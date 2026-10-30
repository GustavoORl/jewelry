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


export async function criarPedidoComItens({
  usuarioId,
  endereco,
  itensSelecionados,
}) {
  return prisma.$transaction(async (tx) => {
    const sacola = await tx.carrinho.findUnique({
      where: {
        usuarioId,
      },
      include: {
        itens: {
          where: {
            id: {
              in: itensSelecionados,
            },
          },
        },
      },
    });

    if (!sacola || sacola.itens.length === 0) {
      const error = new Error(
        "Nenhum dos itens selecionados foi encontrado na sua sacola."
      );
      error.status = 400;
      throw error;
    }

    // Garante que todos os IDs enviados pertencem à sacola do usuário.
    if (sacola.itens.length !== itensSelecionados.length) {
      const error = new Error(
        "Um ou mais itens selecionados não pertencem à sua sacola ou não estão mais disponíveis nela."
      );
      error.status = 400;
      throw error;
    }

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
        idCarrinho: item.id,
        produtoId: produto.id,
        nomeProduto: produto.nome,
        quantidade: item.quantidade,
        precoUnitario,
      };
    });

    // Reserva o estoque de forma condicional.
    for (const item of itensPedido) {
      const resultado = await tx.produto.updateMany({
        where: {
          id: item.produtoId,
          ativo: true,
          categoria: {
            ativo: true,
          },
          estoque: {
            gte: item.quantidade,
          },
        },
        data: {
          estoque: {
            decrement: item.quantidade,
          },
        },
      });

      if (resultado.count !== 1) {
        const error = new Error(
          `Estoque insuficiente ou produto indisponível: "${item.nomeProduto}".`
        );
        error.status = 409;
        throw error;
      }
    }

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

    // Remove somente os itens que foram incluídos no pedido.
    await tx.itemCarrinho.deleteMany({
      where: {
        id: {
          in: itensPedido.map((item) => item.idCarrinho),
        },
        carrinhoId: sacola.id,
      },
    });

    return pedido;
  });
}


// Lista somente os pedidos do cliente informado.
export async function listarPedidosDoUsuario(usuarioId) {
  return prisma.pedido.findMany({
    where: {
      usuarioId,
    },
    orderBy: {
      criadoEm: "desc",
    },
    select: {
      id: true,
      status: true,
      valorTotal: true,
      criadoEm: true,
      destinatario: true,
      itens: {
        select: {
          id: true,
          nomeProduto: true,
          quantidade: true,
          precoUnitario: true,
        },
      },
    },
  });
}

// Busca os detalhes de um pedido pertencente ao cliente informado.
export async function buscarPedidoDoUsuario(usuarioId, pedidoId) {
  return prisma.pedido.findFirst({
    where: {
      id: pedidoId,
      usuarioId,
    },
    include: {
      itens: {
        select: {
          id: true,
          produtoId: true,
          nomeProduto: true,
          quantidade: true,
          precoUnitario: true,
        },
      },
    },
  });
}

// Lista todos os pedidos para o painel administrativo.
export async function listarTodosPedidos() {
  return prisma.pedido.findMany({
    orderBy: {
      criadoEm: "desc",
    },
    include: {
      usuario: {
        select: {
          nome: true,
          email: true,
        },
      },
      itens: {
        select: {
          id: true,
          produtoId: true,
          nomeProduto: true,
          quantidade: true,
          precoUnitario: true,
        },
      },
    },
  });
}

// Atualiza o status de um pedido.
export async function atualizarStatusPedido(pedidoId, novoStatus) {
  return prisma.$transaction(async (tx) => {
    const pedido = await tx.pedido.findUnique({
      where: {
        id: pedidoId,
      },
      include: {
        itens: true,
      },
    });

    if (!pedido) {
      const error = new Error("Pedido não encontrado.");
      error.status = 404;
      throw error;
    }

    if (pedido.status === novoStatus) {
      return pedido;
    }

    // Não permitimos reativar pedidos cancelados nesta etapa.
    if (pedido.status === "CANCELADO") {
      const error = new Error(
        "Não é possível alterar o status de um pedido cancelado."
      );
      error.status = 400;
      throw error;
    }

    // Se o pedido for cancelado, devolvemos o estoque reservado.
    if (novoStatus === "CANCELADO") {
      for (const item of pedido.itens) {
        await tx.produto.update({
          where: {
            id: item.produtoId,
          },
          data: {
            estoque: {
              increment: item.quantidade,
            },
          },
        });
      }
    }

    const resultado = await tx.pedido.updateMany({
      where: {
        id: pedidoId,
        status: pedido.status,
      },
      data: {
        status: novoStatus,
      },
    });

    if (resultado.count !== 1) {
      const error = new Error(
        "O pedido foi atualizado por outra operação. Atualize a página."
      );
      error.status = 409;
      throw error;
    }

    return tx.pedido.findUnique({
      where: {
        id: pedidoId,
      },
      include: {
        itens: true,
      },
    });
  });
}