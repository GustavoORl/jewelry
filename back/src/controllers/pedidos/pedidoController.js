
import * as pedidoService from "../../services/pedidoService.js";

export async function criar(req, res) {
  try {
    const usuarioId = req.usuario.id;
    const pedido = await pedidoService.criarPedido(
      usuarioId,
      req.body.endereco
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: "Pedido criado com sucesso.",
      pedido,
    });
  } catch (error) {
    console.error("Erro ao criar pedido:", error);

    return res.status(error.status || 500).json({
      sucesso: false,
      mensagem:
        error.status
          ? error.message
          : "Erro interno ao criar o pedido.",
    });
  }
}
