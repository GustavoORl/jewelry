
import bcrypt from "bcryptjs";
import { z } from "zod";

import {
  criarUsuarioModel,
  listarUsuariosModel,
  buscarUsuarioPorIdModel,
  atualizarPerfilUsuarioModel,
  atualizarSenhaUsuarioModel,
  buscarCredenciaisUsuarioModel
} from "../models/usuarioModel.js";
import { buscarProdutoPorIdModel } from "../models/produtoModel.js";

const esquemaUsuario = z.object({
  nome: z.string().trim().min(2).max(100),
  cpfCnpj: z.string().trim().optional(),
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  senha: z.string().min(8).max(72),
  telefone: z.string().trim().optional(),
});

const esquemaAtualizarPerfil =
  z.object({
    nome: z
      .string()
      .trim()
      .min(
        2,
        "O nome deve possuir pelo menos 2 caracteres."
      )
      .max(
        120,
        "O nome é muito longo."
      ),

    email: z
      .string()
      .trim()
      .email(
        "Informe um e-mail válido."
      )
      .transform(
        (email) =>
          email.toLowerCase()
      ),

    telefone: z
      .string()
      .trim()
      .max(
        20,
        "Telefone inválido."
      )
      .nullable()
      .optional(),
  });


const esquemaAlterarSenha =
  z
    .object({
      senhaAtual: z
        .string()
        .min(
          1,
          "Informe sua senha atual."
        ),

      novaSenha: z
        .string()
        .min(
          8,
          "A nova senha deve possuir pelo menos 8 caracteres."
        )
        .max(
          72,
          "A nova senha é muito longa."
        ),

      confirmarSenha: z
        .string()
        .min(1),
    })
    .refine(
      (dados) =>
        dados.novaSenha ===
        dados.confirmarSenha,
      {
        message:
          "As novas senhas não coincidem.",

        path: [
          "confirmarSenha",
        ],
      }
    );

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

export async function atualizarPerfilUsuario(
  usuarioId,
  dados
) {
  const dadosValidados =
    esquemaAtualizarPerfil.parse(
      dados
    );

  return atualizarPerfilUsuarioModel(
    usuarioId,
    {
      nome:
        dadosValidados.nome,

      email:
        dadosValidados.email,

      telefone:
        dadosValidados.telefone ||
        null,
    }
  );
}


export async function alterarSenhaUsuario(
  usuarioId,
  dados
) {
  const dadosValidados =
    esquemaAlterarSenha.parse(
      dados
    );

  const usuario =
    await buscarCredenciaisUsuarioModel(
      usuarioId
    );


  if (
    !usuario ||
    !usuario.ativo
  ) {
    const erro =
      new Error(
        "USUARIO_NAO_ENCONTRADO"
      );

    throw erro;
  }


  const senhaAtualCorreta =
    await bcrypt.compare(
      dadosValidados.senhaAtual,
      usuario.senhaHash
    );


  if (!senhaAtualCorreta) {
    const erro =
      new Error(
        "SENHA_ATUAL_INCORRETA"
      );

    throw erro;
  }


  const mesmaSenha =
    await bcrypt.compare(
      dadosValidados.novaSenha,
      usuario.senhaHash
    );


  if (mesmaSenha) {
    const erro =
      new Error(
        "NOVA_SENHA_IGUAL_ATUAL"
      );

    throw erro;
  }


  const novaSenhaHash =
    await bcrypt.hash(
      dadosValidados.novaSenha,
      12
    );


  await atualizarSenhaUsuarioModel(
    usuarioId,
    novaSenhaHash
  );


  return {
    mensagem:
      "Senha alterada com sucesso.",
  };
}