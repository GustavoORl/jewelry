export const PRAZO_DEVOLUCAO_MS = 7 * 86400000;
export function separarPedidosDevolucao(pedidos, solicitacoes, agora = Date.now()) {
  const ids = new Set(solicitacoes.map(d => d.pedidoId));
  const elegiveis = [], solicitados = [], semData = [];
  for (const pedido of pedidos) {
    if (ids.has(pedido.id)) { solicitados.push(pedido); continue; }
    if (pedido.status !== "ENTREGUE") continue;
    if ((pedido.pagamentos || []).some(p => p.status === "REEMBOLSADO")) continue;
    const entrega = pedido.entregueEm ? new Date(pedido.entregueEm).getTime() : NaN;
    if (!Number.isFinite(entrega)) { semData.push(pedido); continue; }
    if (agora >= entrega && agora < entrega + PRAZO_DEVOLUCAO_MS) elegiveis.push(pedido);
  }
  return { elegiveis, solicitados, semData };
}
