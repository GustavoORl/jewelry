import { prisma } from "../config/prisma.js";
import { centavos, validarTotalPagamento, falhaCheckout } from "../services/checkoutValores.js";

// Criar um novo pagamento
export async function criarPagamento(dados) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "Pedido" WHERE "id" = ${dados.pedidoId} FOR UPDATE`;
    const pedido = await tx.pedido.findUnique({ where: { id: dados.pedidoId }, include: { itens: true } });
    if (!pedido || pedido.status !== "PENDENTE" || pedido.expiraEm && pedido.expiraEm <= new Date()) throw falhaCheckout("O pedido não está disponível para pagamento.", 409);
    validarTotalPagamento(pedido);
    if (centavos(dados.valor) !== centavos(pedido.valorTotal)) throw falhaCheckout("O total do pedido mudou. Atualize a página de pagamento.", 409);
    const ativo = await tx.pagamento.findFirst({ where: { pedidoId: pedido.id, status: { in: ["PENDENTE", "PROCESSANDO", "APROVADO"] } } });
    if (ativo) throw falhaCheckout("Já existe um pagamento em andamento para este pedido.", 409);
    return tx.pagamento.create({ data: dados });
  });
}

// Buscar pagamento pelo ID interno
export async function buscarPagamentoPorId(id) {
  return prisma.pagamento.findUnique({
    where: { id },
    include: {
      pedido: true,
    },
  });
}

// Buscar pagamento pela referência externa
export async function buscarPagamentoPorReferencia(referenciaExterna) {
  return prisma.pagamento.findUnique({
    where: { referenciaExterna },
    include: {
      pedido: true,
    },
  });
}

// Buscar pagamento pela chave de idempotência
export async function buscarPagamentoPorChaveIdempotencia(
  chaveIdempotencia
) {
  return prisma.pagamento.findUnique({
    where: { chaveIdempotencia },
    include: {
      pedido: true,
    },
  });
}

// Buscar o pagamento mais recente de um pedido
export async function buscarPagamentoPorPedido(pedidoId) {
  return prisma.pagamento.findFirst({
    where: { pedidoId },
    orderBy: {
      criadoEm: "desc",
    },
  });
}

// Atualizar um pagamento
export async function atualizarPagamento(id, dados) {
  return prisma.pagamento.update({
    where: { id },
    data: dados,
  });
}
