
import * as pedidoService from "../../services/pedidoService.js";

export async function criar(req, res) {
  try {
    const usuarioId = req.usuario.id;

    const pedido = await pedidoService.criarPedido(
      usuarioId,
      req.body.endereco,
      req.body.itensSelecionados
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
      mensagem: error.status
        ? error.message
        : "Erro interno ao criar o pedido.",
    });
  }
}

export async function listar(req, res) {
  try {
    const usuarioId = req.usuario.id;
    const pedidos = await pedidoService.listarPedidos(usuarioId);

    return res.status(200).json({
      sucesso: true,
      pedidos,
    });
  } catch (error) {
    console.error("Erro ao listar pedidos:", error);

    return res.status(error.status || 500).json({
      sucesso: false,
      mensagem: error.status
        ? error.message
        : "Erro interno ao consultar os pedidos.",
    });
  }
}

export async function buscarPorId(req, res) {
  try {
    const usuarioId = req.usuario.id;
    const { pedidoId } = req.params;

    const pedido = await pedidoService.buscarPedido(
      usuarioId,
      pedidoId
    );

    return res.status(200).json({
      sucesso: true,
      pedido,
    });
  } catch (error) {
    console.error("Erro ao consultar pedido:", error);

    return res.status(error.status || 500).json({
      sucesso: false,
      mensagem: error.status
        ? error.message
        : "Erro interno ao consultar o pedido.",
    });
  }
}

// Lista todos os pedidos para o administrador.
export async function listarTodos(req, res) {
  try {
    const pedidos = await pedidoService.listarTodosPedidos(
      req.usuario
    );

    return res.status(200).json({
      sucesso: true,
      pedidos,
    });
  } catch (error) {
    console.error("Erro ao listar pedidos administrativos:", error);

    return res.status(error.status || 500).json({
      sucesso: false,
      mensagem: error.status
        ? error.message
        : "Erro interno ao consultar os pedidos.",
    });
  }
}

// Atualiza o status de um pedido.
export async function atualizarStatus(req, res) {
  try {
    const { pedidoId } = req.params;
    const { status } = req.body;

    const pedido = await pedidoService.atualizarStatus(
      req.usuario,
      pedidoId,
      status
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Status do pedido atualizado com sucesso.",
      pedido,
    });
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);

    return res.status(error.status || 500).json({
      sucesso: false,
      mensagem: error.status
        ? error.message
        : "Erro interno ao atualizar o pedido.",
    });
  }
}