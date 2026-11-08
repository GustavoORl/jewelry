// Verificação opcional do banco configurado: todos os registros criados sofrem rollback.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../src/config/prisma.js";
import { criarServicoDevolucoes } from "../src/services/novidadesService.js";
import { criarServicoConversa } from "../src/services/conversaService.js";

const marcador = `qa-${randomUUID()}`;
const rollback = new Error("ROLLBACK_QA_ESPERADO");
try {
  await prisma.$transaction(async tx => {
    const postagem = await tx.postagem.create({ data: { id: marcador, titulo: "QA temporário", resumo: "Verificação temporária com rollback.", conteudo: "Este texto nunca será persistido após a transação.", publicada: false } });
    assert.equal(postagem.publicada, false);
    await tx.postagem.update({ where: { id: marcador }, data: { publicada: true, publicadoEm: new Date() } });
    assert.equal((await tx.postagem.findFirst({ where: { id: marcador, publicada: true } })).id, marcador);
    const usuario = await tx.usuario.create({ data: { id: marcador, nome: "QA temporário", email: `${marcador}@example.invalid` } });
    const categoria = await tx.categoria.create({ data: { nome: "QA temporário", slug: marcador } });
    const produto = await tx.produto.create({ data: { categoriaId: categoria.id, nome: "QA temporário", slug: marcador, descricao: "Teste com rollback", preco: 100, estoque: 1 } });
    const pedido = await tx.pedido.create({ data: { usuarioId: usuario.id, status: "ENTREGUE", entregueEm: new Date(), valorTotal: 100, destinatario: "QA temporário", cepEntrega: "01001000", ruaEntrega: "Endereço de teste", numeroEntrega: "1", bairroEntrega: "Teste", cidadeEntrega: "Teste", estadoEntrega: "SP", itens: { create: { produtoId: produto.id, nomeProduto: produto.nome, quantidade: 1, precoUnitario: 100 } } }, include: { itens: true } });
    const servico = criarServicoDevolucoes({ $transaction: fn => fn(tx) });
    await tx.postagem.update({ where: { id: marcador }, data: { estilo: "REVISTA", blocos: [{ tipo: "TITULO", texto: "História de QA" }, { tipo: "PRODUTO", produtoId: produto.id }] } });
    assert.equal((await tx.postagem.findUnique({ where: { id: marcador } })).blocos[1].produtoId, produto.id);
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf2kAAAAASUVORK5CYII=", "base64");
    const devolucao = await servico.solicitar(usuario.id, pedido.id, { tipoMotivo: "ARREPENDIMENTO", motivo: "Solicitação temporária para verificação.", itens: [{ itemPedidoId: pedido.itens[0].id, quantidade: 1 }] }, [{ mimetype: "image/png", buffer: png }]);
    assert.equal(devolucao.fotos.length, 1);
    assert.deepEqual(Buffer.from((await tx.fotoDevolucao.findUnique({ where: { id: devolucao.fotos[0].id } })).dados), png);
    assert.equal(devolucao.status, "SOLICITADA");
    for (const status of ["APROVADA", "RECEBIDA", "CONCLUIDA"]) {
      assert.equal((await servico.atualizar(devolucao.id, { status, resposta: "Resposta temporária para verificar a persistência." })).status, status);
    }
    const administrador = await tx.usuario.create({ data: { nome: "QA atendimento", tipo: "ADMIN", email: `${marcador}-admin@example.invalid` } });
    const conversa = criarServicoConversa({ devolucao: tx.devolucao, mensagemDevolucao: tx.mensagemDevolucao, $transaction: fn => fn(tx) });
    await conversa.enviar(pedido.id, { id: usuario.id, tipo: "CLIENTE" }, { texto: "Posso continuar o atendimento?", chaveCliente: randomUUID() });
    await conversa.enviar(pedido.id, { id: administrador.id, tipo: "ADMIN" }, { texto: "Sim, esta é uma resposta de teste.", chaveCliente: randomUUID() });
    const historico = await conversa.listar(pedido.id, { id: usuario.id, tipo: "CLIENTE" });
    assert.ok(historico.mensagens.some(m => m.texto === "Posso continuar o atendimento?"));
    assert.ok(historico.mensagens.some(m => m.texto === "Sim, esta é uma resposta de teste."));
    assert.ok(historico.mensagens.some(m => m.texto.startsWith("Atualização: concluída")));
    assert.ok(await tx.notificacao.count({ where: { usuarioId: usuario.id, lidaEm: null } }) >= 2);
    assert.equal((await tx.produto.findUnique({ where: { id: produto.id } })).estoque, 1);
    assert.equal((await tx.pedido.findUnique({ where: { id: pedido.id } })).status, "ENTREGUE");
    throw rollback;
  }, { timeout: 30000 });
} catch (e) {
  if (e !== rollback) { await prisma.$disconnect(); throw e; }
}
try {
  assert.equal(await prisma.postagem.findUnique({ where: { id: marcador } }), null);
  assert.equal(await prisma.usuario.findUnique({ where: { id: marcador } }), null);
  console.log("Banco: editorial e ciclo completo de devolução aprovados; rollback confirmado, nenhum dado de QA persistido.");
} finally { await prisma.$disconnect(); }
