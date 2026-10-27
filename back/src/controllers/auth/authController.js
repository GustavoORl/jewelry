import { prisma } from "../../config/prisma.js";
import { ZodError } from "zod";
import { autenticarUsuario, renovarTokens, encerrarSessao } from "../../services/authService.js";

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

export async function login(req, res) {
  try {
    const resultado = await autenticarUsuario(req.body);

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

    return res.status(200).json({
      sucesso: true,
      mensagem: "Login realizado com sucesso.",
      usuario: resultado.usuario,
    });
  } catch (erro) {
    if (erro instanceof ZodError) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Informe um email válido e uma senha.",
      });
    }

    if (erro.message === "CREDENCIAIS_INVALIDAS") {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Email ou senha incorretos.",
      });
    }

    console.error("Erro no login:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível realizar o login.",
    });
  }
}


export async function renovar(req, res) {
  try {
    const refreshToken = req.cookies?.aurora_refresh;

    const resultado = await renovarTokens(refreshToken);

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

    return res.status(200).json({
      sucesso: true,
      mensagem: "Sessão renovada com sucesso.",
      usuario: resultado.usuario,
    });
  } catch (erro) {
    if (erro.message === "REFRESH_TOKEN_INVALIDO") {
      res.clearCookie(COOKIE_ACCESS_TOKEN, opcoesCookieBase);
      res.clearCookie(COOKIE_REFRESH_TOKEN, opcoesCookieBase);

      return res.status(401).json({
        sucesso: false,
        mensagem: "Sessão expirada ou inválida. Faça login novamente.",
      });
    }

    console.error("Erro ao renovar a sessão:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível renovar a sessão.",
    });
  }
}


export async function logout(req, res) {
  try {
    const refreshToken = req.cookies?.aurora_refresh;

    await encerrarSessao(refreshToken);

    res.clearCookie(COOKIE_ACCESS_TOKEN, opcoesCookieBase);
    res.clearCookie(COOKIE_REFRESH_TOKEN, opcoesCookieBase);

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

export async function obterUsuarioAutenticado(req, res) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        ativo: true,
      },
    });

    if (!usuario || !usuario.ativo) {
      return res.status(401).json({
        mensagem: "Usuário não autenticado.",
      });
    }

    return res.status(200).json({ usuario });
  } catch (erro) {
    console.error("Erro ao consultar usuário autenticado:", erro);

    return res.status(500).json({
      mensagem: "Erro ao consultar sessão.",
    });
  }
}
