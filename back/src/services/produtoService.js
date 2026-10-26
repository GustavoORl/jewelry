import { z } from "zod";
import { enviarImagem, excluirImagem } from "./imagemService.js";
import { prisma } from "../config/prisma.js";

import {
  listarProdutosModel,
  buscarProdutoPorIdModel,
  excluirProdutoModel,
  atualizarStatusProdutoModel,
} from "../models/produtoModel.js";

const esquemaProduto = z.object({
  categoriaId: z.string().trim().min(1),
  nome: z.string().trim().min(2).max(150),
  slug: z.string().trim().min(2).max(180),
  descricao: z.string().trim().optional(),
  preco: z.coerce.number().positive(),
  estoque: z.coerce.number().int().min(0),
});

const esquemaAtualizacaoProduto = z.object({
  categoriaId: z.string().trim().min(1).optional(),
  nome: z.string().trim().min(2).max(150).optional(),
  slug: z.string().trim().min(2).max(180).optional(),
  descricao: z.string().trim().optional(),
  preco: z.coerce.number().positive().optional(),
  estoque: z.coerce.number().int().min(0).optional(),
}).strict();

const incluirDetalhesProduto = {
  categoria: true,
  imagens: {
    orderBy: {
      posicao: "asc",
    },
  },
};

function extrairCaminhoImagem(urlImagem) {
  if (!urlImagem) {
    return null;
  }

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

// ======================================================
// CADASTRAR PRODUTO
// ======================================================

export async function criarProduto(dados, arquivo) {
  const dadosValidados = esquemaProduto.parse(dados);

  let imagemEnviada = null;

  try {
    if (arquivo) {
      imagemEnviada = await enviarImagem(arquivo, "produtos");
    }

    const produto = await prisma.$transaction(async (tx) => {
      const novoProduto = await tx.produto.create({
        data: {
          categoriaId: dadosValidados.categoriaId,
          nome: dadosValidados.nome,
          slug: dadosValidados.slug,
          descricao: dadosValidados.descricao || "",
          preco: dadosValidados.preco,
          estoque: dadosValidados.estoque,
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

    throw erro;
  }
}

// ======================================================
// LISTAR PRODUTOS
// ======================================================

export async function listarProdutos() {
  return listarProdutosModel();
}

// ======================================================
// BUSCAR PRODUTO POR ID
// ======================================================

export async function buscarProdutoPorId(id) {
  return buscarProdutoPorIdModel(id);
}

// ======================================================
// EXCLUIR PRODUTO E SUAS IMAGENS
// ======================================================

export async function excluirProduto(id) {
  const produto = await buscarProdutoPorIdModel(id);

  if (!produto) {
    throw new Error("PRODUTO_NAO_ENCONTRADO");
  }

  const imagens = produto.imagens ?? [];

  // A exclusão no banco acontece primeiro.
  // Se falhar, nenhum arquivo será removido do Storage.
  const produtoExcluido = await excluirProdutoModel(id);

  // Depois, tentamos excluir os arquivos físicos.
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

// ======================================================
// ATUALIZAR PRODUTO E SUA IMAGEM PRINCIPAL
// ======================================================

export async function atualizarProduto(id, dados, arquivo) {
  if (!id) {
    throw new Error("O ID do produto é obrigatório.");
  }

  const produtoExistente = await buscarProdutoPorIdModel(id);

  if (!produtoExistente) {
    throw new Error("PRODUTO_NAO_ENCONTRADO");
  }

  const dadosValidados = esquemaAtualizacaoProduto.parse(dados);

  const produtoAtualizado = Object.fromEntries(
    Object.entries(dadosValidados).filter(
      ([, valor]) => valor !== undefined
    )
  );

  if (
    Object.keys(produtoAtualizado).length === 0 &&
    !arquivo
  ) {
    throw new Error(
      "Informe dados ou uma nova imagem para atualizar."
    );
  }

  const imagemPrincipal = produtoExistente.imagens?.find(
    (imagem) => imagem.posicao === 0
  );

  let novaImagem = null;
  let atualizacaoConcluida = false;

  try {
    // Envia a nova imagem antes de alterar o banco.
    if (arquivo) {
      novaImagem = await enviarImagem(arquivo, "produtos");
    }

    const produto = await prisma.$transaction(async (tx) => {
      if (Object.keys(produtoAtualizado).length > 0) {
        await tx.produto.update({
          where: {
            id,
          },
          data: produtoAtualizado,
        });
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

    // Remove a imagem antiga somente após o sucesso no banco.
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
    // Se o banco falhou, tenta remover a nova imagem enviada.
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

    if (erro.code === "P2025") {
      throw new Error("Produto ou categoria não encontrada.");
    }

    if (erro.code === "P2002") {
      throw new Error("Já existe um produto com esse slug.");
    }

    throw erro;
  }
}

// ======================================================
// ATUALIZAR STATUS DO PRODUTO
// ======================================================

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
