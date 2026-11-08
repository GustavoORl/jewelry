import { z } from "zod";
import { notificar, notificarAdmins } from "./notificacaoService.js";

const texto = (min, max) => z.string().trim().min(min).max(max);
const imagemHttps = z.url().max(2048).refine(url => url.startsWith("https://"), "Use uma imagem HTTPS.");
export const blocoSchema = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("TEXTO"), texto: texto(1, 10000) }),
  z.object({ tipo: z.literal("TITULO"), texto: texto(1, 200) }),
  z.object({ tipo: z.literal("CITACAO"), texto: texto(1, 1000) }),
  z.object({ tipo: z.literal("IMAGEM"), url: imagemHttps, legenda: z.string().trim().max(300).default("") }),
  z.object({ tipo: z.literal("PRODUTO"), produtoId: texto(1, 100) }),
]);
export const postagemSchema = z.object({
  titulo: texto(3, 160),
  resumo: texto(10, 500),
  conteudo: texto(20, 50000),
  imagemUrl: z.union([z.literal(""), z.url().refine(url => url.startsWith("https://"), "Use uma imagem HTTPS.")]).default(""),
  publicada: z.boolean().default(false),
  blocos: z.array(blocoSchema).max(40).default([]),
  estilo: z.enum(["CLASSICO", "REVISTA"]).default("CLASSICO"),
});
export const solicitacaoSchema = z.object({
  tipoMotivo: z.enum(["DEFEITO", "ARREPENDIMENTO", "PRODUTO_INCORRETO", "AVARIA", "TAMANHO", "OUTRO"]),
  motivo: texto(10, 2000),
  itens: z.array(z.object({ itemPedidoId: texto(1, 100), quantidade: z.number().int().positive() })).min(1).max(100),
});
export const respostaSchema = z.object({
  status: z.enum(["APROVADA", "RECUSADA", "RECEBIDA", "CONCLUIDA"]),
  resposta: texto(10, 2000),
});
const transicoes = { SOLICITADA: ["APROVADA", "RECUSADA"], APROVADA: ["RECEBIDA"], RECEBIDA: ["CONCLUIDA"] };
export function falha(mensagem, status = 400) {
  return Object.assign(new Error(mensagem), { status });
}
export function validarItensDevolucao(pedido, itens, agora = new Date()) {
  if (pedido.status !== "ENTREGUE") throw falha("A devolução pode ser solicitada após a entrega do pedido.");
  if ((pedido.pagamentos || []).some(p => p.status === "REEMBOLSADO")) throw falha("Este pedido já foi reembolsado.");
  const entrega = pedido.entregueEm ? new Date(pedido.entregueEm).getTime() : NaN;
  if (!Number.isFinite(entrega)) throw falha("A data de entrega ainda não foi registrada. Entre em contato com a equipe.");
  if (agora.getTime() < entrega || agora.getTime() >= entrega + 7 * 24 * 60 * 60 * 1000) throw falha("O prazo de 7 dias corridos após a entrega para solicitar reembolso terminou.");
  const ids = new Set();
  for (const item of itens) {
    const original = pedido.itens.find(i => i.id === item.itemPedidoId);
    if (ids.has(item.itemPedidoId) || !original || item.quantidade > original.quantidade) {
      throw falha("Selecione produtos do pedido e quantidades válidas, sem repetições.");
    }
    ids.add(item.itemPedidoId);
  }
}
export function validarTransicao(atual, proximo) {
  if (!transicoes[atual]?.includes(proximo)) throw falha("Essa alteração de status não é permitida.", 409);
}

// Banco injetado para permitir testar autorização, concorrência e regras sem dados reais.
export function criarServicoDevolucoes(db) {
  return {
    async solicitar(usuarioId, pedidoId, entrada, arquivos = []) {
      const dados = solicitacaoSchema.parse(entrada);
      validarFotos(arquivos);
      return db.$transaction(async tx => {
        const pedido = await tx.pedido.findFirst({ where: { id: pedidoId, usuarioId }, include: { itens: true, pagamentos: { select: { status: true } } } });
        if (!pedido) throw falha("Pedido não encontrado.", 404);
        validarItensDevolucao(pedido, dados.itens);
        const devolucao = await tx.devolucao.create({ data: { pedidoId, ...dados, mensagens: { create: { autorId: usuarioId, autorTipo: "CLIENTE", texto: dados.motivo } }, ...(arquivos.length ? { fotos: { create: arquivos.map(a => ({ tipo: a.mimetype, dados: a.buffer })) } } : {}) }, include: { fotos: { select: { id: true } } } });
        await notificarAdmins(tx, { chave: `devolucao:${devolucao.id}`, titulo: "Nova solicitação de devolução", texto: `Pedido #${pedidoId.slice(-8).toUpperCase()}: ${dados.motivo.slice(0, 120)}`, url: `/admin/devolucoes#conversa-${pedidoId}` });
        await notificar(tx, usuarioId, { chave: `devolucao:${devolucao.id}`, titulo: "Solicitação de devolução recebida", texto: "Acompanhe o atendimento e converse com a equipe.", url: `/devolucoes-reembolso#conversa-${pedidoId}` });
        return devolucao;
      }, { timeout: 30000 }).catch(error => {
        if (error.code === "P2002") throw falha("Já existe uma solicitação de devolução para este pedido.", 409);
        throw error;
      });
    },
    async atualizar(id, entrada, usuario) {
      const dados = respostaSchema.parse(entrada);
      return db.$transaction(async tx => {
        const atual = await tx.devolucao.findUnique({ where: { id }, include: { pedido: { select: { usuarioId: true } } } });
        if (!atual) throw falha("Devolução não encontrada.", 404);
        validarTransicao(atual.status, dados.status);
        const alteracao = await tx.devolucao.updateMany({ where: { id, status: atual.status }, data: dados });
        if (alteracao.count !== 1) throw falha("A devolução foi alterada. Atualize a página.", 409);
        const nomes = { APROVADA: "aprovada", RECUSADA: "recusada", RECEBIDA: "produtos recebidos", CONCLUIDA: "concluída" };
        const mensagem = await tx.mensagemDevolucao.create({ data: { devolucaoId: id, autorId: usuario?.id || null, autorTipo: "ADMIN", texto: `Atualização: ${nomes[dados.status]}.\n${dados.resposta}` } });
        await notificar(tx, atual.pedido.usuarioId, { chave: `mensagem:${mensagem.id}`, titulo: "Atualização da devolução", texto: `Sua solicitação foi atualizada: ${nomes[dados.status]}.`, url: `/devolucoes-reembolso#conversa-${atual.pedidoId}` });
        return tx.devolucao.findUnique({ where: { id } });
      });
    },
  };
}

export function validarFotos(arquivos) {
  if (arquivos.length > 3) throw falha("Anexe no máximo 3 fotos.");
  for (const a of arquivos) {
    const b = a.buffer;
    const tipoReal = b?.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ? "image/jpeg"
      : b?.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? "image/png"
      : b?.subarray(0, 4).toString() === "RIFF" && b?.subarray(8, 12).toString() === "WEBP" ? "image/webp" : null;
    if (!tipoReal || tipoReal !== a.mimetype || b.length > 4 * 1024 * 1024) throw falha("Envie fotos JPG, PNG ou WebP de até 4 MB cada.");
  }
}
