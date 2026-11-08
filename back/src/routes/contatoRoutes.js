import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { autenticar } from "../middlewares/autenticar.js";
import { criarServicoConversa } from "../services/conversaService.js";
import { sincronizarPedidos } from "../services/notificacaoService.js";

const tratar = fn => async (req, res) => {
  try { await fn(req, res); }
  catch (e) { const status = e.name === "ZodError" ? 400 : e.status || 500; if (status === 500) console.error("Falha no contato:", e); res.status(status).json({ mensagem: status === 500 ? "Não foi possível concluir a operação." : e.name === "ZodError" ? "Confira a mensagem (1 a 4000 caracteres)." : e.message }); }
};
export const conversaRoutes = Router();
conversaRoutes.use(autenticar);
const conversa = criarServicoConversa(prisma);
conversaRoutes.get("/:pedidoId/mensagens", tratar(async (req, res) => res.set("Cache-Control", "private, no-store").json(await conversa.listar(req.params.pedidoId, req.usuario, req.query.antes))));
conversaRoutes.post("/:pedidoId/mensagens", tratar(async (req, res) => res.status(201).json({ mensagem: await conversa.enviar(req.params.pedidoId, req.usuario, req.body) })));

export const notificacaoRoutes = Router();
notificacaoRoutes.use(autenticar);
notificacaoRoutes.get("/", tratar(async (req, res) => {
  await sincronizarPedidos(prisma, req.usuario.id);
  const ate = new Date().toISOString();
  const [notificacoes, naoLidas] = await Promise.all([
    prisma.notificacao.findMany({ where: { usuarioId: req.usuario.id }, orderBy: [{ criadoEm: "desc" }, { id: "desc" }], take: 50 }),
    prisma.notificacao.count({ where: { usuarioId: req.usuario.id, lidaEm: null } }),
  ]);
  res.set("Cache-Control", "private, no-store").json({ notificacoes, naoLidas, ate });
}));
notificacaoRoutes.patch("/lidas", tratar(async (req, res) => {
  const { ids, ate } = z.object({ ids: z.array(z.string().min(1).max(100)).min(1).max(50).optional(), ate: z.iso.datetime().optional() }).refine(d => Boolean(d.ids) !== Boolean(d.ate)).parse(req.body);
  await prisma.notificacao.updateMany({ where: { usuarioId: req.usuario.id, ...(ids ? { id: { in: ids } } : { criadoEm: { lte: new Date(ate) } }), lidaEm: null }, data: { lidaEm: new Date() } });
  res.json({ sucesso: true });
}));
