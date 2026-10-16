
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../config/prisma.js";

const esquemaLogin = z.object({
  email: z.string().trim().email().transform(
    (email) => email.toLowerCase()
  ),
  senha: z.string().min(1),
});

export async function autenticarUsuario(dados) {
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

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET_NAO_CONFIGURADO");
  }

  const token = jwt.sign(
    {
      tipo: usuario.tipo,
    },
    process.env.JWT_SECRET,
    {
      subject: usuario.id,
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    }
  );

  return {
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
    },
  };
}
