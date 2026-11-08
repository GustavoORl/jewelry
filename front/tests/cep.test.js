import test from "node:test";
import assert from "node:assert/strict";
import { buscarCep } from "../src/services/cepService.js";
test("CEP formatado preenche somente campos do endereço", async () => {
  let url;
  const resultado = await buscarCep("01001-000", { fetchImpl: async u => { url = u; return { ok: true, json: async () => ({ logradouro: "Praça da Sé", bairro: "Sé", localidade: "São Paulo", uf: "SP", complemento: "ignorado" }) }; } });
  assert.equal(url, "https://viacep.com.br/ws/01001000/json/");
  assert.deepEqual(resultado, { rua: "Praça da Sé", bairro: "Sé", cidade: "São Paulo", estado: "SP" });
});
test("CEP inválido não consulta a rede", async () => {
  await assert.rejects(buscarCep("123", { fetchImpl: () => assert.fail("não deve consultar") }), /8 dígitos/);
});
test("CEP inexistente e falha HTTP permitem endereço manual", async () => {
  await assert.rejects(buscarCep("99999999", { fetchImpl: async () => ({ ok: true, json: async () => ({ erro: true }) }) }), /não encontrado/);
  await assert.rejects(buscarCep("01001000", { fetchImpl: async () => ({ ok: false }) }), /manualmente/);
});
test("CEP geral aceita logradouro e bairro vazios", async () => {
  assert.deepEqual(await buscarCep("01001000", { fetchImpl: async () => ({ ok: true, json: async () => ({ localidade: "São Paulo", uf: "SP" }) }) }), { rua: "", bairro: "", cidade: "São Paulo", estado: "SP" });
});
test("consulta encaminha cancelamento sem cookies", async () => {
  const controller = new AbortController();
  await assert.rejects(buscarCep("01001000", { signal: controller.signal, fetchImpl: async (_url, opts) => { assert.equal(opts.signal, controller.signal); assert.equal(opts.credentials, "omit"); throw new DOMException("Abortado", "AbortError"); } }), { name: "AbortError" });
});
