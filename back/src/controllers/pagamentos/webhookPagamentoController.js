import { createHmac, timingSafeEqual } from "node:crypto";

function validarAssinaturaMercadoPago(req) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("MERCADO_PAGO_WEBHOOK_SECRET não configurado.");
  }

  const assinatura = req.headers["x-signature"];
  const requestId = req.headers["x-request-id"];
  const dataId = req.query["data.id"];

  if (!assinatura || !requestId || !dataId) {
    return false;
  }

  // Extrair timestamp e hash da assinatura
  const partes = Object.fromEntries(
    assinatura.split(",").map((parte) => {
      const [chave, ...valor] = parte.trim().split("=");
      return [chave, valor.join("=")];
    })
  );

  const { ts, v1 } = partes;

  if (!ts || !v1) {
    return false;
  }

  // Manifesto exigido pelo Mercado Pago
  const manifesto = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${ts};`;

  const hashCalculado = createHmac("sha256", secret)
    .update(manifesto)
    .digest("hex");

  try {
    const hashRecebido = Buffer.from(v1, "hex");
    const hashEsperado = Buffer.from(hashCalculado, "hex");

    return (
      hashRecebido.length === hashEsperado.length &&
      timingSafeEqual(hashRecebido, hashEsperado)
    );
  } catch {
    return false;
  }
}

export async function receberWebhookPagamento(req, res) {
  try {
    const tipo = req.query.type || req.body?.type;

    // Esta rota foi criada especificamente para Orders
    if (tipo !== "order") {
      return res.sendStatus(200);
    }

    const assinaturaValida = validarAssinaturaMercadoPago(req);

    if (!assinaturaValida) {
      console.warn("Webhook do Mercado Pago com assinatura inválida.");

      return res.status(401).json({
        sucesso: false,
        mensagem: "Assinatura inválida.",
      });
    }

    const orderId = req.query["data.id"] || req.body?.data?.id;

    if (!orderId) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Identificador da Order não informado.",
      });
    }

    console.log("Webhook Order recebido:", orderId);

    /*
      A assinatura foi validada.

      Na próxima etapa, vamos consultar a Order no Mercado Pago,
      localizar o pagamento no banco e executar a reconciliação.
    */

    return res.status(200).json({
      sucesso: true,
      mensagem: "Notificação recebida.",
    });
  } catch (erro) {
    console.error("Erro ao receber webhook:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao processar a notificação.",
    });
  }
}