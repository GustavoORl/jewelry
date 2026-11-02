import {
  criarEnderecoService,
  listarEnderecosService,
  buscarEnderecoService,
  atualizarEnderecoService,
  excluirEnderecoService,
  definirEnderecoPrincipalService,
} from "../../services/enderecoService.js";


/**
 * =========================================
 * CRIAR ENDEREÇO
 * =========================================
 */

export async function criarEnderecoController(
  req,
  res
) {
  try {
    const usuarioId =
      req.usuario.id;

    const endereco =
      await criarEnderecoService(
        usuarioId,
        req.body
      );

    return res
      .status(201)
      .json({
        mensagem:
          "Endereço cadastrado com sucesso.",

        endereco,
      });
  } catch (erro) {
    console.error(
      "Erro ao criar endereço:",
      erro
    );

    return res
      .status(erro.status || 500)
      .json({
        erro:
          erro.message ||
          "Erro interno do servidor.",
      });
  }
}


/**
 * =========================================
 * LISTAR ENDEREÇOS
 * =========================================
 */

export async function listarEnderecosController(
  req,
  res
) {
  try {
    const usuarioId =
      req.usuario.id;

    const enderecos =
      await listarEnderecosService(
        usuarioId
      );

    return res
      .status(200)
      .json({
        enderecos,
      });
  } catch (erro) {
    console.error(
      "Erro ao listar endereços:",
      erro
    );

    return res
      .status(erro.status || 500)
      .json({
        erro:
          erro.message ||
          "Erro interno do servidor.",
      });
  }
}


/**
 * =========================================
 * BUSCAR ENDEREÇO POR ID
 * =========================================
 */

export async function buscarEnderecoController(
  req,
  res
) {
  try {
    const usuarioId =
      req.usuario.id;

    const { id } =
      req.params;

    const endereco =
      await buscarEnderecoService(
        usuarioId,
        id
      );

    return res
      .status(200)
      .json({
        endereco,
      });
  } catch (erro) {
    console.error(
      "Erro ao buscar endereço:",
      erro
    );

    return res
      .status(erro.status || 500)
      .json({
        erro:
          erro.message ||
          "Erro interno do servidor.",
      });
  }
}


/**
 * =========================================
 * ATUALIZAR ENDEREÇO
 * =========================================
 */

export async function atualizarEnderecoController(
  req,
  res
) {
  try {
    const usuarioId =
      req.usuario.id;

    const { id } =
      req.params;

    const endereco =
      await atualizarEnderecoService(
        usuarioId,
        id,
        req.body
      );

    return res
      .status(200)
      .json({
        mensagem:
          "Endereço atualizado com sucesso.",

        endereco,
      });
  } catch (erro) {
    console.error(
      "Erro ao atualizar endereço:",
      erro
    );

    return res
      .status(erro.status || 500)
      .json({
        erro:
          erro.message ||
          "Erro interno do servidor.",
      });
  }
}


/**
 * =========================================
 * DEFINIR ENDEREÇO PRINCIPAL
 * =========================================
 */

export async function definirEnderecoPrincipalController(
  req,
  res
) {
  try {
    const usuarioId =
      req.usuario.id;

    const { id } =
      req.params;

    const endereco =
      await definirEnderecoPrincipalService(
        usuarioId,
        id
      );

    return res
      .status(200)
      .json({
        mensagem:
          "Endereço principal atualizado com sucesso.",

        endereco,
      });
  } catch (erro) {
    console.error(
      "Erro ao definir endereço principal:",
      erro
    );

    return res
      .status(erro.status || 500)
      .json({
        erro:
          erro.message ||
          "Erro interno do servidor.",
      });
  }
}


/**
 * =========================================
 * EXCLUIR ENDEREÇO
 * =========================================
 */

export async function excluirEnderecoController(
  req,
  res
) {
  try {
    const usuarioId =
      req.usuario.id;

    const { id } =
      req.params;

    const resultado =
      await excluirEnderecoService(
        usuarioId,
        id
      );

    return res
      .status(200)
      .json(resultado);
  } catch (erro) {
    console.error(
      "Erro ao excluir endereço:",
      erro
    );

    return res
      .status(erro.status || 500)
      .json({
        erro:
          erro.message ||
          "Erro interno do servidor.",
      });
  }
}