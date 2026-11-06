
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { prisma } from "../config/prisma.js";

const DURACAO_ACCESS_TOKEN = "15m";
const DURACAO_REFRESH_TOKEN_MS = 15 * 24 * 60 * 60 * 1000;

const clienteGoogle = new OAuth2Client();

const esquemaLogin = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((email) => email.toLowerCase()),
  senha: z.string().min(1),
});

const esquemaGoogle = z.object({
  credential: z.string().min(1),
});

// ==========================================
// UTILITÁRIOS
// ==========================================

function gerarHashToken(token) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function verificarJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET_NAO_CONFIGURADO");
  }
}

function formatarUsuario(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    tipo: usuario.tipo,
  };
}

// ==========================================
// CRIAR SESSÃO
// ==========================================

async function criarSessao(usuario) {
  verificarJwtSecret();

  if (!usuario.ativo) {
    throw new Error("USUARIO_DESATIVADO");
  }

  const accessToken = jwt.sign(
    { tipo: usuario.tipo },
    process.env.JWT_SECRET,
    {
      subject: usuario.id,
      expiresIn: DURACAO_ACCESS_TOKEN,
    }
  );

  const refreshToken = randomBytes(64).toString("hex");
  const tokenHash = gerarHashToken(refreshToken);

  const expiraEm = new Date(
    Date.now() + DURACAO_REFRESH_TOKEN_MS
  );

  await prisma.$transaction(
    async (tx) => {
      const agora = new Date();

      await tx.usuario.update({
        where: {
          id: usuario.id,
        },
        data: {
          ultimoAcessoEm: agora,
        },
      });

      const sessoesAtivas =
        await tx.sessaoRefreshToken.findMany({
          where: {
            usuarioId: usuario.id,
            revogadoEm: null,
            expiraEm: { gt: agora },
          },
          orderBy: [
            { criadoEm: "asc" },
            { id: "asc" },
          ],
          select: {
            id: true,
          },
        });

      if (sessoesAtivas.length >= 3) {
        const quantidadeParaRevogar =
          sessoesAtivas.length - 2;

        const sessoesAntigas =
          sessoesAtivas.slice(
            0,
            quantidadeParaRevogar
          );

        await tx.sessaoRefreshToken.updateMany({
          where: {
            id: {
              in: sessoesAntigas.map(
                (sessao) => sessao.id
              ),
            },
            revogadoEm: null,
          },
          data: {
            revogadoEm: agora,
          },
        });
      }

      await tx.sessaoRefreshToken.create({
        data: {
          usuarioId: usuario.id,
          tokenHash,
          expiraEm,
        },
      });
    },
    {
      isolationLevel: "Serializable",
    }
  );

  return {
    accessToken,
    refreshToken,
    usuario: formatarUsuario(usuario),
  };
}

// ==========================================
// LOGIN TRADICIONAL
// ==========================================

export async function autenticarUsuario(dados) {
  verificarJwtSecret();

  const dadosValidados = esquemaLogin.parse(dados);

  const usuario = await prisma.usuario.findUnique({
    where: {
      email: dadosValidados.email,
    },
  });

  if (
    !usuario ||
    !usuario.ativo ||
    !usuario.senhaHash
  ) {
    throw new Error("CREDENCIAIS_INVALIDAS");
  }

  const senhaCorreta = await bcrypt.compare(
    dadosValidados.senha,
    usuario.senhaHash
  );

  if (!senhaCorreta) {
    throw new Error("CREDENCIAIS_INVALIDAS");
  }

  return criarSessao(usuario);
}

// ==========================================
// LOGIN COM GOOGLE
// ==========================================

export async function autenticarGoogle(dados) {
  verificarJwtSecret();

  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID_NAO_CONFIGURADO");
  }

  const dadosValidados = esquemaGoogle.parse(dados);

  let payload;

  try {
    const ticket = await clienteGoogle.verifyIdToken({
      idToken: dadosValidados.credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    payload = ticket.getPayload();
  } catch {
    throw new Error("GOOGLE_TOKEN_INVALIDO");
  }

  if (
    !payload?.sub ||
    !payload?.email ||
    payload.email_verified !== true
  ) {
    throw new Error("GOOGLE_TOKEN_INVALIDO");
  }

  const googleId = payload.sub;
  const email = payload.email.trim().toLowerCase();
  const nome = payload.name?.trim() || "Cliente Aurora";

  // ========================================
  // BUSCAR CONTA VINCULADA AO GOOGLE
  // ========================================

  let usuario = await prisma.usuario.findUnique({
    where: {
      googleId,
    },
  });

  if (usuario) {
    if (!usuario.ativo) {
      throw new Error("USUARIO_DESATIVADO");
    }

    // Evita que a atualização do e-mail
    // sobrescreva o e-mail de outra conta.
    if (usuario.email !== email) {
      const contaComEmail =
        await prisma.usuario.findUnique({
          where: { email },
          select: { id: true },
        });

      if (
        contaComEmail &&
        contaComEmail.id !== usuario.id
      ) {
        throw new Error("GOOGLE_CONTA_CONFLITANTE");
      }

      try {
        usuario = await prisma.usuario.update({
          where: { id: usuario.id },
          data: { email },
        });
      } catch (erro) {
        if (erro.code === "P2002") {
          throw new Error("GOOGLE_CONTA_CONFLITANTE");
        }

        throw erro;
      }
    }

    return criarSessao(usuario);
  }

  // ========================================
  // VERIFICAR E-MAIL EXISTENTE
  // ========================================

  const contaExistente =
    await prisma.usuario.findUnique({
      where: { email },
    });

  if (contaExistente) {
    if (!contaExistente.ativo) {
      throw new Error("USUARIO_DESATIVADO");
    }

    // Não vinculamos automaticamente contas
    // tradicionais apenas pelo e-mail.
    throw new Error("GOOGLE_VINCULACAO_NECESSARIA");
  }

  // ========================================
  // CRIAR CONTA GOOGLE
  // ========================================

  try {
    usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        googleId,
        senhaHash: null,
        tipo: "CLIENTE",
        ativo: true,
      },
    });
  } catch (erro) {
    if (erro.code === "P2002") {
      throw new Error("GOOGLE_CONTA_CONFLITANTE");
    }

    throw erro;
  }

  return criarSessao(usuario);
}

// ==========================================
// RENOVAR TOKENS
// ==========================================

export async function renovarTokens(refreshToken) {
  if (!refreshToken) {
    throw new Error("REFRESH_TOKEN_INVALIDO");
  }

  verificarJwtSecret();

  const tokenHash = gerarHashToken(refreshToken);
  const agora = new Date();

  const sessao =
    await prisma.sessaoRefreshToken.findUnique({
      where: { tokenHash },
      include: { usuario: true },
    });

  if (
    !sessao ||
    sessao.revogadoEm ||
    sessao.expiraEm <= agora ||
    !sessao.usuario.ativo
  ) {
    throw new Error("REFRESH_TOKEN_INVALIDO");
  }

  const accessToken = jwt.sign(
    { tipo: sessao.usuario.tipo },
    process.env.JWT_SECRET,
    {
      subject: sessao.usuario.id,
      expiresIn: DURACAO_ACCESS_TOKEN,
    }
  );

  const novoRefreshToken =
    randomBytes(64).toString("hex");

  const novoTokenHash =
    gerarHashToken(novoRefreshToken);

  const novaExpiracao = new Date(
    Date.now() + DURACAO_REFRESH_TOKEN_MS
  );

  await prisma.$transaction(async (tx) => {
    const resultado =
      await tx.sessaoRefreshToken.updateMany({
        where: {
          id: sessao.id,
          revogadoEm: null,
          expiraEm: { gt: agora },
        },
        data: {
          revogadoEm: agora,
        },
      });

    if (resultado.count !== 1) {
      throw new Error("REFRESH_TOKEN_INVALIDO");
    }

    await tx.sessaoRefreshToken.create({
      data: {
        usuarioId: sessao.usuario.id,
        tokenHash: novoTokenHash,
        expiraEm: novaExpiracao,
      },
    });
  });

  return {
    accessToken,
    refreshToken: novoRefreshToken,
    usuario: formatarUsuario(sessao.usuario),
  };
}

// ==========================================
// LOGOUT
// ==========================================

export async function encerrarSessao(refreshToken) {
  if (!refreshToken) {
    return;
  }

  const tokenHash = gerarHashToken(refreshToken);

  await prisma.sessaoRefreshToken.updateMany({
    where: {
      tokenHash,
      revogadoEm: null,
    },
    data: {
      revogadoEm: new Date(),
    },
  });
}
