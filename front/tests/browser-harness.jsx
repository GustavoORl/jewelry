import NotificacoesConta from "../src/components/NotificacoesConta.jsx";
import DevolucoesUser from "../src/pages/user/DevolucoesUser.jsx";
import PerfilUser from "../src/pages/user/PerfilUser.jsx";
import PedidoUser from "../src/pages/user/PedidoUser.jsx";
// Tela de QA acessada somente por /tests/browser-harness.html no Vite dev.
// Não integra o build de produção nem envia requisições à API real.
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "../src/index.css";
import HistoricoCompras from "../src/pages/user/HistoricoCompras.jsx";
import Checkout from "../src/pages/user/Checkout.jsx";
import AdminEditorial from "../src/pages/admin/AdminEditorial.jsx";
import AdminDevolucoes from "../src/pages/admin/AdminDevolucoes.jsx";
import DevolucaoPedido from "../src/components/user/DevolucaoPedido.jsx";
import EditorialCarrossel from "../src/components/EditorialCarrossel.jsx";
import Editorial from "../src/pages/Editorial.jsx";

const tela = new URLSearchParams(location.search).get("tela") || "editorial";
const postagens = [
  { id: "post-1", titulo: "O encanto está em cada detalhe", resumo: "Inspire-se nos detalhes que tornam cada joia especial.", conteudo: "Cuide das suas joias com carinho.\n\nGuarde cada peça em um local seco e protegido.", imagemUrl: "/assets/images/promocao-joia.png", publicada: true, publicadoEm: new Date().toISOString() },
  { id: "post-2", titulo: "Como cuidar das suas joias", resumo: "Cuidados para preservar o brilho das suas peças favoritas.", conteudo: "Descubra como conservar suas peças favoritas por mais tempo.", imagemUrl: "", publicada: true, publicadoEm: new Date().toISOString() },
];
const pedido = { id: "pedido-qa", status: "ENTREGUE", entregueEm: new Date(Date.now() - (tela === "devolucao-expirada" ? 8 : 1) * 86400000).toISOString(), criadoEm: new Date().toISOString(), valorTotal: 100, pagamentos: [{ status: "APROVADO", metodo: "PIX" }], itens: [{ id: "item-qa", nomeProduto: "Anel Aurora", quantidade: 2 }], usuario: { nome: "Cliente de teste", email: "qa@example.invalid" } };
let devolucao = ["admin-devolucoes", "devolucao-chat", "notificacoes"].includes(tela) ? { id: "dev-qa", pedidoId: pedido.id, pedido, motivo: "O anel ficou maior do que o esperado.", itens: [{ itemPedidoId: "item-qa", quantidade: 1 }], status: "SOLICITADA", criadoEm: new Date().toISOString() } : null;
const mensagensChat = [{ id: "msg-1", autorTipo: "CLIENTE", autor: { nome: "Cliente teste" }, texto: "Gostaria de saber como enviar o produto.", criadoEm: new Date(Date.now() - 120000).toISOString() }, { id: "msg-2", autorTipo: "ADMIN", autor: { nome: "Equipe" }, texto: "Vamos orientar você por aqui. Qual é sua dúvida?", criadoEm: new Date(Date.now() - 60000).toISOString() }];
const avisos = [{ id: "aviso-1", titulo: "Nova mensagem na devolução", texto: "Vamos orientar você por aqui.", url: "/devolucoes-reembolso#conversa-pedido-qa", lidaEm: null, criadoEm: new Date().toISOString() }, { id: "aviso-2", titulo: "Pedido entregue", texto: "Seu pedido foi entregue.", url: "/pedidos/pedido-qa", lidaEm: null, criadoEm: new Date().toISOString() }];
window.fetch = async (url, opcoes = {}) => {
  const caminho = new URL(url, location.origin).pathname;
  const body = opcoes.body instanceof FormData ? JSON.parse(opcoes.body.get("dados") || "{}") : opcoes.body ? JSON.parse(opcoes.body) : {};
  const method = opcoes.method || "GET";
  let dados;
  if (caminho === "/notificacoes") dados = { notificacoes: avisos, naoLidas: avisos.filter(n => !n.lidaEm).length, ate: new Date().toISOString() };
  else if (caminho === "/notificacoes/lidas") { avisos.forEach(n => { if (body.ate || body.ids?.includes(n.id)) n.lidaEm = new Date().toISOString(); }); dados = { sucesso: true }; }
  else if (caminho.endsWith("/mensagens")) {
    if (method === "POST") { const m = { id: "msg-" + (mensagensChat.length + 1), autorTipo: tela === "admin-devolucoes" ? "ADMIN" : "CLIENTE", autor: { nome: "Conta de teste" }, texto: body.texto, criadoEm: new Date().toISOString() }; mensagensChat.push(m); dados = { mensagem: m }; }
    else dados = { mensagens: mensagensChat, temAnteriores: false };
  }
  else if (caminho.startsWith("/ws/")) {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (opcoes.signal?.aborted) throw new DOMException("Abortado", "AbortError");
    dados = caminho.includes("99999999") ? { erro: true } : { logradouro: "Praça da Sé", bairro: "Sé", localidade: "São Paulo", uf: "SP" };
  } else if (caminho === "/me") dados = { usuario: { id: "qa-admin", nome: "Administrador de teste", email: "admin@example.invalid", tipo: "ADMIN" } };
  else if (caminho === "/produtos" || caminho === "/admin/produtos") dados = { produtos: [{ id: "produto-qa", nome: "Anel Aurora", preco: 100, ativo: true, imagens: [{ url: "/assets/images/promocao-joia.png" }] }] };
  else if (caminho === "/devolucoes") dados = { devolucoes: devolucao ? [{ pedidoId: pedido.id }] : [] };
  else if (caminho === "/pedidos") dados = { pedidos: [pedido, { ...pedido, id: "pedido-pendente", status: "PENDENTE", criadoEm: new Date(Date.now() - 3600000).toISOString(), valorTotal: 50, pagamentos: [{ status: "PENDENTE", metodo: "PIX" }] }, { ...pedido, id: "pedido-antigo", criadoEm: new Date(Date.now() - 100 * 86400000).toISOString(), valorTotal: 250, pagamentos: [{ status: "REEMBOLSADO", metodo: "PIX" }] }] };
  else if (caminho === "/admin/devolucoes/entregas-sem-data") dados = { pedidos: [] };
  else if (caminho === "/enderecos") dados = { enderecos: [] };
  else if (caminho === "/sacola") dados = { sacola: { itens: [{ id: "sacola-qa", nome: "Anel Aurora", quantidade: 1, preco: 100, precoVenda: 100, disponivel: true }] } };
  else if (caminho === "/admin/editorial/imagens") dados = { url: "/assets/images/promocao-joia.png" };
  else if (caminho === "/admin/editorial" && method === "POST") { const p = { id: `post-${postagens.length + 1}`, ...body }; postagens.push(p); dados = { postagem: p }; }
  else if (caminho.startsWith("/admin/editorial/") && method === "PUT") { const p = postagens.find(p => caminho.endsWith(p.id)); Object.assign(p, body); dados = { postagem: p }; }
  else if (caminho === "/editorial" || caminho === "/admin/editorial") dados = { postagens };
  else if (caminho.startsWith("/editorial/")) dados = { postagem: postagens.find(p => caminho.endsWith(p.id)) };
  else if (caminho === "/admin/devolucoes") dados = { devolucoes: devolucao ? [devolucao] : [] };
  else if (caminho.startsWith("/admin/devolucoes/")) { devolucao = { ...devolucao, ...body }; dados = { devolucao }; }
  else if (caminho.startsWith("/devolucoes/")) {
    if (method === "POST") devolucao = { id: "dev-qa", status: "SOLICITADA", ...body };
    dados = { devolucao };
  } else throw new Error(`QA: requisição não simulada: ${caminho}`);
  return new Response(JSON.stringify(dados), { status: 200, headers: { "Content-Type": "application/json" } });
};
const entrada = tela === "checkout" ? { pathname: "/checkout", state: { itensSelecionados: ["sacola-qa"] } } : tela === "editorial-lista" ? "/editorial" : "/";
createRoot(document.getElementById("root")).render(<MemoryRouter initialEntries={[entrada]}>
  <div className="bg-amber-100 p-2 text-center text-xs">Verificação local — dados simulados, sem operações reais</div>
  {tela === "notificacoes" ? <Routes><Route path="/" element={<NotificacoesTeste />} /><Route path="/devolucoes-reembolso" element={<DevolucoesUser />} /></Routes> : tela === "checkout" ? <Checkout /> : tela === "admin-editorial" ? <AdminEditorial /> : tela === "admin-devolucoes" ? <AdminDevolucoes /> : tela === "perfil" ? <Routes><Route path="/" element={<PerfilUser />} /><Route path="/devolucoes-reembolso" element={<DevolucoesUser />} /></Routes> : tela === "devolucoes" ? <DevolucoesUser /> : tela === "pedidos" ? <PedidoUser /> : tela === "historico" ? <HistoricoCompras /> : tela.startsWith("devolucao") ? <div className="mx-auto max-w-3xl p-6"><DevolucaoPedido pedido={pedido} /></div> : <Routes><Route path="/" element={<div className="mx-auto max-w-xl p-6"><EditorialCarrossel /></div>} /><Route path="/editorial/:id" element={<Editorial />} /><Route path="/editorial" element={<Editorial />} /></Routes>}
</MemoryRouter>);

function NotificacoesTeste() {
 const [abertas, setAbertas] = useState(false);
 return <div className="flex justify-end p-6"><div className="relative"><NotificacoesConta usuarioId="qa-admin" abertas={abertas} onAlternar={() => setAbertas(a => !a)} onFechar={() => setAbertas(false)} /></div></div>;
}
