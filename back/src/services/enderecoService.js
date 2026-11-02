import { prisma } from "../config/prisma.js";

import {
  criarEndereco,
  listarEnderecos,
  buscarEnderecoPorId,
  contarEnderecos,
  atualizarEndereco,
  removerEnderecoPrincipal,
  definirEnderecoPrincipal,
  excluirEndereco,
  buscarPrimeiroEndereco,
} from "../models/enderecoModel.js";


/**
 * =========================================
 * ERRO HTTP
 * =========================================
 */

function criarErro(
  mensagem,
  status = 400
) {
  const erro = new Error(mensagem);

  erro.status = status;

  return erro;
}


/**
 * =========================================
 * NORMALIZAR CEP
 * =========================================
 */

function normalizarCep(cep) {
  return String(cep || "")
    .replace(/\D/g, "");
}


/**
 * =========================================
 * NORMALIZAR ESTADO
 * =========================================
 */

function normalizarEstado(estado) {
  return String(estado || "")
    .trim()
    .toUpperCase();
}


/**
 * =========================================
 * VALIDAR ENDEREÇO
 * =========================================
 */

function validarEndereco(
  dados,
  parcial = false
) {
  const camposObrigatorios = [
    "destinatario",
    "cep",
    "rua",
    "numero",
    "bairro",
    "cidade",
    "estado",
  ];


  /**
   * CREATE
   */

  if (!parcial) {
    for (const campo of camposObrigatorios) {
      if (
        dados[campo] === undefined ||
        dados[campo] === null ||
        String(dados[campo]).trim() === ""
      ) {
        throw criarErro(
          `O campo ${campo} é obrigatório.`,
          400
        );
      }
    }
  }


  /**
   * UPDATE
   *
   * Se um campo obrigatório for enviado,
   * ele não pode ficar vazio.
   */

  if (parcial) {
    for (const campo of camposObrigatorios) {
      if (
        dados[campo] !== undefined &&
        (
          dados[campo] === null ||
          String(dados[campo]).trim() === ""
        )
      ) {
        throw criarErro(
          `O campo ${campo} não pode ficar vazio.`,
          400
        );
      }
    }
  }


  /**
   * CEP
   */

  if (dados.cep !== undefined) {
    const cep =
      normalizarCep(dados.cep);

    if (cep.length !== 8) {
      throw criarErro(
        "CEP inválido.",
        400
      );
    }
  }


  /**
   * ESTADO
   */

  if (dados.estado !== undefined) {
    const estado =
      normalizarEstado(
        dados.estado
      );

    if (
      !/^[A-Z]{2}$/.test(estado)
    ) {
      throw criarErro(
        "Estado inválido.",
        400
      );
    }
  }


  /**
   * PRINCIPAL
   */

  if (
    dados.principal !== undefined &&
    typeof dados.principal !== "boolean"
  ) {
    throw criarErro(
      "O campo principal deve ser booleano.",
      400
    );
  }
}


/**
 * =========================================
 * PREPARAR DADOS
 * =========================================
 */

function prepararDadosEndereco(dados) {
  const resultado = {};

  const camposTexto = [
    "destinatario",
    "rua",
    "numero",
    "complemento",
    "bairro",
    "cidade",
  ];


  for (const campo of camposTexto) {
    if (dados[campo] !== undefined) {
      const valor =
        String(dados[campo]).trim();

      resultado[campo] =
        valor || null;
    }
  }


  if (dados.cep !== undefined) {
    resultado.cep =
      normalizarCep(
        dados.cep
      );
  }


  if (dados.estado !== undefined) {
    resultado.estado =
      normalizarEstado(
        dados.estado
      );
  }


  if (dados.principal !== undefined) {
    resultado.principal =
      dados.principal;
  }


  return resultado;
}


/**
 * =========================================
 * CRIAR
 * =========================================
 */

export async function criarEnderecoService(
  usuarioId,
  dados
) {
  validarEndereco(dados);

  const dadosPreparados =
    prepararDadosEndereco(dados);


  return prisma.$transaction(
    async (tx) => {
      const quantidade =
        await contarEnderecos(
          usuarioId,
          tx
        );


      /**
       * Primeiro endereço sempre é principal.
       */

      const deveSerPrincipal =
        quantidade === 0 ||
        dadosPreparados.principal === true;


      if (deveSerPrincipal) {
        await removerEnderecoPrincipal(
          usuarioId,
          tx
        );
      }


      return criarEndereco(
        usuarioId,
        {
          ...dadosPreparados,

          complemento:
            dadosPreparados.complemento ??
            null,

          principal:
            deveSerPrincipal,
        },
        tx
      );
    }
  );
}


/**
 * =========================================
 * LISTAR
 * =========================================
 */

export async function listarEnderecosService(
  usuarioId
) {
  return listarEnderecos(
    usuarioId
  );
}


/**
 * =========================================
 * BUSCAR POR ID
 * =========================================
 */

export async function buscarEnderecoService(
  usuarioId,
  enderecoId
) {
  const endereco =
    await buscarEnderecoPorId(
      enderecoId,
      usuarioId
    );


  if (!endereco) {
    throw criarErro(
      "Endereço não encontrado.",
      404
    );
  }


  return endereco;
}


/**
 * =========================================
 * ATUALIZAR
 * =========================================
 */

export async function atualizarEnderecoService(
  usuarioId,
  enderecoId,
  dados
) {
  const enderecoAtual =
    await buscarEnderecoService(
      usuarioId,
      enderecoId
    );


  validarEndereco(
    dados,
    true
  );


  const dadosPreparados =
    prepararDadosEndereco(
      dados
    );


  /**
   * Se o endereço já é principal, não
   * permitimos simplesmente:
   *
   * principal: false
   *
   * Isso poderia deixar o usuário sem
   * nenhum endereço principal.
   */

  if (
    enderecoAtual.principal &&
    dadosPreparados.principal === false
  ) {
    delete dadosPreparados.principal;
  }


  await prisma.$transaction(
    async (tx) => {
      if (
        dadosPreparados.principal === true
      ) {
        await removerEnderecoPrincipal(
          usuarioId,
          tx
        );
      }


      await atualizarEndereco(
        enderecoId,
        usuarioId,
        dadosPreparados,
        tx
      );
    }
  );


  return buscarEnderecoService(
    usuarioId,
    enderecoId
  );
}


/**
 * =========================================
 * DEFINIR PRINCIPAL
 * =========================================
 */

export async function definirEnderecoPrincipalService(
  usuarioId,
  enderecoId
) {
  const endereco =
    await buscarEnderecoService(
      usuarioId,
      enderecoId
    );


  if (endereco.principal) {
    return endereco;
  }


  await prisma.$transaction(
    async (tx) => {
      await removerEnderecoPrincipal(
        usuarioId,
        tx
      );


      await definirEnderecoPrincipal(
        enderecoId,
        usuarioId,
        tx
      );
    }
  );


  return buscarEnderecoService(
    usuarioId,
    enderecoId
  );
}


/**
 * =========================================
 * EXCLUIR
 * =========================================
 */

export async function excluirEnderecoService(
  usuarioId,
  enderecoId
) {
  const endereco =
    await buscarEnderecoService(
      usuarioId,
      enderecoId
    );


  await prisma.$transaction(
    async (tx) => {
      await excluirEndereco(
        enderecoId,
        usuarioId,
        tx
      );


      /**
       * Se não era principal, não precisamos
       * fazer mais nada.
       */

      if (!endereco.principal) {
        return;
      }


      /**
       * Se excluímos o principal, buscamos
       * outro endereço para assumir.
       */

      const proximoEndereco =
        await buscarPrimeiroEndereco(
          usuarioId,
          tx
        );


      if (proximoEndereco) {
        await definirEnderecoPrincipal(
          proximoEndereco.id,
          usuarioId,
          tx
        );
      }
    }
  );


  return {
    mensagem:
      "Endereço excluído com sucesso.",
  };
}