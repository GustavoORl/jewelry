
import bcrypt from "bcryptjs";
import { z } from "zod";

import {
  criarUsuarioModel,
  listarUsuariosModel,
  buscarUsuarioPorIdModel,
} from "../models/usuarioModel.js";
import { buscarProdutoPorIdModel } from "../models/produtoModel.js";

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

  return criarUsuarioModel({
    nome: dadosValidados.nome,
    cpfCnpj: dadosValidados.cpfCnpj || null,
    email: dadosValidados.email,
    senhaHash,
    telefone: dadosValidados.telefone || null,
  });
}

export async function listarUsuarios() {
  return listarUsuariosModel();
}

export async function buscarUsuarioPorId(id) {
  return buscarUsuarioPorIdModel(id);
}

