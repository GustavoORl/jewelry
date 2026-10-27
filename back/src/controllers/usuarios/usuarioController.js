
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import {
  criarUsuario,
  listarUsuarios,
  buscarUsuarioPorId,
} from "../../services/usuarioService.js";

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
      return res.status(400).json({
        sucesso: false,
        mensagem: "Dados inválidos.",
        erros: erro.issues,
      });
    }

    if (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === "P2002"
    ) {
      return res.status(409).json({
        sucesso: false,
        mensagem: "Este e-mail ou CPF/CNPJ já está cadastrado.",
      });
    }

    console.error(erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao cadastrar usuário.",
    });
  }
}

export async function obterUsuarios(req, res) {
  try {
    const usuarios = await listarUsuarios();

    return res.status(200).json({
      sucesso: true,
      usuarios,
    });
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar usuários.",
    });
  }
}

export async function obterUsuarioPorId(req, res) {
  try {
    const usuario = await buscarUsuarioPorId(req.params.id);

    if (!usuario) {
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
    console.error(erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar usuário.",
    });
  }
}
