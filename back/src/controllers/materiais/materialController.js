
import { ZodError } from "zod";

import {
  criarMaterial,
  listarMateriais,
  buscarMaterialPorId,
  atualizarMaterial,
  excluirMaterial,
} from "../../services/materialService.js";

// Cadastra um material.
export async function cadastrarMaterial(req, res) {
  try {
    const material = await criarMaterial(req.body);

    return res.status(201).json({
      sucesso: true,
      mensagem: "Material cadastrado com sucesso.",
      material,
    });
  } catch (erro) {
    if (erro instanceof ZodError) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Dados inválidos.",
        erros: erro.issues,
      });
    }

    if (erro.message === "MATERIAL_JA_CADASTRADO") {
      return res.status(409).json({
        sucesso: false,
        mensagem: "Já existe um material com esse nome.",
      });
    }

    console.error("Erro ao cadastrar material:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao cadastrar material.",
    });
  }
}

// Lista todos os materiais.
export async function obterMateriais(req, res) {
  try {
    const materiais = await listarMateriais();

    return res.status(200).json({
      sucesso: true,
      materiais,
    });
  } catch (erro) {
    console.error("Erro ao listar materiais:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar materiais.",
    });
  }
}

// Busca um material pelo ID.
export async function obterMaterialPorId(req, res) {
  try {
    const material = await buscarMaterialPorId(req.params.id);

    return res.status(200).json({
      sucesso: true,
      material,
    });
  } catch (erro) {
    if (erro.message === "ID_MATERIAL_INVALIDO") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O ID do material é inválido.",
      });
    }

    if (erro.message === "MATERIAL_NAO_ENCONTRADO") {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Material não encontrado.",
      });
    }

    console.error("Erro ao consultar material:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao consultar material.",
    });
  }
}

// Atualiza um material.
export async function atualizarMaterialController(req, res) {
  try {
    const material = await atualizarMaterial(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: "Material atualizado com sucesso.",
      material,
    });
  } catch (erro) {
    if (erro instanceof ZodError) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Dados inválidos.",
        erros: erro.issues,
      });
    }

    if (erro.message === "ID_MATERIAL_INVALIDO") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O ID do material é inválido.",
      });
    }

    if (erro.message === "MATERIAL_NAO_ENCONTRADO") {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Material não encontrado.",
      });
    }

    if (erro.message === "MATERIAL_JA_CADASTRADO") {
      return res.status(409).json({
        sucesso: false,
        mensagem: "Já existe um material com esse nome.",
      });
    }

    if (erro.message === "NENHUM_DADO_PARA_ATUALIZAR") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Informe ao menos um campo para atualizar.",
      });
    }

    console.error("Erro ao atualizar material:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar material.",
    });
  }
}

// Exclui um material.
export async function excluirMaterialController(req, res) {
  try {
    const material = await excluirMaterial(req.params.id);

    return res.status(200).json({
      sucesso: true,
      mensagem: "Material excluído com sucesso.",
      material,
    });
  } catch (erro) {
    if (erro.message === "ID_MATERIAL_INVALIDO") {
      return res.status(400).json({
        sucesso: false,
        mensagem: "O ID do material é inválido.",
      });
    }

    if (erro.message === "MATERIAL_NAO_ENCONTRADO") {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Material não encontrado.",
      });
    }

    if (erro.message === "MATERIAL_VINCULADO_A_PRODUTOS") {
      return res.status(409).json({
        sucesso: false,
        mensagem:
          "Não é possível excluir este material porque ele está associado a um ou mais produtos.",
      });
    }

    console.error("Erro ao excluir material:", erro);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao excluir material.",
    });
  }
}
