
import { apiFetch as requisicao } from "./api.js";

export async function cadastrarProduto(dados) {
  const resultado = await requisicao("/produtos", {
    method: "POST",
    body: JSON.stringify(dados),
  });

  return resultado.produto;
}

export async function listarProdutos() {
  const resultado = await requisicao("/produtos");
  return resultado.produtos;
}

export async function listarCategorias() {
  const resultado = await requisicao("/categorias");
  return resultado.categorias;
}
