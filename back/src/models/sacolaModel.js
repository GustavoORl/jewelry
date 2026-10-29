
import { prisma } from "../config/prisma.js";

export async function buscarSacola(usuarioId) {
  return prisma.carrinho.findUnique({
    where: {
      usuarioId,
    },
    include: {
      itens: {
        orderBy: {
          criadoEm: "asc",
        },
        include: {
          produto: {
            include: {
              imagens: {
                orderBy: {
                  posicao: "asc",
                },
                take: 1,
              },
              categoria: {
                select: {
                  id: true,
                  nome: true,
                  slug: true,
                  ativo: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function criarSacola(usuarioId) {
  return prisma.carrinho.create({
    data: {
      usuarioId,
    },
  });
}

export async function buscarOuCriarSacola(usuarioId) {
  return prisma.carrinho.upsert({
    where: {
      usuarioId,
    },
    update: {},
    create: {
      usuarioId,
    },
  });
}

export async function buscarProduto(produtoId) {
  return prisma.produto.findUnique({
    where: {
      id: produtoId,
    },
    select: {
      id: true,
      nome: true,
      slug: true,
      preco: true,
      estoque: true,
      ativo: true,
      categoria: {
        select: {
          ativo: true,
        },
      },
    },
  });
}

export async function buscarItemSacola(carrinhoId, produtoId) {
  return prisma.itemCarrinho.findUnique({
    where: {
      carrinhoId_produtoId: {
        carrinhoId,
        produtoId,
      },
    },
  });
}

export async function adicionarItemSacola(
  carrinhoId,
  produtoId,
  quantidade
) {
  return prisma.itemCarrinho.upsert({
    where: {
      carrinhoId_produtoId: {
        carrinhoId,
        produtoId,
      },
    },
    update: {
      quantidade: {
        increment: quantidade,
      },
    },
    create: {
      carrinhoId,
      produtoId,
      quantidade,
    },
  });
}

export async function atualizarQuantidadeItem(itemId, quantidade) {
  return prisma.itemCarrinho.update({
    where: {
      id: itemId,
    },
    data: {
      quantidade,
    },
  });
}

export async function removerItemSacola(itemId) {
  return prisma.itemCarrinho.delete({
    where: {
      id: itemId,
    },
  });
}

export async function limparSacola(carrinhoId) {
  return prisma.itemCarrinho.deleteMany({
    where: {
      carrinhoId,
    },
  });
}
