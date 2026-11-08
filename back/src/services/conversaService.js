import { z } from "zod";
import { notificar, notificarAdmins } from "./notificacaoService.js";

const mensagemSchema = z.object({ texto: z.string().trim().min(1).max(4000), chaveCliente: z.uuid() });
const falha = (mensagem, status = 400) => Object.assign(new Error(mensagem), { status });
export function criarServicoConversa(db) {
  async function acessar(pedidoId, usuario, cliente = db) {
    if (!usuario?.id) throw falha("Autenticação necessária.", 401);
    const devolucao = await cliente.devolucao.findFirst({ where: { pedidoId, ...(usuario.tipo === "ADMIN" ? {} : { pedido: { usuarioId: usuario.id } }) }, include: { pedido: { select: { usuarioId: true } } } });
    if (!devolucao) throw falha("Conversa não encontrada.", 404);
    return devolucao;
  }
  return {
    async listar(pedidoId, usuario, antes) {
      const devolucao = await acessar(pedidoId, usuario);
      if (antes && (typeof antes !== "string" || antes.length > 100 || !await db.mensagemDevolucao.findFirst({ where: { id: antes, devolucaoId: devolucao.id } }))) throw falha("Página de conversa inválida.");
      const mensagens = await db.mensagemDevolucao.findMany({ where: { devolucaoId: devolucao.id }, orderBy: [{ criadoEm: "desc" }, { id: "desc" }], take: 101, ...(antes ? { cursor: { id: antes }, skip: 1 } : {}), include: { autor: { select: { nome: true } } } });
      return { mensagens: mensagens.slice(0, 100).reverse(), temAnteriores: mensagens.length > 100 };
    },
    async enviar(pedidoId, usuario, entrada) {
      const dados = mensagemSchema.parse(entrada);
      let devolucao;
      try {
        return await db.$transaction(async tx => {
          devolucao = await acessar(pedidoId, usuario, tx);
          const mensagem = await tx.mensagemDevolucao.create({ data: { ...dados, devolucaoId: devolucao.id, autorId: usuario.id, autorTipo: usuario.tipo }, include: { autor: { select: { nome: true } } } });
          const evento = { chave: `mensagem:${mensagem.id}`, titulo: "Nova mensagem na devolução", texto: dados.texto.slice(0, 160), url: usuario.tipo === "ADMIN" ? `/devolucoes-reembolso#conversa-${pedidoId}` : `/admin/devolucoes#conversa-${pedidoId}` };
          if (usuario.tipo === "ADMIN") await notificar(tx, devolucao.pedido.usuarioId, evento);
          else await notificarAdmins(tx, evento);
          return mensagem;
        });
      } catch (e) {
        if (e.code !== "P2002" || !devolucao) throw e;
        const anterior = await db.mensagemDevolucao.findUnique({ where: { chaveCliente: dados.chaveCliente }, include: { autor: { select: { nome: true } } } });
        if (anterior?.devolucaoId === devolucao.id && anterior.autorId === usuario.id && anterior.texto === dados.texto) return anterior;
        throw falha("Identificador de mensagem já utilizado.", 409);
      }
    },
  };
}
