import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { prisma } from "../src/config/prisma.js";
import { editorialPublico, editorialAdmin, devolucoesCliente, devolucoesAdmin } from "../src/routes/novidadesRoutes.js";
import { autenticar } from "../src/middlewares/autenticar.js";
import { autorizarAdmin } from "../src/middlewares/autorizarAdmin.js";

// Este processo usa somente dados simulados; nunca grava no banco configurado.
test("HTTP: publicação, rascunhos, permissões e fluxo de devolução", async () => {
  process.env.JWT_SECRET = "chave-exclusiva-do-processo-de-teste";
  const postagens = new Map();
  let devolucao = null;
  let fotosSalvas = [];
  let filtroDevolucoes;
  prisma.produto.count = async ({ where }) => where.id.in.filter(id => id === "produto-ativo").length;
  prisma.produto.findMany = async () => [{ id: "produto-ativo", nome: "Joia atual", preco: 100, imagens: [], categoriaId: "c1" }];
  prisma.promocao.findMany = async () => [];
  prisma.fotoDevolucao.findFirst = async ({ where }) => where.id === "foto-teste" && (!where.devolucao || where.devolucao.pedido.usuarioId === "cliente") ? { tipo: "image/png", dados: fotosSalvas[0].dados } : null;
  const pedido = { id: "pedido-teste", usuarioId: "cliente", status: "ENTREGUE", entregueEm: new Date(), itens: [{ id: "item-teste", nomeProduto: "Anel de teste", quantidade: 2 }], usuario: { nome: "Cliente teste", email: "teste@example.invalid" } };
  prisma.postagem.findMany = async ({ where, omit } = {}) => [...postagens.values()].filter(p => !where?.publicada || p.publicada).map(p => omit?.conteudo ? { ...p, conteudo: undefined } : p);
  prisma.postagem.findFirst = async ({ where }) => { const p = postagens.get(where.id); return p?.publicada ? p : null; };
  prisma.postagem.findUnique = async ({ where }) => postagens.get(where.id) || null;
  prisma.postagem.create = async ({ data }) => { const p = { id: `post-${postagens.size + 1}`, ...data }; postagens.set(p.id, p); return p; };
  prisma.postagem.update = async ({ where, data }) => { const p = { ...postagens.get(where.id), ...data }; postagens.set(p.id, p); return p; };
  prisma.postagem.delete = async ({ where }) => { postagens.delete(where.id); };
  prisma.pedido.findFirst = async ({ where }) => where.id === pedido.id && where.usuarioId === pedido.usuarioId ? pedido : null;
  prisma.devolucao.findUnique = async () => devolucao ? { ...devolucao, pedido } : null;
  prisma.devolucao.findMany = async args => { filtroDevolucoes = args.where; return devolucao ? [{ ...devolucao, pedido }] : []; };
  prisma.devolucao.create = async ({ data }) => {
    if (devolucao) throw Object.assign(new Error(), { code: "P2002" });
    fotosSalvas = data.fotos?.create || [];
    devolucao = { id: "dev-teste", status: "SOLICITADA", ...data, fotos: fotosSalvas.map((_, i) => ({ id: i ? `foto-${i}` : "foto-teste" })) }; return devolucao;
  };
  prisma.devolucao.updateMany = async ({ where, data }) => {
    if (devolucao?.id !== where.id || devolucao.status !== where.status) return { count: 0 };
    devolucao = { ...devolucao, ...data }; return { count: 1 };
  };
  prisma.usuario.findMany = async () => [];
  prisma.notificacao.upsert = async () => ({});
  prisma.mensagemDevolucao.create = async () => ({ id: "m1" });
  prisma.$transaction = async fn => fn(prisma);
  const app = express();
  app.use(express.json(), cookieParser());
  app.use("/editorial", editorialPublico);
  app.use("/devolucoes", devolucoesCliente);
  app.use("/admin/editorial", autenticar, autorizarAdmin, editorialAdmin);
  app.use("/admin/devolucoes", autenticar, autorizarAdmin, devolucoesAdmin);
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const token = tipo => jwt.sign({ tipo }, process.env.JWT_SECRET, { subject: "cliente", expiresIn: "1m" });
  async function request(path, { tipo, method = "GET", body } = {}) {
    const r = await fetch(base + path, { method, headers: { "Content-Type": "application/json", ...(tipo ? { Cookie: `aurora_access=${token(tipo)}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, dados: r.status === 204 ? null : await r.json() };
  }
  try {
    assert.equal((await request("/admin/editorial")).status, 401);
    assert.equal((await request("/admin/editorial", { tipo: "CLIENTE" })).status, 403);
    assert.equal((await request("/admin/devolucoes", { tipo: "CLIENTE" })).status, 403);
    assert.equal((await request("/devolucoes/pedido-teste")).status, 401);
    assert.equal((await request("/devolucoes")).status, 401);
    assert.equal((await request("/admin/editorial", { tipo: "ADMIN", method: "POST", body: { titulo: "x" } })).status, 400);
    const dados = { titulo: "Editorial de teste", resumo: "Resumo para testar o editorial.", conteudo: "Conteúdo completo de uma postagem para verificação.", imagemUrl: "", publicada: false };
    assert.equal((await request("/admin/editorial", { tipo: "ADMIN", method: "POST", body: { ...dados, blocos: [{ tipo: "PRODUTO", produtoId: "inexistente" }] } })).status, 400);
    const criado = await request("/admin/editorial", { tipo: "ADMIN", method: "POST", body: dados });
    assert.equal(criado.status, 201);
    const id = criado.dados.postagem.id;
    assert.equal((await request("/editorial")).dados.postagens.length, 0);
    assert.equal((await request(`/editorial/${id}`)).status, 404);
    assert.equal((await request(`/admin/editorial/${id}`, { tipo: "ADMIN", method: "PUT", body: { ...dados, publicada: true } })).status, 200);
    const lista = await request("/editorial");
    assert.equal(lista.dados.postagens.length, 1);
    assert.equal(lista.dados.postagens[0].conteudo, undefined);
    assert.equal((await request(`/editorial/${id}`)).dados.postagem.conteudo, dados.conteudo);
    await request(`/admin/editorial/${id}`, { tipo: "ADMIN", method: "PUT", body: { ...dados, publicada: true, blocos: [{ tipo: "PRODUTO", produtoId: "produto-ativo" }] } });
    assert.equal((await request(`/editorial/${id}`)).dados.postagem.blocos[0].produto.nome, "Joia atual");
    await request(`/admin/editorial/${id}`, { tipo: "ADMIN", method: "PUT", body: dados });
    assert.equal((await request(`/editorial/${id}`)).status, 404);
    assert.equal((await request(`/admin/editorial/${id}`, { tipo: "ADMIN", method: "DELETE" })).status, 204);
    assert.equal((await request("/devolucoes/alheio", { tipo: "CLIENTE" })).status, 404);
    assert.equal((await request("/devolucoes/pedido-teste", { tipo: "CLIENTE" })).dados.devolucao, null);
    const solicitacao = { tipoMotivo: "ARREPENDIMENTO", motivo: "Produto não serviu no tamanho desejado.", itens: [{ itemPedidoId: "item-teste", quantidade: 1 }] };
    pedido.entregueEm = new Date(Date.now() - 8 * 86400000);
    assert.equal((await request("/devolucoes/pedido-teste", { tipo: "CLIENTE", method: "POST", body: solicitacao })).status, 400);
    pedido.entregueEm = null;
    assert.equal((await request("/devolucoes/pedido-teste", { tipo: "CLIENTE", method: "POST", body: solicitacao })).status, 400);
    pedido.entregueEm = new Date();
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf2kAAAAASUVORK5CYII=", "base64");
    async function anexar(quantidade) {
      const form = new FormData(); form.append("dados", JSON.stringify(solicitacao));
      for (let i = 0; i < quantidade; i++) form.append("fotos", new Blob([png], { type: "image/png" }), `foto-${i}.png`);
      return fetch(base + "/devolucoes/pedido-teste", { method: "POST", headers: { Cookie: `aurora_access=${token("CLIENTE")}` }, body: form });
    }
    assert.equal((await anexar(4)).status, 400);
    const comFotos = await anexar(3);
    assert.equal(comFotos.status, 201);
    assert.equal((await comFotos.json()).devolucao.fotos.length, 3);
    const fotoOwner = await fetch(base + "/devolucoes/fotos/foto-teste", { headers: { Cookie: `aurora_access=${token("CLIENTE")}` } });
    assert.equal(fotoOwner.status, 200);
    assert.equal(fotoOwner.headers.get("cache-control"), "private, no-store");
    assert.deepEqual(Buffer.from(await fotoOwner.arrayBuffer()), png);
    assert.equal((await request("/devolucoes/fotos/foto-teste")).status, 401);
    const outro = jwt.sign({ tipo: "CLIENTE" }, process.env.JWT_SECRET, { subject: "outro", expiresIn: "1m" });
    assert.equal((await fetch(base + "/devolucoes/fotos/foto-teste", { headers: { Cookie: `aurora_access=${outro}` } })).status, 404);
    assert.equal((await fetch(base + "/devolucoes/fotos/foto-teste", { headers: { Cookie: `aurora_access=${token("ADMIN")}` } })).status, 200);
    assert.equal((await request("/devolucoes/pedido-teste", { tipo: "CLIENTE", method: "POST", body: solicitacao })).status, 409);
    assert.equal((await request("/admin/devolucoes", { tipo: "ADMIN" })).dados.devolucoes.length, 1);
    const pessoais = await request("/devolucoes", { tipo: "CLIENTE" });
    assert.equal(pessoais.dados.devolucoes[0].pedidoId, "pedido-teste");
    assert.deepEqual(filtroDevolucoes, { pedido: { usuarioId: "cliente" } });
    const alterar = status => request("/admin/devolucoes/dev-teste", { tipo: "ADMIN", method: "PATCH", body: { status, resposta: "Instruções da equipe para a devolução." } });
    assert.equal((await alterar("CONCLUIDA")).status, 409);
    for (const status of ["APROVADA", "RECEBIDA", "CONCLUIDA"]) assert.equal((await alterar(status)).dados.devolucao.status, status);
    assert.equal((await alterar("APROVADA")).status, 409);
  } finally { await new Promise(resolve => server.close(resolve)); await prisma.$disconnect(); }
});
