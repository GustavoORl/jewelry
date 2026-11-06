
import { prisma } from "../../config/prisma.js";
import { ZodError } from "zod";

import {
  autenticarUsuario,
  autenticarGoogle,
  renovarTokens,
  encerrarSessao,
} from "../../services/authService.js";

const COOKIE_ACCESS_TOKEN = "aurora_access";
const COOKIE_REFRESH_TOKEN = "aurora_refresh";

const opcoesCookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

const opcoesCookieAccess = {
  ...opcoesCookieBase,
  maxAge: 15 * 60 * 1000,
};

const opcoesCookieRefresh = {
  ...opcoesCookieBase,
  maxAge: 15 * 24 * 60 * 60 * 1000,
};

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function definirCookies(res, resultado) {
  res.cookie(
    COOKIE_ACCESS_TOKEN,
    resultado.accessToken,
    opcoesCookieAccess
  );

  res.cookie(
    COOKIE_REFRESH_TOKEN,
    resultado.refreshToken,
    opcoesCookieRefresh
  );
}

function limparCookies(res) {
  res.clearCookie(
    COOKIE_ACCESS_TOKEN,
    opcoesCookieBase
  );

  res.clearCookie(
    COOKIE_REFRESH_TOKEN,
    opcoesCookieBase
  );
}

// ==========================================
// LOGIN TRADICIONAL
// ==========================================

export async function login(req, res) {
  try {
    const resultado = await autenticarUsuario(req.body);

    definirCookies(res, resultado);

    return res.status(200).json({
      sucesso: true,
      mensagem: "Login realizado com sucesso.",
      usuario: resultado.usuario,
    });
  } catch (erro) {
    if (erro instanceof ZodError) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Informe um e-mail válido e uma senha.",
        erros: erro.issues,
      });
    }

    if (erro.message === "CREDENCIAIS_INVALIDAS") {
      return res.status(401).json({
        sucesso: false,
        mensagem: "E-mail ou senha incorretos.",
      });
    }

    if (erro.message === "USUARIO_DESATIVADO") {
      return res.status(403).json({
        sucesso: false,
        mensagem:
          "Esta conta está desativada. Entre em contato com o suporte.",
      });
    }

    console.error("Erro no login:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível realizar o login.",
    });
  }
}

// ==========================================
// LOGIN E CADASTRO COM GOOGLE
// ==========================================

export async function loginGoogle(req, res) {
  try {
    const resultado = await autenticarGoogle(req.body);

    definirCookies(res, resultado);

    return res.status(200).json({
      sucesso: true,
      mensagem: "Autenticação com Google realizada com sucesso.",
      usuario: resultado.usuario,
    });
  } catch (erro) {
    if (erro instanceof ZodError) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Credencial Google não informada.",
        erros: erro.issues,
      });
    }

    if (erro.message === "GOOGLE_TOKEN_INVALIDO") {
      return res.status(401).json({
        sucesso: false,
        mensagem:
          "Autenticação Google inválida ou expirada. Tente novamente.",
      });
    }

    if (erro.message === "USUARIO_DESATIVADO") {
      return res.status(403).json({
        sucesso: false,
        mensagem:
          "Esta conta está desativada. Entre em contato com o suporte.",
      });
    }

    if (erro.message === "GOOGLE_VINCULACAO_NECESSARIA") {
      return res.status(409).json({
        sucesso: false,
        mensagem:
          "Já existe uma conta com este e-mail. Entre com sua senha para continuar. A vinculação com o Google ainda não está disponível.",
      });
    }

    if (erro.message === "GOOGLE_CONTA_CONFLITANTE") {
      return res.status(409).json({
        sucesso: false,
        mensagem:
          "Não foi possível vincular esta conta Google. Entre em contato com o suporte.",
      });
    }

    console.error("Erro no login Google:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem:
        "Não foi possível realizar a autenticação com Google.",
    });
  }
}

// ==========================================
// RENOVAR SESSÃO
// ==========================================

export async function renovar(req, res) {
  try {
    const refreshToken =
      req.cookies?.[COOKIE_REFRESH_TOKEN];

    const resultado = await renovarTokens(refreshToken);

    definirCookies(res, resultado);

    return res.status(200).json({
      sucesso: true,
      mensagem: "Sessão renovada com sucesso.",
      usuario: resultado.usuario,
    });
  } catch (erro) {
    if (erro.message === "REFRESH_TOKEN_INVALIDO") {
      limparCookies(res);

      return res.status(401).json({
        sucesso: false,
        mensagem:
          "Sessão expirada ou inválida. Faça login novamente.",
      });
    }

    console.error("Erro ao renovar sessão:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível renovar a sessão.",
    });
  }
}

// ==========================================
// LOGOUT
// ==========================================

export async function logout(req, res) {
  try {
    const refreshToken =
      req.cookies?.[COOKIE_REFRESH_TOKEN];

    await encerrarSessao(refreshToken);

    limparCookies(res);

    return res.status(200).json({
      sucesso: true,
      mensagem: "Logout realizado com sucesso.",
    });
  } catch (erro) {
    console.error("Erro no logout:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível encerrar a sessão.",
    });
  }
}

// ==========================================
// USUÁRIO AUTENTICADO
// ==========================================

export async function obterUsuarioAutenticado(req, res) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: {
        id: req.usuario.id,
      },

      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        tipo: true,
        ativo: true,
        googleId: true,
        senhaHash: true,
      },
    });

    if (!usuario || !usuario.ativo) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado.",
      });
    }

    // Não expor googleId ou senhaHash na resposta.
    const dadosUsuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      tipo: usuario.tipo,
      ativo: usuario.ativo,
      possuiGoogle: Boolean(usuario.googleId),
      possuiSenha: Boolean(usuario.senhaHash),
    };

    return res.status(200).json({
      sucesso: true,
      usuario: dadosUsuario,
    });
  } catch (erro) {
    console.error(
      "Erro ao consultar usuário autenticado:",
      erro
    );

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar sessão.",
    });
  }
}
