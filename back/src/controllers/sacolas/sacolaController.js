
import * as sacolaService from "../../services/sacolaService.js";

export async function consultar(req, res) {
  try {
    const usuarioId = req.usuario.id;

    const sacola = await sacolaService.consultarSacola(usuarioId);

    return res.status(200).json(sacola);
  } catch (error) {
    console.error("Erro ao consultar sacola:", error);

    return res.status(error.status || 500).json({
      mensagem:
        error.status
          ? error.message
          : "Erro interno ao consultar a sacola.",
    });
  }
}

export async function adicionarItem(req, res) {
  try {
    const usuarioId = req.usuario.id;
    const { produtoId, quantidade = 1 } = req.body;

    if (!produtoId || typeof produtoId !== "string") {
      return res.status(400).json({
        mensagem: "Informe um produto válido.",
      });
    }

    const sacola = await sacolaService.adicionarProduto(
      usuarioId,
      produtoId,
      quantidade
    );

    return res.status(200).json({
      mensagem: "Produto adicionado à sacola.",
      sacola,
    });
  } catch (error) {
    console.error("Erro ao adicionar produto à sacola:", error);

    return res.status(error.status || 500).json({
      mensagem:
        error.status
          ? error.message
          : "Erro interno ao adicionar produto à sacola.",
    });
  }
}

export async function alterarQuantidade(req, res) {
  try {
    const usuarioId = req.usuario.id;
    const { itemId } = req.params;
    const { quantidade } = req.body;

    if (
      !Number.isInteger(quantidade) ||
      quantidade < 1
    ) {
      return res.status(400).json({
        mensagem: "Informe uma quantidade inteira maior que zero.",
      });
    }

    const sacola = await sacolaService.alterarQuantidade(
      usuarioId,
      itemId,
      quantidade
    );

    return res.status(200).json({
      mensagem: "Quantidade atualizada com sucesso.",
      sacola,
    });
  } catch (error) {
    console.error("Erro ao alterar quantidade:", error);

    return res.status(error.status || 500).json({
      mensagem:
        error.status
          ? error.message
          : "Erro interno ao alterar a quantidade.",
    });
  }
}

export async function removerItem(req, res) {
  try {
    const usuarioId = req.usuario.id;
    const { itemId } = req.params;

    const sacola = await sacolaService.removerProduto(
      usuarioId,
      itemId
    );

    return res.status(200).json({
      mensagem: "Produto removido da sacola.",
      sacola,
    });
  } catch (error) {
    console.error("Erro ao remover produto da sacola:", error);

    return res.status(error.status || 500).json({
      mensagem:
        error.status
          ? error.message
          : "Erro interno ao remover produto da sacola.",
    });
  }
}

export async function esvaziar(req, res) {
  try {
    const usuarioId = req.usuario.id;

    const resultado = await sacolaService.esvaziarSacola(usuarioId);

    return res.status(200).json({
      mensagem: "Sacola esvaziada com sucesso.",
      sacola: resultado,
    });
  } catch (error) {
    console.error("Erro ao esvaziar sacola:", error);

    return res.status(error.status || 500).json({
      mensagem:
        error.status
          ? error.message
          : "Erro interno ao esvaziar a sacola.",
    });
  }
}
