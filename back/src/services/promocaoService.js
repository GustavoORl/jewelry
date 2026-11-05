import { z } from "zod";

import {
    criarPromocaoModel,
    listarPromocoesModel,
    listarPromocoesAtivasModel,
    buscarPromocaoPorIdModel,
    buscarProdutosExistentesModel,
    buscarCategoriasExistentesModel,
    atualizarPromocaoModel,
    alterarStatusPromocaoModel,
    excluirPromocaoModel,
} from "../models/promocaoModel.js";

const schemaPromocao = z.object({
    nome: z.string().trim().min(3).max(150),

    descricao: z.string().trim().max(1000).nullish(),

    tipo: z.enum(["PERCENTUAL", "FIXO"]),

    valor: z.coerce.number().positive().finite(),

    ativo: z.boolean().default(true),

    inicioEm: z.coerce.date(),
    fimEm: z.coerce.date(),

    produtoIds: z.array(z.string().min(1)).default([]),
    categoriaIds: z.array(z.string().min(1)).default([]),
}).superRefine((dados, contexto) => {
    if (dados.fimEm <= dados.inicioEm) {
        contexto.addIssue({
            code: "custom",
            path: ["fimEm"],
            message: "A data final deve ser posterior à inicial.",
        });
    }

    if (dados.tipo === "PERCENTUAL" && dados.valor > 100) {
        contexto.addIssue({
            code: "custom",
            path: ["valor"],
            message: "O desconto percentual não pode ultrapassar 100%.",
        });
    }

    if (Math.round(dados.valor * 100) !== dados.valor * 100 &&
        Math.abs(Math.round(dados.valor * 100) - dados.valor * 100) > 1e-8) {
        contexto.addIssue({
            code: "custom",
            path: ["valor"],
            message: "O valor deve ter no máximo duas casas decimais.",
        });
    }

    if (!dados.produtoIds.length && !dados.categoriaIds.length) {
        contexto.addIssue({
            code: "custom",
            message: "Selecione pelo menos um produto ou categoria.",
        });
    }
});

function criarErro(mensagem, status = 400) {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;
}

function validarDados(dados) {
    const resultado = schemaPromocao.safeParse(dados);

    if (!resultado.success) {
        const mensagem = resultado.error.issues
            .map((item) => item.message)
            .join(" ");

        throw criarErro(mensagem);
    }

    const valores = resultado.data;

    return {
        ...valores,
        produtoIds: [...new Set(valores.produtoIds)],
        categoriaIds: [...new Set(valores.categoriaIds)],
    };
}

async function validarRelacionamentos(dados) {
    const [produtos, categorias] = await Promise.all([
        buscarProdutosExistentesModel(dados.produtoIds),
        buscarCategoriasExistentesModel(dados.categoriaIds),
    ]);

    if (produtos.length !== dados.produtoIds.length) {
        throw criarErro("Um ou mais produtos não foram encontrados.");
    }

    if (categorias.length !== dados.categoriaIds.length) {
        throw criarErro("Uma ou mais categorias não foram encontradas.");
    }
}

async function exigirPromocao(id) {
    const promocao = await buscarPromocaoPorIdModel(id);

    if (!promocao) {
        throw criarErro("Promoção não encontrada.", 404);
    }

    return promocao;
}

export async function criarPromocao(dados) {
    const valores = validarDados(dados);

    await validarRelacionamentos(valores);

    return criarPromocaoModel(valores);
}

export async function listarPromocoes() {
    return listarPromocoesModel();
}

export async function listarPromocoesAtivas() {
    return listarPromocoesAtivasModel();
}

export async function buscarPromocao(id) {
    return exigirPromocao(id);
}

export async function atualizarPromocao(id, dados) {
    await exigirPromocao(id);

    const valores = validarDados(dados);

    await validarRelacionamentos(valores);

    return atualizarPromocaoModel(id, valores);
}

export async function alterarStatusPromocao(id, ativo) {
    await exigirPromocao(id);

    if (typeof ativo !== "boolean") {
        throw criarErro("O campo ativo deve ser booleano.");
    }

    return alterarStatusPromocaoModel(id, ativo);
}

export async function excluirPromocao(id) {
    await exigirPromocao(id);

    return excluirPromocaoModel(id);
}
