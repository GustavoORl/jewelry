import { randomUUID } from "node:crypto";
import { prisma } from "../config/prisma.js";

import {
  criarPagamento,
  atualizarPagamento,
} from "../models/pagamentoModel.js";

// Cria uma Order no Mercado Pago
async function criarOrderMercadoPago(dados, chaveIdempotencia) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
  }

  const resposta = await fetch("https://api.mercadopago.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": chaveIdempotencia,
    },
    body: JSON.stringify(dados),
  });

  const texto = await resposta.text();

  let resultado;

  try {
    resultado = texto ? JSON.parse(texto) : {};
  } catch {
    throw new Error("O Mercado Pago retornou uma resposta inválida.");
  }

  if (!resposta.ok) {
    const erro = new Error(
      resultado.message || "Erro ao criar Order no Mercado Pago."
    );

    erro.status = resposta.status;
    erro.detalhes = resultado;

    throw erro;
  }

  return resultado;
}

async function consultarOrderMercadoPago(orderId) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
  }

  const resposta = await fetch(
    `https://api.mercadopago.com/v1/orders/${encodeURIComponent(orderId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const resultado = await resposta.json();

  if (!resposta.ok) {
    const erro = new Error(
      resultado.message || "Erro ao consultar Order no Mercado Pago."
    );

    erro.status = resposta.status;
    erro.detalhes = resultado;

    throw erro;
  }

  return resultado;
}

// Iniciar pagamento via Pix
export async function iniciarPagamentoPix(pedidoId, usuarioId) {
  // 1. Buscar pedido
  const pedido = await prisma.pedido.findFirst({
    where: {
      id: pedidoId,
      usuarioId,
    },
    include: {
      usuario: true,
    },
  });

  if (!pedido) {
    throw new Error("Pedido não encontrado.");
  }

  // 2. Validar situação do pedido
  if (pedido.status !== "PENDENTE") {
    throw new Error("Este pedido não está disponível para pagamento.");
  }

  // 3. Verificar tentativa anterior em andamento
  const pagamentoExistente = await prisma.pagamento.findFirst({
    where: {
      pedidoId,
      status: {
        in: ["PENDENTE", "PROCESSANDO"],
      },
    },
    orderBy: {
      criadoEm: "desc",
    },
  });

  if (pagamentoExistente) {
    throw new Error(
      "Este pedido já possui uma tentativa de pagamento em andamento."
    );
  }

  // 4. Gerar identificadores
  const referenciaExterna = `AUR-${randomUUID()}`;
  const chaveIdempotencia = randomUUID();

  const valor = pedido.valorTotal.toFixed(2);

  // 5. Registrar tentativa no banco
  const pagamento = await criarPagamento({
    pedidoId: pedido.id,
    provedor: "MERCADO_PAGO",
    metodo: "PIX",
    status: "PROCESSANDO",
    valor,
    referenciaExterna,
    chaveIdempotencia,
  });

  // 6. Montar requisição da Order
  const dadosOrder = {
    type: "online",
    total_amount: valor,
    external_reference: referenciaExterna,
    processing_mode: "automatic",

    payer: {
      email: pedido.usuario.email,
    },

    transactions: {
      payments: [
        {
          amount: valor,
          payment_method: {
            id: "pix",
            type: "bank_transfer",
          },
        },
      ],
    },
  };

  try {
    // 7. Solicitar criação da Order
    const resultado = await criarOrderMercadoPago(
      dadosOrder,
      chaveIdempotencia
    );

    const transacao = resultado.transactions?.payments?.[0];

    if (!resultado.id || !transacao?.id) {
      throw new Error(
        "O Mercado Pago não retornou os identificadores esperados."
      );
    }

    const metodoPagamento = transacao.payment_method;

    if (!metodoPagamento?.qr_code || !metodoPagamento?.qr_code_base64) {
      throw new Error(
        "A Order foi criada, mas os dados do QR Code não foram retornados."
      );
    }

    // 8. Atualizar pagamento no banco
    const pagamentoAtualizado = await atualizarPagamento(pagamento.id, {
      provedorOrdemId: String(resultado.id),
      provedorPagamentoId: String(transacao.id),
      status: "PENDENTE",
      detalhes: resultado,
    });

    // 9. Retornar informações ao frontend
    return {
      pagamentoId: pagamentoAtualizado.id,
      status: pagamentoAtualizado.status,
      metodo: pagamentoAtualizado.metodo,
      valor,

      pix: {
        codigo: metodoPagamento.qr_code,
        imagemBase64: metodoPagamento.qr_code_base64,
        linkPagamento: metodoPagamento.ticket_url || null,
      },
    };
  } catch (erro) {
    console.error("Erro ao iniciar pagamento Pix:", erro);

    // Preservar a tentativa para reconciliação posterior.
    // Não marcar como RECUSADO: a Order pode ter sido criada
    // mesmo que o servidor não tenha recebido a resposta.

    try {
      await atualizarPagamento(pagamento.id, {
        detalhes: {
          erro: erro.message,
          statusHttp: erro.status || null,
          resposta: erro.detalhes || null,
          aguardandoReconciliacao: true,
        },
      });
    } catch (erroBanco) {
      console.error(
        "Erro ao registrar detalhes da falha:",
        erroBanco
      );
    }

    throw erro;
  }
}

export async function reconciliarPagamento(pagamentoId, usuarioId) {
  const pagamento = await prisma.pagamento.findFirst({
    where: {
      id: pagamentoId,
      pedido: {
        usuarioId,
      },
    },
    include: {
      pedido: true,
    },
  });

  if (!pagamento) {
    throw new Error("Pagamento não encontrado.");
  }

  if (!pagamento.provedorOrdemId) {
    throw new Error(
      "Esta tentativa ainda não possui um ID de Order para consulta."
    );
  }

  // Consultar informações atualizadas no Mercado Pago
  const order = await consultarOrderMercadoPago(
    pagamento.provedorOrdemId
  );

  // Validar se a Order consultada pertence à tentativa local
  if (order.external_reference !== pagamento.referenciaExterna) {
    throw new Error(
      "A referência da Order não corresponde ao pagamento."
    );
  }

  const transacao = order.transactions?.payments?.[0];

  const novoStatus = interpretarStatusPagamento(order);

  if (!novoStatus) {
  throw new Error(
    `Status do Mercado Pago não reconhecido: ${order.status} (${order.status_detail}).`
  );
}

  // Não permitir que um pagamento aprovado volte para outro status.
if (
  pagamento.status === "APROVADO" &&
  novoStatus !== "APROVADO"
) {
  return {
    pagamentoId: pagamento.id,
    status: pagamento.status,
    statusPedido: pagamento.pedido.status,
    mensagem: "Pagamento já confirmado anteriormente.",
  };
}

// Não permitir regressão de um pagamento reembolsado.
if (
  pagamento.status === "REEMBOLSADO" &&
  novoStatus !== "REEMBOLSADO"
) {
  return {
    pagamentoId: pagamento.id,
    status: pagamento.status,
    statusPedido: pagamento.pedido.status,
    mensagem: "Pagamento já reembolsado anteriormente.",
  };
}

  // Atualizar pagamento e pedido na mesma transação do banco
  const resultado = await prisma.$transaction(async (tx) => {
    const pagamentoAtualizado = await tx.pagamento.update({
      where: {
        id: pagamento.id,
      },
      data: {
        status: novoStatus,
        provedorPagamentoId: transacao?.id
          ? String(transacao.id)
          : pagamento.provedorPagamentoId,
        detalhes: order,
      },
    });

    let pedidoAtualizado = pagamento.pedido;

    if (
      novoStatus === "APROVADO" &&
      pagamento.pedido.status === "PENDENTE"
    ) {
      pedidoAtualizado = await tx.pedido.update({
        where: {
          id: pagamento.pedidoId,
        },
        data: {
          status: "PAGO",
        },
      });
    }

    return {
      pagamento: pagamentoAtualizado,
      pedido: pedidoAtualizado,
    };
  });

  return {
    pagamentoId: resultado.pagamento.id,
    status: resultado.pagamento.status,
    statusPedido: resultado.pedido.status,
  };
}

function interpretarStatusPagamento(order) {
  const transacao = order.transactions?.payments?.[0];

  const statusOrder = order.status;
  const detalheOrder = order.status_detail;

  const statusTransacao = transacao?.status;
  const detalheTransacao = transacao?.status_detail;

  // Aprovação: exige confirmação de crédito efetivo.
  if (
    statusOrder === "processed" &&
    detalheOrder === "accredited" &&
    statusTransacao === "processed" &&
    detalheTransacao === "accredited"
  ) {
    return "APROVADO";
  }

  // Reembolso integral.
  if (
    statusOrder === "refunded" ||
    statusTransacao === "refunded"
  ) {
    return "REEMBOLSADO";
  }

  // Expiração.
  if (
    (statusOrder === "canceled" && detalheOrder === "expired") ||
    (statusOrder === "failed" && detalheOrder === "expired") ||
    (statusTransacao === "expired" && detalheTransacao === "expired")
  ) {
    return "EXPIRADO";
  }

  // Cancelamento.
  if (
    statusOrder === "canceled" ||
    statusTransacao === "canceled"
  ) {
    return "CANCELADO";
  }

  // Recusa ou falha definitiva.
  if (
    statusOrder === "failed" ||
    statusTransacao === "failed"
  ) {
    return "RECUSADO";
  }

  // Pagamento aguardando ação.
  if (
    statusOrder === "created" ||
    statusOrder === "action_required"
  ) {
    return "PENDENTE";
  }

  // Pagamento em processamento.
  if (
    statusOrder === "processing" ||
    statusTransacao === "processing"
  ) {
    return "PROCESSANDO";
  }

  // Não classificar estados desconhecidos como se fossem conhecidos.
  return null;
}