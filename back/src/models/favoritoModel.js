
import { prisma } from "../config/prisma.js";

// Lista os favoritos de um usuário
export async function listarFavoritos(usuarioId) {
  return prisma.favorito.findMany({
    where: {
      usuarioId,
      produto: {
        ativo: true,
        categoria: {
          ativo: true,
        },
      },
    },
    orderBy: {
      criadoEm: "desc",
    },
    include: {
      produto: {
        include: {
          imagens: {
            orderBy: {
              posicao: "asc",
            },
          },
          categoria: true,
          materiais: {
            include: {
              material: true,
            },
          },
        },
      },
    },
  });
}

// Busca um favorito específico
export async function buscarFavorito(usuarioId, produtoId) {
  return prisma.favorito.findUnique({
    where: {
      usuarioId_produtoId: {
        usuarioId,
        produtoId,
      },
    },
  });
}

// Verifica se o produto existe e está disponível
export async function buscarProdutoFavoritavel(produtoId) {
  return prisma.produto.findFirst({
    where: {
      id: produtoId,
      ativo: true,
      categoria: {
        ativo: true,
      },
    },
    select: {
      id: true,
    },
  });
}

// Adiciona um produto aos favoritos
export async function adicionarFavorito(usuarioId, produtoId) {
  return prisma.favorito.create({
    data: {
      usuarioId,
      produtoId,
    },
  });
}

// Remove um produto dos favoritos
export async function removerFavorito(usuarioId, produtoId) {
  return prisma.favorito.delete({
    where: {
      usuarioId_produtoId: {
        usuarioId,
        produtoId,
      },
    },
  });
}
