export function falhaCheckout(mensagem, status = 400) { return Object.assign(new Error(mensagem), { status }); }
export function centavos(valor) {
  if (valor == null || valor === "" || !Number.isFinite(Number(valor))) throw falhaCheckout("Valor monetário inválido.");
  const n = Math.round(Number(valor) * 100);
  if (!Number.isSafeInteger(n) || n < 0 || n > 9999999999) throw falhaCheckout("Valor monetário fora do limite permitido.");
  return n;
}
export function precificarItens(itens, produtos) {
  const mapa = new Map(produtos.map(p => [p.id, p]));
  let totalCentavos = 0;
  const itensPedido = itens.map(item => {
    const p = mapa.get(item.produtoId);
    if (!p?.ativo || !p.categoria?.ativo || !Number.isInteger(item.quantidade) || item.quantidade < 1 || p.estoque < item.quantidade) throw falhaCheckout(`O produto "${p?.nome || "selecionado"}" não está disponível na quantidade solicitada.`);
    const original = centavos(p.preco);
    const promocional = p.precoPromocional == null ? original : centavos(p.precoPromocional);
    const unitario = p.emPromocao === true && promocional < original ? promocional : original;
    totalCentavos += unitario * item.quantidade;
    if (!Number.isSafeInteger(totalCentavos) || totalCentavos > 9999999999) throw falhaCheckout("O valor do pedido ultrapassa o limite permitido.");
    return { idCarrinho: item.id, produtoId: p.id, nomeProduto: p.nome, quantidade: item.quantidade, precoUnitario: unitario / 100, precoOriginal: original / 100 };
  });
  return { itensPedido, totalCentavos };
}
export function subtotalHistorico(itens) {
  const total = itens.reduce((s, i) => {
    if (!Number.isInteger(i.quantidade) || i.quantidade < 1) throw falhaCheckout("Quantidade inválida no pedido.");
    return s + centavos(i.precoUnitario) * i.quantidade;
  }, 0);
  if (!Number.isSafeInteger(total) || total > 9999999999) throw falhaCheckout("Total inválido no pedido.");
  return total;
}
export function validarTotalPagamento(pedido) {
  const subtotal = subtotalHistorico(pedido.itens);
  if (subtotal !== centavos(pedido.valorTotal)) throw falhaCheckout("Os valores do pedido estão inconsistentes. Revise o pedido antes de pagar.", 409);
  return pedido.valorTotal;
}
