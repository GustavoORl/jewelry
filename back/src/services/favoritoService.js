
import * as favoritoModel from "../models/favoritoModel.js";

function erro(mensagem, status = 400) {
  const error = new Error(mensagem);
  error.status = status;
  return error;
}

// Lista os favoritos do usuário
export async function listarFavoritos(usuarioId) {
  if (!usuarioId) {
    throw erro("Usuário não autenticado.", 401);
  }

  return favoritoModel.listarFavoritos(usuarioId);
}

// Adiciona um produto aos favoritos
export async function adicionarFavorito(usuarioId, produtoId) {
  if (!usuarioId) {
    throw erro("Usuário não autenticado.", 401);
  }

  if (typeof produtoId !== "string" || !produtoId.trim()) {
    throw erro("Identificador do produto inválido.");
  }

  const produto = await favoritoModel.buscarProdutoFavoritavel(
    produtoId.trim()
  );

  if (!produto) {
    throw erro("Produto não encontrado ou indisponível.", 404);
  }

  const favoritoExistente = await favoritoModel.buscarFavorito(
    usuarioId,
    produtoId.trim()
  );

  if (favoritoExistente) {
    throw erro("Este produto já está nos seus favoritos.", 409);
  }

  try {
    return await favoritoModel.adicionarFavorito(
      usuarioId,
      produtoId.trim()
    );
  } catch (error) {
    // Protege contra duas requisições simultâneas
    if (error.code === "P2002") {
      throw erro("Este produto já está nos seus favoritos.", 409);
    }

    throw error;
  }
}

// Remove um produto dos favoritos
export async function removerFavorito(usuarioId, produtoId) {
  if (!usuarioId) {
    throw erro("Usuário não autenticado.", 401);
  }

  if (typeof produtoId !== "string" || !produtoId.trim()) {
    throw erro("Identificador do produto inválido.");
  }

  const favorito = await favoritoModel.buscarFavorito(
    usuarioId,
    produtoId.trim()
  );

  if (!favorito) {
    throw erro("Este produto não está nos seus favoritos.", 404);
  }

  return favoritoModel.removerFavorito(
    usuarioId,
    produtoId.trim()
  );
}
