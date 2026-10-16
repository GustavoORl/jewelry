
import { z } from "zod";
import { prisma } from "../config/prisma.js";

const esquemaProduto = z.object({
  categoriaId: z.string().min(1),
  nome: z.string().trim().min(2).max(150),
  slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  descricao: z.string().trim().min(1),
  preco: z.coerce.number().positive().finite(),
  estoque: z.coerce.number().int().min(0).default(0),
});

export async function criarProduto(dados) {
  const dadosValidados = esquemaProduto.parse(dados);

  return prisma.produto.create({
    data: {
      ...dadosValidados,
      preco: dadosValidados.preco,
    },
    include: {
      categoria: true,
      imagens: true,
    },
  });
}

export async function listarProdutos() {
  return prisma.produto.findMany({
    where: {
      ativo: true,
    },
    include: {
      categoria: true,
      imagens: {
        orderBy: {
          posicao: "asc",
        },
      },
    },
    orderBy: {
      criadoEm: "desc",
    },
  });
}

export async function buscarProdutoPorId(id) {
  return prisma.produto.findUnique({
    where: { id },
    include: {
      categoria: true,
      imagens: {
        orderBy: {
          posicao: "asc",
        },
      },
    },
  });
}
