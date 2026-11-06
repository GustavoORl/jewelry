
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import {
  criarUsuario,
  listarUsuarios,
  buscarUsuarioPorId,
  atualizarPerfilUsuario,
  alterarSenhaUsuario,
} from "../../services/usuarioService.js";

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function responderErroValidacao(res, erro) {
  return res.status(400).json({
    sucesso: false,
    mensagem: erro.issues?.[0]?.message || "Dados inválidos.",
    erros: erro.issues,
  });
}

function erroPrisma(erro, codigo) {
  return (
    erro instanceof Prisma.PrismaClientKnownRequestError &&
    erro.code === codigo
  );
}

// ==========================================
// CADASTRAR USUÁRIO
// ==========================================

export async function cadastrarUsuario(req, res) {
  try {
    const usuario = await criarUsuario(req.body);

    return res.status(201).json({
      sucesso: true,
      mensagem: "Usuário cadastrado com sucesso.",
      usuario,
    });
  } catch (erro) {
    if (erro instanceof ZodError) {
      return responderErroValidacao(res, erro);
    }

    if (erro.message === "TELEFONE_INVALIDO") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Informe um telefone válido com DDD.",
      });
    }

    if (erroPrisma(erro, "P2002")) {
      return res.status(409).json({
        sucesso: false,
        mensagem: "Este e-mail ou CPF/CNPJ já está cadastrado.",
      });
    }

    console.error("Erro ao cadastrar usuário:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível cadastrar o usuário.",
    });
  }
}

// ==========================================
// LISTAR USUÁRIOS
// ==========================================

export async function obterUsuarios(req, res) {
  try {
    const usuarios = await listarUsuarios();

    return res.status(200).json({
      sucesso: true,
      usuarios,
    });
  } catch (erro) {
    console.error("Erro ao listar usuários:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível consultar os usuários.",
    });
  }
}

// ==========================================
// BUSCAR USUÁRIO POR ID
// ==========================================

export async function obterUsuarioPorId(req, res) {
  try {
    const usuario = await buscarUsuarioPorId(req.params.id);

    if (!usuario || !usuario.ativo) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Usuário não encontrado.",
      });
    }

    return res.status(200).json({
      sucesso: true,
      usuario,
    });
  } catch (erro) {
    if (erro.message === "USUARIO_NAO_ENCONTRADO") {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Usuário não encontrado.",
      });
    }

    console.error("Erro ao buscar usuário:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível consultar o usuário.",
    });
  }
}

// ==========================================
// ATUALIZAR MEU PERFIL
// ==========================================

export async function atualizarMeuPerfil(req, res) {
  try {
    const usuario = await atualizarPerfilUsuario(
      req.usuario.id,
      req.body
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Dados atualizados com sucesso.",
      usuario,
    });
  } catch (erro) {
    if (erro instanceof ZodError) {
      return responderErroValidacao(res, erro);
    }

    if (erro.message === "TELEFONE_INVALIDO") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Informe um telefone válido com DDD.",
      });
    }

    if (erro.message === "ALTERACAO_EMAIL_NAO_PERMITIDA") {
      return res.status(403).json({
        sucesso: false,
        mensagem:
          "A alteração de e-mail ainda não está disponível. Por segurança, seu endereço de e-mail não pode ser modificado nesta página.",
      });
    }

    if (erro.message === "USUARIO_NAO_ENCONTRADO") {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Usuário não encontrado ou conta desativada.",
      });
    }

    if (erroPrisma(erro, "P2002")) {
      return res.status(409).json({
        sucesso: false,
        mensagem: "Já existe uma conta com esses dados.",
      });
    }

    if (erroPrisma(erro, "P2025")) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Usuário não encontrado.",
      });
    }

    console.error("Erro ao atualizar perfil:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível atualizar seus dados.",
    });
  }
}

// ==========================================
// ALTERAR MINHA SENHA
// ==========================================

export async function alterarMinhaSenha(req, res) {
  try {
    const resultado = await alterarSenhaUsuario(
      req.usuario.id,
      req.body
    );

    return res.status(200).json({
      sucesso: true,
      mensagem:
        resultado?.mensagem || "Senha alterada com sucesso.",
    });
  } catch (erro) {
    if (erro instanceof ZodError) {
      return responderErroValidacao(res, erro);
    }

    if (erro.message === "SENHA_ATUAL_INCORRETA") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A senha atual está incorreta.",
      });
    }

    if (erro.message === "NOVA_SENHA_IGUAL_ATUAL") {
      return res.status(400).json({
        sucesso: false,
        mensagem:
          "A nova senha deve ser diferente da senha atual.",
      });
    }

    if (erro.message === "USUARIO_SEM_SENHA") {
      return res.status(409).json({
        sucesso: false,
        mensagem:
          "Esta conta ainda não possui uma senha tradicional. Se você utiliza o Google para entrar, continue usando essa opção.",
      });
    }

    if (erro.message === "USUARIO_NAO_ENCONTRADO") {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Usuário não encontrado ou conta desativada.",
      });
    }

    if (erroPrisma(erro, "P2025")) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Usuário não encontrado.",
      });
    }

    console.error("Erro ao alterar senha:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível alterar sua senha.",
    });
  }
}
