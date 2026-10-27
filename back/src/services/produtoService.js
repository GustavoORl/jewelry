
import { z } from "zod";
import { enviarImagem, excluirImagem } from "./imagemService.js";
import { prisma } from "../config/prisma.js";

import {
  listarProdutosModel,
  buscarProdutoPorIdModel,
  excluirProdutoModel,
  atualizarStatusProdutoModel,
} from "../models/produtoModel.js";

const incluirDetalhesProduto = {
  categoria: true,
  imagens: {
    orderBy: {
      posicao: "asc",
    },
  },
  materiais: {
    include: {
      material: true,
    },
  },
};

// Aceita materialIds como array ou como JSON recebido via FormData.
function normalizarMaterialIds(valor) {
  if (valor === undefined) return [];

  if (typeof valor === "string") {
    try {
      valor = JSON.parse(valor);
    } catch {
      throw new Error(
        "O campo materialIds deve conter um array válido de IDs."
      );
    }
  }

  if (!Array.isArray(valor)) {
    throw new Error("O campo materialIds deve ser um array.");
  }

  return valor;
}

const esquemaMaterialIds = z
  .array(z.coerce.number().int().positive())
  .refine(
    (ids) => new Set(ids).size === ids.length,
    "Não informe materiais duplicados."
  );

const esquemaProduto = z.object({
  categoriaId: z.string().trim().min(1),
  nome: z.string().trim().min(2).max(150),
  slug: z.string().trim().min(2).max(180),
  descricao: z.string().trim().optional(),
  preco: z.coerce.number().positive(),
  estoque: z.coerce.number().int().min(0),
  materialIds: z.preprocess(
    normalizarMaterialIds,
    esquemaMaterialIds
  ).optional().default([]),
});

const esquemaAtualizacaoProduto = z
  .object({
    categoriaId: z.string().trim().min(1).optional(),
    nome: z.string().trim().min(2).max(150).optional(),
    slug: z.string().trim().min(2).max(180).optional(),
    descricao: z.string().trim().optional(),
    preco: z.coerce.number().positive().optional(),
    estoque: z.coerce.number().int().min(0).optional(),
    materialIds: z.preprocess(
      normalizarMaterialIds,
      esquemaMaterialIds
    ).optional(),
  })
  .strict();

function extrairCaminhoImagem(urlImagem) {
  if (!urlImagem) return null;

  const bucket = process.env.SUPABASE_STORAGE_BUCKET;

  if (!bucket) {
    throw new Error(
      "A variável SUPABASE_STORAGE_BUCKET não está configurada."
    );
  }

  const marcador = `/object/public/${bucket}/`;
  const indice = urlImagem.indexOf(marcador);

  if (indice === -1) {
    throw new Error(
      "Não foi possível identificar o caminho da imagem no Supabase."
    );
  }

  return decodeURIComponent(
    urlImagem.slice(indice + marcador.length)
  );
}

async function removerImagemDoStorage(urlImagem) {
  const caminho = extrairCaminhoImagem(urlImagem);

  if (caminho) {
    await excluirImagem(caminho);
  }
}

// Confere se todos os materiais informados existem.
async function validarMateriais(tx, materialIds) {
  if (materialIds.length === 0) return;

  const materiaisEncontrados = await tx.material.findMany({
    where: {
      id: {
        in: materialIds,
      },
    },
    select: {
      id: true,
    },
  });

  const idsEncontrados = new Set(
    materiaisEncontrados.map((material) => material.id)
  );

  const idsInvalidos = materialIds.filter(
    (id) => !idsEncontrados.has(id)
  );

  if (idsInvalidos.length > 0) {
    const erro = new Error(
      `Material(is) não encontrado(s): ${idsInvalidos.join(", ")}.`
    );
    erro.code = "MATERIAL_NAO_ENCONTRADO";
    throw erro;
  }
}

// Cadastra um produto e seus materiais.
export async function criarProduto(dados, arquivo) {
  const dadosValidados = esquemaProduto.parse({
    ...dados,
    materialIds: normalizarMaterialIds(dados.materialIds),
  });

  let imagemEnviada = null;

  try {
    if (arquivo) {
      imagemEnviada = await enviarImagem(arquivo, "produtos");
    }

    const produto = await prisma.$transaction(async (tx) => {
      await validarMateriais(tx, dadosValidados.materialIds);

      const novoProduto = await tx.produto.create({
        data: {
          categoriaId: dadosValidados.categoriaId,
          nome: dadosValidados.nome,
          slug: dadosValidados.slug,
          descricao: dadosValidados.descricao ?? "",
          preco: dadosValidados.preco,
          estoque: dadosValidados.estoque,

          materiais: {
            create: dadosValidados.materialIds.map((materialId) => ({
              material: {
                connect: {
                  id: materialId,
                },
              },
            })),
          },
        },
      });

      if (imagemEnviada) {
        await tx.imagemProduto.create({
          data: {
            produtoId: novoProduto.id,
            url: imagemEnviada.url,
            textoAlternativo: dadosValidados.nome,
            posicao: 0,
          },
        });
      }

      return tx.produto.findUnique({
        where: {
          id: novoProduto.id,
        },
        include: incluirDetalhesProduto,
      });
    });

    return produto;
  } catch (erro) {
    if (imagemEnviada) {
      try {
        await excluirImagem(imagemEnviada.caminho);
      } catch (erroStorage) {
        console.error(
          "Não foi possível remover a imagem após a falha no cadastro:",
          erroStorage
        );
      }
    }

    if (erro.code === "P2002") {
      throw new Error("Já existe um produto com esse slug.");
    }

    if (erro.code === "P2003") {
      throw new Error("A categoria informada não existe.");
    }

    throw erro;
  }
}

// Lista os produtos ativos.
export async function listarProdutos() {
  return listarProdutosModel();
}

// Busca um produto pelo ID.
export async function buscarProdutoPorId(id) {
  return buscarProdutoPorIdModel(id);
}

// Exclui o produto e tenta remover suas imagens do Storage.
export async function excluirProduto(id) {
  const produto = await buscarProdutoPorIdModel(id);

  if (!produto) {
    throw new Error("PRODUTO_NAO_ENCONTRADO");
  }

  const imagens = produto.imagens ?? [];
  const produtoExcluido = await excluirProdutoModel(id);

  const resultados = await Promise.allSettled(
    imagens.map((imagem) => removerImagemDoStorage(imagem.url))
  );

  const falhas = resultados.filter(
    (resultado) => resultado.status === "rejected"
  );

  if (falhas.length > 0) {
    console.error(
      `O produto ${id} foi excluído, mas ${falhas.length} imagem(ns) não puderam ser removidas do Storage.`,
      falhas.map((resultado) => resultado.reason)
    );
  }

  return {
    ...produtoExcluido,
    imagensRemovidas: imagens.length - falhas.length,
    falhasAoRemoverImagens: falhas.length,
  };
}

// Atualiza os dados do produto, os materiais e, opcionalmente, a imagem principal.
export async function atualizarProduto(id, dados, arquivo) {
  if (!id) {
    throw new Error("O ID do produto é obrigatório.");
  }

  const produtoExistente = await buscarProdutoPorIdModel(id);

  if (!produtoExistente) {
    throw new Error("PRODUTO_NAO_ENCONTRADO");
  }

  const dadosValidados = esquemaAtualizacaoProduto.parse({
    ...dados,
    ...(dados.materialIds !== undefined
      ? { materialIds: normalizarMaterialIds(dados.materialIds) }
      : {}),
  });

  const {
    materialIds,
    ...camposProduto
  } = dadosValidados;

  const produtoAtualizado = Object.fromEntries(
    Object.entries(camposProduto).filter(
      ([, valor]) => valor !== undefined
    )
  );

  const atualizarMateriais = materialIds !== undefined;

  if (
    Object.keys(produtoAtualizado).length === 0 &&
    !atualizarMateriais &&
    !arquivo
  ) {
    throw new Error(
      "Informe dados, materiais ou uma nova imagem para atualizar."
    );
  }

  const imagemPrincipal = produtoExistente.imagens?.find(
    (imagem) => imagem.posicao === 0
  );

  let novaImagem = null;
  let atualizacaoConcluida = false;

  try {
    if (arquivo) {
      novaImagem = await enviarImagem(arquivo, "produtos");
    }

    const produto = await prisma.$transaction(async (tx) => {
      if (atualizarMateriais) {
        await validarMateriais(tx, materialIds);
      }

      if (Object.keys(produtoAtualizado).length > 0) {
        await tx.produto.update({
          where: {
            id,
          },
          data: produtoAtualizado,
        });
      }

      if (atualizarMateriais) {
        await tx.produtoMaterial.deleteMany({
          where: {
            produtoId: id,
          },
        });

        if (materialIds.length > 0) {
          await tx.produtoMaterial.createMany({
            data: materialIds.map((materialId) => ({
              produtoId: id,
              materialId,
            })),
          });
        }
      }

      if (novaImagem) {
        const textoAlternativo =
          dadosValidados.nome ?? produtoExistente.nome;

        if (imagemPrincipal) {
          await tx.imagemProduto.update({
            where: {
              id: imagemPrincipal.id,
            },
            data: {
              url: novaImagem.url,
              textoAlternativo,
            },
          });
        } else {
          await tx.imagemProduto.create({
            data: {
              produtoId: id,
              url: novaImagem.url,
              textoAlternativo,
              posicao: 0,
            },
          });
        }
      }

      return tx.produto.findUnique({
        where: {
          id,
        },
        include: incluirDetalhesProduto,
      });
    });

    atualizacaoConcluida = true;

    if (novaImagem && imagemPrincipal) {
      try {
        await removerImagemDoStorage(imagemPrincipal.url);
      } catch (erroStorage) {
        console.error(
          "Produto atualizado, mas não foi possível remover a imagem antiga:",
          erroStorage
        );
      }
    }

    return produto;
  } catch (erro) {
    if (novaImagem && !atualizacaoConcluida) {
      try {
        await excluirImagem(novaImagem.caminho);
      } catch (erroStorage) {
        console.error(
          "Não foi possível remover a nova imagem após a falha na atualização:",
          erroStorage
        );
      }
    }

    if (erro.code === "P2002") {
      throw new Error("Já existe um produto com esse slug.");
    }

    if (erro.code === "P2003") {
      throw new Error("A categoria ou um material informado não existe.");
    }

    throw erro;
  }
}

// Ativa ou desativa um produto sem excluí-lo do banco.
export async function atualizarStatusProdutoService(id, ativo) {
  if (!id) {
    throw new Error("O ID do produto é obrigatório.");
  }

  if (typeof ativo !== "boolean") {
    throw new Error("O campo ativo deve ser true ou false.");
  }

  try {
    return await atualizarStatusProdutoModel(id, ativo);
  } catch (erro) {
    console.error("Erro ao atualizar status do produto:", {
      code: erro.code,
      message: erro.message,
      meta: erro.meta,
    });

    throw erro;
  }
}
