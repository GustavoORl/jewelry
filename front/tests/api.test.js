import test from "node:test";
import assert from "node:assert/strict";

const resposta = (status, dados = {}) => new Response(JSON.stringify(dados), {
  status,
  headers: { "Content-Type": "application/json" },
});

// Cada cenário recebe seu próprio estado de renovação, sem cookies reais.
async function cliente(t, fetchImpl) {
  t.mock.method(globalThis, "fetch", fetchImpl);
  return import(`../src/services/api.js?cenario=${encodeURIComponent(t.name)}`);
}

test("access expirado renova cookies e repete /me antes de retornar o usuário", async t => {
  const chamadas = [];
  const { apiFetch } = await cliente(t, async (url, opcoes) => {
    chamadas.push([url, opcoes]);
    if (url === "/renovar") return resposta(200);
    return chamadas.length === 1 ? resposta(401) : resposta(200, { usuario: { id: "cliente" } });
  });
  assert.deepEqual(await apiFetch("/me"), { usuario: { id: "cliente" } });
  assert.deepEqual(chamadas.map(([url]) => url), ["/me", "/renovar", "/me"]);
  assert.equal(chamadas[1][1].method, "POST");
  assert.ok(chamadas.every(([, opcoes]) => opcoes.credentials === "include"));
});

test("requisições simultâneas compartilham uma renovação, inclusive 401 atrasado", async t => {
  let renovacoes = 0;
  let renovado = false;
  let liberarAtrasada;
  const atrasada = new Promise(resolve => { liberarAtrasada = resolve; });
  const contagens = new Map();
  const { apiFetch } = await cliente(t, async url => {
    if (url === "/renovar") {
      renovacoes++;
      await new Promise(resolve => setImmediate(resolve));
      renovado = true;
      return resposta(200);
    }
    const tentativa = (contagens.get(url) || 0) + 1;
    contagens.set(url, tentativa);
    if (url === "/atrasada" && tentativa === 1) {
      await atrasada;
      return resposta(401);
    }
    return resposta(renovado ? 200 : 401);
  });
  const pendente = apiFetch("/atrasada");
  await Promise.all([apiFetch("/me"), apiFetch("/sacola"), apiFetch("/favoritos")]);
  liberarAtrasada();
  await pendente;
  assert.equal(renovacoes, 1);
  assert.ok([...contagens.values()].every(n => n === 2));
});

test("refresh inválido não repete operação e preserva status 401", async t => {
  const chamadas = [];
  const { apiFetch } = await cliente(t, async url => {
    chamadas.push(url);
    return resposta(401, { mensagem: "Sessão expirada" });
  });
  await assert.rejects(apiFetch("/me"), { message: "Sessão expirada", status: 401 });
  assert.deepEqual(chamadas, ["/me", "/renovar"]);
});

test("novo 401 após renovar termina sem ciclo de refresh", async t => {
  const chamadas = [];
  const { apiFetch } = await cliente(t, async url => {
    chamadas.push(url);
    return resposta(url === "/renovar" ? 200 : 401);
  });
  await assert.rejects(apiFetch("/me"), { status: 401 });
  assert.deepEqual(chamadas, ["/me", "/renovar", "/me"]);
});

test("login, Google, logout e refresh explícito não acionam renovação automática", async t => {
  const chamadas = [];
  const { apiFetch } = await cliente(t, async url => {
    chamadas.push(url);
    return resposta(401);
  });
  for (const url of ["/entrar", "/google", "/sair", "/renovar"]) {
    await assert.rejects(apiFetch(url, { method: "POST" }), { status: 401 });
  }
  assert.equal(chamadas.length, 4);
});

test("erro 403 ou 500 não renova sessão", async t => {
  const chamadas = [];
  const { apiFetch } = await cliente(t, async url => {
    chamadas.push(url);
    return resposta(Number(url.slice(1)));
  });
  for (const status of [403, 500]) await assert.rejects(apiFetch(`/${status}`), { status });
  assert.equal(chamadas.length, 2);
});

test("repetição mantém método, JSON, headers e sinal; resposta binária é suportada", async t => {
  const chamadas = [];
  const { apiRequest } = await cliente(t, async (url, opcoes) => {
    chamadas.push([url, opcoes]);
    if (url === "/renovar") return resposta(200);
    return chamadas.length === 1 ? resposta(401) : new Response("imagem");
  });
  const signal = new AbortController().signal;
  const body = JSON.stringify({ nome: "teste" });
  const r = await apiRequest("/imagem", { method: "POST", body, headers: { "X-Teste": "valor" }, signal });
  assert.equal(await r.text(), "imagem");
  assert.deepEqual(chamadas[0][1], chamadas[2][1]);
  assert.equal(chamadas[2][1].body, body);
  assert.equal(chamadas[2][1].signal, signal);
  assert.equal(chamadas[2][1].headers["Content-Type"], "application/json");
});

test("upload preserva FormData e boundary definido pelo navegador ao repetir", async t => {
  const chamadas = [];
  const { apiFetch } = await cliente(t, async (url, opcoes) => {
    chamadas.push([url, opcoes]);
    return resposta(chamadas.length === 1 ? 401 : 200);
  });
  const body = new FormData();
  body.append("foto", new Blob(["foto"]), "foto.png");
  await apiFetch("/devolucoes", { method: "POST", body, headers: { "Content-Type": "multipart/form-data" } });
  assert.equal(chamadas[2][1].body, body);
  assert.equal(chamadas[2][1].headers["Content-Type"], undefined);
});

test("falha temporária no refresh pode ser tentada novamente na próxima requisição", async t => {
  let renovacoes = 0;
  const { apiFetch } = await cliente(t, async url => {
    if (url === "/renovar") return resposta(++renovacoes === 1 ? 500 : 200);
    return resposta(renovacoes === 2 ? 200 : 401);
  });
  await assert.rejects(apiFetch("/me"), { status: 500 });
  await apiFetch("/me");
  assert.equal(renovacoes, 2);
});
