import test from "node:test";
import assert from "node:assert/strict";
import { mesclarMensagens } from "../src/utils/mensagens.js";
test("polling e envio não duplicam mensagens e preservam histórico carregado", () => {
  const antiga = { id: "a", criadoEm: "2026-11-01", texto: "Primeira" };
  const recente = { id: "b", criadoEm: "2026-11-02", texto: "Resposta" };
  const nova = { id: "c", criadoEm: "2026-11-03", texto: "Continuação" };
  assert.deepEqual(mesclarMensagens([antiga, recente], [recente, nova]), [antiga, recente, nova]);
  assert.deepEqual(mesclarMensagens([nova], [antiga]), [antiga, nova]);
});
