
import { prisma } from "../config/prisma.js";

const incluirDetalhesProduto = {
  categoria: true,
  imagens: {
    orderBy: {
      posicao: "asc",
    },
  },
};

export async function criarProdutoModel(dados) {
  return prisma.produto.create({
    data: {
      categoriaId: dados.categoriaId,
      nome: dados.nome,
      slug: dados.slug,
      descricao: dados.descricao ?? null,
      preco: dados.preco,
      estoque: dados.estoque,
    },
    include: incluirDetalhesProduto,
  });
}

export async function listarProdutosModel() {
  return prisma.produto.findMany({
    where: {
        ativo: true,
    },
    include: incluirDetalhesProduto,
    orderBy: {
      criadoEm: "desc",
    },
  });
}

export async function buscarProdutoPorIdModel(id) {
  return prisma.produto.findUnique({
    where: { id },
    include: incluirDetalhesProduto,
  });
}

export async function excluirProdutoModel(id){
    return prisma.produto.delete({where: {id}});
}


export async function atualizarProdutoModel(produto, id) {
  return prisma.produto.update({
    where: { id },
    data: produto,
    include: incluirDetalhesProduto,
  });
}

export async function atualizarStatusProdutoModel(id, ativo) {
    return prisma.produto.update({
        where: { id },
        data: { ativo },
        select: {
            id: true,
            nome: true,
            ativo: true,
        },
    });
}