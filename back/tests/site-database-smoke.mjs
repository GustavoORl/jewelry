// Fluxos HTTP reais sobre dados sintéticos em uma única transação com rollback.
// Não inicia cobranças nem uploads.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../src/config/prisma.js";


const executar = prisma.$transaction.bind(prisma), fetchOriginal = globalThis.fetch;
const marcador = `qa-site-${randomUUID()}`, rollback = new Error("ROLLBACK_SITE_ESPERADO");
const restaurar = [], aprovados = [];
let servidor;
const nomes = ["usuario", "sessaoRefreshToken", "produto", "categoria", "material", "produtoMaterial", "imagemProduto", "imagemCategoria", "promocao", "promocaoProduto", "promocaoCategoria", "carrinho", "itemCarrinho", "endereco", "favorito", "pedido", "itemPedido", "pagamento", "postagem", "devolucao", "fotoDevolucao", "mensagemDevolucao", "notificacao"];
const metodos = ["findUnique", "findUniqueOrThrow", "findFirst", "findFirstOrThrow", "findMany", "create", "createMany", "update", "updateMany", "upsert", "delete", "deleteMany", "count", "aggregate", "groupBy"];
try {
  await executar(async tx => {
    // Toda consulta da aplicação usa esta transação isolada, inclusive autenticação.
    for (const nome of nomes) {
      if (!prisma[nome] || !tx[nome]) continue;
      for (const metodo of metodos) if (typeof tx[nome][metodo] === "function") {
        const original = prisma[nome][metodo]; restaurar.push(() => { prisma[nome][metodo] = original; });
        prisma[nome][metodo] = tx[nome][metodo].bind(tx[nome]);
      }
    }
    const queryOriginal = prisma.$queryRaw;
    restaurar.push(() => { prisma.$queryRaw = queryOriginal; });
    prisma.$queryRaw = tx.$queryRaw.bind(tx);
    prisma.$transaction = fn => typeof fn === "function" ? fn(tx) : Promise.all(fn);
    const { default: app } = await import("../src/app.js");
    servidor = await new Promise(resolve => { const s = app.listen(0, "127.0.0.1", () => resolve(s)); });
    const base = `http://127.0.0.1:${servidor.address().port}`;
    let cookies = "";
    async function req(method, path, body, esperado = 200, cookie = cookies) {
      const r = await fetchOriginal(`${base}${path}`, { method, headers: { Cookie: cookie, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const dados = await r.json();
      assert.equal(r.status, esperado, `${method} ${path}: ${JSON.stringify(dados)}`);
      aprovados.push(`${method} ${path}: ${r.status}`);
      return { dados, cookies: r.headers.getSetCookie().map(c => c.split(";")[0]).join("; ") };
    }
    const email = `${marcador}@example.invalid`, senha = "Teste-qa-12345";
    await req("GET", "/health");
    for (const path of ["/me", "/sacola", "/pedidos", "/favoritos", "/enderecos", "/admin/produtos"]) await req("GET", path, null, 401, "");
    await req("POST", "/usuario", { nome: "Teste QA", email, senha }, 201);
    const login = await req("POST", "/entrar", { email, senha }); cookies = login.cookies;
    assert.ok(cookies.includes("aurora_access="));
    const usuario = (await req("GET", "/me")).dados.usuario;
    await req("GET", "/admin/produtos", null, 403);
    await req("PATCH", "/usuario/me", { nome: "Teste QA Atualizado" });
    const categoria = await tx.categoria.create({ data: { nome: "QA Anéis", slug: marcador } });
    const produto = await tx.produto.create({ data: { nome: "Anel QA", slug: marcador, descricao: "Produto temporário", preco: 100, estoque: 5, categoriaId: categoria.id } });
    for (const path of ["/produtos", `/produtos/${produto.id}`, "/categorias", "/materiais", "/promocoes", "/editorial"]) await req("GET", path);
    await req("GET", "/sacola");
    await req("POST", "/sacola/itens", { produtoId: produto.id, quantidade: 1 }, 200);
    let sacola = (await req("GET", "/sacola")).dados;
    const item = sacola.itens[0];
    await req("PATCH", `/sacola/itens/${item.id}`, { quantidade: 2 });
    await req("POST", `/favoritos/${produto.id}`, {}, 201);
    await req("GET", "/favoritos"); await req("DELETE", `/favoritos/${produto.id}`);
    const endereco = { destinatario: "Teste QA", cep: "01001000", rua: "Rua sintética", numero: "1", bairro: "Centro", cidade: "São Paulo", estado: "SP" };
    const criado = await req("POST", "/enderecos", endereco, 201);
    const enderecoId = criado.dados.endereco.id;
    await req("GET", "/enderecos"); await req("PATCH", `/enderecos/${enderecoId}`, { numero: "2" });
    await req("PATCH", `/enderecos/${enderecoId}/principal`, {});
    const pedido = (await req("POST", "/pedidos", { endereco, itensSelecionados: [item.id] }, 201)).dados.pedido;
    assert.equal(Number(pedido.valorTotal), 200);
    await req("GET", "/pedidos"); await req("GET", `/pedidos/${pedido.id}`);
    await req("PATCH", `/pedidos/${pedido.id}/endereco`, { endereco: { ...endereco, cep: "22041001" } });
    assert.equal((await tx.produto.findUnique({ where: { id: produto.id } })).estoque, 3);
    assert.equal((await req("GET", "/sacola")).dados.itens.length, 0);
    const admin = await tx.usuario.create({ data: { nome: "Admin QA", email: `${marcador}-admin@example.invalid`, tipo: "ADMIN" } });
    const cookieAdmin = `aurora_access=${jwt.sign({ tipo: "ADMIN" }, process.env.JWT_SECRET, { subject: admin.id, expiresIn: "5m" })}`;
    for (const path of ["/admin/produtos", "/admin/categorias", "/admin/materiais", "/admin/usuarios", "/admin/pedidos", "/admin/dashboard", "/admin/promocao", "/admin/editorial", "/admin/devolucoes"]) await req("GET", path, null, 200, cookieAdmin);
    await req("GET", "/notificacoes"); await req("GET", "/devolucoes");
    await req("DELETE", `/enderecos/${enderecoId}`);
    await req("POST", "/sair", {});
    assert.ok(usuario.id);
    throw rollback;
  }, { timeout: 120000 });
} catch (e) { if (e !== rollback) throw e; }
finally {
  globalThis.fetch = fetchOriginal; prisma.$transaction = executar;
  for (const fn of restaurar.reverse()) fn();
  if (servidor) await new Promise(resolve => servidor.close(resolve));
  try {
    assert.equal(await prisma.usuario.count({ where: { email: { startsWith: marcador } } }), 0, "Rollback deve remover todas as contas de QA");
  } finally { await prisma.$disconnect(); }
}
console.log(`${aprovados.length} verificações HTTP aprovadas; dados sintéticos desfeitos por rollback. Sem cobranças ou etiquetas.`);
for (const linha of aprovados) console.log(linha);
