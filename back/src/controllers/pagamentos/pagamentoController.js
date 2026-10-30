import { iniciarPagamentoPix, reconciliarPagamento } from "../../services/pagamentoService.js";

export async function criarPagamentoPix(req, res) {
  try {
    const { pedidoId } = req.body;
    const usuarioId = req.usuario.id;

    if (!pedidoId || typeof pedidoId !== "string") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Informe um ID de pedido válido.",
      });
    }

    const pagamento = await iniciarPagamentoPix(pedidoId, usuarioId);

    return res.status(201).json({
      sucesso: true,
      mensagem: "Cobrança Pix criada com sucesso.",
      pagamento,
    });
  } catch (erro) {
    console.error("Erro ao criar pagamento Pix:", erro);

    // Erros de validação e regras de negócio
    const errosCliente = [
      "Pedido não encontrado.",
      "Este pedido não está disponível para pagamento.",
      "Este pedido já possui uma tentativa de pagamento em andamento.",
    ];

    if (errosCliente.includes(erro.message)) {
      return res.status(
        erro.message === "Pedido não encontrado." ? 404 : 409
      ).json({
        sucesso: false,
        mensagem: erro.message,
      });
    }

    // Erros de configuração ou comunicação com o provedor
    return res.status(502).json({
      sucesso: false,
      mensagem: "Não foi possível confirmar a criação da cobrança. Verifique o status antes de tentar novamente.",
    });
  }
}

export async function consultarPagamento(req, res) {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;

    const resultado = await reconciliarPagamento(id, usuarioId);

    return res.status(200).json({
      sucesso: true,
      mensagem: "Pagamento consultado com sucesso.",
      pagamento: resultado,
    });
  } catch (erro) {
    console.error("Erro ao consultar pagamento:", erro);

    if (erro.message === "Pagamento não encontrado.") {
      return res.status(404).json({
        sucesso: false,
        mensagem: erro.message,
      });
    }

    return res.status(502).json({
      sucesso: false,
      mensagem: "Não foi possível consultar o pagamento.",
    });
  }
}