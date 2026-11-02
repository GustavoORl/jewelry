import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import {
  reconciliarPagamentoPorOrderId,
} from "../../services/pagamentoService.js";

/**
 * =========================================
 * WEBHOOK MERCADO PAGO - ORDERS API
 * =========================================
 *
 * Arquitetura:
 *
 * PIX     -> Orders API
 * CRÉDITO -> Orders API
 *
 * Evento processado:
 *
 * type = order
 *
 * O Mercado Pago envia:
 *
 * data.id = ORD...
 *
 * Não confiamos diretamente no status
 * enviado pelo webhook.
 *
 * Depois de validar a assinatura,
 * o service consulta:
 *
 * GET /v1/orders/{orderId}
 */

/**
 * =========================================
 * SECRET DO WEBHOOK
 * =========================================
 */

function obterWebhookSecret() {
  const secret =
    process.env
      .MERCADO_PAGO_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error(
      "MERCADO_PAGO_WEBHOOK_SECRET não configurado."
    );
  }

  return secret;
}

/**
 * =========================================
 * EXTRAIR X-SIGNATURE
 * =========================================
 *
 * Formato:
 *
 * ts=123456789,v1=abcdef...
 */

function extrairAssinatura(
  assinatura
) {
  if (
    !assinatura ||
    typeof assinatura !==
      "string"
  ) {
    return {
      ts: null,
      v1: null,
    };
  }

  const partes =
    assinatura
      .split(",")
      .map(
        (parte) =>
          parte.trim()
      )
      .filter(Boolean);

  let ts =
    null;

  let v1 =
    null;

  for (
    const parte
    of partes
  ) {
    const [
      chave,
      ...valor
    ] =
      parte.split("=");

    const valorCompleto =
      valor.join("=");

    if (
      chave === "ts"
    ) {
      ts =
        valorCompleto;
    }

    if (
      chave === "v1"
    ) {
      v1 =
        valorCompleto;
    }
  }

  return {
    ts,
    v1,
  };
}

/**
 * =========================================
 * EXTRAIR DATA.ID
 * =========================================
 *
 * Orders API:
 *
 * ?data.id=ORD...&type=order
 *
 * O query parameter é utilizado
 * prioritariamente porque também participa
 * da validação da assinatura.
 */

function extrairDataId(
  req
) {
  return (
    req.query[
      "data.id"
    ] ||
    req.query.id ||
    req.body
      ?.data
      ?.id ||
    null
  );
}

/**
 * =========================================
 * IDENTIFICAR TIPO DA NOTIFICAÇÃO
 * =========================================
 */

function extrairTipoNotificacao(
  req
) {
  return (
    req.query.type ||
    req.body?.type ||
    req.query.topic ||
    req.body?.topic ||
    null
  );
}

/**
 * =========================================
 * VALIDAR ASSINATURA
 * =========================================
 *
 * Manifest:
 *
 * id:{data.id};
 * request-id:{x-request-id};
 * ts:{ts};
 *
 * O data.id deve ser convertido
 * para lowercase.
 */

function validarAssinaturaMercadoPago(
  req
) {
  const secret =
    obterWebhookSecret();

  /**
   * Headers enviados pelo
   * Mercado Pago.
   */

  const assinatura =
    req.headers[
      "x-signature"
    ];

  const requestId =
    req.headers[
      "x-request-id"
    ];

  const dataId =
    extrairDataId(
      req
    );

  /**
   * Para nossa integração Orders,
   * esperamos os três componentes.
   */

  if (
    !assinatura ||
    !requestId ||
    !dataId
  ) {
    console.warn(
      "Webhook sem dados necessários para validar assinatura:",
      {
        possuiAssinatura:
          Boolean(
            assinatura
          ),

        possuiRequestId:
          Boolean(
            requestId
          ),

        possuiDataId:
          Boolean(
            dataId
          ),
      }
    );

    return false;
  }

  const {
    ts,
    v1,
  } =
    extrairAssinatura(
      assinatura
    );

  if (
    !ts ||
    !v1
  ) {
    console.warn(
      "Webhook com x-signature incompleto:",
      {
        possuiTs:
          Boolean(ts),

        possuiV1:
          Boolean(v1),
      }
    );

    return false;
  }

  /**
   * =====================================
   * MANIFEST
   * =====================================
   */

  const manifesto =
    `id:${String(
      dataId
    ).toLowerCase()};` +
    `request-id:${requestId};` +
    `ts:${ts};`;

  /**
   * =====================================
   * HMAC SHA-256
   * =====================================
   */

  const hashCalculado =
    createHmac(
      "sha256",
      secret
    )
      .update(
        manifesto
      )
      .digest(
        "hex"
      );

  try {
    const hashRecebido =
      Buffer.from(
        v1,
        "hex"
      );

    const hashEsperado =
      Buffer.from(
        hashCalculado,
        "hex"
      );

    /**
     * timingSafeEqual exige
     * buffers do mesmo tamanho.
     */

    if (
      hashRecebido.length !==
      hashEsperado.length
    ) {
      console.warn(
        "Webhook com assinatura de tamanho inválido."
      );

      return false;
    }

    return timingSafeEqual(
      hashRecebido,
      hashEsperado
    );
  } catch (erro) {
    console.warn(
      "Erro ao comparar assinatura do webhook:",
      erro.message
    );

    return false;
  }
}

/**
 * =========================================
 * VALIDAR ORDER ID
 * =========================================
 *
 * Orders atuais possuem IDs como:
 *
 * ORD01...
 *
 * Não fazemos uma regex excessivamente
 * restritiva para evitar incompatibilidade
 * caso o formato do identificador evolua.
 */

function orderIdValido(
  orderId
) {
  return (
    typeof orderId ===
      "string" &&
    orderId
      .trim()
      .length > 0
  );
}

/**
 * =========================================
 * CONTROLLER
 * =========================================
 *
 * Fluxo:
 *
 * Mercado Pago
 *      ↓
 * webhook type=order
 *      ↓
 * validar HMAC
 *      ↓
 * data.id = ORD...
 *      ↓
 * reconciliarPagamentoPorOrderId()
 *      ↓
 * GET /v1/orders/{orderId}
 *      ↓
 * validar external_reference
 *      ↓
 * atualizar Pagamento
 *      ↓
 * se aprovado:
 * Pedido -> PAGO
 */

export async function receberWebhookPagamento(
  req,
  res
) {
  try {
    /**
     * =====================================
     * TIPO DA NOTIFICAÇÃO
     * =====================================
     */

    const tipo =
      extrairTipoNotificacao(
        req
      );

    /**
     * =====================================
     * IGNORAR EVENTOS NÃO RELACIONADOS
     * =====================================
     *
     * A integração atual trabalha com
     * Orders API.
     *
     * Portanto processamos:
     *
     * type = order
     *
     * Outros eventos são reconhecidos
     * pelo endpoint, mas não fazem parte
     * deste fluxo.
     */

    if (
      tipo !== "order"
    ) {
      console.log(
        "Webhook ignorado:",
        tipo ||
        "tipo não informado"
      );

      return res.sendStatus(
        200
      );
    }

    /**
     * =====================================
     * VALIDAR ASSINATURA
     * =====================================
     */

    const assinaturaValida =
      validarAssinaturaMercadoPago(
        req
      );

    if (
      !assinaturaValida
    ) {
      console.warn(
        "Webhook Order do Mercado Pago com assinatura inválida."
      );

      return res
        .status(401)
        .json({
          sucesso:
            false,

          mensagem:
            "Assinatura inválida.",
        });
    }

    /**
     * =====================================
     * ORDER ID
     * =====================================
     *
     * Para type=order:
     *
     * data.id = ORD...
     */

    const orderId =
      extrairDataId(
        req
      );

    if (
      !orderIdValido(
        orderId
      )
    ) {
      console.warn(
        "Webhook Order sem identificador válido."
      );

      return res
        .status(400)
        .json({
          sucesso:
            false,

          mensagem:
            "Identificador da Order não informado.",
        });
    }

    const orderIdNormalizado =
      String(
        orderId
      ).trim();

    /**
     * =====================================
     * LOG SEGURO
     * =====================================
     */

    console.log(
      "Webhook Order recebido:",
      {
        orderId:
          orderIdNormalizado,

        action:
          req.body
            ?.action ||
          null,

        liveMode:
          req.body
            ?.live_mode ??
          null,
      }
    );

    /**
     * =====================================
     * RECONCILIAR ORDER
     * =====================================
     *
     * IMPORTANTE:
     *
     * Não usamos:
     *
     * req.body.data.status
     *
     * como fonte de verdade.
     *
     * O service consulta novamente:
     *
     * GET /v1/orders/{orderId}
     *
     * usando nosso Access Token.
     */

    try {
      const pagamento =
        await reconciliarPagamentoPorOrderId(
          orderIdNormalizado
        );

      console.log(
        "Pagamento reconciliado pelo webhook Order:",
        {
          pagamentoId:
            pagamento.id,

          status:
            pagamento.status,

          orderId:
            orderIdNormalizado,
        }
      );
    } catch (erro) {
      console.error(
        "Erro ao reconciliar Order pelo webhook:",
        {
          orderId:
            orderIdNormalizado,

          mensagem:
            erro.message,

          status:
            erro.status ||
            null,

          stack:
            erro.stack,
        }
      );

      /**
       * Retornamos erro para que o
       * Mercado Pago possa reenviar
       * a notificação.
       */

      return res
        .status(500)
        .json({
          sucesso:
            false,

          mensagem:
            "Não foi possível processar a notificação da Order.",
        });
    }

    /**
     * =====================================
     * SUCESSO
     * =====================================
     */

    return res
      .status(200)
      .json({
        sucesso:
          true,

        mensagem:
          "Notificação processada.",
      });
  } catch (erro) {
    console.error(
      "Erro ao receber webhook do Mercado Pago:",
      erro
    );

    return res
      .status(500)
      .json({
        sucesso:
          false,

        mensagem:
          "Erro interno ao processar a notificação.",
      });
  }
}