
import bcrypt from "bcryptjs";
import { z } from "zod";

import {
  criarUsuarioModel,
  listarUsuariosModel,
  buscarUsuarioPorIdModel,
  atualizarPerfilUsuarioModel,
  atualizarSenhaUsuarioModel,
  buscarCredenciaisUsuarioModel,
} from "../models/usuarioModel.js";

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function normalizarTelefone(valor) {
  if (valor == null || valor === "") {
    return null;
  }

  const telefone = valor.replace(/\D/g, "");

  return telefone || null;
}

// ==========================================
// VALIDAÇÕES
// ==========================================

// Cadastro tradicional.
// Contas Google são criadas pelo authService.
const esquemaUsuario = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "O nome deve possuir pelo menos 2 caracteres.")
    .max(100, "O nome é muito longo."),

  cpfCnpj: z
    .string()
    .trim()
    .optional()
    .nullable(),

  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .transform((email) => email.toLowerCase()),

  senha: z
    .string()
    .min(8, "A senha deve possuir pelo menos 8 caracteres.")
    .max(72, "A senha é muito longa."),

  telefone: z
    .string()
    .trim()
    .optional()
    .nullable(),
});

// Atualização dos dados pessoais.
// O e-mail permanece somente para leitura.
const esquemaAtualizarPerfil = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "O nome deve possuir pelo menos 2 caracteres.")
    .max(120, "O nome é muito longo."),

  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .transform((email) => email.toLowerCase())
    .optional(),

  telefone: z
    .string()
    .trim()
    .nullable()
    .optional(),
});

// Alteração de senha tradicional.
const esquemaAlterarSenha = z
  .object({
    senhaAtual: z
      .string()
      .min(1, "Informe sua senha atual."),

    novaSenha: z
      .string()
      .min(
        8,
        "A nova senha deve possuir pelo menos 8 caracteres."
      )
      .max(72, "A nova senha é muito longa."),

    confirmarSenha: z
      .string()
      .min(1, "Confirme sua nova senha."),
  })
  .refine(
    (dados) =>
      dados.novaSenha === dados.confirmarSenha,
    {
      message: "As novas senhas não coincidem.",
      path: ["confirmarSenha"],
    }
  );

// ==========================================
// CADASTRAR USUÁRIO
// ==========================================

export async function criarUsuario(dados) {
  const dadosValidados = esquemaUsuario.parse(dados);

  const telefone = normalizarTelefone(
    dadosValidados.telefone
  );

  if (
    telefone &&
    !/^\d{10,11}$/.test(telefone)
  ) {
    throw new Error("TELEFONE_INVALIDO");
  }

  const senhaHash = await bcrypt.hash(
    dadosValidados.senha,
    12
  );

  return criarUsuarioModel({
    nome: dadosValidados.nome,
    cpfCnpj: dadosValidados.cpfCnpj || null,
    email: dadosValidados.email,
    senhaHash,
    telefone,
  });
}

// ==========================================
// LISTAR USUÁRIOS
// ==========================================

export async function listarUsuarios() {
  return listarUsuariosModel();
}

// ==========================================
// BUSCAR USUÁRIO
// ==========================================

export async function buscarUsuarioPorId(id) {
  if (!id) {
    throw new Error("USUARIO_NAO_ENCONTRADO");
  }

  return buscarUsuarioPorIdModel(id);
}

// ==========================================
// ATUALIZAR PERFIL
// ==========================================

export async function atualizarPerfilUsuario(
  usuarioId,
  dados
) {
  if (!usuarioId) {
    throw new Error("USUARIO_NAO_ENCONTRADO");
  }

  const dadosValidados =
    esquemaAtualizarPerfil.parse(dados);

  const usuarioAtual =
    await buscarUsuarioPorIdModel(usuarioId);

  if (!usuarioAtual || !usuarioAtual.ativo) {
    throw new Error("USUARIO_NAO_ENCONTRADO");
  }

  // O e-mail não pode ser alterado por este endpoint.
  // Se o frontend enviar o e-mail atual, aceitamos
  // para manter compatibilidade com Configuracoes.jsx.
  if (
    dadosValidados.email !== undefined &&
    dadosValidados.email !== usuarioAtual.email.toLowerCase()
  ) {
    throw new Error("ALTERACAO_EMAIL_NAO_PERMITIDA");
  }

  const telefone = normalizarTelefone(
    dadosValidados.telefone
  );

  if (
    telefone &&
    !/^\d{10,11}$/.test(telefone)
  ) {
    throw new Error("TELEFONE_INVALIDO");
  }

  return atualizarPerfilUsuarioModel(
    usuarioId,
    {
      nome: dadosValidados.nome,

      // Preserva o e-mail já cadastrado.
      email: usuarioAtual.email,

      telefone,
    }
  );
}

// ==========================================
// ALTERAR SENHA
// ==========================================

export async function alterarSenhaUsuario(
  usuarioId,
  dados
) {
  if (!usuarioId) {
    throw new Error("USUARIO_NAO_ENCONTRADO");
  }

  const dadosValidados =
    esquemaAlterarSenha.parse(dados);

  const usuario =
    await buscarCredenciaisUsuarioModel(usuarioId);

  if (!usuario || !usuario.ativo) {
    throw new Error("USUARIO_NAO_ENCONTRADO");
  }

  // Usuários cadastrados somente pelo Google
  // não possuem senha tradicional.
  if (!usuario.senhaHash) {
    throw new Error("USUARIO_SEM_SENHA");
  }

  // ========================================
  // VERIFICAR SENHA ATUAL
  // ========================================

  const senhaAtualCorreta = await bcrypt.compare(
    dadosValidados.senhaAtual,
    usuario.senhaHash
  );

  if (!senhaAtualCorreta) {
    throw new Error("SENHA_ATUAL_INCORRETA");
  }

  // ========================================
  // IMPEDIR REUTILIZAÇÃO
  // ========================================

  const mesmaSenha = await bcrypt.compare(
    dadosValidados.novaSenha,
    usuario.senhaHash
  );

  if (mesmaSenha) {
    throw new Error("NOVA_SENHA_IGUAL_ATUAL");
  }

  // ========================================
  // GERAR HASH DA NOVA SENHA
  // ========================================

  const novaSenhaHash = await bcrypt.hash(
    dadosValidados.novaSenha,
    12
  );

  // ========================================
  // SALVAR NOVA SENHA
  // ========================================

  await atualizarSenhaUsuarioModel(
    usuarioId,
    novaSenhaHash
  );

  return {
    mensagem: "Senha alterada com sucesso.",
  };
}
