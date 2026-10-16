
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../config/prisma.js";

const esquemaUsuario = z.object({
  nome: z.string().trim().min(2).max(100),
  cpfCnpj: z.string().trim().optional(),
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  senha: z.string().min(8).max(72),
  telefone: z.string().trim().optional(),
});

export async function criarUsuario(dados) {
  const dadosValidados = esquemaUsuario.parse(dados);

  const senhaHash = await bcrypt.hash(dadosValidados.senha, 12);

  return prisma.usuario.create({
    data: {
      nome: dadosValidados.nome,
      cpfCnpj: dadosValidados.cpfCnpj || null,
      email: dadosValidados.email,
      senhaHash,
      telefone: dadosValidados.telefone || null,
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

export async function listarUsuarios() {
  return prisma.usuario.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      tipo: true,
      ativo: true,
      criadoEm: true,
    },
    orderBy: {
      criadoEm: "desc",
    },
  });
}

export async function buscarUsuarioPorId(id) {
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
