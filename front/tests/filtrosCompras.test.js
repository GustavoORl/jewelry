import test from "node:test";
import assert from "node:assert/strict";
import { compraConcluida, filtrarHistorico, filtrarPedidos } from "../src/utils/filtrosCompras.js";
import { direcaoSwipe, proximoIndice } from "../src/utils/carrossel.js";

const pedido = (id, statusPagamento, criadoEm, status = "ENTREGUE", valorTotal = 100) => ({ id, pagamentos: [{ status: statusPagamento }], criadoEm, status, valorTotal });
test("histórico inclui somente entregues, cancelados ou reembolsados", () => {
  for (const status of ["PENDENTE", "PAGO", "EM_PREPARACAO", "ENVIADO"]) assert.equal(compraConcluida(pedido("x", "APROVADO", "2026-11-01", status)), false);
  assert.equal(compraConcluida({ status: "ENTREGUE", pagamentos: [] }), true);
  assert.equal(compraConcluida(pedido("x", "CANCELADO", "2026-11-01", "CANCELADO")), true);
  assert.equal(compraConcluida(pedido("x", "REEMBOLSADO", "2026-11-01", "PAGO")), true);
  assert.equal(compraConcluida({ status: "REEMBOLSADO" }), true);
  assert.equal(compraConcluida({ pagamentos: [] }), false);
});
test("período inclui o primeiro e último dia no horário brasileiro", () => {
  const pedidos = [pedido("antes", "APROVADO", "2026-11-01T02:59:59Z"), pedido("inicio", "APROVADO", "2026-11-01T03:00:00Z"), pedido("fim", "APROVADO", "2026-11-08T02:59:59Z"), pedido("depois", "APROVADO", "2026-11-08T03:00:00Z"), pedido("pendente", "PENDENTE", "2026-11-02T10:00:00Z", "PENDENTE")];
  assert.deepEqual(filtrarHistorico(pedidos, { periodo: "PERSONALIZADO", inicio: "2026-11-01", fim: "2026-11-07" }).map(p => p.id), ["fim", "inicio"]);
  assert.equal(filtrarHistorico(pedidos, { periodo: "PERSONALIZADO", inicio: "2026-11-07", fim: "2026-11-01" }).length, 0);
});
test("últimos 30 dias respeitam a data local, e todo o período aceita compras antigas", () => {
  const pedidos = [pedido("fora", "APROVADO", "2026-10-09T02:59:59Z"), pedido("dentro", "APROVADO", "2026-10-09T03:00:00Z")];
  assert.deepEqual(filtrarHistorico(pedidos, { periodo: "30", agora: new Date("2026-11-07T20:00:00Z") }).map(p => p.id), ["dentro"]);
  assert.equal(filtrarHistorico(pedidos).length, 2);
});
test("pedidos combinam status e ordenação sem alterar o array original", () => {
  const pedidos = [pedido("a", "APROVADO", "2026-11-01", "ENVIADO", 30), pedido("b", "PENDENTE", "2026-11-07", "PENDENTE", 10), pedido("c", "APROVADO", "2026-11-05", "ENVIADO", 90)];
  assert.deepEqual(filtrarPedidos(pedidos).map(p => p.id), ["b", "c", "a"]);
  assert.deepEqual(filtrarPedidos(pedidos, { status: "ENVIADO", ordem: "MAIOR_VALOR" }).map(p => p.id), ["c", "a"]);
  assert.deepEqual(filtrarPedidos(pedidos, { ordem: "ANTIGOS" }).map(p => p.id), ["a", "c", "b"]);
  assert.deepEqual(filtrarPedidos(pedidos, { ordem: "MENOR_VALOR" }).map(p => p.id), ["b", "a", "c"]);
  assert.deepEqual(pedidos.map(p => p.id), ["a", "b", "c"]);
});
test("carrossel volta ao início e distingue swipe horizontal de rolagem", () => {
  assert.equal(proximoIndice(2, 1, 3), 0);
  assert.equal(proximoIndice(0, -1, 3), 2);
  assert.equal(proximoIndice(0, 1, 0), 0);
  assert.equal(direcaoSwipe(-80, 10), 1);
  assert.equal(direcaoSwipe(80, 10), -1);
  assert.equal(direcaoSwipe(20, 0), 0);
  assert.equal(direcaoSwipe(80, 150), 0);
});
