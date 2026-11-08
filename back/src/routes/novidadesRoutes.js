import { Router } from "express";
import multer from "multer";
import { uploadImagem } from "../middlewares/uploadMiddleware.js";
import { enviarImagem } from "../services/imagemService.js";
import { adicionarPrecosPromocionais } from "../services/promocaoPrecoService.js";
import { prisma } from "../config/prisma.js";
import { autenticar } from "../middlewares/autenticar.js";
import { criarServicoDevolucoes, postagemSchema, falha, validarFotos } from "../services/novidadesService.js";

const servico = criarServicoDevolucoes(prisma);
const fotosInclude = { fotos: { select: { id: true } } };
const receberFotos = multer({ storage: multer.memoryStorage(), limits: { files: 3, fileSize: 4 * 1024 * 1024, fields: 1, fieldSize: 20000 } }).array("fotos", 3);
const uploadSeguro = middleware => (req, res, next) => middleware(req, res, erro => erro ? res.status(400).json({ mensagem: "Confira os anexos: até 3 fotos JPG, PNG ou WebP de 4 MB cada." }) : next());
async function validarProdutos(blocos) {
  const ids = [...new Set(blocos.filter(b => b.tipo === "PRODUTO").map(b => b.produtoId))];
  if (ids.length && await prisma.produto.count({ where: { id: { in: ids } } }) !== ids.length) throw falha("Um dos produtos selecionados não está disponível. Remova ou substitua o card.");
}
async function completarPostagem(postagem) {
  const blocos = Array.isArray(postagem.blocos) ? postagem.blocos : [];
  const ids = blocos.filter(b => b.tipo === "PRODUTO").map(b => b.produtoId);
  if (!ids.length) return postagem;
  const produtos = await adicionarPrecosPromocionais(await prisma.produto.findMany({ where: { id: { in: ids }, ativo: true }, include: { imagens: { orderBy: { posicao: "asc" }, take: 1 } } }));
  return { ...postagem, blocos: blocos.map(b => b.tipo === "PRODUTO" ? { ...b, produto: produtos.find(p => p.id === b.produtoId) || null } : b) };
}
const tratar = fn => async (req, res) => {
  try { await fn(req, res); }
  catch (erro) {
    const status = erro.name === "ZodError" ? 400 : erro.code === "P2025" ? 404 : erro.status || 500;
    if (status === 500) console.error("Erro nas novidades Aurora:", erro);
    res.status(status).json({ sucesso: false, mensagem: status === 500 ? "Não foi possível concluir a operação." : erro.name === "ZodError" ? "Confira os campos e os limites informados." : erro.code === "P2025" ? "Registro não encontrado." : erro.message });
  }
};
export const editorialPublico = Router();
editorialPublico.get("/", tratar(async (_req, res) => {
  const postagens = await prisma.postagem.findMany({ where: { publicada: true }, orderBy: { publicadoEm: "desc" }, omit: { conteudo: true, blocos: true } });
  res.json({ postagens });
}));
editorialPublico.get("/:id", tratar(async (req, res) => {
  const postagem = await prisma.postagem.findFirst({ where: { id: req.params.id, publicada: true } });
  if (!postagem) throw falha("Postagem não encontrada.", 404);
  res.json({ postagem: await completarPostagem(postagem) });
}));
export const editorialAdmin = Router();
editorialAdmin.post("/imagens", uploadSeguro(uploadImagem.single("imagem")), tratar(async (req, res) => {
  if (!req.file) throw falha("Selecione uma imagem.");
  validarFotos([req.file]);
  const imagem = await enviarImagem(req.file, "editorial");
  res.status(201).json({ url: imagem.url });
}));
editorialAdmin.get("/", tratar(async (_req, res) => res.json({ postagens: await prisma.postagem.findMany({ orderBy: { criadoEm: "desc" }, take: 100 }) })));
editorialAdmin.post("/", tratar(async (req, res) => {
  const dados = postagemSchema.parse(req.body);
  await validarProdutos(dados.blocos);
  res.status(201).json({ postagem: await prisma.postagem.create({ data: { ...dados, publicadoEm: dados.publicada ? new Date() : null } }) });
}));
editorialAdmin.put("/:id", tratar(async (req, res) => {
  const dados = postagemSchema.parse(req.body);
  await validarProdutos(dados.blocos);
  const atual = await prisma.postagem.findUnique({ where: { id: req.params.id } });
  if (!atual) throw falha("Postagem não encontrada.", 404);
  res.json({ postagem: await prisma.postagem.update({ where: { id: atual.id }, data: { ...dados, publicadoEm: dados.publicada ? atual.publicadoEm || new Date() : null } }) });
}));
editorialAdmin.delete("/:id", tratar(async (req, res) => {
  await prisma.postagem.delete({ where: { id: req.params.id } });
  res.status(204).end();
}));
export const devolucoesCliente = Router();
devolucoesCliente.use(autenticar);
devolucoesCliente.get("/", tratar(async (req, res) => {
  res.json({ devolucoes: await prisma.devolucao.findMany({ where: { pedido: { usuarioId: req.usuario.id } }, select: { pedidoId: true } }) });
}));
devolucoesCliente.get("/fotos/:fotoId", tratar(async (req, res) => {
  const foto = await prisma.fotoDevolucao.findFirst({ where: { id: req.params.fotoId, ...(req.usuario.tipo === "ADMIN" ? {} : { devolucao: { pedido: { usuarioId: req.usuario.id } } }) } });
  if (!foto) throw falha("Foto não encontrada.", 404);
  res.set({ "Content-Type": foto.tipo, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" }).send(Buffer.from(foto.dados));
}));
devolucoesCliente.get("/:pedidoId", tratar(async (req, res) => {
  const pedido = await prisma.pedido.findFirst({ where: { id: req.params.pedidoId, usuarioId: req.usuario.id }, select: { id: true } });
  if (!pedido) throw falha("Pedido não encontrado.", 404);
  res.json({ devolucao: await prisma.devolucao.findUnique({ where: { pedidoId: pedido.id }, include: fotosInclude }) });
}));
devolucoesCliente.post("/:pedidoId", uploadSeguro(receberFotos), tratar(async (req, res) => {
  let dados = req.body;
  if (req.is("multipart/form-data")) {
    try { dados = JSON.parse(req.body.dados); } catch { throw falha("Dados da solicitação inválidos."); }
  }
  res.status(201).json({ devolucao: await servico.solicitar(req.usuario.id, req.params.pedidoId, dados, req.files || []) });
}));
export const devolucoesAdmin = Router();
devolucoesAdmin.get("/", tratar(async (_req, res) => res.json({ devolucoes: await prisma.devolucao.findMany({ orderBy: { criadoEm: "desc" }, include: { ...fotosInclude, pedido: { select: { itens: true, usuario: { select: { nome: true, email: true } } } } } }) })));
devolucoesAdmin.get("/entregas-sem-data", tratar(async (_req, res) => res.json({ pedidos: await prisma.pedido.findMany({ where: { status: "ENTREGUE", entregueEm: null }, select: { id: true, usuario: { select: { nome: true } } }, take: 100 }) })));
devolucoesAdmin.patch("/entrega/:pedidoId", tratar(async (req, res) => {
  const data = typeof req.body.entregueEm === "string" ? new Date(req.body.entregueEm) : new Date(NaN);
  if (!Number.isFinite(data.getTime()) || data > new Date()) throw falha("Informe uma data de entrega válida e não futura.");
  const pedido = await prisma.pedido.findUnique({ where: { id: req.params.pedidoId }, select: { criadoEm: true } });
  if (!pedido) throw falha("Pedido não encontrado.", 404);
  if (data < pedido.criadoEm) throw falha("A entrega não pode ser anterior à compra.");
  const r = await prisma.pedido.updateMany({ where: { id: req.params.pedidoId, status: "ENTREGUE", entregueEm: null }, data: { entregueEm: data } });
  if (!r.count) throw falha("A data já foi registrada ou o pedido ainda não foi entregue.", 409);
  res.json({ sucesso: true });
}));
devolucoesAdmin.patch("/:id", tratar(async (req, res) => res.json({ devolucao: await servico.atualizar(req.params.id, req.body, req.usuario) })));
