
import * as sacolaModel from "../models/sacolaModel.js";

import {
    adicionarPrecosPromocionais,
} from "./promocaoPrecoService.js";

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function erro(mensagem, status = 400) {
    const error = new Error(mensagem);
    error.status = status;
    return error;
}

function validarQuantidade(quantidade) {
    if (
        !Number.isInteger(quantidade) ||
        quantidade < 1
    ) {
        throw erro(
            "A quantidade deve ser um número inteiro maior que zero."
        );
    }
}

function paraCentavos(valor) {
    return Math.round(Number(valor) * 100);
}

function paraReais(centavos) {
    return Number((centavos / 100).toFixed(2));
}

async function obterSacola(usuarioId) {
    return sacolaModel.buscarOuCriarSacola(usuarioId);
}

async function validarProdutoDisponivel(produtoId) {
    const produto = await sacolaModel.buscarProduto(produtoId);

    if (!produto) {
        throw erro("Produto não encontrado.", 404);
    }

    if (!produto.ativo || !produto.categoria?.ativo) {
        throw erro(
            "Este produto não está disponível para compra.",
            400
        );
    }

    if (produto.estoque <= 0) {
        throw erro(
            "Este produto está sem estoque.",
            400
        );
    }

    return produto;
}

// ============================================================
// CONSULTAR SACOLA
// ============================================================

export async function consultarSacola(usuarioId) {
    let sacola = await sacolaModel.buscarSacola(usuarioId);

    if (!sacola) {
        await sacolaModel.criarSacola(usuarioId);
        sacola = await sacolaModel.buscarSacola(usuarioId);
    }

    // Obtém todos os produtos associados à sacola.
    const produtos = sacola.itens.map(
        (item) => item.produto
    );

    // Aplica promoções vigentes em uma única consulta.
    const produtosComPromocao =
        await adicionarPrecosPromocionais(produtos);

    // Cria um mapa para localizar os produtos rapidamente.
    const produtosPorId = new Map(
        produtosComPromocao.map((produto) => [
            produto.id,
            produto,
        ])
    );

    // ========================================================
    // MONTAR ITENS
    // ========================================================

    const itens = sacola.itens.map((item) => {
        const produto =
            produtosPorId.get(item.produtoId) ||
            item.produto;

        const precoOriginalCentavos = paraCentavos(
            produto.preco
        );

        const precoPromocionalCentavos = paraCentavos(
            produto.precoPromocional ?? produto.preco
        );

        const emPromocao =
            produto.emPromocao === true &&
            precoPromocionalCentavos >= 0 &&
            precoPromocionalCentavos < precoOriginalCentavos;

        const precoVendaCentavos = emPromocao
            ? precoPromocionalCentavos
            : precoOriginalCentavos;

        const subtotalOriginalCentavos =
            precoOriginalCentavos * item.quantidade;

        const subtotalCentavos =
            precoVendaCentavos * item.quantidade;

        const economiaCentavos =
            subtotalOriginalCentavos -
            subtotalCentavos;

        const disponivel =
            produto.ativo &&
            produto.categoria?.ativo &&
            produto.estoque >= item.quantidade;

        return {
            id: item.id,
            produtoId: item.produtoId,

            nome: produto.nome,
            slug: produto.slug,

            // Preço original do cadastro.
            preco: paraReais(precoOriginalCentavos),
            precoOriginal: paraReais(precoOriginalCentavos),

            // Preço efetivo de venda.
            precoPromocional: emPromocao
                ? paraReais(precoVendaCentavos)
                : null,

            precoVenda: paraReais(precoVendaCentavos),

            emPromocao,

            percentualDesconto: emPromocao
                ? produto.percentualDesconto ??
                  Math.round(
                      (economiaCentavos /
                          subtotalOriginalCentavos) *
                          100
                  )
                : 0,

            promocao: emPromocao
                ? produto.promocao ?? null
                : null,

            quantidade: item.quantidade,

            // Subtotal já considera a promoção.
            subtotal: paraReais(subtotalCentavos),

            subtotalOriginal: paraReais(
                subtotalOriginalCentavos
            ),

            economia: paraReais(economiaCentavos),

            estoque: produto.estoque,
            disponivel,

            imagem: produto.imagens?.[0]?.url ?? null,

            categoria: produto.categoria?.nome ?? null,
        };
    });

    // ========================================================
    // TOTAIS DA SACOLA
    // ========================================================

    const valorOriginalCentavos = itens.reduce(
        (total, item) =>
            total + paraCentavos(item.subtotalOriginal),
        0
    );

    const valorTotalCentavos = itens.reduce(
        (total, item) =>
            total + paraCentavos(item.subtotal),
        0
    );

    const economiaTotalCentavos =
        valorOriginalCentavos - valorTotalCentavos;

    return {
        id: sacola.id,

        itens,

        quantidadeItens: itens.reduce(
            (total, item) => total + item.quantidade,
            0
        ),

        valorOriginal: paraReais(valorOriginalCentavos),

        valorTotal: paraReais(valorTotalCentavos),

        economiaTotal: paraReais(economiaTotalCentavos),

        atualizadoEm: sacola.atualizadoEm,
    };
}

// ============================================================
// ADICIONAR PRODUTO
// ============================================================

export async function adicionarProduto(
    usuarioId,
    produtoId,
    quantidade = 1
) {
    validarQuantidade(quantidade);

    const produto = await validarProdutoDisponivel(produtoId);

    const sacola = await obterSacola(usuarioId);

    const itemExistente =
        await sacolaModel.buscarItemSacola(
            sacola.id,
            produtoId
        );

    const quantidadeFinal =
        (itemExistente?.quantidade ?? 0) + quantidade;

    if (quantidadeFinal > produto.estoque) {
        throw erro(
            `Estoque insuficiente. Disponível: ${produto.estoque} unidade(s).`
        );
    }

    await sacolaModel.adicionarItemSacola(
        sacola.id,
        produtoId,
        quantidade
    );

    return consultarSacola(usuarioId);
}

// ============================================================
// ALTERAR QUANTIDADE
// ============================================================

export async function alterarQuantidade(
    usuarioId,
    itemId,
    quantidade
) {
    validarQuantidade(quantidade);

    const sacolaAtual =
        await sacolaModel.buscarSacola(usuarioId);

    if (!sacolaAtual) {
        throw erro("Sacola não encontrada.", 404);
    }

    const item = sacolaAtual.itens.find(
        (itemAtual) => itemAtual.id === itemId
    );

    if (!item) {
        throw erro(
            "Item não encontrado na sua sacola.",
            404
        );
    }

    const produto = await sacolaModel.buscarProduto(
        item.produtoId
    );

    if (!produto) {
        throw erro("Produto não encontrado.", 404);
    }

    const estaDiminuindo =
        quantidade < item.quantidade;

    if (!estaDiminuindo) {
        if (
            !produto.ativo ||
            !produto.categoria?.ativo
        ) {
            throw erro(
                "Este produto não está disponível para compra."
            );
        }

        if (produto.estoque <= 0) {
            throw erro(
                "Este produto está sem estoque."
            );
        }

        if (quantidade > produto.estoque) {
            throw erro(
                `Estoque insuficiente. Disponível: ${produto.estoque} unidade(s).`
            );
        }
    }

    await sacolaModel.atualizarQuantidadeItem(
        itemId,
        quantidade
    );

    return consultarSacola(usuarioId);
}

// ============================================================
// REMOVER PRODUTO
// ============================================================

export async function removerProduto(
    usuarioId,
    itemId
) {
    const sacola =
        await sacolaModel.buscarSacola(usuarioId);

    if (!sacola) {
        throw erro("Sacola não encontrada.", 404);
    }

    const item = sacola.itens.find(
        (itemAtual) => itemAtual.id === itemId
    );

    if (!item) {
        throw erro(
            "Item não encontrado na sua sacola.",
            404
        );
    }

    await sacolaModel.removerItemSacola(itemId);

    return consultarSacola(usuarioId);
}

// ============================================================
// ESVAZIAR SACOLA
// ============================================================

export async function esvaziarSacola(usuarioId) {
    const sacola =
        await sacolaModel.buscarSacola(usuarioId);

    if (!sacola) {
        return {
            mensagem: "Sua sacola já está vazia.",
            itens: [],
            quantidadeItens: 0,
            valorOriginal: 0,
            valorTotal: 0,
            economiaTotal: 0,
        };
    }

    await sacolaModel.limparSacola(sacola.id);

    return consultarSacola(usuarioId);
}
