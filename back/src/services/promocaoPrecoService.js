import { prisma } from "../config/prisma.js";

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function paraCentavos(valor) {
    return Math.round(Number(valor) * 100);
}

function paraReais(centavos) {
    return Number((centavos / 100).toFixed(2));
}

function calcularPrecoComDesconto(precoOriginal, promocao) {
    const precoCentavos = paraCentavos(precoOriginal);
    const valor = Number(promocao.valor);

    if (
        !Number.isFinite(valor) ||
        valor <= 0 ||
        precoCentavos <= 0
    ) {
        return precoCentavos;
    }

    let descontoCentavos = 0;

    if (promocao.tipo === "PERCENTUAL") {
        const percentual = Math.min(valor, 100);

        descontoCentavos = Math.round(
            precoCentavos * percentual / 100
        );
    } else if (promocao.tipo === "FIXO") {
        descontoCentavos = paraCentavos(valor);
    }

    return Math.max(
        0,
        precoCentavos - descontoCentavos
    );
}

// ============================================================
// BUSCAR PROMOÇÕES VÁLIDAS
// ============================================================

export async function buscarPromocoesVigentes(
    produtos,
    cliente = prisma
) {
    if (!produtos.length) return [];

    const agora = new Date();

    const produtoIds = [
        ...new Set(produtos.map((produto) => produto.id)),
    ];

    const categoriaIds = [
        ...new Set(
            produtos
                .map((produto) => produto.categoriaId)
                .filter(Boolean)
        ),
    ];

    return cliente.promocao.findMany({
        where: {
            ativo: true,
            inicioEm: {
                lte: agora,
            },
            fimEm: {
                gt: agora,
            },
            OR: [
                {
                    produtos: {
                        some: {
                            produtoId: {
                                in: produtoIds,
                            },
                        },
                    },
                },
                {
                    categorias: {
                        some: {
                            categoriaId: {
                                in: categoriaIds,
                            },
                        },
                    },
                },
            ],
        },
        include: {
            produtos: {
                select: {
                    produtoId: true,
                },
            },
            categorias: {
                select: {
                    categoriaId: true,
                },
            },
        },
    });
}

// ============================================================
// APLICAR DESCONTOS AOS PRODUTOS
// ============================================================

export function aplicarPromocoesNosProdutos(
    produtos,
    promocoes
) {
    const promocoesPorProduto = new Map();
    const promocoesPorCategoria = new Map();

    for (const promocao of promocoes) {
        for (const relacao of promocao.produtos ?? []) {
            const lista =
                promocoesPorProduto.get(relacao.produtoId) ?? [];

            lista.push(promocao);

            promocoesPorProduto.set(
                relacao.produtoId,
                lista
            );
        }

        for (const relacao of promocao.categorias ?? []) {
            const lista =
                promocoesPorCategoria.get(relacao.categoriaId) ?? [];

            lista.push(promocao);

            promocoesPorCategoria.set(
                relacao.categoriaId,
                lista
            );
        }
    }

    return produtos.map((produto) => {
        const precoOriginalCentavos = paraCentavos(
            produto.preco
        );

        const candidatas = new Map();

        const promocoesProduto =
            promocoesPorProduto.get(produto.id) ?? [];

        const promocoesCategoria =
            promocoesPorCategoria.get(produto.categoriaId) ?? [];

        for (const promocao of [
            ...promocoesProduto,
            ...promocoesCategoria,
        ]) {
            candidatas.set(promocao.id, promocao);
        }

        let melhorPromocao = null;
        let melhorPrecoCentavos = precoOriginalCentavos;

        for (const promocao of candidatas.values()) {
            const precoCalculado = calcularPrecoComDesconto(
                produto.preco,
                promocao
            );

            if (precoCalculado < melhorPrecoCentavos) {
                melhorPrecoCentavos = precoCalculado;
                melhorPromocao = promocao;
            }
        }

        const emPromocao = melhorPromocao !== null;

        const descontoCentavos =
            precoOriginalCentavos - melhorPrecoCentavos;

        const percentualDesconto =
            precoOriginalCentavos > 0
                ? Number(
                    (
                        descontoCentavos /
                        precoOriginalCentavos *
                        100
                    ).toFixed(2)
                )
                : 0;

        return {
            ...produto,

            // Preservamos o preço original.
            preco: produto.preco,

            precoPromocional: paraReais(
                melhorPrecoCentavos
            ),

            emPromocao,

            percentualDesconto,

            valorDesconto: paraReais(
                descontoCentavos
            ),

            promocao: melhorPromocao
                ? {
                    id: melhorPromocao.id,
                    nome: melhorPromocao.nome,
                    tipo: melhorPromocao.tipo,
                    valor: Number(melhorPromocao.valor),
                    fimEm: melhorPromocao.fimEm,
                }
                : null,
        };
    });
}

// ============================================================
// ENRIQUECER LISTA DE PRODUTOS
// ============================================================

export async function adicionarPrecosPromocionais(
    produtos,
    cliente = prisma
) {
    if (!Array.isArray(produtos)) {
        throw new Error(
            "É necessário informar uma lista de produtos."
        );
    }

    if (produtos.length === 0) return [];

    const promocoes = await buscarPromocoesVigentes(
        produtos,
        cliente
    );

    return aplicarPromocoesNosProdutos(
        produtos,
        promocoes
    );
}

// ============================================================
// ENRIQUECER PRODUTO INDIVIDUAL
// ============================================================

export async function adicionarPrecoPromocional(
    produto,
    cliente = prisma
) {
    if (!produto) return null;

    const [produtoComPromocao] =
        await adicionarPrecosPromocionais(
            [produto],
            cliente
        );

    return produtoComPromocao;
}