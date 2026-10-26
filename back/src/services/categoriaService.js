import { z } from "zod";

import { prisma } from "../config/prisma.js";

import {
  enviarImagem,
  excluirImagem,
} from "./imagemService.js";

import {
  criarCategoriaModel,
  buscarCategoriaPorIdModel,
  listarCategoriasModel,
  excluirCategoriaModel,
  atualizarCategoriaModel,
  atualizarStatusCategoriaModel,
} from "../models/categoriaModel.js";

const esquemaCategoria = z
  .object({
    nome: z.string().trim().min(2).max(150),
    slug: z.string().trim().min(2).max(180),
    descricao: z.string().trim().optional(),
  })
  .strict();

const esquemaAtualizacaoCategoria = z
  .object({
    nome: z.string().trim().min(2).max(150).optional(),
    slug: z.string().trim().min(2).max(180).optional(),
    descricao: z.string().trim().optional(),
  })
  .strict();

/**
 * Extrai o caminho de uma imagem a partir da URL pública
 * do Supabase Storage.
 */
function extrairCaminhoImagem(urlImagem) {
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
      "Não foi possível identificar o caminho da imagem no Supabase Storage."
    );
  }

  return decodeURIComponent(
    urlImagem.slice(indice + marcador.length)
  );
}

/**
 * Remove uma imagem do Supabase Storage a partir da URL pública.
 */
async function removerImagemDoStorage(urlImagem) {
  const caminho = extrairCaminhoImagem(urlImagem);

  await excluirImagem(caminho);
}

/**
 * Valida os dados e converte campos vazios opcionais.
 */
function validarDadosCategoria(dados, esquema) {
  const dadosValidados = esquema.parse(dados);

  if (dadosValidados.descricao !== undefined) {
    dadosValidados.descricao =
      dadosValidados.descricao || null;
  }

  return dadosValidados;
}

/**
 * Cadastra uma categoria e, opcionalmente, sua imagem.
 */
export async function criarCategoria(dados, arquivo) {
  let imagemEnviada = null;

  try {
    const dadosValidados = validarDadosCategoria(
      dados,
      esquemaCategoria
    );

    // Envia a imagem antes de criar os registros no banco.
    if (arquivo) {
      imagemEnviada = await enviarImagem(
        arquivo,
        "categorias"
      );
    }

    const categoria = await prisma.$transaction(async (tx) => {
      const novaCategoria = await criarCategoriaModel(
        dadosValidados,
        tx
      );

      if (imagemEnviada) {
        await tx.imagemCategoria.create({
          data: {
            categoriaId: novaCategoria.id,
            url: imagemEnviada.url,
            textoAlternativo: dadosValidados.nome,
            posicao: 0,
          },
        });
      }

      return tx.categoria.findUnique({
        where: {
          id: novaCategoria.id,
        },
        include: {
          imagens: {
            orderBy: {
              posicao: "asc",
            },
          },
        },
      });
    });

    return categoria;
  } catch (erro) {
    // Se o banco falhar, tentamos remover a imagem enviada.
    if (imagemEnviada) {
      try {
        await excluirImagem(imagemEnviada.caminho);
      } catch (erroImagem) {
        console.error(
          "Não foi possível remover a imagem após falha no cadastro:",
          erroImagem
        );
      }
    }

    if (erro.code === "P2002") {
      throw new Error(
        "Já existe uma categoria com esse slug."
      );
    }

    throw erro;
  }
}

/**
 * Lista as categorias.
 */
export async function listarCategorias() {
  return listarCategoriasModel();
}

/**
 * Busca uma categoria pelo ID.
 */
export async function buscarCategoriaPorId(id) {
  if (!id) {
    throw new Error("O ID da categoria é obrigatório.");
  }

  return buscarCategoriaPorIdModel(id);
}

/**
 * Exclui definitivamente uma categoria e suas imagens.
 *
 * A exclusão só é permitida se não houver produtos relacionados.
 */
export async function excluirCategoria(id) {
  if (!id) {
    throw new Error("O ID da categoria é obrigatório.");
  }

  try {
    // Recupera a categoria e suas imagens antes da exclusão.
    const categoria = await prisma.categoria.findUnique({
      where: { id },
      include: {
        imagens: true,
      },
    });

    if (!categoria) {
      throw new Error("CATEGORIA_NAO_ENCONTRADA");
    }

    // A exclusão do registro e das imagens do banco ocorre
    // dentro de uma transação.
    await prisma.$transaction(async (tx) => {
      await excluirCategoriaModel(id, tx);
    });

    // Só tentamos apagar os arquivos do Storage depois
    // que a exclusão no banco foi concluída.
    const resultados = await Promise.allSettled(
      categoria.imagens.map((imagem) =>
        removerImagemDoStorage(imagem.url)
      )
    );

    const falhas = resultados.filter(
      (resultado) => resultado.status === "rejected"
    );

    if (falhas.length > 0) {
      console.error(
        `A categoria ${id} foi excluída do banco, mas ${falhas.length} imagem(ns) não puderam ser removidas do Storage.`,
        falhas.map((falha) => falha.reason)
      );
    }

    return {
      mensagem: "Categoria excluída com sucesso.",
      id: categoria.id,
      imagensRemovidas:
        resultados.length - falhas.length,
      falhasAoRemoverImagens: falhas.length,
    };
  } catch (erro) {
    if (erro.message === "CATEGORIA_NAO_ENCONTRADA") {
      throw new Error("CATEGORIA_NAO_ENCONTRADA");
    }

    if (erro.code === "P2003") {
      throw new Error("CATEGORIA_POSSUI_PRODUTOS");
    }

    if (erro.code === "P2025") {
      throw new Error("CATEGORIA_NAO_ENCONTRADA");
    }

    throw erro;
  }
}

/**
 * Atualiza os dados de uma categoria e, opcionalmente,
 * substitui sua imagem principal.
 */
export async function atualizarCategoria(
  id,
  dados,
  arquivo
) {
  if (!id) {
    throw new Error("O ID da categoria é obrigatório.");
  }

  let novaImagem = null;
  let atualizacaoConcluida = false;

  try {
    const dadosValidados = validarDadosCategoria(
      dados,
      esquemaAtualizacaoCategoria
    );

    if (
      Object.keys(dadosValidados).length === 0 &&
      !arquivo
    ) {
      throw new Error(
        "Informe ao menos um campo ou uma imagem para atualizar."
      );
    }

    const categoriaExistente =
      await prisma.categoria.findUnique({
        where: { id },
        include: {
          imagens: {
            orderBy: {
              posicao: "asc",
            },
          },
        },
      });

    if (!categoriaExistente) {
      throw new Error("CATEGORIA_NAO_ENCONTRADA");
    }

    const imagemPrincipal =
      categoriaExistente.imagens.find(
        (imagem) => imagem.posicao === 0
      );

    // Envia a nova imagem antes de modificar o banco.
    if (arquivo) {
      novaImagem = await enviarImagem(
        arquivo,
        "categorias"
      );
    }

    const categoriaAtualizada = await prisma.$transaction(
      async (tx) => {
        await atualizarCategoriaModel(
          dadosValidados,
          id,
          tx
        );

        if (novaImagem) {
          if (imagemPrincipal) {
            await tx.imagemCategoria.update({
              where: {
                id: imagemPrincipal.id,
              },
              data: {
                url: novaImagem.url,
                textoAlternativo:
                  dadosValidados.nome ??
                  categoriaExistente.nome,
              },
            });
          } else {
            await tx.imagemCategoria.create({
              data: {
                categoriaId: id,
                url: novaImagem.url,
                textoAlternativo:
                  dadosValidados.nome ??
                  categoriaExistente.nome,
                posicao: 0,
              },
            });
          }
        } else if (dadosValidados.nome && imagemPrincipal) {
          await tx.imagemCategoria.update({
            where: {
              id: imagemPrincipal.id,
            },
            data: {
              textoAlternativo: dadosValidados.nome,
            },
          });
        }

        return tx.categoria.findUnique({
          where: { id },
          include: {
            imagens: {
              orderBy: {
                posicao: "asc",
              },
            },
          },
        });
      }
    );

    atualizacaoConcluida = true;

    // Só removemos a imagem anterior depois que o banco
    // confirmou a substituição.
    if (novaImagem && imagemPrincipal) {
      try {
        await removerImagemDoStorage(
          imagemPrincipal.url
        );
      } catch (erroImagem) {
        console.error(
          "A categoria foi atualizada, mas a imagem anterior não pôde ser removida do Storage:",
          erroImagem
        );
      }
    }

    return categoriaAtualizada;
  } catch (erro) {
    // Se a atualização no banco falhou, tentamos remover
    // o arquivo novo para evitar imagens órfãs.
    if (novaImagem && !atualizacaoConcluida) {
      try {
        await excluirImagem(novaImagem.caminho);
      } catch (erroImagem) {
        console.error(
          "Não foi possível remover a nova imagem após falha na atualização:",
          erroImagem
        );
      }
    }

    if (erro.message === "CATEGORIA_NAO_ENCONTRADA") {
      throw new Error("CATEGORIA_NAO_ENCONTRADA");
    }

    if (erro.code === "P2025") {
      throw new Error("CATEGORIA_NAO_ENCONTRADA");
    }

    if (erro.code === "P2002") {
      throw new Error(
        "Já existe uma categoria com esse slug."
      );
    }

    throw erro;
  }
}

/**
 * Ativa ou desativa uma categoria sem excluir sua imagem.
 */
export async function atualizarStatusCategoriaService(
  id,
  ativo
) {
  if (!id) {
    throw new Error("O ID da categoria é obrigatório.");
  }

  if (typeof ativo !== "boolean") {
    throw new Error(
      "O campo ativo deve ser true ou false."
    );
  }

  try {
    return await atualizarStatusCategoriaModel(
      id,
      ativo
    );
  } catch (erro) {
    if (erro.code === "P2025") {
      throw new Error("CATEGORIA_NAO_ENCONTRADA");
    }

    throw erro;
  }
}