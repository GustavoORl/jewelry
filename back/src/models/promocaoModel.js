import { prisma } from "../config/prisma.js";

const incluirRelacionamentos = {
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
};

export async function criarPromocaoModel(dados) {
    return prisma.promocao.create({
        data: {
            nome: dados.nome,
            descricao: dados.descricao,
            tipo: dados.tipo,
            valor: dados.valor,
            ativo: dados.ativo,
            inicioEm: dados.inicioEm,
            fimEm: dados.fimEm,

            produtos: {
                create: dados.produtoIds.map((produtoId) => ({
                    produto: {
                        connect: { id: produtoId },
                    },
                })),
            },

            categorias: {
                create: dados.categoriaIds.map((categoriaId) => ({
                    categoria: {
                        connect: { id: categoriaId },
                    },
                })),
            },
        },
        include: incluirRelacionamentos,
    });
}

export async function listarPromocoesModel() {
    return prisma.promocao.findMany({
        include: incluirRelacionamentos,
        orderBy: {
            criadoEm: "desc",
        },
    });
}

export async function listarPromocoesAtivasModel() {
    const agora = new Date();

    return prisma.promocao.findMany({
        where: {
            ativo: true,
            inicioEm: { lte: agora },
            fimEm: { gt: agora },
        },
        include: incluirRelacionamentos,
        orderBy: {
            fimEm: "asc",
        },
    });
}

export async function buscarPromocaoPorIdModel(id) {
    return prisma.promocao.findUnique({
        where: { id },
        include: incluirRelacionamentos,
    });
}

export async function buscarProdutosExistentesModel(ids) {
    return prisma.produto.findMany({
        where: {
            id: { in: ids },
        },
        select: {
            id: true,
        },
    });
}

export async function buscarCategoriasExistentesModel(ids) {
    return prisma.categoria.findMany({
        where: {
            id: { in: ids },
        },
        select: {
            id: true,
        },
    });
}

export async function atualizarPromocaoModel(id, dados) {
    return prisma.promocao.update({
        where: { id },
        data: {
            nome: dados.nome,
            descricao: dados.descricao,
            tipo: dados.tipo,
            valor: dados.valor,
            ativo: dados.ativo,
            inicioEm: dados.inicioEm,
            fimEm: dados.fimEm,

            produtos: {
                deleteMany: {},
                create: dados.produtoIds.map((produtoId) => ({
                    produto: {
                        connect: { id: produtoId },
                    },
                })),
            },

            categorias: {
                deleteMany: {},
                create: dados.categoriaIds.map((categoriaId) => ({
                    categoria: {
                        connect: { id: categoriaId },
                    },
                })),
            },
        },
        include: incluirRelacionamentos,
    });
}

export async function alterarStatusPromocaoModel(id, ativo) {
    return prisma.promocao.update({
        where: { id },
        data: { ativo },
        include: incluirRelacionamentos,
    });
}

export async function excluirPromocaoModel(id) {
    return prisma.promocao.delete({
        where: { id },
    });
}
