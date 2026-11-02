import { randomUUID } from "node:crypto";

import { prisma } from "../config/prisma.js";

import {
  criarPagamento,
  atualizarPagamento,
} from "../models/pagamentoModel.js";


const MERCADO_PAGO_API =
  "https://api.mercadopago.com";


/**
 * =========================================
 * ACCESS TOKEN
 * =========================================
 */

function obterAccessToken() {
  const accessToken =
    process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      "MERCADO_PAGO_ACCESS_TOKEN não configurado."
    );
  }

  return accessToken;
}


/**
 * =========================================
 * UTILITÁRIOS DE RESPOSTA
 * =========================================
 */

async function lerRespostaJson(resposta) {
  const texto =
    await resposta.text();

  if (!texto) {
    return {};
  }

  try {
    return JSON.parse(texto);
  } catch {
    throw new Error(
      "O Mercado Pago retornou uma resposta inválida."
    );
  }
}


function criarErroMercadoPago(
  resposta,
  resultado,
  mensagemPadrao
) {
  const erro = new Error(
    resultado?.message ||
    mensagemPadrao
  );

  erro.status =
    resposta.status;

  erro.detalhes =
    resultado;

  return erro;
}


/**
 * =========================================
 * CRIAR ORDER
 * =========================================
 *
 * Todas as novas transações do projeto
 * passam pela Orders API.
 */

async function criarOrderMercadoPago(
  dados,
  chaveIdempotencia
) {
  const accessToken =
    obterAccessToken();

  const resposta =
    await fetch(
      `${MERCADO_PAGO_API}/v1/orders`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",

          "X-Idempotency-Key":
            chaveIdempotencia,
        },

        body:
          JSON.stringify(dados),
      }
    );

  const resultado =
    await lerRespostaJson(
      resposta
    );


  if (!resposta.ok) {
    /**
     * Criamos uma cópia segura do payload
     * apenas para diagnóstico.
     *
     * Nunca devemos exibir:
     *
     * - token do cartão
     * - security_code
     * - cvv
     * - número completo do cartão
     */

    const payloadSeguro =
      structuredClone(
        dados
      );


    const pagamentos =
      payloadSeguro
        ?.transactions
        ?.payments;


    if (
      Array.isArray(
        pagamentos
      )
    ) {
      for (
        const pagamento
        of pagamentos
      ) {
        /**
         * Caso o token esteja dentro de:
         *
         * payment_method.token
         */

        if (
          pagamento
            ?.payment_method
            ?.token
        ) {
          pagamento.payment_method.token =
            "[REMOVIDO]";
        }


        /**
         * Segurança adicional caso algum
         * campo sensível seja enviado
         * futuramente.
         */

        if (
          pagamento
            ?.payment_method
            ?.security_code
        ) {
          pagamento.payment_method.security_code =
            "[REMOVIDO]";
        }


        if (
          pagamento
            ?.payment_method
            ?.cvv
        ) {
          pagamento.payment_method.cvv =
            "[REMOVIDO]";
        }


        if (
          pagamento
            ?.payment_method
            ?.card_number
        ) {
          pagamento.payment_method.card_number =
            "[REMOVIDO]";
        }


        if (
          pagamento
            ?.payment_method
            ?.number
        ) {
          pagamento.payment_method.number =
            "[REMOVIDO]";
        }


        /**
         * Algumas APIs podem utilizar
         * token diretamente na transação.
         */

        if (
          pagamento?.token
        ) {
          pagamento.token =
            "[REMOVIDO]";
        }


        if (
          pagamento?.security_code
        ) {
          pagamento.security_code =
            "[REMOVIDO]";
        }


        if (
          pagamento?.cvv
        ) {
          pagamento.cvv =
            "[REMOVIDO]";
        }
      }
    }


    console.error(
  "=========================================="
);

console.error(
  "ERRO COMPLETO ORDERS MERCADO PAGO:"
);

console.dir(
  {
    statusHttp:
      resposta.status,

    statusText:
      resposta.statusText,

    payloadEnviado:
      payloadSeguro,

    respostaMercadoPago:
      resultado,
  },
  {
    depth: null,
    colors: true,
  }
);

console.error(
  "=========================================="
);

console.error(
  "ERROS MERCADO PAGO:"
);

console.dir(
  resultado?.errors,
  {
    depth: null,
    colors: true,
  }
);


    throw criarErroMercadoPago(
      resposta,
      resultado,
      "Erro ao criar Order no Mercado Pago."
    );
  }


  return resultado;
}


/**
 * =========================================
 * CONSULTAR ORDER
 * =========================================
 */

async function consultarOrderMercadoPago(
  orderId
) {
  const accessToken =
    obterAccessToken();

  if (!orderId) {
    throw new Error(
      "ID da Order do Mercado Pago não informado."
    );
  }

  const resposta =
    await fetch(
      `${MERCADO_PAGO_API}/v1/orders/${encodeURIComponent(
        orderId
      )}`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          Accept:
            "application/json",
        },
      }
    );

  const resultado =
    await lerRespostaJson(
      resposta
    );

  if (!resposta.ok) {
    console.error(
      "Erro ao consultar Order no Mercado Pago:",
      {
        status:
          resposta.status,

        message:
          resultado?.message,

        error:
          resultado?.error,

        errors:
          resultado?.errors,
      }
    );

    throw criarErroMercadoPago(
      resposta,
      resultado,
      "Erro ao consultar Order no Mercado Pago."
    );
  }

  return resultado;
}


/**
 * =========================================
 * DIAGNÓSTICO
 * =========================================
 *
 * Agora utiliza a mesma aplicação
 * utilizada pelas Orders.
 */

export async function diagnosticarMercadoPago() {
  const accessToken =
    obterAccessToken();

  const resposta =
    await fetch(
      `${MERCADO_PAGO_API}/v1/payment_methods`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          Accept:
            "application/json",
        },
      }
    );

  const resultado =
    await lerRespostaJson(
      resposta
    );

  if (!resposta.ok) {
    throw criarErroMercadoPago(
      resposta,
      resultado,
      "Erro ao consultar os meios de pagamento do Mercado Pago."
    );
  }

  const meiosPagamento =
    Array.isArray(resultado)
      ? resultado.map(
          (metodo) => ({
            id:
              metodo.id,

            nome:
              metodo.name,

            tipo:
              metodo.payment_type_id,

            status:
              metodo.status,
          })
        )
      : resultado;

  return {
    autenticado: true,

    statusHttp:
      resposta.status,

    meiosPagamento,
  };
}


/**
 * =========================================
 * INTERPRETAR STATUS
 * =========================================
 *
 * Converte os status da Orders API
 * para os status da aplicação.
 */

function interpretarStatusPagamento(
  order
) {
  const transacao =
    order
      ?.transactions
      ?.payments
      ?.[0];

  const statusOrder =
    order?.status;

  const detalheOrder =
    order?.status_detail;

  const statusTransacao =
    transacao?.status;

  const detalheTransacao =
    transacao?.status_detail;


  /**
   * APROVADO
   */

  if (
    statusOrder === "processed" &&
    detalheOrder === "accredited" &&
    (
      !statusTransacao ||
      (
        statusTransacao ===
          "processed" &&
        detalheTransacao ===
          "accredited"
      )
    )
  ) {
    return "APROVADO";
  }


  /**
   * REEMBOLSADO
   */

  if (
    statusOrder === "refunded" ||
    statusTransacao === "refunded"
  ) {
    return "REEMBOLSADO";
  }


  /**
   * CHARGEBACK
   *
   * Como nosso enum ainda não possui
   * CHARGEBACK, tratamos como reembolso.
   */

  if (
    statusOrder === "charged_back" ||
    statusTransacao === "charged_back"
  ) {
    return "REEMBOLSADO";
  }


  /**
   * EXPIRADO
   */

  if (
    (
      statusOrder === "canceled" &&
      detalheOrder === "expired"
    ) ||
    (
      statusOrder === "failed" &&
      detalheOrder === "expired"
    ) ||
    statusTransacao === "expired" ||
    detalheTransacao === "expired"
  ) {
    return "EXPIRADO";
  }


  /**
   * CANCELADO
   */

  if (
    statusOrder === "canceled" ||
    statusTransacao === "canceled"
  ) {
    return "CANCELADO";
  }


  /**
   * RECUSADO
   */

  if (
    statusOrder === "failed" ||
    statusTransacao === "failed"
  ) {
    return "RECUSADO";
  }


  /**
   * PENDENTE
   */

  if (
    statusOrder === "created" ||
    statusOrder ===
      "action_required" ||
    statusTransacao ===
      "created" ||
    statusTransacao ===
      "action_required"
  ) {
    return "PENDENTE";
  }


  /**
   * PROCESSANDO
   */

  if (
    statusOrder === "processing" ||
    statusTransacao ===
      "processing"
  ) {
    return "PROCESSANDO";
  }


  /**
   * Status desconhecido.
   */

  return null;
}


/**
 * =========================================
 * SANITIZAR ORDER
 * =========================================
 *
 * Remove possíveis informações sensíveis
 * antes de salvar a resposta no banco.
 */

function sanitizarOrder(order) {
  if (
    !order ||
    typeof order !== "object"
  ) {
    return order;
  }

  const orderSanitizada =
    structuredClone(order);

  const pagamentos =
    orderSanitizada
      .transactions
      ?.payments;

  if (
    Array.isArray(
      pagamentos
    )
  ) {
    for (
      const pagamento
      of pagamentos
    ) {
      const metodo =
        pagamento
          ?.payment_method;

      if (
        metodo &&
        typeof metodo ===
          "object"
      ) {
        delete metodo.token;

        delete metodo.security_code;

        delete metodo.cvv;

        delete metodo.card_number;

        delete metodo.number;
      }

      delete pagamento?.token;

      delete pagamento
        ?.security_code;

      delete pagamento?.cvv;
    }
  }

  return orderSanitizada;
}


/**
 * =========================================
 * TRANSIÇÃO DE STATUS
 * =========================================
 */

function podeAlterarStatus(
  statusAtual,
  novoStatus
) {
  if (
    statusAtual === novoStatus
  ) {
    return false;
  }


  /**
   * Um pagamento aprovado só pode
   * avançar para reembolsado.
   */

  if (
    statusAtual ===
      "APROVADO" &&
    novoStatus !==
      "REEMBOLSADO"
  ) {
    return false;
  }


  /**
   * Reembolso é final.
   */

  if (
    statusAtual ===
      "REEMBOLSADO"
  ) {
    return false;
  }

  return true;
}


/**
 * =========================================
 * APLICAR ORDER AO PAGAMENTO
 * =========================================
 *
 * Fonte única de verdade para:
 *
 * - criação;
 * - polling;
 * - webhook.
 */

async function aplicarOrderAoPagamento(
  pagamento,
  order
) {
  if (!pagamento?.pedido) {
    throw new Error(
      "O pagamento local precisa incluir o pedido para aplicar a Order."
    );
  }


  /**
   * Garantir que a Order pertence
   * à tentativa correta.
   */

  if (
    order?.external_reference !==
    pagamento.referenciaExterna
  ) {
    throw new Error(
      "A referência da Order não corresponde ao pagamento."
    );
  }


  const novoStatus =
    interpretarStatusPagamento(
      order
    );


  if (!novoStatus) {
    throw new Error(
      `Status de pagamento não reconhecido: ${
        order?.status ||
        "desconhecido"
      } / ${
        order?.status_detail ||
        "sem detalhe"
      }`
    );
  }


  const transacao =
    order
      ?.transactions
      ?.payments
      ?.[0];


  /**
   * Se nada mudou, não precisamos
   * atualizar status.
   *
   * Mesmo assim, mantemos o snapshot
   * mais recente da Order.
   */

  if (
    !podeAlterarStatus(
      pagamento.status,
      novoStatus
    )
  ) {
    console.log(
      `Pagamento ${pagamento.id}: ${pagamento.status} → ${novoStatus}. Nenhuma alteração necessária.`
    );


    await prisma.pagamento.update({
      where: {
        id:
          pagamento.id,
      },

      data: {
        provedorOrdemId:
          order?.id != null
            ? String(order.id)
            : pagamento.provedorOrdemId,

        provedorPagamentoId:
          transacao?.id != null
            ? String(transacao.id)
            : pagamento.provedorPagamentoId,

        detalhes: {
          ...(
            pagamento.detalhes &&
            typeof pagamento.detalhes ===
              "object"
              ? pagamento.detalhes
              : {}
          ),

          ultimaOrder:
            sanitizarOrder(
              order
            ),
        },
      },
    });


    return {
      pagamento: {
        ...pagamento,

        provedorOrdemId:
          order?.id != null
            ? String(order.id)
            : pagamento.provedorOrdemId,

        provedorPagamentoId:
          transacao?.id != null
            ? String(
                transacao.id
              )
            : pagamento.provedorPagamentoId,

        detalhes: {
          ...(
            pagamento.detalhes &&
            typeof pagamento.detalhes ===
              "object"
              ? pagamento.detalhes
              : {}
          ),

          ultimaOrder:
            sanitizarOrder(
              order
            ),
        },
      },

      pedido:
        pagamento.pedido,

      alterado:
        false,
    };
  }


  /**
   * Atualiza pagamento e pedido
   * na mesma transação.
   */

  const resultado =
    await prisma.$transaction(
      async (tx) => {
        const pagamentoAtualizado =
          await tx.pagamento.update({
            where: {
              id:
                pagamento.id,
            },

            data: {
              status:
                novoStatus,

              provedorOrdemId:
                order?.id != null
                  ? String(
                      order.id
                    )
                  : pagamento.provedorOrdemId,

              provedorPagamentoId:
                transacao?.id != null
                  ? String(
                      transacao.id
                    )
                  : pagamento.provedorPagamentoId,

              detalhes: {
                ...(
                  pagamento.detalhes &&
                  typeof pagamento.detalhes ===
                    "object"
                    ? pagamento.detalhes
                    : {}
                ),

                ultimaOrder:
                  sanitizarOrder(
                    order
                  ),
              },
            },
          });


        let pedidoAtualizado =
          pagamento.pedido;


        /**
         * Pedido passa para PAGO
         * somente após aprovação.
         */

        if (
          novoStatus ===
            "APROVADO" &&
          pagamento.pedido
            .status ===
            "PENDENTE"
        ) {
          pedidoAtualizado =
            await tx.pedido.update({
              where: {
                id:
                  pagamento.pedidoId,
              },

              data: {
                status:
                  "PAGO",
              },
            });
        }


        return {
          pagamento:
            pagamentoAtualizado,

          pedido:
            pedidoAtualizado,
        };
      }
    );


  return {
    ...resultado,

    alterado:
      true,
  };
}


/**
 * =========================================
 * BUSCAR PEDIDO
 * =========================================
 */

async function buscarPedidoParaPagamento(
  pedidoId,
  usuarioId
) {
  const pedido =
    await prisma.pedido.findFirst({
      where: {
        id:
          pedidoId,

        usuarioId,
      },

      include: {
        usuario:
          true,
      },
    });


  if (!pedido) {
    throw new Error(
      "Pedido não encontrado."
    );
  }


  if (
    pedido.status !==
      "PENDENTE"
  ) {
    throw new Error(
      "Este pedido não está disponível para pagamento."
    );
  }


  return pedido;
}


/**
 * =========================================
 * VERIFICAR TENTATIVA ATIVA
 * =========================================
 */

async function validarAusenciaTentativaAtiva(
  pedidoId
) {
  const pagamentoExistente =
    await prisma.pagamento.findFirst({
      where: {
        pedidoId,

        status: {
          in: [
            "PENDENTE",
            "PROCESSANDO",
          ],
        },
      },

      orderBy: {
        criadoEm:
          "desc",
      },
    });


  if (
    pagamentoExistente
  ) {
    throw new Error(
      "Este pedido já possui uma tentativa de pagamento em andamento."
    );
  }
}


/**
 * =========================================
 * EXTRAIR ORDER DE ERRO
 * =========================================
 *
 * O Mercado Pago pode retornar uma
 * Order válida mesmo junto de erro HTTP.
 */

function obterOrderDeErro(
  erro
) {
  const order =
    erro
      ?.detalhes
      ?.data;

  if (
    order?.id &&
    order
      ?.transactions
      ?.payments
      ?.[0]
      ?.id
  ) {
    return order;
  }

  return null;
}


/**
 * =========================================
 * REGISTRAR FALHA
 * =========================================
 */

async function registrarFalhaParaReconciliacao(
  pagamento,
  erro,
  contexto
) {
  console.error(
    contexto,
    erro
  );

  try {
    await atualizarPagamento(
      pagamento.id,
      {
        detalhes: {
          ...(
            pagamento.detalhes &&
            typeof pagamento.detalhes ===
              "object"
              ? pagamento.detalhes
              : {}
          ),

          erro:
            erro.message,

          statusHttp:
            erro.status ||
            null,

          resposta:
            erro.detalhes
              ? {
                  errors:
                    erro
                      .detalhes
                      .errors ||
                    null,

                  data:
                    erro
                      .detalhes
                      .data
                      ? sanitizarOrder(
                          erro
                            .detalhes
                            .data
                        )
                      : null,
                }
              : null,

          aguardandoReconciliacao:
            true,
        },
      }
    );
  } catch (
    erroBanco
  ) {
    console.error(
      "Erro ao registrar detalhes da falha:",
      erroBanco
    );
  }
}


/**
 * =========================================
 * DETALHES DO CARTÃO
 * =========================================
 */

function montarDetalhesCartao(
  transacao,
  paymentMethodId,
  parcelas
) {
  const metodoRetornado =
    transacao
      ?.payment_method ||
    {};


  const detalhesCartao = {
    bandeira:
      metodoRetornado.id ||
      paymentMethodId,

    parcelas,
  };


  if (
    metodoRetornado
      .last_four_digits
  ) {
    detalhesCartao.ultimos4 =
      metodoRetornado
        .last_four_digits;
  }


  return detalhesCartao;
}


/**
 * =========================================
 * PERSISTIR ORDER DE CARTÃO
 * =========================================
 */

async function persistirOrderCartao({
  pagamento,
  pedido,
  order,
  paymentMethodId,
  parcelas,
}) {
  const transacao =
    order
      ?.transactions
      ?.payments
      ?.[0];


  if (
    !order?.id ||
    !transacao?.id
  ) {
    throw new Error(
      "O Mercado Pago não retornou os identificadores esperados."
    );
  }


  const detalhesCartao =
    montarDetalhesCartao(
      transacao,
      paymentMethodId,
      parcelas
    );


  const pagamentoPreparado =
    await atualizarPagamento(
      pagamento.id,
      {
        provedorOrdemId:
          String(
            order.id
          ),

        provedorPagamentoId:
          String(
            transacao.id
          ),

        detalhes: {
          ...(
            pagamento.detalhes &&
            typeof pagamento.detalhes ===
              "object"
              ? pagamento.detalhes
              : {}
          ),

          cartao:
            detalhesCartao,
        },
      }
    );


  const aplicacao =
    await aplicarOrderAoPagamento(
      {
        ...pagamentoPreparado,

        pedido,
      },

      order
    );


  return {
    pagamentoId:
      aplicacao.pagamento.id,

    status:
      aplicacao.pagamento.status,

    metodo:
      aplicacao.pagamento.metodo,

    valor:
      pagamento.valor.toString(),

    cartao:
      detalhesCartao,
  };
}


/**
 * =========================================
 * PIX
 * =========================================
 */

export async function iniciarPagamentoPix(
  pedidoId,
  usuarioId
) {
  const pedido =
    await buscarPedidoParaPagamento(
      pedidoId,
      usuarioId
    );


  await validarAusenciaTentativaAtiva(
    pedidoId
  );


  const referenciaExterna =
    `AUR-${randomUUID()}`;

  const chaveIdempotencia =
    randomUUID();

  const valor =
    pedido.valorTotal.toFixed(
      2
    );


  /**
   * Criar pagamento local.
   */

  const pagamento =
    await criarPagamento({
      pedidoId:
        pedido.id,

      provedor:
        "MERCADO_PAGO",

      metodo:
        "PIX",

      status:
        "PROCESSANDO",

      valor,

      referenciaExterna,

      chaveIdempotencia,
    });


  /**
   * Montar Order.
   */

  const dadosOrder = {
    type:
      "online",

    total_amount:
      valor,

    external_reference:
      referenciaExterna,

    processing_mode:
      "automatic",

    payer: {
      email:
        pedido.usuario.email,
    },

    transactions: {
      payments: [
        {
          amount:
            valor,

          payment_method: {
            id:
              "pix",

            type:
              "bank_transfer",
          },
        },
      ],
    },
  };


  try {
    const order =
      await criarOrderMercadoPago(
        dadosOrder,
        chaveIdempotencia
      );


    const transacao =
      order
        ?.transactions
        ?.payments
        ?.[0];


    const metodoPagamento =
      transacao
        ?.payment_method;


    if (
      !order?.id ||
      !transacao?.id
    ) {
      throw new Error(
        "O Mercado Pago não retornou os identificadores esperados."
      );
    }


    if (
      !metodoPagamento
        ?.qr_code ||
      !metodoPagamento
        ?.qr_code_base64
    ) {
      throw new Error(
        "A Order foi criada, mas os dados do QR Code não foram retornados."
      );
    }


    /**
     * Salvar IDs e Pix.
     */

    const pagamentoPreparado =
      await atualizarPagamento(
        pagamento.id,
        {
          provedorOrdemId:
            String(
              order.id
            ),

          provedorPagamentoId:
            String(
              transacao.id
            ),

          detalhes: {
            pix: {
              codigo:
                metodoPagamento
                  .qr_code,

              imagemBase64:
                metodoPagamento
                  .qr_code_base64,

              linkPagamento:
                metodoPagamento
                  .ticket_url ||
                null,
            },
          },
        }
      );


    /**
     * Aplicar status da Order.
     */

    const aplicacao =
      await aplicarOrderAoPagamento(
        {
          ...pagamentoPreparado,

          pedido,
        },

        order
      );


    return {
      pagamentoId:
        aplicacao.pagamento.id,

      status:
        aplicacao.pagamento.status,

      metodo:
        aplicacao.pagamento.metodo,

      valor,

      pix: {
        codigo:
          metodoPagamento
            .qr_code,

        imagemBase64:
          metodoPagamento
            .qr_code_base64,

        linkPagamento:
          metodoPagamento
            .ticket_url ||
          null,
      },
    };
  } catch (erro) {
    /**
     * Algumas respostas de erro podem
     * conter uma Order válida.
     */

    const orderRetornada =
      obterOrderDeErro(
        erro
      );


    if (
      orderRetornada
    ) {
      const transacao =
        orderRetornada
          .transactions
          ?.payments
          ?.[0];


      const metodoPagamento =
        transacao
          ?.payment_method;


      const pagamentoPreparado =
        await atualizarPagamento(
          pagamento.id,
          {
            provedorOrdemId:
              String(
                orderRetornada.id
              ),

            provedorPagamentoId:
              String(
                transacao.id
              ),

            detalhes: {
              ...(
                metodoPagamento
                  ?.qr_code
                  ? {
                      pix: {
                        codigo:
                          metodoPagamento
                            .qr_code,

                        imagemBase64:
                          metodoPagamento
                            .qr_code_base64 ||
                          null,

                        linkPagamento:
                          metodoPagamento
                            .ticket_url ||
                          null,
                      },
                    }
                  : {}
              ),
            },
          }
        );


      const aplicacao =
        await aplicarOrderAoPagamento(
          {
            ...pagamentoPreparado,

            pedido,
          },

          orderRetornada
        );


      return {
        pagamentoId:
          aplicacao.pagamento.id,

        status:
          aplicacao.pagamento.status,

        metodo:
          aplicacao.pagamento.metodo,

        valor,

        pix:
          metodoPagamento
            ?.qr_code
            ? {
                codigo:
                  metodoPagamento
                    .qr_code,

                imagemBase64:
                  metodoPagamento
                    .qr_code_base64 ||
                  null,

                linkPagamento:
                  metodoPagamento
                    .ticket_url ||
                  null,
              }
            : null,
      };
    }


    await registrarFalhaParaReconciliacao(
      pagamento,
      erro,
      "Erro ao iniciar pagamento Pix:"
    );


    throw erro;
  }
}


/**
 * =========================================
 * CARTÃO - NÚCLEO COMPARTILHADO
 * =========================================
 *
 * Crédito e débito utilizam exatamente
 * o mesmo fluxo.
 *
 * A única diferença é:
 *
 * credit_card
 * debit_card
 */

async function iniciarPagamentoCartaoViaOrder({
  dados,
  usuarioId,
  metodoLocal,
  tipoMercadoPago,
  permitirParcelas,
}) {
  const {
    pedidoId,
    token,
    paymentMethodId,
    installments,
    payer,
  } = dados;


  /**
   * Buscar pedido.
   */

  const pedido =
    await buscarPedidoParaPagamento(
      pedidoId,
      usuarioId
    );


  /**
   * Evitar duas tentativas simultâneas.
   */

  await validarAusenciaTentativaAtiva(
    pedidoId
  );


  /**
   * Validar token.
   */

  if (
    !token ||
    typeof token !== "string"
  ) {
    throw new Error(
      "Token do cartão não informado."
    );
  }


  /**
   * O paymentMethodId vem do SDK
   * do Mercado Pago.
   *
   * Exemplos:
   *
   * elo
   * visa
   * master
   */

  if (
    !paymentMethodId ||
    typeof paymentMethodId !== "string"
  ) {
    throw new Error(
      "Método do cartão não informado."
    );
  }


  /**
   * =====================================
   * NORMALIZAR PAYMENT METHOD
   * =====================================
   *
   * O Card Payment Brick identifica
   * o cartão Elo de débito como:
   *
   * payment_method_id = "elo"
   *
   * Porém a Orders API exige:
   *
   * payment_method.id = "debelo"
   *
   * quando:
   *
   * payment_method.type = "debit_card"
   */

  const paymentMethodIdOrder =
    tipoMercadoPago === "debit_card" &&
    paymentMethodId.toLowerCase() === "elo"
      ? "debelo"
      : paymentMethodId;


  console.log(
    "PAYMENT METHOD NORMALIZADO:",
    {
      metodoLocal,
      tipoMercadoPago,
      recebidoDoBrick:
        paymentMethodId,
      enviadoParaOrder:
        paymentMethodIdOrder,
    }
  );


  /**
   * Crédito aceita parcelas.
   * Débito sempre usa 1.
   */

  const numeroParcelas =
    permitirParcelas
      ? Number(
          installments
        )
      : 1;


  if (
    !Number.isInteger(
      numeroParcelas
    ) ||
    numeroParcelas < 1
  ) {
    throw new Error(
      "Quantidade de parcelas inválida."
    );
  }


  /**
   * Identificadores internos.
   */

  const referenciaExterna =
    `AUR-${randomUUID()}`;

  const chaveIdempotencia =
    randomUUID();

  const valor =
    pedido.valorTotal.toFixed(
      2
    );


  /**
   * Criar tentativa local.
   */

  const pagamento =
    await criarPagamento({
      pedidoId:
        pedido.id,

      provedor:
        "MERCADO_PAGO",

      metodo:
        metodoLocal,

      status:
        "PROCESSANDO",

      valor,

      referenciaExterna,

      chaveIdempotencia,
    });


  /**
   * Dados do comprador.
   *
   * Prioridade:
   *
   * 1. e-mail recebido pelo checkout
   * 2. e-mail cadastrado no pedido
   */

  const payerOrder = {
    email:
      payer?.email ||
      pedido.usuario.email,
  };


  if (
    payer
      ?.identification
      ?.type &&
    payer
      ?.identification
      ?.number
  ) {
    payerOrder.identification = {
      type:
        payer
          .identification
          .type,

      number:
        payer
          .identification
          .number,
    };
  }


  /**
   * =====================================
   * ORDER DO CARTÃO
   * =====================================
   */

  const dadosOrder = {
    type:
      "online",

    total_amount:
      valor,

    external_reference:
      referenciaExterna,

    processing_mode:
      "automatic",

    payer:
      payerOrder,

    transactions: {
      payments: [
        {
          amount:
            valor,

          payment_method: {
            id:
              paymentMethodIdOrder,

            type:
              tipoMercadoPago,

            token,

            installments:
              numeroParcelas,
          },
        },
      ],
    },
  };


  try {
    /**
     * Criar Order.
     */

    const order =
      await criarOrderMercadoPago(
        dadosOrder,
        chaveIdempotencia
      );


    /**
     * Salvar IDs e aplicar status.
     *
     * Usamos paymentMethodIdOrder,
     * pois é o valor efetivamente
     * enviado ao Mercado Pago.
     */

    return await persistirOrderCartao({
      pagamento,

      pedido,

      order,

      paymentMethodId:
        paymentMethodIdOrder,

      parcelas:
        numeroParcelas,
    });
  } catch (erro) {
    /**
     * O Mercado Pago pode devolver
     * uma Order válida dentro da
     * resposta de erro.
     *
     * Isso acontece, por exemplo,
     * quando um cartão é recusado.
     */

    const orderRetornada =
      obterOrderDeErro(
        erro
      );


    if (
      orderRetornada
    ) {
      try {
        return await persistirOrderCartao({
          pagamento,

          pedido,

          order:
            orderRetornada,

          paymentMethodId:
            paymentMethodIdOrder,

          parcelas:
            numeroParcelas,
        });
      } catch (
        erroOrder
      ) {
        console.error(
          "Erro ao registrar Order retornada:",
          erroOrder
        );

        throw erroOrder;
      }
    }


    /**
     * Sem Order confirmada.
     *
     * Pode ser:
     *
     * - timeout;
     * - falha de rede;
     * - erro de validação;
     * - indisponibilidade.
     *
     * Não marcamos automaticamente
     * como recusado.
     */

    await registrarFalhaParaReconciliacao(
      pagamento,

      erro,

      `Erro ao iniciar pagamento ${metodoLocal.toLowerCase()} via Orders:`
    );


    throw erro;
  }
}

/**
 * =========================================
 * CRÉDITO
 * =========================================
 */

export async function iniciarPagamentoCartao(
  dados,
  usuarioId
) {
  return iniciarPagamentoCartaoViaOrder({
    dados,

    usuarioId,

    metodoLocal:
      "CREDITO",

    tipoMercadoPago:
      "credit_card",

    permitirParcelas:
      true,
  });
}


/**
 * =========================================
 * DÉBITO
 * =========================================
 */

export async function iniciarPagamentoDebito(
  dados,
  usuarioId
) {
  return iniciarPagamentoCartaoViaOrder({
    dados,

    usuarioId,

    metodoLocal:
      "DEBITO",

    tipoMercadoPago:
      "debit_card",

    permitirParcelas:
      false,
  });
}


/**
 * =========================================
 * RECONCILIAÇÃO FRONTEND
 * =========================================
 *
 * Todos os pagamentos novos agora usam
 * provedorOrdemId.
 */

export async function reconciliarPagamento(
  pagamentoId,
  usuarioId
) {
  const pagamento =
    await prisma.pagamento.findFirst({
      where: {
        id:
          pagamentoId,

        pedido: {
          usuarioId,
        },
      },

      include: {
        pedido:
          true,
      },
    });


  if (!pagamento) {
    throw new Error(
      "Pagamento não encontrado."
    );
  }


  if (
    !pagamento
      .provedorOrdemId
  ) {
    throw new Error(
      "O pagamento ainda não possui uma Order no Mercado Pago."
    );
  }


  /**
   * Consultar diretamente no MP.
   */

  const order =
    await consultarOrderMercadoPago(
      pagamento.provedorOrdemId
    );


  /**
   * Aplicar estado recebido.
   */

  const resultado =
    await aplicarOrderAoPagamento(
      pagamento,
      order
    );


  return {
    pagamentoId:
      resultado.pagamento.id,

    status:
      resultado.pagamento.status,

    statusPedido:
      resultado.pedido.status,
  };
}


/**
 * =========================================
 * COMPATIBILIDADE TEMPORÁRIA
 * =========================================
 *
 * Seu controller antigo ainda pode importar
 * esta função.
 *
 * Porém ela NÃO consulta mais:
 *
 * /v1/payments
 *
 * Quando alterarmos o controller,
 * essa função poderá ser removida.
 */

export async function reconciliarPagamentoPorPaymentId() {
  throw new Error(
    "A Payments API foi desativada neste projeto. Utilize reconciliação por Order ID."
  );
}


/**
 * =========================================
 * BUSCAR ÚLTIMO PAGAMENTO DO PEDIDO
 * =========================================
 */

export async function buscarUltimoPagamentoPedido(
  pedidoId,
  usuarioId
) {
  const pagamento =
    await prisma.pagamento.findFirst({
      where: {
        pedidoId,

        pedido: {
          usuarioId,
        },
      },

      orderBy: {
        criadoEm:
          "desc",
      },
    });


  if (!pagamento) {
    return null;
  }


  const detalhes =
    pagamento.detalhes &&
    typeof pagamento.detalhes ===
      "object"
      ? pagamento.detalhes
      : {};


  /**
   * =====================================
   * PIX
   * =====================================
   */

  const pixSalvo =
    detalhes.pix;


  /**
   * Compatibilidade com estrutura
   * salva anteriormente.
   */

  const transacaoAntiga =
    detalhes
      .transactions
      ?.payments
      ?.[0];


  const metodoPagamentoAntigo =
    transacaoAntiga
      ?.payment_method;


  const pix =
    pixSalvo?.codigo
      ? {
          codigo:
            pixSalvo.codigo,

          imagemBase64:
            pixSalvo
              .imagemBase64 ||
            null,

          linkPagamento:
            pixSalvo
              .linkPagamento ||
            null,
        }

      : metodoPagamentoAntigo
          ?.qr_code

        ? {
            codigo:
              metodoPagamentoAntigo
                .qr_code,

            imagemBase64:
              metodoPagamentoAntigo
                .qr_code_base64 ||
              null,

            linkPagamento:
              metodoPagamentoAntigo
                .ticket_url ||
              null,
          }

        : null;


  /**
   * =====================================
   * CARTÃO
   * =====================================
   */

  let cartao =
    null;


  if (
    [
      "CREDITO",
      "DEBITO",
    ].includes(
      pagamento.metodo
    ) &&
    detalhes.cartao
  ) {
    cartao =
      detalhes.cartao;
  }


  return {
    pagamentoId:
      pagamento.id,

    status:
      pagamento.status,

    metodo:
      pagamento.metodo,

    valor:
      pagamento.valor.toString(),

    pix,

    cartao,
  };
}


/**
 * =========================================
 * WEBHOOK - ORDER ID
 * =========================================
 *
 * O webhook informa o ID da Order.
 *
 * Nunca confiamos diretamente no status
 * recebido no webhook.
 *
 * Consultamos a Order novamente no
 * Mercado Pago.
 */

export async function reconciliarPagamentoPorOrderId(
  orderId
) {
  if (!orderId) {
    throw new Error(
      "ID da Order não informado."
    );
  }


  /**
   * Buscar pagamento local.
   */

  const pagamento =
    await prisma.pagamento.findFirst({
      where: {
        provedorOrdemId:
          String(
            orderId
          ),
      },

      include: {
        pedido:
          true,
      },
    });


  if (!pagamento) {
    throw new Error(
      "Pagamento não encontrado para esta Order."
    );
  }


  /**
   * Consultar estado atual
   * diretamente no Mercado Pago.
   */

  const order =
    await consultarOrderMercadoPago(
      String(
        orderId
      )
    );


  /**
   * Aplicar status.
   */

  const resultado =
    await aplicarOrderAoPagamento(
      pagamento,
      order
    );


  return resultado.pagamento;
}


/**
 * =========================================
 * TESTAR MÉTODOS DE DÉBITO
 * =========================================
 *
 * Consulta os meios de débito disponíveis
 * para a MESMA aplicação utilizada
 * pelas Orders.
 */

export async function testarMetodosDebitoMercadoPago() {
  const accessToken =
    obterAccessToken();


  const resposta =
    await fetch(
      `${MERCADO_PAGO_API}/v1/payment_methods`,
      {
        method:
          "GET",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          Accept:
            "application/json",
        },
      }
    );


  const dados =
    await lerRespostaJson(
      resposta
    );


  if (!resposta.ok) {
    throw criarErroMercadoPago(
      resposta,

      dados,

      "Não foi possível consultar os meios de pagamento."
    );
  }


  const metodosDebito =
    Array.isArray(dados)
      ? dados
          .filter(
            (metodo) =>
              metodo
                .payment_type_id ===
              "debit_card"
          )

          .map(
            (metodo) => ({
              id:
                metodo.id,

              nome:
                metodo.name,

              tipo:
                metodo.payment_type_id,

              status:
                metodo.status,

              minAllowedAmount:
                metodo
                  .min_allowed_amount,

              maxAllowedAmount:
                metodo
                  .max_allowed_amount,

              settings:
                metodo.settings,
            })
          )

      : [];


  console.log(
    "======================================"
  );

  console.log(
    "MÉTODOS DE DÉBITO DISPONÍVEIS:"
  );

  console.dir(
    metodosDebito,
    {
      depth:
        null,
    }
  );

  console.log(
    "======================================"
  );


  return metodosDebito;
}

export async function listarMetodosPagamentoMercadoPago() {
  const accessToken =
    obterAccessToken();

  const resposta =
    await fetch(
      `${MERCADO_PAGO_API}/v1/payment_methods`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",
        },
      }
    );

  const resultado =
    await lerRespostaJson(
      resposta
    );

  if (!resposta.ok) {
    console.error(
      "Erro ao buscar métodos de pagamento:",
      resultado
    );

    throw criarErroMercadoPago(
      resposta,
      resultado,
      "Não foi possível consultar os métodos de pagamento."
    );
  }

  console.dir(
    resultado,
    {
      depth: null,
      colors: true,
    }
  );

  return resultado;
}