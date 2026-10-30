import { prisma } from "../config/prisma.js";

const STATUS_FATURAMENTO = [
  "PAGO",
  "EM_PREPARACAO",
  "ENVIADO",
  "ENTREGUE",
];

export async function buscarIndicadores(inicio, fim) {
  const [faturamento, totalPedidos, produtosAtivos, clientes] =
    await Promise.all([
      prisma.pedido.aggregate({
        where: {
          criadoEm: { gte: inicio, lt: fim },
          status: { in: STATUS_FATURAMENTO },
        },
        _sum: { valorTotal: true },
      }),

      prisma.pedido.count({
        where: {
          criadoEm: { gte: inicio, lt: fim },
        },
      }),

      prisma.produto.count({
        where: { ativo: true },
      }),

      prisma.usuario.count({
        where: {
          tipo: "CLIENTE",
          ativo: true,
        },
      }),
    ]);

  return {
    faturamento: Number(faturamento._sum.valorTotal ?? 0),
    totalPedidos,
    produtosAtivos,
    clientes,
  };
}

export async function buscarPedidosRecentes(inicio, fim) {
  return prisma.pedido.findMany({
    where: {
      criadoEm: { gte: inicio, lt: fim },
    },
    orderBy: { criadoEm: "desc" },
    take: 5,
    select: {
      id: true,
      status: true,
      valorTotal: true,
      criadoEm: true,
      destinatario: true,
      usuario: {
        select: {
          nome: true,
          email: true,
        },
      },
    },
  });
}

export async function buscarPedidosPorStatus(inicio, fim) {
  const agrupados = await prisma.pedido.groupBy({
    by: ["status"],
    where: {
      criadoEm: { gte: inicio, lt: fim },
    },
    _count: { _all: true },
  });

  return agrupados.map((item) => ({
    status: item.status,
    quantidade: item._count._all,
  }));
}

export async function buscarProdutosMaisVendidos(inicio, fim) {
  const itens = await prisma.itemPedido.findMany({
    where: {
      pedido: {
        criadoEm: { gte: inicio, lt: fim },
        status: { in: STATUS_FATURAMENTO },
      },
    },
    select: {
      produtoId: true,
      nomeProduto: true,
      quantidade: true,
      precoUnitario: true,
    },
  });

  const agrupados = new Map();

  for (const item of itens) {
    const atual = agrupados.get(item.produtoId) ?? {
      produtoId: item.produtoId,
      nome: item.nomeProduto,
      quantidadeVendida: 0,
      faturamento: 0,
    };

    atual.quantidadeVendida += item.quantidade;
    atual.faturamento +=
      Number(item.precoUnitario) * item.quantidade;

    agrupados.set(item.produtoId, atual);
  }

  return [...agrupados.values()]
    .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida)
    .slice(0, 5)
    .map((item) => ({
      ...item,
      faturamento: Number(item.faturamento.toFixed(2)),
    }));
}

export async function buscarVendasPorDia(inicio, fim) {
  const pedidos = await prisma.pedido.findMany({
    where: {
      criadoEm: { gte: inicio, lt: fim },
      status: { in: STATUS_FATURAMENTO },
    },
    select: {
      criadoEm: true,
      valorTotal: true,
    },
  });

  const vendas = new Map();

  for (const pedido of pedidos) {
    const data = pedido.criadoEm.toISOString().slice(0, 10);

    vendas.set(
      data,
      (vendas.get(data) ?? 0) + Number(pedido.valorTotal)
    );
  }

  return [...vendas.entries()]
    .map(([data, valor]) => ({
      data,
      valor: Number(valor.toFixed(2)),
    }))
    .sort((a, b) => a.data.localeCompare(b.data));
}