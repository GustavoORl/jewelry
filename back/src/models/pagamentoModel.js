import { prisma } from "../config/prisma.js";

// Criar um novo pagamento
export async function criarPagamento(dados) {
  return prisma.pagamento.create({
    data: dados,
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