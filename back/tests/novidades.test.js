import test from "node:test";
import assert from "node:assert/strict";
import { postagemSchema, solicitacaoSchema, validarItensDevolucao, validarTransicao, criarServicoDevolucoes, validarFotos } from "../src/services/novidadesService.js";

const pedido = { id: "p1", status: "ENTREGUE", entregueEm: new Date(), itens: [{ id: "i1", quantidade: 2 }] };
const entrada = { tipoMotivo: "ARREPENDIMENTO", motivo: "O produto não serviu.", itens: [{ itemPedidoId: "i1", quantidade: 1 }] };
test("devolução valida pedido entregue, produtos, quantidades e duplicações", () => {
  validarItensDevolucao(pedido, entrada.itens);
  for (const itens of [[{ itemPedidoId: "outro", quantidade: 1 }], [{ itemPedidoId: "i1", quantidade: 3 }], [...entrada.itens, ...entrada.itens]]) assert.throws(() => validarItensDevolucao(pedido, itens));
  for (const status of ["PENDENTE", "PAGO", "ENVIADO", "CANCELADO"]) assert.throws(() => validarItensDevolucao({ ...pedido, status }, entrada.itens));
});
test("rejeita motivo curto, lista vazia e quantidades inválidas", () => {
  assert.equal(solicitacaoSchema.safeParse({ ...entrada, motivo: "x" }).success, false);
  assert.equal(solicitacaoSchema.safeParse({ ...entrada, itens: [] }).success, false);
  for (const quantidade of [0, -1, 1.5, "1"]) assert.equal(solicitacaoSchema.safeParse({ ...entrada, itens: [{ itemPedidoId: "i1", quantidade }] }).success, false);
});
test("etapas não permitem conclusão antecipada ou reabertura", () => {
  for (const [a, b] of [["SOLICITADA", "APROVADA"], ["SOLICITADA", "RECUSADA"], ["APROVADA", "RECEBIDA"], ["RECEBIDA", "CONCLUIDA"]]) validarTransicao(a, b);
  for (const [a, b] of [["SOLICITADA", "CONCLUIDA"], ["RECUSADA", "APROVADA"], ["CONCLUIDA", "SOLICITADA"], ["RECEBIDA", "APROVADA"]]) assert.throws(() => validarTransicao(a, b));
});
test("postagens validam tamanhos, booleano e URL HTTPS", () => {
  const p = { titulo: "Cuidados com joias", resumo: "Como cuidar de suas joias.", conteudo: "Guarde suas joias em local seco e protegido.", publicada: true, imagemUrl: "https://example.com/joia.png" };
  assert.equal(postagemSchema.safeParse(p).success, true);
  for (const imagemUrl of ["javascript:alert(1)", "http://example.com/imagem.png", "inválido"]) assert.equal(postagemSchema.safeParse({ ...p, imagemUrl }).success, false);
  assert.equal(postagemSchema.safeParse({ ...p, publicada: "true" }).success, false);
  assert.equal(postagemSchema.safeParse({ ...p, titulo: "a".repeat(161) }).success, false);
});
function banco({ encontrado = pedido, duplicado = false, disputa = false } = {}) {
  const chamadas = [];
  const tx = {
    usuario: { findMany: async () => [] },
    notificacao: { upsert: async () => ({}) },
    mensagemDevolucao: { create: async () => ({ id: "m1" }) },
    pedido: { findFirst: async args => { chamadas.push(args); return encontrado; } },
    devolucao: {
      create: async ({ data }) => { if (duplicado) throw Object.assign(new Error(), { code: "P2002" }); return data; },
      findUnique: async () => ({ id: "d1", status: "SOLICITADA", pedidoId: "p1", pedido: { usuarioId: "cliente" } }),
      updateMany: async args => { chamadas.push(args); return { count: disputa ? 0 : 1 }; },
    },
  };
  return { chamadas, $transaction: async fn => fn(tx) };
}
test("consulta exige dono do pedido e bloqueia acesso a pedido alheio", async () => {
  const db = banco({ encontrado: null });
  await assert.rejects(criarServicoDevolucoes(db).solicitar("cliente", "p1", entrada), { status: 404 });
  assert.deepEqual(db.chamadas[0].where, { id: "p1", usuarioId: "cliente" });
});
test("solicitação persiste itens e motivo e trata duplicidade", async () => {
  assert.deepEqual(await criarServicoDevolucoes(banco()).solicitar("cliente", "p1", entrada), { pedidoId: "p1", ...entrada, mensagens: { create: { autorId: "cliente", autorTipo: "CLIENTE", texto: entrada.motivo } } });
  await assert.rejects(criarServicoDevolucoes(banco({ duplicado: true })).solicitar("cliente", "p1", entrada), { status: 409 });
});
test("atualização impede disputa entre administradores", async () => {
  const db = banco();
  const resposta = { status: "APROVADA", resposta: "Envie o produto conforme instruções." };
  await criarServicoDevolucoes(db).atualizar("d1", resposta);
  assert.deepEqual(db.chamadas[0].where, { id: "d1", status: "SOLICITADA" });
  await assert.rejects(criarServicoDevolucoes(banco({ disputa: true })).atualizar("d1", resposta), { status: 409 });
});

test("prazo permite menos de sete dias e recusa o limite exato", () => {
  const entregueEm = new Date("2026-11-01T15:30:00Z");
  const p = { ...pedido, entregueEm };
  const limite = new Date(entregueEm.getTime() + 7 * 86400000);
  validarItensDevolucao(p, entrada.itens, new Date(limite.getTime() - 1));
  assert.throws(() => validarItensDevolucao(p, entrada.itens, limite), /7 dias/);
  assert.throws(() => validarItensDevolucao(p, entrada.itens, new Date(limite.getTime() + 1)), /7 dias/);
  assert.throws(() => validarItensDevolucao({ ...p, entregueEm: null }, entrada.itens), /não foi registrada/);
  assert.throws(() => validarItensDevolucao(p, entrada.itens, new Date(entregueEm.getTime() - 1)));
  assert.throws(() => validarItensDevolucao({ ...p, pagamentos: [{ status: "REEMBOLSADO" }] }, entrada.itens, new Date(entregueEm)), /já foi reembolsado/);
});
test("motivo é obrigatório e limitado às opções suportadas", () => {
  assert.equal(solicitacaoSchema.safeParse({ ...entrada, tipoMotivo: undefined }).success, false);
  assert.equal(solicitacaoSchema.safeParse({ ...entrada, tipoMotivo: "INVENTADO" }).success, false);
  for (const tipoMotivo of ["DEFEITO", "ARREPENDIMENTO", "PRODUTO_INCORRETO", "AVARIA", "TAMANHO", "OUTRO"]) assert.equal(solicitacaoSchema.safeParse({ ...entrada, tipoMotivo }).success, true);
});
test("fotos limitam quantidade, tamanho, tipo e assinatura real do arquivo", () => {
  const png = { mimetype: "image/png", buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]) };
  validarFotos([png, png, png]);
  assert.throws(() => validarFotos([png, png, png, png]), /3 fotos/);
  assert.throws(() => validarFotos([{ ...png, mimetype: "image/jpeg" }]), /JPG/);
  assert.throws(() => validarFotos([{ ...png, buffer: Buffer.from("arquivo HTML") }]), /JPG/);
  const grande = Buffer.alloc(4 * 1024 * 1024 + 1); png.buffer.copy(grande);
  assert.throws(() => validarFotos([{ ...png, buffer: grande }]), /4 MB/);
});
test("editorial valida blocos e rejeita links e tipos não permitidos", () => {
  const p = { titulo: "Uma história", resumo: "Resumo de uma história.", conteudo: "Uma introdução para a história das joias." };
  const blocos = [{ tipo: "TITULO", texto: "Inspiração" }, { tipo: "IMAGEM", url: "https://example.com/foto.jpg", legenda: "Detalhes" }, { tipo: "PRODUTO", produtoId: "p1" }];
  assert.equal(postagemSchema.safeParse({ ...p, blocos, estilo: "REVISTA" }).success, true);
  for (const bloco of [{ tipo: "HTML", texto: "<script>" }, { tipo: "IMAGEM", url: "javascript:alert(1)" }, { tipo: "PRODUTO", produtoId: "" }]) assert.equal(postagemSchema.safeParse({ ...p, blocos: [bloco] }).success, false);
  assert.equal(postagemSchema.safeParse({ ...p, blocos: Array(41).fill(blocos[0]) }).success, false);
  assert.deepEqual(postagemSchema.parse(p).blocos, []);
});
