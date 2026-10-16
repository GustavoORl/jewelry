
import { Prisma } from "../../../generated/prisma/client.js";
import { ZodError } from "zod";
import {
  criarProduto,
  listarProdutos,
  buscarProdutoPorId,
} from "../../services/produtoService.js";

export async function cadastrarProduto(req, res) {
  try {
    const produto = await criarProduto(req.body);

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
