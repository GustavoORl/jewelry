import test from "node:test";
import assert from "node:assert/strict";
import { precificarItens, validarTotalPagamento } from "../src/services/checkoutValores.js";

test("checkout cobra somente os produtos com os descontos calculados pelo servidor", () => {
  const { totalCentavos, itensPedido } = precificarItens(
    [{ id: "i1", produtoId: "p1", quantidade: 2 }],
    [{ id: "p1", nome: "Anel", ativo: true, categoria: { ativo: true }, estoque: 3, preco: 100, emPromocao: true, precoPromocional: 80 }],
  );
  assert.equal(totalCentavos, 16000);
  assert.equal(validarTotalPagamento({ itens: itensPedido, valorTotal: "160.00" }), "160.00");
  assert.throws(() => validarTotalPagamento({ itens: itensPedido, valorTotal: "1.00" }), { status: 409 });
});
