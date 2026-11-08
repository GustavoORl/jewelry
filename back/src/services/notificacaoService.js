export async function notificar(db, usuarioId, evento) {
  const data = { ...evento, usuarioId, chave: `${evento.chave}:${usuarioId}` };
  return db.notificacao.upsert({ where: { chave: data.chave }, create: data, update: {} });
}
export async function notificarAdmins(db, evento) {
  const admins = await db.usuario.findMany({ where: { tipo: "ADMIN", ativo: true }, select: { id: true } });
  if (!admins.length) return;
  await db.notificacao.createMany({ data: admins.map(a => ({ ...evento, usuarioId: a.id, chave: `${evento.chave}:${a.id}` })), skipDuplicates: true });
}
const statusPedido = { PENDENTE: "Pedido recebido", PAGO: "Pagamento confirmado", EM_PREPARACAO: "Pedido em preparação", ENVIADO: "Pedido enviado", ENTREGUE: "Pedido entregue", CANCELADO: "Pedido cancelado" };
export async function notificarStatusPedido(db, pedido) {
  if (!statusPedido[pedido.status]) return;
  return notificar(db, pedido.usuarioId, { chave: `pedido:${pedido.id}:${pedido.status}`, titulo: statusPedido[pedido.status], texto: `Há uma atualização no pedido #${pedido.id.slice(-8).toUpperCase()}.`, url: `/pedidos/${pedido.id}` });
}
// Também contempla confirmações de pagamento/webhooks e pedidos anteriores à implantação.
export async function sincronizarPedidos(db, usuarioId) {
  const pedidos = await db.pedido.findMany({ where: { usuarioId, atualizadoEm: { gte: new Date(Date.now() - 30 * 86400000) } }, orderBy: { atualizadoEm: "desc" }, take: 100, select: { id: true, usuarioId: true, status: true, pagamentos: { where: { status: "REEMBOLSADO" }, select: { id: true } } } });
  const eventos = [];
  for (const pedido of pedidos) {
    if (statusPedido[pedido.status]) eventos.push({ usuarioId, chave: `pedido:${pedido.id}:${pedido.status}:${usuarioId}`, titulo: statusPedido[pedido.status], texto: `Há uma atualização no pedido #${pedido.id.slice(-8).toUpperCase()}.`, url: `/pedidos/${pedido.id}` });
    for (const pagamento of pedido.pagamentos) eventos.push({ usuarioId, chave: `reembolso:${pagamento.id}:${usuarioId}`, titulo: "Pagamento reembolsado", texto: `O reembolso do pedido #${pedido.id.slice(-8).toUpperCase()} foi registrado.`, url: "/historico-compras" });
  }
  if (eventos.length) await db.notificacao.createMany({ data: eventos, skipDuplicates: true });
}
