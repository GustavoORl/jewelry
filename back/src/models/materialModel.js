
import { prisma } from "../config/prisma.js";

// Cadastra um novo material.
export async function criarMaterialModel(dados) {
  return prisma.material.create({
    data: {
      nome: dados.nome,
    },
  });
}

// Lista todos os materiais cadastrados.
export async function listarMateriaisModel() {
  return prisma.material.findMany({
    orderBy: {
      nome: "asc",
    },
  });
}

// Busca um material pelo ID.
export async function buscarMaterialPorIdModel(id) {
  return prisma.material.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      produtos: {
        include: {
          produto: {
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
  });
}

// Busca um material pelo nome.
export async function buscarMaterialPorNomeModel(nome) {
  return prisma.material.findUnique({
    where: {
      nome,
    },
  });
}

// Atualiza os dados de um material.
export async function atualizarMaterialModel(id, dados) {
  return prisma.material.update({
    where: {
      id: Number(id),
    },
    data: {
      nome: dados.nome,
    },
  });
}

// Exclui um material.
export async function excluirMaterialModel(id) {
  return prisma.material.delete({
    where: {
      id: Number(id),
    },
  });
}
