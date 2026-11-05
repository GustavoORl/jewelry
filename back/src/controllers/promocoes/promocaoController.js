import * as promocaoService from "../../services/promocaoService.js";

function tratarErro(res, erro) {
    console.error("Erro na promoção:", erro);

    if (erro.code === "P2025") {
        return res.status(404).json({
            sucesso: false,
            mensagem: "Registro não encontrado.",
        });
    }

    if (erro.code === "P2002") {
        return res.status(409).json({
            sucesso: false,
            mensagem: "Já existe um registro com estes dados.",
        });
    }

    return res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.status
            ? erro.message
            : "Erro interno ao processar a promoção.",
    });
}

export async function criar(req, res) {
    try {
        const promocao = await promocaoService.criarPromocao(req.body);

        return res.status(201).json({
            sucesso: true,
            promocao,
        });
    } catch (erro) {
        return tratarErro(res, erro);
    }
}

export async function listar(req, res) {
    try {
        const promocoes = await promocaoService.listarPromocoesAtivas();

        return res.json({
            sucesso: true,
            promocoes,
        });
    } catch (erro) {
        return tratarErro(res, erro);
    }
}

export async function listarAdmin(req, res) {
    try {
        const promocoes = await promocaoService.listarPromocoes();

        return res.json({
            sucesso: true,
            promocoes,
        });
    } catch (erro) {
        return tratarErro(res, erro);
    }
}

export async function buscar(req, res) {
    try {
        const promocao = await promocaoService.buscarPromocao(
            req.params.id
        );

        return res.json({
            sucesso: true,
            promocao,
        });
    } catch (erro) {
        return tratarErro(res, erro);
    }
}

export async function atualizar(req, res) {
    try {
        const promocao = await promocaoService.atualizarPromocao(
            req.params.id,
            req.body
        );

        return res.json({
            sucesso: true,
            promocao,
        });
    } catch (erro) {
        return tratarErro(res, erro);
    }
}

export async function alterarStatus(req, res) {
    try {
        const promocao = await promocaoService.alterarStatusPromocao(
            req.params.id,
            req.body?.ativo
        );

        return res.json({
            sucesso: true,
            promocao,
        });
    } catch (erro) {
        return tratarErro(res, erro);
    }
}

export async function excluir(req, res) {
    try {
        await promocaoService.excluirPromocao(req.params.id);

        return res.json({
            sucesso: true,
            mensagem: "Promoção excluída com sucesso.",
        });
    } catch (erro) {
        return tratarErro(res, erro);
    }
}
