
import { prisma } from "../config/prisma.js";

export async function criarUsuarioModel(dados) {
  return prisma.usuario.create({
    data: {
      nome: dados.nome,
      cpfCnpj: dados.cpfCnpj,
      email: dados.email,
      senhaHash: dados.senhaHash,
      telefone: dados.telefone,
      tipo: "CLIENTE",
    },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      tipo: true,
      criadoEm: true,
    },
  });
}

export async function listarUsuariosModel() {
  return prisma.usuario.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      tipo: true,
      ativo: true,
      criadoEm: true,
      ultimoAcessoEm: true,
    },
    orderBy: {
      criadoEm: "desc",
    },
  });
}

export async function buscarUsuarioPorIdModel(id) {
  return prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      tipo: true,
      ativo: true,
      criadoEm: true,
    },
  });
}

export async function desativarUsuarioModel(id) {
  return prisma.usuario.update({
    where: { id },
    data: {
      ativo: false,
    },
  });
}
