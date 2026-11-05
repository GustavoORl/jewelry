import { prisma } from "../config/prisma.js";
import { adicionarPrecosPromocionais } from "../services/promocaoPrecoService.js";

/**
 * =========================================
 * BUSCAR SACOLA PARA CRIAÇÃO DO PEDIDO
 * =========================================
 */

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


/**
 * =========================================
 * CRIAR PEDIDO
 * =========================================
 */


export async function criarPedidoComItens({
    usuarioId,
    endereco,
    itensSelecionados,
}) {
    return prisma.$transaction(async (tx) => {
        /**
         * ---------------------------------------
         * 1. BUSCAR ITENS SELECIONADOS
         * ---------------------------------------
         */

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

        /**
         * Garante que todos os IDs enviados
         * realmente pertencem à sacola.
         */

        if (
            sacola.itens.length !==
            itensSelecionados.length
        ) {
            const error = new Error(
                "Um ou mais itens selecionados não pertencem à sua sacola ou não estão mais disponíveis nela."
            );

            error.status = 400;
            throw error;
        }

        /**
         * ---------------------------------------
         * 2. BUSCAR PRODUTOS
         * ---------------------------------------
         */

        const produtos = await tx.produto.findMany({
            where: {
                id: {
                    in: sacola.itens.map(
                        (item) => item.produtoId
                    ),
                },
            },

            include: {
                categoria: true,
            },
        });

        if (
            produtos.length !==
            sacola.itens.length
        ) {
            const error = new Error(
                "Um ou mais produtos não estão mais disponíveis."
            );

            error.status = 400;
            throw error;
        }

        /**
         * ---------------------------------------
         * 3. APLICAR PROMOÇÕES
         * ---------------------------------------
         *
         * Reutilizamos o serviço de promoções
         * utilizado pela listagem e pela sacola.
         *
         * O segundo argumento (tx) garante que
         * a consulta aconteça dentro da transação.
         */

        const produtosComPromocao =
            await adicionarPrecosPromocionais(
                produtos,
                tx
            );

        const produtosPorId = new Map(
            produtosComPromocao.map(
                (produto) => [
                    produto.id,
                    produto,
                ]
            )
        );

        /**
         * ---------------------------------------
         * 4. CALCULAR PEDIDO
         * ---------------------------------------
         */

        let totalCentavos = 0;

        const itensPedido = sacola.itens.map(
            (item) => {
                const produto =
                    produtosPorId.get(
                        item.produtoId
                    );

                if (
                    !produto ||
                    !produto.ativo ||
                    !produto.categoria?.ativo ||
                    produto.estoque < item.quantidade ||
                    !Number.isInteger(item.quantidade) ||
                    item.quantidade < 1
                ) {
                    const error = new Error(
                        `O produto "${produto?.nome ?? "selecionado"}" não está disponível na quantidade solicitada.`
                    );

                    error.status = 400;
                    throw error;
                }

                /**
                 * PREÇO ORIGINAL
                 */

                const precoOriginalCentavos =
                    Math.round(
                        Number(produto.preco) * 100
                    );

                if (
                    !Number.isSafeInteger(
                        precoOriginalCentavos
                    ) ||
                    precoOriginalCentavos < 0
                ) {
                    const error = new Error(
                        `O produto "${produto.nome}" possui um preço inválido.`
                    );

                    error.status = 400;
                    throw error;
                }

                /**
                 * PREÇO PROMOCIONAL
                 */

                const precoPromocionalCentavos =
                    Math.round(
                        Number(
                            produto.precoPromocional
                        ) * 100
                    );

                const promocaoValida =
                    produto.emPromocao === true &&
                    Number.isSafeInteger(
                        precoPromocionalCentavos
                    ) &&
                    precoPromocionalCentavos >= 0 &&
                    precoPromocionalCentavos <
                        precoOriginalCentavos;

                /**
                 * PREÇO FINAL DE VENDA
                 */

                const precoUnitarioCentavos =
                    promocaoValida
                        ? precoPromocionalCentavos
                        : precoOriginalCentavos;

                /**
                 * SUBTOTAL DO ITEM
                 */

                const subtotalCentavos =
                    precoUnitarioCentavos *
                    item.quantidade;

                if (
                    !Number.isSafeInteger(
                        subtotalCentavos
                    )
                ) {
                    const error = new Error(
                        `Não foi possível calcular o subtotal do produto "${produto.nome}".`
                    );

                    error.status = 400;
                    throw error;
                }

                totalCentavos += subtotalCentavos;

                if (
                    !Number.isSafeInteger(
                        totalCentavos
                    )
                ) {
                    const error = new Error(
                        "O valor total do pedido ultrapassa o limite permitido."
                    );

                    error.status = 400;
                    throw error;
                }

                const precoUnitario =
                    precoUnitarioCentavos / 100;

                return {
                    idCarrinho:
                        item.id,

                    produtoId:
                        produto.id,

                    nomeProduto:
                        produto.nome,

                    quantidade:
                        item.quantidade,

                    precoUnitario,
                };
            }
        );

        /**
         * ---------------------------------------
         * 5. RESERVAR ESTOQUE
         * ---------------------------------------
         *
         * updateMany permite uma atualização
         * condicional, garantindo:
         *
         * estoque >= quantidade
         *
         * Isso reduz problemas de concorrência.
         */

        for (const item of itensPedido) {
            const resultado =
                await tx.produto.updateMany({
                    where: {
                        id:
                            item.produtoId,

                        ativo:
                            true,

                        categoria: {
                            ativo:
                                true,
                        },

                        estoque: {
                            gte:
                                item.quantidade,
                        },
                    },

                    data: {
                        estoque: {
                            decrement:
                                item.quantidade,
                        },
                    },
                });

            if (
                resultado.count !== 1
            ) {
                const error = new Error(
                    `Estoque insuficiente ou produto indisponível: "${item.nomeProduto}".`
                );

                error.status = 409;
                throw error;
            }
        }

        /**
         * ---------------------------------------
         * 6. CRIAR PEDIDO
         * ---------------------------------------
         *
         * O estoque ficará reservado durante
         * o prazo para conclusão do pagamento.
         */

        const TEMPO_PAGAMENTO_MINUTOS = 30;

        const expiraEm = new Date(
            Date.now() +
            TEMPO_PAGAMENTO_MINUTOS * 60 * 1000
        );

        const pedido =
            await tx.pedido.create({
                data: {
                    usuarioId,

                    status: "PENDENTE",

                    expiraEm,

                    /**
                     * Valor total com promoções.
                     */

                    valorTotal:
                        (totalCentavos / 100).toFixed(2),

                    destinatario:
                        endereco.destinatario,

                    cepEntrega:
                        endereco.cep,

                    ruaEntrega:
                        endereco.rua,

                    numeroEntrega:
                        endereco.numero,

                    complementoEntrega:
                        endereco.complemento || null,

                    bairroEntrega:
                        endereco.bairro,

                    cidadeEntrega:
                        endereco.cidade,

                    estadoEntrega:
                        endereco.estado,

                    /**
                     * Registra o preço efetivo
                     * de cada produto no pedido.
                     */

                    itens: {
                        create:
                            itensPedido.map(
                                (item) => ({
                                    produtoId:
                                        item.produtoId,

                                    nomeProduto:
                                        item.nomeProduto,

                                    quantidade:
                                        item.quantidade,

                                    precoUnitario:
                                        item.precoUnitario.toFixed(2),
                                })
                            ),
                    },
                },

                include: {
                    itens: true,
                },
            });

        /**
         * ---------------------------------------
         * 7. REMOVER ITENS DA SACOLA
         * ---------------------------------------
         *
         * Remove somente os itens utilizados
         * neste pedido.
         */

        await tx.itemCarrinho.deleteMany({
            where: {
                id: {
                    in:
                        itensPedido.map(
                            (item) =>
                                item.idCarrinho
                        ),
                },

                carrinhoId:
                    sacola.id,
            },
        });

        /**
         * ---------------------------------------
         * 8. RETORNAR PEDIDO
         * ---------------------------------------
         */

        return pedido;
    });
}


/**
 * =========================================
 * LISTAR PEDIDOS DO CLIENTE
 * =========================================
 */

export async function listarPedidosDoUsuario(
  usuarioId
) {
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

      expiraEm: true,

      destinatario: true,


      /**
       * Itens do pedido.
       *
       * Além dos dados salvos no momento da compra,
       * buscamos a primeira imagem atual do produto
       * e seu slug.
       */
      itens: {
        select: {
          id: true,

          produtoId: true,

          nomeProduto: true,

          quantidade: true,

          precoUnitario: true,

          produto: {
            select: {
              slug: true,

              imagens: {
                orderBy: {
                  posicao: "asc",
                },

                take: 1,

                select: {
                  url: true,

                  textoAlternativo: true,
                },
              },
            },
          },
        },
      },


      /**
       * Retornamos também os pagamentos
       * para que a interface possa conhecer
       * a situação financeira do pedido.
       */
      pagamentos: {
        orderBy: {
          criadoEm: "desc",
        },

        select: {
          id: true,

          metodo: true,

          status: true,

          valor: true,

          criadoEm: true,
        },
      },
    },
  });
}


/**
 * =========================================
 * BUSCAR DETALHES DO PEDIDO DO CLIENTE
 * =========================================
 */

export async function buscarPedidoDoUsuario(
  usuarioId,
  pedidoId
) {
  return prisma.pedido.findFirst({
    where: {
      id:
        pedidoId,

      usuarioId,
    },


    include: {
      itens: {
        select: {
          id: true,

          produtoId:
            true,

          nomeProduto:
            true,

          quantidade:
            true,

          precoUnitario:
            true,


          /**
           * Usado pelo PedidoDetalhado.jsx
           * para exibir imagem e link.
           */

          produto: {
            select: {
              slug: true,

              imagens: {
                orderBy: {
                  posicao:
                    "asc",
                },

                take:
                  1,

                select: {
                  url:
                    true,

                  textoAlternativo:
                    true,
                },
              },
            },
          },
        },
      },


      /**
       * Necessário para mostrar o método
       * e status do pagamento.
       */

      pagamentos: {
        orderBy: {
          criadoEm:
            "desc",
        },

        select: {
          id: true,

          metodo: true,

          status: true,

          valor: true,

          criadoEm: true,
        },
      },
    },
  });
}


/**
 * =========================================
 * BUSCAR PEDIDO POR ID
 * =========================================
 *
 * Uso interno/administrativo.
 *
 * Diferente de buscarPedidoDoUsuario(),
 * esta função não recebe usuarioId.
 *
 * Ela é utilizada pelo service para descobrir
 * o status verdadeiro que está no banco antes
 * de permitir uma transição administrativa.
 */

export async function buscarPedidoPorId(
  pedidoId
) {
  return prisma.pedido.findUnique({
    where: {
      id:
        pedidoId,
    },


    select: {
      id: true,

      status: true,

      valorTotal: true,

      criadoEm: true,

      atualizadoEm: true,
    },
  });
}


/**
 * =========================================
 * LISTAR TODOS OS PEDIDOS
 * PAINEL ADMINISTRATIVO
 * =========================================
 */

export async function listarTodosPedidos() {
  return prisma.pedido.findMany({
    orderBy: {
      criadoEm:
        "desc",
    },


    include: {
      /**
       * Cliente
       */

      usuario: {
        select: {
          nome:
            true,

          email:
            true,
        },
      },


      /**
       * Produtos
       */

      itens: {
        select: {
          id:
            true,

          produtoId:
            true,

          nomeProduto:
            true,

          quantidade:
            true,

          precoUnitario:
            true,
        },
      },


      /**
       * Pagamentos
       *
       * Utilizado pelo modal do AdminPedidos.
       */

      pagamentos: {
        orderBy: {
          criadoEm:
            "desc",
        },

        select: {
          id:
            true,

          metodo:
            true,

          status:
            true,

          valor:
            true,

          criadoEm:
            true,
        },
      },
    },
  });
}


/**
 * =========================================
 * ATUALIZAR STATUS DO PEDIDO
 * =========================================
 *
 * A validação das transições:
 *
 * PAGO
 *   ↓
 * EM_PREPARACAO
 *   ↓
 * ENVIADO
 *   ↓
 * ENTREGUE
 *
 * é feita no pedidoService.
 *
 *
 * Este model ainda possui proteções próprias
 * para concorrência e cancelamento.
 */

export async function atualizarStatusPedido(
  pedidoId,
  novoStatus
) {
  return prisma.$transaction(
    async (tx) => {
      /**
       * -------------------------------------
       * 1. BUSCAR PEDIDO
       * -------------------------------------
       */

      const pedido =
        await tx.pedido.findUnique({
          where: {
            id:
              pedidoId,
          },

          include: {
            itens:
              true,
          },
        });


      if (!pedido) {
        const error =
          new Error(
            "Pedido não encontrado."
          );

        error.status =
          404;

        throw error;
      }


      /**
       * -------------------------------------
       * 2. MESMO STATUS
       * -------------------------------------
       */

      if (
        pedido.status ===
        novoStatus
      ) {
        return pedido;
      }


      /**
       * -------------------------------------
       * 3. PEDIDO CANCELADO
       * -------------------------------------
       */

      if (
        pedido.status ===
        "CANCELADO"
      ) {
        const error =
          new Error(
            "Não é possível alterar o status de um pedido cancelado."
          );

        error.status =
          400;

        throw error;
      }


      /**
       * -------------------------------------
       * 4. CANCELAMENTO
       * -------------------------------------
       *
       * Esta lógica será útil quando
       * implementarmos cancelamento.
       *
       * Ao cancelar, devolvemos o estoque
       * reservado.
       */

      if (
        novoStatus ===
        "CANCELADO"
      ) {
        for (
          const item of
          pedido.itens
        ) {
          await tx.produto.update({
            where: {
              id:
                item.produtoId,
            },

            data: {
              estoque: {
                increment:
                  item.quantidade,
              },
            },
          });
        }
      }


      /**
       * -------------------------------------
       * 5. ATUALIZAÇÃO CONDICIONAL
       * -------------------------------------
       *
       * Além das regras do service, fazemos
       * uma proteção contra concorrência.
       *
       * Exemplo:
       *
       * requisição A lê: PAGO
       * requisição B lê: PAGO
       *
       * A atualiza:
       * PAGO -> EM_PREPARACAO
       *
       * Quando B tentar atualizar usando
       * status = PAGO, count será 0.
       */

      const resultado =
        await tx.pedido.updateMany({
          where: {
            id:
              pedidoId,

            status:
              pedido.status,
          },

          data: {
            status:
              novoStatus,
          },
        });


      if (
        resultado.count !== 1
      ) {
        const error =
          new Error(
            "O pedido foi atualizado por outra operação. Atualize a página e tente novamente."
          );

        error.status =
          409;

        throw error;
      }


      /**
       * -------------------------------------
       * 6. RETORNAR PEDIDO ATUALIZADO
       * -------------------------------------
       *
       * Retornamos as mesmas informações
       * utilizadas pelo painel administrativo.
       */

      return tx.pedido.findUnique({
        where: {
          id:
            pedidoId,
        },


        include: {
          usuario: {
            select: {
              nome:
                true,

              email:
                true,
            },
          },


          itens: {
            select: {
              id:
                true,

              produtoId:
                true,

              nomeProduto:
                true,

              quantidade:
                true,

              precoUnitario:
                true,
            },
          },


          pagamentos: {
            orderBy: {
              criadoEm:
                "desc",
            },

            select: {
              id:
                true,

              metodo:
                true,

              status:
                true,

              valor:
                true,

              criadoEm:
                true,
            },
          },
        },
      });
    }
  );
}

/**
 * =========================================
 * EXPIRAR PEDIDO PENDENTE
 * =========================================
 *
 * Cancela um pedido somente se:
 *
 * - ainda estiver PENDENTE;
 * - possuir prazo de expiração;
 * - o prazo já tiver terminado.
 *
 * Se o pagamento tiver sido aprovado antes
 * desta operação, o status já será PAGO e
 * nenhuma alteração será realizada.
 */

export async function expirarPedidoPendente(
  pedidoId
) {
  return prisma.$transaction(
    async (tx) => {
      const agora =
        new Date();


      /**
       * Primeiro tentamos assumir o direito
       * de cancelar o pedido.
       *
       * A alteração só acontece se o pedido
       * AINDA estiver PENDENTE e vencido.
       */

      const resultado =
        await tx.pedido.updateMany({
          where: {
            id:
              pedidoId,

            status:
              "PENDENTE",

            expiraEm: {
              not:
                null,

              lte:
                agora,
            },
          },

          data: {
            status:
              "CANCELADO",
          },
        });


      /**
       * count === 0 significa que:
       *
       * - o pedido já foi pago;
       * - já foi cancelado;
       * - ainda não venceu;
       * - ou não existe.
       *
       * Em qualquer desses casos não
       * devolvemos estoque.
       */

      if (
        resultado.count !== 1
      ) {
        return null;
      }


      /**
       * Como conseguimos alterar
       * PENDENTE -> CANCELADO,
       * agora podemos devolver o estoque.
       */

      const pedido =
        await tx.pedido.findUnique({
          where: {
            id:
              pedidoId,
          },

          include: {
            itens:
              true,
          },
        });


      if (!pedido) {
        throw new Error(
          "Pedido não encontrado após a expiração."
        );
      }


      for (
        const item of pedido.itens
      ) {
        await tx.produto.update({
          where: {
            id:
              item.produtoId,
          },

          data: {
            estoque: {
              increment:
                item.quantidade,
            },
          },
        });
      }


      return pedido;
    }
  );
}


/**
 * =========================================
 * BUSCAR PEDIDOS PENDENTES VENCIDOS
 * =========================================
 */

export async function buscarPedidosPendentesVencidos() {
  return prisma.pedido.findMany({
    where: {
      status:
        "PENDENTE",

      expiraEm: {
        not:
          null,

        lte:
          new Date(),
      },
    },

    select: {
      id:
        true,

      expiraEm:
        true,
    },
  });
}

/**
 * =========================================
 * ATUALIZAR ENDEREÇO DO PEDIDO
 * =========================================
 */
export async function atualizarEnderecoDoPedido({
  usuarioId,
  pedidoId,
  endereco,
}) {
  return prisma.$transaction(async (tx) => {
    // 1. BUSCAR PEDIDO DO USUÁRIO

    const pedido = await tx.pedido.findFirst({
      where: {
        id: pedidoId,
        usuarioId,
      },

      select: {
        id: true,
        usuarioId: true,
        status: true,
        expiraEm: true,
      },
    });

    if (!pedido) {
      const error = new Error("Pedido não encontrado.");
      error.status = 404;
      throw error;
    }

    // 2. VERIFICAR STATUS

    if (pedido.status !== "PENDENTE") {
      const error = new Error(
        "Somente pedidos pendentes podem ter o endereço alterado."
      );

      error.status = 409;
      throw error;
    }

    // 3. VERIFICAR EXPIRAÇÃO

    const agora = new Date();

    if (
      pedido.expiraEm &&
      pedido.expiraEm <= agora
    ) {
      const error = new Error(
        "O prazo de pagamento deste pedido expirou."
      );

      error.status = 409;
      throw error;
    }

    // 4. ATUALIZAÇÃO CONDICIONAL
    //
    // Confere novamente o status, o proprietário
    // e o prazo na operação de escrita.

    const resultado = await tx.pedido.updateMany({
      where: {
        id: pedidoId,
        usuarioId,
        status: "PENDENTE",

        OR: [
          { expiraEm: null },
          { expiraEm: { gt: new Date() } },
        ],
      },

      data: {
        destinatario: endereco.destinatario,

        cepEntrega: endereco.cep,

        ruaEntrega: endereco.rua,

        numeroEntrega: endereco.numero,

        complementoEntrega:
          endereco.complemento || null,

        bairroEntrega: endereco.bairro,

        cidadeEntrega: endereco.cidade,

        estadoEntrega: endereco.estado,
      },
    });

    if (resultado.count !== 1) {
      const error = new Error(
        "O pedido foi atualizado, pago ou expirou durante a operação. Atualize a página e tente novamente."
      );

      error.status = 409;
      throw error;
    }

    // 5. RETORNAR PEDIDO ATUALIZADO

    return tx.pedido.findFirst({
      where: {
        id: pedidoId,
        usuarioId,
      },

      include: {
        itens: true,
      },
    });
  });
}