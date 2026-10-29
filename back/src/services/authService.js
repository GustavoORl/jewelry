
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "../config/prisma.js";

const DURACAO_ACCESS_TOKEN = "15m";
const DURACAO_REFRESH_TOKEN_MS = 15 * 24 * 60 * 60 * 1000;

const esquemaLogin = z.object({
  email: z.string().trim().email().transform(
    (email) => email.toLowerCase()
  ),
  senha: z.string().min(1),
});

function gerarHashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function autenticarUsuario(dados) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET_NAO_CONFIGURADO");
  }

  const dadosValidados = esquemaLogin.parse(dados);

  const usuario = await prisma.usuario.findUnique({
    where: {
      email: dadosValidados.email,
    },
  });

  if (!usuario || !usuario.ativo) {
    throw new Error("CREDENCIAIS_INVALIDAS");
  }

  const senhaCorreta = await bcrypt.compare(
    dadosValidados.senha,
    usuario.senhaHash
  );

  if (!senhaCorreta) {
    throw new Error("CREDENCIAIS_INVALIDAS");
  }

  // Access token: JWT com validade de 15 minutos.
  const accessToken = jwt.sign(
    { tipo: usuario.tipo },
    process.env.JWT_SECRET,
    {
      subject: usuario.id,
      expiresIn: DURACAO_ACCESS_TOKEN,
    }
  );

  // Refresh token: valor aleatório, não um JWT.
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
      }
    });

    // Busca as sessões ainda válidas deste usuário.
    const sessoesAtivas = await tx.sessaoRefreshToken.findMany({
      where: {
        usuarioId: usuario.id,
        revogadoEm: null,
        expiraEm: { gt: agora },
      },
      orderBy: {
        criadoEm: "asc",
      },
      select: {
        id: true,
      },
    });

    // Se já existem três sessões, libera espaço
    // revogando a mais antiga.
    if (sessoesAtivas.length >= 3) {
      const quantidadeParaRevogar = sessoesAtivas.length - 2;

      const sessoesAntigas = sessoesAtivas.slice(
        0,
        quantidadeParaRevogar
      );

      await tx.sessaoRefreshToken.updateMany({
        where: {
          id: {
            in: sessoesAntigas.map((sessao) => sessao.id),
          },
          revogadoEm: null,
        },
        data: {
          revogadoEm: agora,
        },
      });
    }

    // Cria a sessão do novo login.
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
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
    },
  };
}


export async function renovarTokens(refreshToken) {
  if (!refreshToken) {
    throw new Error("REFRESH_TOKEN_INVALIDO");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET_NAO_CONFIGURADO");
  }

  const tokenHash = gerarHashToken(refreshToken);
  const agora = new Date();

  // Localiza a sessão e o usuário correspondente.
  const sessao = await prisma.sessaoRefreshToken.findUnique({
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

  const novoRefreshToken = randomBytes(64).toString("hex");
  const novoTokenHash = gerarHashToken(novoRefreshToken);
  const novaExpiracao = new Date(
    Date.now() + DURACAO_REFRESH_TOKEN_MS
  );

  // Revoga o token antigo e cria o novo na mesma transação.
  await prisma.$transaction(async (tx) => {
    const resultado = await tx.sessaoRefreshToken.updateMany({
      where: {
        id: sessao.id,
        revogadoEm: null,
        expiraEm: { gt: agora },
      },
      data: {
        revogadoEm: agora,
      },
    });

    // Impede duas renovações simultâneas da mesma sessão.
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
    usuario: {
      id: sessao.usuario.id,
      nome: sessao.usuario.nome,
      email: sessao.usuario.email,
      tipo: sessao.usuario.tipo,
    },
  };
}


export async function encerrarSessao(refreshToken) {
  // Sem refresh token, não há sessão para revogar.
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


