
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import {
  criarProduto,
  listarProdutos,
  buscarProdutoPorId,
  excluirProduto,
  atualizarProduto,
  atualizarStatusProdutoService
} from "../../services/produtoService.js";

export async function cadastrarProduto(req, res) {
  try {
    const produto = await criarProduto(req.body, req.files || []);

    return res.status(201).json({
      sucesso: true,
      mensagem: "Produto cadastrado com sucesso.",
      produto,
    });
  } catch (erro) {
    if (erro instanceof ZodError) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Dados inválidos.",
        erros: erro.issues,
      });
    }

    if (erro.message === "MATERIAL_NAO_ENCONTRADO") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Um ou mais materiais informados não existem.",
      });
    }

    if (erro.message === "MATERIAIS_DUPLICADOS") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A lista contém materiais duplicados.",
      });
    }

    if (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === "P2002"
    ) {
      return res.status(409).json({
        sucesso: false,
        mensagem: "Já existe um produto com esse slug.",
      });
    }

    if (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === "P2003"
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A categoria informada não existe.",
      });
    }

    console.error(erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao cadastrar produto.",
    });
  }
}

export async function obterProdutos(req, res) {
  try {
    const produtos = await listarProdutos();

    return res.status(200).json({
      sucesso: true,
      produtos,
    });
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar produtos.",
    });
  }
}

export async function obterProdutoPorId(req, res) {
  try {
    const produto = await buscarProdutoPorId(req.params.id);

    if (!produto) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Produto não encontrado.",
      });
    }

    return res.status(200).json({
      sucesso: true,
      produto,
    });
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar produto.",
    });
  }
}



export async function excluirProdutoController(req, res, next) {
  try {
    const { id } = req.params;

    const resultado = await excluirProduto(id);

    return res.status(200).json({
      sucesso: true,
      mensagem: "Produto excluído com sucesso.",
      produto: resultado,
      aviso:
        resultado.falhasAoRemoverImagens > 0
          ? "O produto foi excluído, mas algumas imagens não puderam ser removidas do armazenamento."
          : null,
    });
  } catch (erro) {
    if (erro.message === "PRODUTO_NAO_ENCONTRADO") {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Produto não encontrado.",
      });
    }

    if (erro.code === "P2003") {
      return res.status(409).json({
        sucesso: false,
        mensagem:
          "Não foi possível excluir o produto porque existem registros relacionados a ele.",
      });
    }

    console.error("Erro ao excluir produto:", erro);

    return next(erro);
  }
}



export async function atualizarProdutoController(req, res, next) {
  try {
    const { id } = req.params;
    const dados = req.body;
    const imagens = req.files || [];

    if (!id) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O ID do produto é obrigatório.",
      });
    }

    if (
      (!dados || Object.keys(dados).length === 0) &&
      imagens.length === 0
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Informe dados ou imagens para atualizar o produto.",
      });
    }

    const produto = await atualizarProduto(
      id,
      dados ?? {},
      imagens
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Produto atualizado com sucesso.",
      produto,
    });
  } catch (erro) {
    if (erro.message === "PRODUTO_NAO_ENCONTRADO") {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Produto não encontrado.",
      });
    }

    if (erro.message === "MATERIAL_NAO_ENCONTRADO") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Um ou mais materiais informados não existem.",
      });
    }

    if (erro.message === "MATERIAIS_DUPLICADOS") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A lista contém materiais duplicados.",
      });
    }

    console.error("Erro ao atualizar produto:", erro);
    return next(erro);
  }
}


export async function atualizarStatusProdutoController(req, res, next) {
  try {
    const { id } = req.params;
    const { ativo } = req.body;

    const produto = await atualizarStatusProdutoService(id, ativo);

    return res.status(200).json({
      mensagem: `Produto ${ativo ? "ativado" : "desativado"} com sucesso.`,
      produto,
    });
  } catch (erro) {
    return next(erro);
  }
}