import { Prisma } from "../../../generated/prisma/client.js";
import { ZodError } from "zod";

import {
  criarCategoria,
  listarCategorias,
  buscarCategoriaPorId,
  excluirCategoria,
  atualizarCategoria,
  atualizarStatusCategoriaService,
} from "../../services/categoriaService.js";

export async function cadastrarCategoria(req, res) {
  try {
    const categoria = await criarCategoria(
      req.body,
      req.file
    );

    return res.status(201).json({
      sucesso: true,
      mensagem: "Categoria cadastrada com sucesso.",
      categoria,
    });
  } catch (erro) {
    if (erro instanceof ZodError) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Dados inválidos.",
        erros: erro.issues,
      });
    }

    if (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === "P2002"
    ) {
      return res.status(409).json({
        sucesso: false,
        mensagem: "Já existe uma categoria com esse slug.",
      });
    }

    console.error("Erro ao cadastrar categoria:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao cadastrar categoria.",
    });
  }
}

export async function obterCategorias(req, res) {
  try {
    const categorias = await listarCategorias();

    return res.status(200).json({
      sucesso: true,
      categorias,
    });
  } catch (erro) {
    console.error("Erro ao consultar categorias:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar categorias.",
    });
  }
}

export async function obterCategoriaPorId(req, res) {
  try {
    const categoria = await buscarCategoriaPorId(
      req.params.id
    );

    if (!categoria) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Categoria não encontrada.",
      });
    }

    return res.status(200).json({
      sucesso: true,
      categoria,
    });
  } catch (erro) {
    console.error("Erro ao consultar categoria:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar categoria.",
    });
  }
}

export async function excluirCategoriaController(req, res) {
  try {
    const { id } = req.params;

    const resultado = await excluirCategoria(id);

    return res.status(200).json({
      sucesso: true,
      ...resultado,
    });
  } catch (erro) {
    if (erro.message === "CATEGORIA_NAO_ENCONTRADA") {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Categoria não encontrada.",
      });
    }

    if (erro.message === "CATEGORIA_POSSUI_PRODUTOS") {
      return res.status(409).json({
        sucesso: false,
        mensagem:
          "Não é possível excluir esta categoria porque existem produtos vinculados a ela.",
      });
    }

    console.error("Erro ao excluir categoria:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível excluir a categoria.",
    });
  }
}

export async function atualizarCategoriaController(
  req,
  res,
  next
) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O ID da categoria é obrigatório.",
      });
    }

    const categoria = await atualizarCategoria(
      id,
      req.body,
      req.file
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Categoria atualizada com sucesso.",
      categoria,
    });
  } catch (erro) {
    if (erro instanceof ZodError) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Dados inválidos.",
        erros: erro.issues,
      });
    }

    if (erro.message === "CATEGORIA_NAO_ENCONTRADA") {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Categoria não encontrada.",
      });
    }

    if (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === "P2002"
    ) {
      return res.status(409).json({
        sucesso: false,
        mensagem: "Já existe uma categoria com esse slug.",
      });
    }

    console.error("Erro ao atualizar categoria:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar categoria.",
    });
  }
}

export async function atualizarStatusCategoriaController(
  req,
  res,
  next
) {
  try {
    const { id } = req.params;
    const { ativo } = req.body;

    const categoria = await atualizarStatusCategoriaService(
      id,
      ativo
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: `Categoria ${
        ativo ? "ativada" : "desativada"
      } com sucesso.`,
      categoria,
    });
  } catch (erro) {
    if (erro.message === "CATEGORIA_NAO_ENCONTRADA") {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Categoria não encontrada.",
      });
    }

    if (
      erro.message === "O ID da categoria é obrigatório." ||
      erro.message === "O campo ativo deve ser true ou false."
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: erro.message,
      });
    }

    console.error("Erro ao atualizar status da categoria:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar status da categoria.",
    });
  }
}