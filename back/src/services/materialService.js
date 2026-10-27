
import { z } from "zod";

import {
  criarMaterialModel,
  listarMateriaisModel,
  buscarMaterialPorIdModel,
  buscarMaterialPorNomeModel,
  atualizarMaterialModel,
  excluirMaterialModel,
} from "../models/materialModel.js";

// Validação para cadastro.
const esquemaMaterial = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "O nome do material deve ter pelo menos 2 caracteres.")
    .max(100, "O nome do material deve ter no máximo 100 caracteres."),
});

// Validação para atualização.
const esquemaAtualizacaoMaterial = z
  .object({
    nome: z
      .string()
      .trim()
      .min(2, "O nome do material deve ter pelo menos 2 caracteres.")
      .max(100, "O nome do material deve ter no máximo 100 caracteres.")
      .optional(),
  })
  .strict();

// Cadastra um novo material.
export async function criarMaterial(dados) {
  const dadosValidados = esquemaMaterial.parse(dados);

  const materialExistente = await buscarMaterialPorNomeModel(
    dadosValidados.nome
  );

  if (materialExistente) {
    throw new Error("MATERIAL_JA_CADASTRADO");
  }

  try {
    return await criarMaterialModel(dadosValidados);
  } catch (erro) {
    // Protege também contra duplicidade em cadastros simultâneos.
    if (erro.code === "P2002") {
      throw new Error("MATERIAL_JA_CADASTRADO");
    }

    throw erro;
  }
}

// Lista todos os materiais.
export async function listarMateriais() {
  return listarMateriaisModel();
}

// Busca um material pelo ID.
export async function buscarMaterialPorId(id) {
  const idNumerico = Number(id);

  if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
    throw new Error("ID_MATERIAL_INVALIDO");
  }

  const material = await buscarMaterialPorIdModel(idNumerico);

  if (!material) {
    throw new Error("MATERIAL_NAO_ENCONTRADO");
  }

  return material;
}

// Atualiza um material.
export async function atualizarMaterial(id, dados) {
  const idNumerico = Number(id);

  if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
    throw new Error("ID_MATERIAL_INVALIDO");
  }

  const materialExistente = await buscarMaterialPorIdModel(idNumerico);

  if (!materialExistente) {
    throw new Error("MATERIAL_NAO_ENCONTRADO");
  }

  const dadosValidados = esquemaAtualizacaoMaterial.parse(dados);

  if (Object.keys(dadosValidados).length === 0) {
    throw new Error("NENHUM_DADO_PARA_ATUALIZAR");
  }

  if (dadosValidados.nome !== undefined) {
    const materialComMesmoNome = await buscarMaterialPorNomeModel(
      dadosValidados.nome
    );

    if (
      materialComMesmoNome &&
      materialComMesmoNome.id !== idNumerico
    ) {
      throw new Error("MATERIAL_JA_CADASTRADO");
    }
  }

  try {
    return await atualizarMaterialModel(idNumerico, dadosValidados);
  } catch (erro) {
    if (erro.code === "P2002") {
      throw new Error("MATERIAL_JA_CADASTRADO");
    }

    if (erro.code === "P2025") {
      throw new Error("MATERIAL_NAO_ENCONTRADO");
    }

    throw erro;
  }
}

// Exclui um material, desde que não esteja associado a produtos.
export async function excluirMaterial(id) {
  const idNumerico = Number(id);

  if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
    throw new Error("ID_MATERIAL_INVALIDO");
  }

  const materialExistente = await buscarMaterialPorIdModel(idNumerico);

  if (!materialExistente) {
    throw new Error("MATERIAL_NAO_ENCONTRADO");
  }

  try {
    return await excluirMaterialModel(idNumerico);
  } catch (erro) {
    if (erro.code === "P2025") {
      throw new Error("MATERIAL_NAO_ENCONTRADO");
    }

    if (erro.code === "P2003") {
      throw new Error("MATERIAL_VINCULADO_A_PRODUTOS");
    }

    throw erro;
  }
}
