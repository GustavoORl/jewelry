const diaBrasil = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" });
export function compraConcluida(pedido) {
  return ["ENTREGUE", "CANCELADO", "REEMBOLSADO"].includes(pedido.status)
    || (pedido.pagamentos || []).some(p => p.status === "REEMBOLSADO");
}
export function intervaloPeriodo(periodo, inicio, fim, agora = new Date()) {
  if (periodo === "PERSONALIZADO") return { inicio, fim };
  if (periodo === "TODOS") return {};
  const hoje = diaBrasil.format(agora);
  const data = new Date(`${hoje}T12:00:00Z`);
  data.setUTCDate(data.getUTCDate() - Number(periodo) + 1);
  return { inicio: data.toISOString().slice(0, 10), fim: hoje };
}
export function filtrarHistorico(pedidos, { periodo = "TODOS", inicio = "", fim = "", agora } = {}) {
  const intervalo = intervaloPeriodo(periodo, inicio, fim, agora);
  if (intervalo.inicio && intervalo.fim && intervalo.inicio > intervalo.fim) return [];
  return pedidos.filter(p => {
    const data = new Date(p.criadoEm);
    if (!compraConcluida(p) || !Number.isFinite(data.getTime())) return false;
    const dia = diaBrasil.format(data);
    return (!intervalo.inicio || dia >= intervalo.inicio) && (!intervalo.fim || dia <= intervalo.fim);
  }).sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
}
export function filtrarPedidos(pedidos, { status = "TODOS", ordem = "RECENTES" } = {}) {
  return pedidos.filter(p => status === "TODOS" || p.status === status).sort((a, b) => {
    if (ordem === "MAIOR_VALOR") return Number(b.valorTotal) - Number(a.valorTotal);
    if (ordem === "MENOR_VALOR") return Number(a.valorTotal) - Number(b.valorTotal);
    const diferenca = new Date(b.criadoEm) - new Date(a.criadoEm);
    return ordem === "ANTIGOS" ? -diferenca : diferenca;
  });
}
