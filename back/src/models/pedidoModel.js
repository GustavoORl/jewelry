
import { prisma } from "../config/prisma.js";

export async function buscarSacolaParaPedido(usuarioId) {
  return prisma.carrinho.findUnique({
    where: {
      usuarioId,
    },
    include: {
      itens: {
        include: {
          produto: {
            include: {
              categoria: true,
            },
          },
        },
      },
    },
  });
}

export async function criarPedidoComItens({ usuarioId, endereco }) {
  return prisma.$transaction(async (tx) => {
    // Consulta a sacola dentro da transação.
    const sacola = await tx.carrinho.findUnique({
      where: {
        usuarioId,
      },
      include: {
        itens: true,
      },
    });

    if (!sacola || sacola.itens.length === 0) {
      const error = new Error("Sua sacola está vazia.");
      error.status = 400;
      throw error;
    }

    // Revalida os produtos e utiliza os preços do banco.
    const produtos = await tx.produto.findMany({
      where: {
        id: {
          in: sacola.itens.map((item) => item.produtoId),
        },
      },
      include: {
        categoria: true,
      },
    });

    if (produtos.length !== sacola.itens.length) {
      const error = new Error(
        "Um ou mais produtos não estão mais disponíveis."
      );
      error.status = 400;
      throw error;
    }

    const produtosPorId = new Map(
      produtos.map((produto) => [produto.id, produto])
    );

    let totalCalculado = 0;

    const itensPedido = sacola.itens.map((item) => {
      const produto = produtosPorId.get(item.produtoId);

      if (
        !produto ||
        !produto.ativo ||
        !produto.categoria.ativo ||
        produto.estoque < item.quantidade
      ) {
        const error = new Error(
          `O produto "${produto?.nome ?? "selecionado"}" não está disponível na quantidade solicitada.`
        );
        error.status = 400;
        throw error;
      }

      const precoUnitario = Number(produto.preco);

      totalCalculado += precoUnitario * item.quantidade;

      return {
        produtoId: produto.id,
        nomeProduto: produto.nome,
        quantidade: item.quantidade,
        precoUnitario,
      };
    });

    // Cria o pedido e seus itens.
    const pedido = await tx.pedido.create({
      data: {
        usuarioId,
        status: "PENDENTE",
        valorTotal: totalCalculado.toFixed(2),

        destinatario: endereco.destinatario,
        cepEntrega: endereco.cep,
        ruaEntrega: endereco.rua,
        numeroEntrega: endereco.numero,
        complementoEntrega: endereco.complemento || null,
        bairroEntrega: endereco.bairro,
        cidadeEntrega: endereco.cidade,
        estadoEntrega: endereco.estado,

        itens: {
          create: itensPedido.map((item) => ({
            produtoId: item.produtoId,
            nomeProduto: item.nomeProduto,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario.toFixed(2),
          })),
        },
      },
      include: {
        itens: true,
      },
    });

    // Limpa a sacola somente após criar o pedido.
    // Os itens do pedido permanecem salvos em ItemPedido.
    await tx.itemCarrinho.deleteMany({
      where: {
        carrinhoId: sacola.id,
      },
    });

    return pedido;
  });
}
