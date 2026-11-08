import test from "node:test";
import assert from "node:assert/strict";
import { criarExclusaoImagemProduto } from "../src/services/produtoImagemService.js";

function banco() {
  const fotos = [{ id: "f1", produtoId: "p1", url: "foto-1", posicao: 0 }, { id: "f2", produtoId: "p1", url: "foto-2", posicao: 1 }];
  return { fotos, $transaction: async fn => fn({ imagemProduto: {
    findFirst: async ({ where }) => fotos.find(f => f.id === where.id && f.produtoId === where.produtoId),
    deleteMany: async ({ where }) => { const i = fotos.findIndex(f => f.id === where.id && f.produtoId === where.produtoId); if (i < 0) return { count: 0 }; fotos.splice(i, 1); return { count: 1 }; },
  } }) };
}
test("exclui somente a foto selecionada e limpa o arquivo; próxima foto vira principal", async () => {
  const db = banco(), apagados = [];
  const excluir = criarExclusaoImagemProduto(db, async url => apagados.push(url));
  assert.equal((await excluir("p1", "f1")).aviso, null);
  assert.deepEqual(apagados, ["foto-1"]); assert.equal(db.fotos[0].id, "f2");
  await excluir("p1", "f2"); assert.equal(db.fotos.length, 0);
});
test("não exclui foto de outro produto nem apaga arquivos em erro de banco", async () => {
  const db = banco(); let chamadas = 0;
  const excluir = criarExclusaoImagemProduto(db, async () => chamadas++);
  await assert.rejects(excluir("p2", "f1"), { status: 404 });
  assert.equal(db.fotos.length, 2); assert.equal(chamadas, 0);
  db.$transaction = async () => { throw new Error("Banco indisponível"); };
  await assert.rejects(excluir("p1", "f1")); assert.equal(chamadas, 0);
});
test("falha de armazenamento retorna aviso sem desfazer exclusão confirmada", async () => {
  const db = banco();
  const resultado = await criarExclusaoImagemProduto(db, async () => { throw new Error("Storage indisponível"); })("p1", "f1");
  assert.ok(resultado.aviso); assert.equal(db.fotos.length, 1);
});
