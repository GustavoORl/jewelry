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

export async function criarPedido(usuarioId, dadosEndereco) {
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
  });
}
