import {
  iniciarPagamentoPix,
  iniciarPagamentoCartao,
  iniciarPagamentoDebito,
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


function responderErroPedido(
  res,
  erro
) {
  if (
    erro.message ===
    "Pedido não encontrado."
  ) {
    return res
      .status(404)
      .json({
        sucesso:
          false,

        mensagem:
          erro.message,
      });
  }


  if (
    erro.message ===
      "Este pedido não está disponível para pagamento." ||
    erro.message ===
      "Este pedido já possui uma tentativa de pagamento em andamento."
  ) {
    return res
      .status(409)
      .json({
        sucesso:
          false,

        mensagem:
          erro.message,
      });
  }


  return null;
}


/**
 * =========================================
 * PIX
 * =========================================
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


    if (
      !pedidoId ||
      typeof pedidoId !==
        "string"
    ) {
      return res
        .status(400)
        .json({
          sucesso:
            false,

          mensagem:
            "Informe um ID de pedido válido.",
        });
    }


    const pagamento =
      await iniciarPagamentoPix(
        pedidoId,
        usuarioId
      );


    return res
      .status(201)
      .json({
        sucesso:
          true,

        mensagem:
          "Cobrança Pix criada com sucesso.",

        pagamento,
      });
  } catch (
    erro
  ) {
    console.error(
      "Erro ao criar pagamento Pix:",
      erro
    );


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


    return res
      .status(
        erro.status || 502
      )
      .json({
        sucesso:
          false,

        mensagem:
          "Não foi possível confirmar a criação da cobrança. Verifique o status antes de tentar novamente.",

        statusMercadoPago:
          erro.status ||
          null,
      });
  }
}


/**
 * =========================================
 * CRÉDITO
 * =========================================
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
     * Pedido
     */

    if (
      !pedidoId ||
      typeof pedidoId !==
        "string"
    ) {
      return res
        .status(400)
        .json({
          sucesso:
            false,

          mensagem:
            "Informe um ID de pedido válido.",
        });
    }


    /**
     * Token
     */

    if (
      !token ||
      typeof token !==
        "string"
    ) {
      return res
        .status(400)
        .json({
          sucesso:
            false,

          mensagem:
            "Token do cartão não informado.",
        });
    }


    /**
     * Método
     */

    if (
      !paymentMethodId ||
      typeof paymentMethodId !==
        "string"
    ) {
      return res
        .status(400)
        .json({
          sucesso:
            false,

          mensagem:
            "Método do cartão não informado.",
        });
    }


    /**
     * Parcelas
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
      return res
        .status(400)
        .json({
          sucesso:
            false,

          mensagem:
            "Quantidade de parcelas inválida.",
        });
    }


    /**
     * Service
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


    return res
      .status(201)
      .json({
        sucesso:
          true,

        mensagem:
          "Pagamento com cartão de crédito processado.",

        pagamento,
      });
  } catch (
    erro
  ) {
    console.error(
      "Erro ao criar pagamento com cartão de crédito:",
      erro
    );


    /**
     * Pedido
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
     * Validação do cartão
     */

    if (
      ERROS_CARTAO.includes(
        erro.message
      )
    ) {
      return res
        .status(400)
        .json({
          sucesso:
            false,

          mensagem:
            erro.message,
        });
    }


    /**
     * Mercado Pago
     */

    return res
      .status(
        erro.status || 502
      )
      .json({
        sucesso:
          false,

        mensagem:
          erro.message ||
          "Não foi possível processar o pagamento com cartão de crédito.",

        statusMercadoPago:
          erro.status ||
          null,
      });
  }
}


/**
 * =========================================
 * DÉBITO
 * =========================================
 */

export async function criarPagamentoDebito(
  req,
  res
) {
  try {
    const {
      pedidoId,
      token,
      paymentMethodId,
      payer,
    } = req.body;


    const usuarioId =
      req.usuario.id;


    /**
     * Pedido
     */

    if (
      !pedidoId ||
      typeof pedidoId !==
        "string"
    ) {
      return res
        .status(400)
        .json({
          sucesso:
            false,

          mensagem:
            "Informe um ID de pedido válido.",
        });
    }


    /**
     * Token
     */

    if (
      !token ||
      typeof token !==
        "string"
    ) {
      return res
        .status(400)
        .json({
          sucesso:
            false,

          mensagem:
            "Token do cartão não informado.",
        });
    }


    /**
     * Método
     */

    if (
      !paymentMethodId ||
      typeof paymentMethodId !==
        "string"
    ) {
      return res
        .status(400)
        .json({
          sucesso:
            false,

          mensagem:
            "Método do cartão não informado.",
        });
    }


    /**
     * Service
     *
     * Agora o débito também utiliza:
     *
     * POST /v1/orders
     *
     * e não mais:
     *
     * POST /v1/payments
     */

    const pagamento =
      await iniciarPagamentoDebito(
        {
          pedidoId,

          token,

          paymentMethodId,

          payer,
        },

        usuarioId
      );


    return res
      .status(201)
      .json({
        sucesso:
          true,

        mensagem:
          "Pagamento com cartão de débito processado.",

        pagamento,
      });
  } catch (
    erro
  ) {
    console.error(
      "Erro ao criar pagamento com cartão de débito:",
      erro
    );


    /**
     * Pedido
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
     * Validação do cartão
     */

    if (
      ERROS_CARTAO.includes(
        erro.message
      )
    ) {
      return res
        .status(400)
        .json({
          sucesso:
            false,

          mensagem:
            erro.message,
        });
    }


    /**
     * Mercado Pago / Orders
     */

    return res
      .status(
        erro.status || 502
      )
      .json({
        sucesso:
          false,

        mensagem:
          erro.message ||
          "Não foi possível processar o pagamento com cartão de débito.",

        statusMercadoPago:
          erro.status ||
          null,
      });
  }
}


/**
 * =========================================
 * CONSULTAR PAGAMENTO
 * =========================================
 *
 * O service consulta agora:
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
      return res
        .status(400)
        .json({
          sucesso:
            false,

          mensagem:
            "Informe um ID de pagamento válido.",
        });
    }


    const resultado =
      await reconciliarPagamento(
        id,
        usuarioId
      );


    return res
      .status(200)
      .json({
        sucesso:
          true,

        mensagem:
          "Pagamento consultado com sucesso.",

        pagamento:
          resultado,
      });
  } catch (
    erro
  ) {
    console.error(
      "Erro ao consultar pagamento:",
      erro
    );


    if (
      erro.message ===
      "Pagamento não encontrado."
    ) {
      return res
        .status(404)
        .json({
          sucesso:
            false,

          mensagem:
            erro.message,
        });
    }


    if (
      erro.message ===
      "O pagamento ainda não possui uma Order no Mercado Pago."
    ) {
      return res
        .status(409)
        .json({
          sucesso:
            false,

          mensagem:
            erro.message,
        });
    }


    return res
      .status(
        erro.status || 502
      )
      .json({
        sucesso:
          false,

        mensagem:
          "Não foi possível consultar o pagamento.",

        statusMercadoPago:
          erro.status ||
          null,
      });
  }
}


/**
 * =========================================
 * RECUPERAR ÚLTIMO PAGAMENTO DO PEDIDO
 * =========================================
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
      return res
        .status(400)
        .json({
          sucesso:
            false,

          mensagem:
            "Informe um ID de pedido válido.",
        });
    }


    const pagamento =
      await buscarUltimoPagamentoPedido(
        pedidoId,
        usuarioId
      );


    return res
      .status(200)
      .json({
        sucesso:
          true,

        pagamento,
      });
  } catch (
    erro
  ) {
    console.error(
      "Erro ao recuperar pagamento:",
      erro
    );


    return res
      .status(500)
      .json({
        sucesso:
          false,

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
 * Agora utiliza:
 *
 * MERCADO_PAGO_ACCESS_TOKEN
 *
 * da mesma aplicação responsável
 * pelas Orders.
 */

export async function diagnosticarIntegracaoMercadoPago(
  req,
  res
) {
  try {
    const diagnostico =
      await diagnosticarMercadoPago();


    return res
      .status(200)
      .json({
        sucesso:
          true,

        diagnostico,
      });
  } catch (
    erro
  ) {
    console.error(
      "Erro no diagnóstico do Mercado Pago:",
      erro
    );


    return res
      .status(
        erro.status || 500
      )
      .json({
        sucesso:
          false,

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