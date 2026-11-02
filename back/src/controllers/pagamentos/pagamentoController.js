import {
  iniciarPagamentoPix,
  iniciarPagamentoCartao,
  reconciliarPagamento,
  buscarUltimoPagamentoPedido,
  diagnosticarMercadoPago,
} from "../../services/pagamentoService.js";

/**
 * =========================================
 * ERROS CONHECIDOS
 * =========================================
 */

const ERROS_PEDIDO = [
  "Pedido não encontrado.",
  "Este pedido não está disponível para pagamento.",
  "Este pedido já possui uma tentativa de pagamento em andamento.",
];

const ERROS_CARTAO = [
  "Token do cartão não informado.",
  "Método do cartão não informado.",
  "Quantidade de parcelas inválida.",
];

/**
 * =========================================
 * RESPONDER ERRO DE PEDIDO
 * =========================================
 */

function responderErroPedido(
  res,
  erro
) {
  if (
    erro.message ===
    "Pedido não encontrado."
  ) {
    return res.status(404).json({
      sucesso: false,
      mensagem: erro.message,
    });
  }

  if (
    erro.message ===
      "Este pedido não está disponível para pagamento." ||
    erro.message ===
      "Este pedido já possui uma tentativa de pagamento em andamento."
  ) {
    return res.status(409).json({
      sucesso: false,
      mensagem: erro.message,
    });
  }

  return null;
}

/**
 * =========================================
 * RESPONDER ERRO DE CARTÃO
 * =========================================
 */

function responderErroCartao(
  res,
  erro
) {
  if (
    ERROS_CARTAO.includes(
      erro.message
    )
  ) {
    return res.status(400).json({
      sucesso: false,
      mensagem: erro.message,
    });
  }

  return null;
}

/**
 * =========================================
 * PIX
 * =========================================
 *
 * O service utiliza:
 *
 * POST /v1/orders
 *
 * processing_mode = automatic
 */

export async function criarPagamentoPix(
  req,
  res
) {
  try {
    const {
      pedidoId,
    } = req.body;

    const usuarioId =
      req.usuario.id;

    /**
     * =====================================
     * PEDIDO
     * =====================================
     */

    if (
      !pedidoId ||
      typeof pedidoId !==
        "string"
    ) {
      return res.status(400).json({
        sucesso: false,

        mensagem:
          "Informe um ID de pedido válido.",
      });
    }

    /**
     * =====================================
     * ORDERS API - PIX
     * =====================================
     */

    const pagamento =
      await iniciarPagamentoPix(
        pedidoId,
        usuarioId
      );

    return res.status(201).json({
      sucesso: true,

      mensagem:
        "Cobrança Pix criada com sucesso.",

      pagamento,
    });
  } catch (erro) {
    console.error(
      "Erro ao criar pagamento Pix:",
      erro
    );

    /**
     * =====================================
     * ERROS DO PEDIDO
     * =====================================
     */

    if (
      ERROS_PEDIDO.includes(
        erro.message
      )
    ) {
      return responderErroPedido(
        res,
        erro
      );
    }

    /**
     * =====================================
     * ERRO ORDERS API
     * =====================================
     */

    return res
      .status(
        erro.status ||
        502
      )
      .json({
        sucesso: false,

        mensagem:
          erro.message ||
          "Não foi possível criar a cobrança Pix.",

        statusMercadoPago:
          erro.status ||
          null,

        detalhes:
          erro.detalhes ||
          null,
      });
  }
}

/**
 * =========================================
 * CARTÃO DE CRÉDITO
 * =========================================
 *
 * O service utiliza:
 *
 * POST /v1/orders
 *
 * processing_mode = automatic
 */

export async function criarPagamentoCartao(
  req,
  res
) {
  try {
    const {
      pedidoId,
      token,
      paymentMethodId,
      installments,
      payer,
    } = req.body;

    const usuarioId =
      req.usuario.id;

    /**
     * =====================================
     * PEDIDO
     * =====================================
     */

    if (
      !pedidoId ||
      typeof pedidoId !==
        "string"
    ) {
      return res.status(400).json({
        sucesso: false,

        mensagem:
          "Informe um ID de pedido válido.",
      });
    }

    /**
     * =====================================
     * TOKEN
     * =====================================
     */

    if (
      !token ||
      typeof token !==
        "string"
    ) {
      return res.status(400).json({
        sucesso: false,

        mensagem:
          "Token do cartão não informado.",
      });
    }

    /**
     * =====================================
     * PAYMENT METHOD
     * =====================================
     *
     * Identificado pelo MercadoPago.js:
     *
     * visa
     * master
     * elo
     * amex
     * etc.
     */

    if (
      !paymentMethodId ||
      typeof paymentMethodId !==
        "string"
    ) {
      return res.status(400).json({
        sucesso: false,

        mensagem:
          "Método do cartão não informado.",
      });
    }

    /**
     * =====================================
     * PARCELAS
     * =====================================
     */

    const numeroParcelas =
      Number(
        installments
      );

    if (
      !Number.isInteger(
        numeroParcelas
      ) ||
      numeroParcelas < 1
    ) {
      return res.status(400).json({
        sucesso: false,

        mensagem:
          "Quantidade de parcelas inválida.",
      });
    }

    /**
     * =====================================
     * ORDERS API
     * =====================================
     */

    const pagamento =
      await iniciarPagamentoCartao(
        {
          pedidoId,

          token,

          paymentMethodId,

          installments:
            numeroParcelas,

          payer,
        },

        usuarioId
      );

    return res.status(201).json({
      sucesso: true,

      mensagem:
        "Pagamento com cartão de crédito processado.",

      pagamento,
    });
  } catch (erro) {
    console.error(
      "Erro ao criar pagamento com cartão de crédito:",
      erro
    );

    /**
     * =====================================
     * PEDIDO
     * =====================================
     */

    if (
      ERROS_PEDIDO.includes(
        erro.message
      )
    ) {
      return responderErroPedido(
        res,
        erro
      );
    }

    /**
     * =====================================
     * VALIDAÇÃO DO CARTÃO
     * =====================================
     */

    if (
      ERROS_CARTAO.includes(
        erro.message
      )
    ) {
      return responderErroCartao(
        res,
        erro
      );
    }

    /**
     * =====================================
     * MERCADO PAGO / ORDERS API
     * =====================================
     */

    return res
      .status(
        erro.status ||
        502
      )
      .json({
        sucesso: false,

        mensagem:
          erro.message ||
          "Não foi possível processar o pagamento com cartão de crédito.",

        statusMercadoPago:
          erro.status ||
          null,

        detalhes:
          erro.detalhes ||
          null,
      });
  }
}

/**
 * =========================================
 * CONSULTAR / RECONCILIAR PAGAMENTO
 * =========================================
 *
 * O parâmetro recebido pela rota continua
 * sendo o ID LOCAL da tabela Pagamento.
 *
 * O service encontra:
 *
 * pagamento.provedorOrdemId
 *
 * e consulta:
 *
 * GET /v1/orders/{orderId}
 */

export async function consultarPagamento(
  req,
  res
) {
  try {
    const {
      id,
    } = req.params;

    const usuarioId =
      req.usuario.id;

    if (
      !id ||
      typeof id !==
        "string"
    ) {
      return res.status(400).json({
        sucesso: false,

        mensagem:
          "Informe um ID de pagamento válido.",
      });
    }

    /**
     * O ID recebido é o nosso
     * Pagamento.id.
     *
     * O service resolve o Order ID.
     */

    const resultado =
      await reconciliarPagamento(
        id,
        usuarioId
      );

    return res.status(200).json({
      sucesso: true,

      mensagem:
        "Pagamento consultado com sucesso.",

      pagamento:
        resultado,
    });
  } catch (erro) {
    console.error(
      "Erro ao consultar pagamento:",
      erro
    );

    /**
     * =====================================
     * PAGAMENTO LOCAL NÃO EXISTE
     * =====================================
     */

    if (
      erro.message ===
      "Pagamento não encontrado."
    ) {
      return res.status(404).json({
        sucesso: false,
        mensagem: erro.message,
      });
    }

    /**
     * =====================================
     * ORDER AINDA NÃO ASSOCIADA
     * =====================================
     */

    if (
      erro.message ===
      "O pagamento ainda não possui uma Order no Mercado Pago."
    ) {
      return res.status(409).json({
        sucesso: false,
        mensagem: erro.message,
      });
    }

    /**
     * =====================================
     * ERRO CONSULTANDO MERCADO PAGO
     * =====================================
     */

    return res
      .status(
        erro.status ||
        502
      )
      .json({
        sucesso: false,

        mensagem:
          erro.message ||
          "Não foi possível consultar o pagamento.",

        statusMercadoPago:
          erro.status ||
          null,

        detalhes:
          erro.detalhes ||
          null,
      });
  }
}

/**
 * =========================================
 * RECUPERAR ÚLTIMO PAGAMENTO DO PEDIDO
 * =========================================
 *
 * Utilizado principalmente quando:
 *
 * - frontend recarrega;
 * - usuário retorna à tela;
 * - precisamos recuperar QR Code Pix;
 * - precisamos recuperar status atual.
 */

export async function recuperarPagamentoPedido(
  req,
  res
) {
  try {
    const {
      pedidoId,
    } = req.params;

    const usuarioId =
      req.usuario.id;

    if (
      !pedidoId ||
      typeof pedidoId !==
        "string"
    ) {
      return res.status(400).json({
        sucesso: false,

        mensagem:
          "Informe um ID de pedido válido.",
      });
    }

    const pagamento =
      await buscarUltimoPagamentoPedido(
        pedidoId,
        usuarioId
      );

    return res.status(200).json({
      sucesso: true,

      pagamento,
    });
  } catch (erro) {
    console.error(
      "Erro ao recuperar pagamento:",
      erro
    );

    return res.status(500).json({
      sucesso: false,

      mensagem:
        "Não foi possível recuperar o pagamento.",
    });
  }
}

/**
 * =========================================
 * DIAGNÓSTICO MERCADO PAGO
 * =========================================
 *
 * Utiliza:
 *
 * MERCADO_PAGO_ACCESS_TOKEN
 *
 * da aplicação responsável por:
 *
 * - PIX
 * - cartão de crédito
 *
 * via Orders API.
 */

export async function diagnosticarIntegracaoMercadoPago(
  req,
  res
) {
  try {
    const diagnostico =
      await diagnosticarMercadoPago();

    return res.status(200).json({
      sucesso: true,

      diagnostico,
    });
  } catch (erro) {
    console.error(
      "Erro no diagnóstico do Mercado Pago:",
      erro
    );

    return res
      .status(
        erro.status ||
        500
      )
      .json({
        sucesso: false,

        mensagem:
          erro.message ||
          "Erro ao diagnosticar integração com Mercado Pago.",

        statusMercadoPago:
          erro.status ||
          null,

        detalhes:
          erro.detalhes ||
          null,
      });
  }
}