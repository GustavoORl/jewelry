import * as pedidoModel from "../models/pedidoModel.js";

function erro(mensagem, status = 400) {
  const error = new Error(mensagem);
  error.status = status;
  return error;
}

function validarTexto(valor, campo, obrigatorio = true) {
  if (valor == null && !obrigatorio) {
    return null;
  }

  if (typeof valor !== "string" || !valor.trim()) {
    throw erro(`Informe ${campo}.`);
  }

  return valor.trim();
}
export async function criarPedido(
  usuarioId,
  dadosEndereco,
  itensSelecionados
) {
  if (!usuarioId) {
    throw erro("Usuário não autenticado.", 401);
  }

  if (
    !Array.isArray(itensSelecionados) ||
    itensSelecionados.length === 0
  ) {
    throw erro("Selecione pelo menos um produto para continuar.");
  }

  if (
    itensSelecionados.some(
      (id) => typeof id !== "string" || !id.trim()
    )
  ) {
    throw erro("Os identificadores dos itens selecionados são inválidos.");
  }

  // Evita IDs repetidos na requisição.
  const idsUnicos = [...new Set(itensSelecionados)];

  if (idsUnicos.length !== itensSelecionados.length) {
    throw erro("Existem itens duplicados na seleção.");
  }

  if (
    !dadosEndereco ||
    typeof dadosEndereco !== "object" ||
    Array.isArray(dadosEndereco)
  ) {
    throw erro("Informe o endereço de entrega.");
  }

  const endereco = {
    destinatario: validarTexto(
      dadosEndereco.destinatario,
      "o nome do destinatário"
    ),
    cep: validarTexto(dadosEndereco.cep, "o CEP"),
    rua: validarTexto(dadosEndereco.rua, "a rua"),
    numero: validarTexto(dadosEndereco.numero, "o número"),
    complemento: validarTexto(
      dadosEndereco.complemento,
      "o complemento",
      false
    ),
    bairro: validarTexto(dadosEndereco.bairro, "o bairro"),
    cidade: validarTexto(dadosEndereco.cidade, "a cidade"),
    estado: validarTexto(dadosEndereco.estado, "o estado"),
  };

  return pedidoModel.criarPedidoComItens({
    usuarioId,
    endereco,
    itensSelecionados: idsUnicos,
  });
}

export async function listarPedidos(usuarioId) {
  if (!usuarioId) {
    throw erro("Usuário não autenticado.", 401);
  }

  return pedidoModel.listarPedidosDoUsuario(usuarioId);
}

export async function buscarPedido(usuarioId, pedidoId) {
  if (!usuarioId) {
    throw erro("Usuário não autenticado.", 401);
  }

  if (typeof pedidoId !== "string" || !pedidoId.trim()) {
    throw erro("Identificador do pedido inválido.");
  }

  const pedido = await pedidoModel.buscarPedidoDoUsuario(
    usuarioId,
    pedidoId
  );

  if (!pedido) {
    throw erro("Pedido não encontrado.", 404);
  }

  return pedido;
}

const statusPermitidos = [
  "PENDENTE",
  "PAGO",
  "EM_PREPARACAO",
  "ENVIADO",
  "ENTREGUE",
  "CANCELADO",
];

// Lista todos os pedidos para administração.
export async function listarTodosPedidos(usuario) {
  if (!usuario || usuario.tipo !== "ADMIN") {
    throw erro("Acesso não autorizado.", 403);
  }

  return pedidoModel.listarTodosPedidos();
}

// Atualiza o status de um pedido.
export async function atualizarStatus(usuario, pedidoId, novoStatus) {
  if (!usuario || usuario.tipo !== "ADMIN") {
    throw erro("Acesso não autorizado.", 403);
  }

  if (typeof pedidoId !== "string" || !pedidoId.trim()) {
    throw erro("Identificador do pedido inválido.");
  }

  if (!statusPermitidos.includes(novoStatus)) {
    throw erro("Status do pedido inválido.");
  }

  return pedidoModel.atualizarStatusPedido(
    pedidoId,
    novoStatus
  );
}