import { prisma } from "../config/prisma.js";

const incluirImagensCategoria = {
  imagens: {
    orderBy: {
      posicao: "asc",
    },
  },
};

export async function criarCategoriaModel(dados, banco = prisma) {
  return banco.categoria.create({
    data: {
      nome: dados.nome,
      slug: dados.slug,
      descricao: dados.descricao ?? null,
    },
    include: incluirImagensCategoria,
  });
}

export async function listarCategoriasModel() {
  return prisma.categoria.findMany({
    include: incluirImagensCategoria,
    orderBy: {
      atualizadoEm: "desc",
    },
  });
}

export async function buscarCategoriaPorIdModel(id) {
  return prisma.categoria.findUnique({
    where: { id },
    include: {
      ...incluirImagensCategoria,
      produtos: {
        select: {
          id: true,
          nome: true,
          ativo: true,
        },
      },
    },
  });
}

export async function excluirCategoriaModel(id, banco = prisma) {
  return banco.categoria.delete({
    where: { id },
  });
}

export async function atualizarCategoriaModel(
  categoria,
  id,
  banco = prisma
) {
  return banco.categoria.update({
    where: { id },
    data: categoria,
    include: incluirImagensCategoria,
  });
}

export async function atualizarStatusCategoriaModel(id, ativo) {
  return prisma.categoria.update({
    where: { id },
    data: { ativo },
    select: {
      id: true,
      nome: true,
      ativo: true,
    },
  });
}