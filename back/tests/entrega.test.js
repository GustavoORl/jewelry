import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/config/prisma.js";
import { atualizarStatusPedido } from "../src/models/pedidoModel.js";

test("marcar entregue registra o instante de entrega sem mudar itens ou estoque", async () => {
  let pedido = { id: "p1", usuarioId: "u1", status: "ENVIADO", entregueEm: null, itens: [] };
  let alteracao;
  prisma.$transaction = async fn => fn({ notificacao: { upsert: async () => ({}) }, pedido: {
    findUnique: async () => pedido,
    updateMany: async ({ data, where }) => { alteracao = { data, where }; pedido = { ...pedido, ...data }; return { count: 1 }; },
  } });
  const antes = Date.now();
  const atualizado = await atualizarStatusPedido("p1", "ENTREGUE");
  assert.equal(atualizado.status, "ENTREGUE");
  assert.ok(atualizado.entregueEm.getTime() >= antes);
  assert.deepEqual(alteracao.where, { id: "p1", status: "ENVIADO" });
  assert.deepEqual(Object.keys(alteracao.data).sort(), ["entregueEm", "status"]);
  const original = atualizado.entregueEm;
  await atualizarStatusPedido("p1", "ENTREGUE");
  assert.equal(pedido.entregueEm, original);
});
test("atualizações fora da entrega não iniciam nem renovam o prazo", async () => {
  let data;
  prisma.$transaction = async fn => fn({ notificacao: { upsert: async () => ({}) }, pedido: {
    findUnique: async () => ({ id: "p2", usuarioId: "u1", status: "PAGO", entregueEm: null, itens: [] }),
    updateMany: async args => { data = args.data; return { count: 1 }; },
  } });
  await atualizarStatusPedido("p2", "EM_PREPARACAO");
  assert.deepEqual(data, { status: "EM_PREPARACAO" });
});
