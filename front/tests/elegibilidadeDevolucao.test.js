import test from "node:test";
import assert from "node:assert/strict";
import { separarPedidosDevolucao, PRAZO_DEVOLUCAO_MS } from "../src/utils/elegibilidadeDevolucao.js";

test("lista só entregues há menos de sete dias e sem solicitação anterior", () => {
  const agora = Date.parse("2026-11-07T18:00:00Z");
  const pedido = (id, idade, extra = {}) => ({ id, status: "ENTREGUE", entregueEm: new Date(agora - idade).toISOString(), ...extra });
  const pedidos = [pedido("recente", 86400000), pedido("ultimo-ms", PRAZO_DEVOLUCAO_MS - 1), pedido("limite", PRAZO_DEVOLUCAO_MS), pedido("vencido", PRAZO_DEVOLUCAO_MS + 1), pedido("futuro", -1), pedido("enviado", 1000, { status: "ENVIADO" }), pedido("sem-data", 0, { entregueEm: null }), pedido("ja-solicitado", 86400000), pedido("reembolsado", 86400000, { pagamentos: [{ status: "REEMBOLSADO" }] })];
  const grupos = separarPedidosDevolucao(pedidos, [{ pedidoId: "ja-solicitado" }], agora);
  assert.deepEqual(grupos.elegiveis.map(p => p.id), ["recente", "ultimo-ms"]);
  assert.deepEqual(grupos.solicitados.map(p => p.id), ["ja-solicitado"]);
  assert.deepEqual(grupos.semData.map(p => p.id), ["sem-data"]);
});
test("solicitações existentes continuam acessíveis após o prazo e mudança de status", () => {
  const pedidos = [{ id: "antigo", status: "CANCELADO", entregueEm: "2020-01-01" }];
  const grupos = separarPedidosDevolucao(pedidos, [{ pedidoId: "antigo" }]);
  assert.equal(grupos.elegiveis.length, 0);
  assert.deepEqual(grupos.solicitados, pedidos);
});
