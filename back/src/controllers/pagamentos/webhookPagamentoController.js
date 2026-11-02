import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import {
  reconciliarPagamentoPorOrderId,
} from "../../services/pagamentoService.js";


/**
 * =========================================
 * OBTER SECRET DO WEBHOOK
 * =========================================
 *
 * Agora a AURELIA utiliza apenas
 * a aplicação responsável pelas Orders.
 *
 * Portanto:
 *
 * PIX
 * CRÉDITO
 * DÉBITO
 *
 * usam o mesmo webhook e o mesmo secret.
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
 * EXTRAIR PARTES DA ASSINATURA
 * =========================================
 *
 * Exemplo:
 *
 * x-signature:
 *
 * ts=123456789,v1=abcdef123...
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
      ts:
        null,

      v1:
        null,
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
 * VALIDAR ASSINATURA
 * =========================================
 *
 * Formato utilizado pelo Mercado Pago:
 *
 * id:{data.id};
 * request-id:{x-request-id};
 * ts:{ts};
 */

function validarAssinaturaMercadoPago(
  req
) {
  const secret =
    obterWebhookSecret();


  /**
   * Headers enviados pelo Mercado Pago.
   */

  const assinatura =
    req.headers[
      "x-signature"
    ];

  const requestId =
    req.headers[
      "x-request-id"
    ];


  /**
   * Para validação da assinatura,
   * devemos utilizar o data.id
   * enviado na QUERY STRING.
   *
   * Exemplo:
   *
   * ?data.id=ORD...&type=order
   */

  const dataId =
    req.query[
      "data.id"
    ];


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


  /**
   * Extrair:
   *
   * ts
   * v1
   */

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
          Boolean(
            ts
          ),

        possuiV1:
          Boolean(
            v1
          ),
      }
    );


    return false;
  }


  /**
   * =====================================
   * MANIFESTO
   * =====================================
   *
   * IMPORTANTE:
   *
   * O Mercado Pago utiliza o data.id
   * em lowercase no manifesto.
   */

  const manifesto =
    `id:${String(
      dataId
    ).toLowerCase()};` +
    `request-id:${requestId};` +
    `ts:${ts};`;


  /**
   * Gerar hash esperado.
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
    /**
     * Converter os hashes
     * para Buffer.
     */

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
     * timingSafeEqual exige buffers
     * com o mesmo tamanho.
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
  } catch (
    erro
  ) {
    console.warn(
      "Erro ao comparar assinatura do webhook:",
      erro.message
    );


    return false;
  }
}


/**
 * =========================================
 * EXTRAIR ORDER ID
 * =========================================
 *
 * O Mercado Pago normalmente envia:
 *
 * query:
 *
 * data.id=ORD...
 *
 * Mas também pode existir:
 *
 * body.data.id
 *
 * Usamos a query como prioridade.
 */

function extrairOrderId(
  req
) {
  return (
    req.query[
      "data.id"
    ] ||
    req.body
      ?.data
      ?.id ||
    null
  );
}


/**
 * =========================================
 * CONTROLLER
 * =========================================
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
      req.query.type ||
      req.body?.type;


    /**
     * Agora processamos SOMENTE:
     *
     * type = order
     *
     * Outros eventos do Mercado Pago
     * podem utilizar a mesma URL,
     * mas não fazem parte deste fluxo.
     */

    if (
      tipo !== "order"
    ) {
      console.log(
        "Webhook ignorado:",
        tipo ||
        "tipo não informado"
      );


      return res
        .sendStatus(
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
        .status(
          401
        )
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
     */

    const orderId =
      extrairOrderId(
        req
      );


    if (
      !orderId
    ) {
      console.warn(
        "Webhook Order sem identificador da Order."
      );


      return res
        .status(
          400
        )
        .json({
          sucesso:
            false,

          mensagem:
            "Identificador da Order não informado.",
        });
    }


    /**
     * =====================================
     * LOG DA NOTIFICAÇÃO
     * =====================================
     */

    console.log(
      "Webhook Order recebido:",
      orderId
    );


    /**
     * Não utilizamos o status recebido
     * diretamente no webhook.
     *
     * reconciliarPagamentoPorOrderId()
     *
     * fará:
     *
     * GET /v1/orders/{id}
     *
     * e consultará o estado real
     * da Order no Mercado Pago.
     */

    try {
      const pagamento =
        await reconciliarPagamentoPorOrderId(
          String(
            orderId
          )
        );


      console.log(
        "Pagamento reconciliado pelo webhook Order:",
        pagamento.id,
        pagamento.status
      );
    } catch (
      erro
    ) {
      /**
       * Se a Order existir no Mercado Pago,
       * mas ainda não tivermos salvo
       * provedorOrdemId localmente,
       * pode ocorrer uma condição de corrida:
       *
       * Mercado Pago envia webhook
       * antes da nossa requisição HTTP
       * terminar.
       *
       * Nesse caso o Mercado Pago
       * poderá reenviar a notificação.
       */

      console.error(
        "Erro ao reconciliar Order pelo webhook:",
        {
          orderId,

          mensagem:
            erro.message,

          stack:
            erro.stack,
        }
      );


      return res
        .status(
          500
        )
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
      .status(
        200
      )
      .json({
        sucesso:
          true,

        mensagem:
          "Notificação processada.",
      });
  } catch (
    erro
  ) {
    console.error(
      "Erro ao receber webhook do Mercado Pago:",
      erro
    );


    return res
      .status(
        500
      )
      .json({
        sucesso:
          false,

        mensagem:
          "Erro interno ao processar a notificação.",
      });
  }
}