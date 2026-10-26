
const API_URL = import.meta.env.VITE_API_URL;

async function requisicao(endpoint, opcoes = {}) {
  const token = sessionStorage.getItem("aurora_token");

  const resposta = await fetch(`${API_URL}${endpoint}`, {
    ...opcoes,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opcoes.headers,
    },
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      resultado.mensagem || "Não foi possível concluir a operação."
    );
  }

  return resultado;
}

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
