import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { prisma } from "../src/config/prisma.js";
import authRoutes from "../src/routes/public/authRoutes.js";

test("HTTP: access expirado, renovação com rotação e rejeição de refresh inválido", async () => {
  process.env.JWT_SECRET = "segredo-exclusivo-teste-refresh";
  const usuario = { id: "cliente-refresh", nome: "Cliente", email: "cliente@example.test", tipo: "CLIENTE", ativo: true };
  const hash = token => createHash("sha256").update(token).digest("hex");
  const sessoes = [];
  function sessao(token, alteracoes = {}) {
    const registro = { id: String(sessoes.length + 1), tokenHash: hash(token), usuarioId: usuario.id,
      usuario, revogadoEm: null, expiraEm: new Date(Date.now() + 86400000), ...alteracoes };
    sessoes.push(registro);
    return registro;
  }
  // Banco isolado em memória: este teste nunca acessa usuários ou sessões reais.
  prisma.usuario.findUnique = async () => usuario;
  prisma.sessaoRefreshToken.findUnique = async ({ where }) => sessoes.find(s => s.tokenHash === where.tokenHash) || null;
  prisma.sessaoRefreshToken.updateMany = async ({ where, data }) => {
    const registros = sessoes.filter(s => s.id === where.id && !s.revogadoEm && s.expiraEm > where.expiraEm.gt);
    registros.forEach(s => Object.assign(s, data));
    return { count: registros.length };
  };
  prisma.sessaoRefreshToken.create = async ({ data }) => {
    const registro = { id: String(sessoes.length + 1), revogadoEm: null, usuario, ...data };
    sessoes.push(registro);
    return registro;
  };
  prisma.$transaction = async fn => fn(prisma);
  const app = express();
  app.use(express.json(), cookieParser(), authRoutes);
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const cookies = r => r.headers.getSetCookie().map(c => c.split(";")[0]).join("; ");
  try {
    const antigo = jwt.sign({ tipo: usuario.tipo }, process.env.JWT_SECRET, { subject: usuario.id, expiresIn: -1 });
    assert.equal((await fetch(`${base}/me`, { headers: { Cookie: `aurora_access=${antigo}` } })).status, 401);
    assert.equal((await fetch(`${base}/me`)).status, 401);
    const original = sessao("refresh-valido");
    const renovacao = await fetch(`${base}/renovar`, { method: "POST", headers: { Cookie: "aurora_refresh=refresh-valido" } });
    assert.equal(renovacao.status, 200);
    assert.ok(original.revogadoEm);
    const novosCookies = cookies(renovacao);
    assert.match(novosCookies, /aurora_access=/);
    assert.match(novosCookies, /aurora_refresh=/);
    for (const cookie of renovacao.headers.getSetCookie()) assert.match(cookie, /HttpOnly/);
    const token = novosCookies.match(/aurora_access=([^;]+)/)[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    assert.equal(payload.exp - payload.iat, 15 * 60);
    const me = await fetch(`${base}/me`, { headers: { Cookie: novosCookies } });
    assert.equal(me.status, 200);
    assert.equal((await me.json()).usuario.id, usuario.id);
    const segundaRenovacao = await fetch(`${base}/renovar`, { method: "POST", headers: { Cookie: novosCookies } });
    assert.equal(segundaRenovacao.status, 200);
    sessao("expirado", { expiraEm: new Date(Date.now() - 1) });
    sessao("revogado", { revogadoEm: new Date() });
    sessao("desativado", { usuario: { ...usuario, ativo: false } });
    for (const tokenRefresh of ["refresh-valido", "expirado", "revogado", "desativado", "inexistente", ""]) {
      const r = await fetch(`${base}/renovar`, { method: "POST", headers: { Cookie: `aurora_refresh=${tokenRefresh}` } });
      assert.equal(r.status, 401);
      assert.match(cookies(r), /aurora_access=;/);
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
    await prisma.$disconnect();
  }
});
