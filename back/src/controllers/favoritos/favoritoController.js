
import * as favoritoService from "../../services/favoritoService.js";

export async function listar(req, res) {
  try {
    const favoritos = await favoritoService.listarFavoritos(
      req.usuario.id
    );

    return res.status(200).json({
      sucesso: true,
      favoritos,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      sucesso: false,
      mensagem: error.status
        ? error.message
        : "Erro ao listar favoritos.",
    });
  }
}

export async function adicionar(req, res) {
  try {
    const favorito = await favoritoService.adicionarFavorito(
      req.usuario.id,
      req.params.produtoId
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: "Produto adicionado aos favoritos.",
      favorito,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      sucesso: false,
      mensagem: error.status
        ? error.message
        : "Erro ao adicionar produto aos favoritos.",
    });
  }
}

export async function remover(req, res) {
  try {
    await favoritoService.removerFavorito(
      req.usuario.id,
      req.params.produtoId
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Produto removido dos favoritos.",
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      sucesso: false,
      mensagem: error.status
        ? error.message
        : "Erro ao remover produto dos favoritos.",
    });
  }
}
