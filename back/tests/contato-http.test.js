import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { prisma } from "../src/config/prisma.js";
import { conversaRoutes, notificacaoRoutes } from "../src/routes/contatoRoutes.js";

test("HTTP: conversa contínua privada, reenvio idempotente, histórico e notificações por usuário", async () => {
  process.env.JWT_SECRET = "segredo-exclusivo-teste-contato";
  const mensagens = [], notificacoes = [];
  const criarAviso = data => {
    const existente = notificacoes.find(n => n.chave === data.chave);
    if (existente) return existente;
    const novo = { id: randomUUID(), criadoEm: new Date(), lidaEm: null, ...data }; notificacoes.push(novo); return novo;
  };
  prisma.usuario.findMany = async () => [{ id: "admin" }];
  prisma.pedido.findMany = async ({ where }) => where.usuarioId === "cliente" ? [{ id: "p1", usuarioId: "cliente", status: "PAGO", pagamentos: [] }] : [];
  prisma.devolucao.findFirst = async ({ where }) => where.pedidoId === "p1" && (!where.pedido || where.pedido.usuarioId === "cliente") ? { id: "d1", pedido: { usuarioId: "cliente" } } : null;
  prisma.mensagemDevolucao.create = async ({ data }) => {
    if (data.chaveCliente && mensagens.some(m => m.chaveCliente === data.chaveCliente)) throw Object.assign(new Error(), { code: "P2002" });
    const m = { id: randomUUID(), criadoEm: new Date(), autor: { nome: data.autorTipo === "ADMIN" ? "Equipe" : "Cliente" }, ...data }; mensagens.push(m); return m;
  };
  prisma.mensagemDevolucao.findUnique = async ({ where }) => mensagens.find(m => m.chaveCliente === where.chaveCliente) || null;
  prisma.mensagemDevolucao.findFirst = async ({ where }) => mensagens.find(m => m.id === where.id && m.devolucaoId === where.devolucaoId) || null;
  prisma.mensagemDevolucao.findMany = async ({ where, cursor, take }) => {
    const rows = mensagens.filter(m => m.devolucaoId === where.devolucaoId).sort((a, b) => b.criadoEm - a.criadoEm || (a.id < b.id ? 1 : -1));
    return rows.slice(cursor ? rows.findIndex(m => m.id === cursor.id) + 1 : 0).slice(0, take);
  };
  prisma.notificacao.upsert = async ({ create }) => criarAviso(create);
  prisma.notificacao.createMany = async ({ data }) => { data.forEach(criarAviso); return { count: data.length }; };
  prisma.notificacao.findMany = async ({ where }) => notificacoes.filter(n => n.usuarioId === where.usuarioId).slice(-50).reverse();
  prisma.notificacao.count = async ({ where }) => notificacoes.filter(n => n.usuarioId === where.usuarioId && n.lidaEm === null).length;
  prisma.notificacao.updateMany = async ({ where, data }) => {
    const rows = notificacoes.filter(n => n.usuarioId === where.usuarioId && n.lidaEm === null && (where.id ? where.id.in.includes(n.id) : n.criadoEm <= where.criadoEm.lte));
    rows.forEach(n => Object.assign(n, data)); return { count: rows.length };
  };
  prisma.$transaction = async fn => fn(prisma);
  const app = express(); app.use(express.json(), cookieParser()); app.use("/devolucoes", conversaRoutes); app.use("/notificacoes", notificacaoRoutes);
  const server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function req(path, usuario, method = "GET", body) {
    const cookie = usuario ? `aurora_access=${jwt.sign({ tipo: usuario === "admin" ? "ADMIN" : "CLIENTE" }, process.env.JWT_SECRET, { subject: usuario, expiresIn: "2m" })}` : "";
    const r = await fetch(base + path, { method, headers: { Cookie: cookie, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, data: await r.json() };
  }
  const enviar = (usuario, texto, chaveCliente = randomUUID()) => req("/devolucoes/p1/mensagens", usuario, "POST", { texto, chaveCliente, autorId: "forjado", autorTipo: "ADMIN" });
  try {
    assert.equal((await req("/devolucoes/p1/mensagens")).status, 401);
    assert.equal((await req("/notificacoes")).status, 401);
    assert.equal((await req("/devolucoes/p1/mensagens", "outro")).status, 404);
    assert.equal((await enviar("outro", "Não pode enviar")).status, 404);
    assert.equal((await enviar("cliente", "   ")).status, 400);
    assert.equal((await enviar("cliente", "x".repeat(4001))).status, 400);
    const chave = randomUUID();
    const primeira = await enviar("cliente", "Preciso de ajuda com a devolução.", chave);
    assert.equal(primeira.status, 201); assert.equal(primeira.data.mensagem.autorId, "cliente"); assert.equal(primeira.data.mensagem.autorTipo, "CLIENTE");
    assert.equal((await enviar("cliente", "Preciso de ajuda com a devolução.", chave)).data.mensagem.id, primeira.data.mensagem.id);
    assert.equal(mensagens.length, 1); assert.equal(notificacoes.length, 1);
    assert.equal((await enviar("admin", "Vamos ajudar. Pode explicar o que aconteceu?")).status, 201);
    assert.equal((await enviar("cliente", "O fecho não está fechando.")).status, 201);
    const conversa = await req("/devolucoes/p1/mensagens", "cliente");
    assert.equal(conversa.data.mensagens.length, 3);
    assert.deepEqual(new Set(conversa.data.mensagens.map(m => m.autorTipo)), new Set(["CLIENTE", "ADMIN"]));
    const avisos = await req("/notificacoes", "cliente");
    assert.equal(avisos.data.naoLidas, 2); assert.ok(avisos.data.notificacoes.every(n => n.usuarioId === "cliente"));
    const novamente = await req("/notificacoes", "cliente"); assert.equal(novamente.data.notificacoes.length, avisos.data.notificacoes.length);
    const adminAviso = notificacoes.find(n => n.usuarioId === "admin");
    await req("/notificacoes/lidas", "cliente", "PATCH", { ids: [adminAviso.id] }); assert.equal(adminAviso.lidaEm, null);
    await req("/notificacoes/lidas", "cliente", "PATCH", { ate: novamente.data.ate });
    assert.equal((await req("/notificacoes", "cliente")).data.naoLidas, 0);
    await new Promise(resolve => setTimeout(resolve, 5));
    await enviar("admin", "Pode enviar uma foto do fecho?");
    await req("/notificacoes/lidas", "cliente", "PATCH", { ate: novamente.data.ate });
    assert.equal((await req("/notificacoes", "cliente")).data.naoLidas, 1);
    assert.equal((await req("/devolucoes/p1/mensagens?antes=mensagem-alheia", "cliente")).status, 400);
    for (let i = 0; i < 105; i++) await prisma.mensagemDevolucao.create({ data: { devolucaoId: "d1", autorId: "cliente", autorTipo: "CLIENTE", texto: `Histórico ${i}` } });
    const recentes = (await req("/devolucoes/p1/mensagens", "cliente")).data;
    assert.equal(recentes.mensagens.length, 100); assert.equal(recentes.temAnteriores, true);
    const antigas = (await req(`/devolucoes/p1/mensagens?antes=${recentes.mensagens[0].id}`, "cliente")).data;
    assert.equal(antigas.mensagens.length, mensagens.length - 100); assert.equal(antigas.temAnteriores, false);
    assert.equal(new Set([...recentes.mensagens, ...antigas.mensagens].map(m => m.id)).size, mensagens.length);
  } finally { await new Promise(resolve => server.close(resolve)); await prisma.$disconnect(); }
});
