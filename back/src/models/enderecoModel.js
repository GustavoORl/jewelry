import { prisma } from "../config/prisma.js";


/**
 * =========================================
 * CRIAR ENDEREÇO
 * =========================================
 */

export async function criarEndereco(
  usuarioId,
  dados,
  tx = prisma
) {
  return tx.endereco.create({
    data: {
      usuarioId,

      destinatario: dados.destinatario,
      cep: dados.cep,
      rua: dados.rua,
      numero: dados.numero,
      complemento: dados.complemento ?? null,
      bairro: dados.bairro,
      cidade: dados.cidade,
      estado: dados.estado,

      principal: dados.principal ?? false,
    },
  });
}


/**
 * =========================================
 * LISTAR ENDEREÇOS DO USUÁRIO
 * =========================================
 */

export async function listarEnderecos(
  usuarioId,
  tx = prisma
) {
  return tx.endereco.findMany({
    where: {
      usuarioId,
    },

    orderBy: [
      {
        principal: "desc",
      },
      {
        criadoEm: "desc",
      },
    ],
  });
}


/**
 * =========================================
 * BUSCAR ENDEREÇO POR ID
 * =========================================
 *
 * Também verifica usuarioId para impedir
 * acesso ao endereço de outro usuário.
 */

export async function buscarEnderecoPorId(
  enderecoId,
  usuarioId,
  tx = prisma
) {
  return tx.endereco.findFirst({
    where: {
      id: enderecoId,
      usuarioId,
    },
  });
}


/**
 * =========================================
 * BUSCAR ENDEREÇO PRINCIPAL
 * =========================================
 */

export async function buscarEnderecoPrincipal(
  usuarioId,
  tx = prisma
) {
  return tx.endereco.findFirst({
    where: {
      usuarioId,
      principal: true,
    },
  });
}


/**
 * =========================================
 * CONTAR ENDEREÇOS DO USUÁRIO
 * =========================================
 */

export async function contarEnderecos(
  usuarioId,
  tx = prisma
) {
  return tx.endereco.count({
    where: {
      usuarioId,
    },
  });
}


/**
 * =========================================
 * ATUALIZAR ENDEREÇO
 * =========================================
 */

export async function atualizarEndereco(
  enderecoId,
  usuarioId,
  dados,
  tx = prisma
) {
  return tx.endereco.updateMany({
    where: {
      id: enderecoId,
      usuarioId,
    },

    data: dados,
  });
}


/**
 * =========================================
 * REMOVER PRINCIPAL DOS ENDEREÇOS
 * =========================================
 */

export async function removerEnderecoPrincipal(
  usuarioId,
  tx = prisma
) {
  return tx.endereco.updateMany({
    where: {
      usuarioId,
      principal: true,
    },

    data: {
      principal: false,
    },
  });
}


/**
 * =========================================
 * DEFINIR ENDEREÇO COMO PRINCIPAL
 * =========================================
 */

export async function definirEnderecoPrincipal(
  enderecoId,
  usuarioId,
  tx = prisma
) {
  return tx.endereco.updateMany({
    where: {
      id: enderecoId,
      usuarioId,
    },

    data: {
      principal: true,
    },
  });
}


/**
 * =========================================
 * EXCLUIR ENDEREÇO
 * =========================================
 */

export async function excluirEndereco(
  enderecoId,
  usuarioId,
  tx = prisma
) {
  return tx.endereco.deleteMany({
    where: {
      id: enderecoId,
      usuarioId,
    },
  });
}


/**
 * =========================================
 * BUSCAR PRIMEIRO ENDEREÇO
 * =========================================
 *
 * Utilizado quando o endereço principal
 * é excluído e precisamos escolher outro.
 */

export async function buscarPrimeiroEndereco(
  usuarioId,
  tx = prisma
) {
  return tx.endereco.findFirst({
    where: {
      usuarioId,
    },

    orderBy: {
      criadoEm: "asc",
    },
  });
}