import { randomUUID } from "node:crypto";
import { validarTotalPagamento } from "./checkoutValores.js";

import { prisma } from "../config/prisma.js";

import {
  criarPagamento,
  atualizarPagamento,
} from "../models/pagamentoModel.js";

const MERCADO_PAGO_API =
  "https://api.mercadopago.com";

/**
 * =========================================
 * ACCESS TOKEN
 * =========================================
 */

function obterAccessToken() {
  const accessToken =
    process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      "MERCADO_PAGO_ACCESS_TOKEN não configurado."
    );
  }

  return accessToken;
}

/**
 * =========================================
 * UTILITÁRIOS HTTP
 * =========================================
 */

async function lerRespostaJson(resposta) {
  const texto =
    await resposta.text();

  if (!texto) {
    return {};
  }

  try {
    return JSON.parse(texto);
  } catch {
    throw new Error(
      "O Mercado Pago retornou uma resposta inválida."
    );
  }
}

function criarErroMercadoPago(
  resposta,
  resultado,
  mensagemPadrao
) {
  const erro = new Error(
    resultado?.message ||
    resultado?.error ||
    mensagemPadrao
  );

  erro.status =
    resposta.status;

  erro.detalhes =
    resultado;

  return erro;
}

/**
 * =========================================
 * SANITIZAÇÃO
 * =========================================
 */

function sanitizarObjeto(valor) {
  if (
    valor == null ||
    typeof valor !== "object"
  ) {
    return valor;
  }

  const copia =
    structuredClone(valor);

  function limpar(objeto) {
    if (
      objeto == null ||
      typeof objeto !== "object"
    ) {
      return;
    }

    for (
      const chave of Object.keys(objeto)
    ) {
      if (
        [
          "token",
          "security_code",
          "cvv",
          "card_number",
        ].includes(chave)
      ) {
        objeto[chave] =
          "[REMOVIDO]";

        continue;
      }

      limpar(objeto[chave]);
    }
  }

  limpar(copia);

  return copia;
}

/**
 * =========================================
 * CRIAR ORDER
 * =========================================
 *
 * PIX e crédito passam agora por:
 *
 * POST /v1/orders
 */

async function criarOrderMercadoPago(
  dados,
  chaveIdempotencia
) {
  const accessToken =
    obterAccessToken();

  const resposta =
    await fetch(
      `${MERCADO_PAGO_API}/v1/orders`,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",

          Accept:
            "application/json",

          "X-Idempotency-Key":
            chaveIdempotencia,
        },

        body:
          JSON.stringify(dados),
      }
    );

  const resultado =
    await lerRespostaJson(
      resposta
    );


  /**
   * =========================================
   * ORDER CRIADA, MAS TRANSAÇÃO FALHOU
   * =========================================
   *
   * A Orders API pode responder HTTP 402
   * quando a Order foi criada corretamente,
   * mas uma das transações falhou.
   *
   * Exemplo:
   *
   * {
   *   "errors": [
   *     {
   *       "code": "failed",
   *       "details": [
   *         "PAY...: insufficient_amount"
   *       ]
   *     }
   *   ],
   *
   *   "data": {
   *     "id": "ORD...",
   *     "status": "failed",
   *     ...
   *   }
   * }
   *
   * Nesse cenário NÃO devemos lançar
   * exception.
   *
   * A Order existe e precisa ser persistida
   * normalmente para que nosso sistema
   * registre o pagamento como RECUSADO.
   */

  let order =
    resultado;


  if (
    resposta.status === 402 &&
    resultado?.data?.id
  ) {
    order =
      resultado.data;

    const transacaoFalha =
      obterTransacaoPagamento(
        order
      );

    console.warn(
      "ORDER CRIADA COM TRANSAÇÃO NÃO APROVADA:",
      {
        statusHttp:
          resposta.status,

        orderId:
          order?.id,

        orderStatus:
          order?.status,

        orderStatusDetail:
          order?.status_detail,

        paymentId:
          transacaoFalha?.id,

        paymentStatus:
          transacaoFalha?.status,

        paymentStatusDetail:
          transacaoFalha
            ?.status_detail,

        paymentMethodId:
          transacaoFalha
            ?.payment_method
            ?.id,

        paymentMethodType:
          transacaoFalha
            ?.payment_method
            ?.type,

        erros:
          resultado?.errors ||
          [],
      }
    );
  }


  /**
   * =========================================
   * ERRO REAL DA API
   * =========================================
   *
   * Se não for:
   *
   * - uma resposta 2xx
   *
   * nem:
   *
   * - HTTP 402 contendo data.id
   *
   * então tratamos como erro real da
   * integração.
   */

  else if (!resposta.ok) {
    console.error(
      "=========================================="
    );

    console.error(
      "ERRO ORDERS MERCADO PAGO:"
    );

    console.dir(
      {
        statusHttp:
          resposta.status,

        statusText:
          resposta.statusText,

        payloadEnviado:
          sanitizarObjeto(
            dados
          ),

        respostaMercadoPago:
          sanitizarObjeto(
            resultado
          ),
      },
      {
        depth:
          null,

        colors:
          true,
      }
    );

    console.error(
      "=========================================="
    );

    throw criarErroMercadoPago(
      resposta,
      resultado,
      "Erro ao criar Order no Mercado Pago."
    );
  }


  /**
   * =========================================
   * TRANSAÇÃO DA ORDER
   * =========================================
   */

  const transacao =
    obterTransacaoPagamento(
      order
    );


  /**
   * =========================================
   * LOG SEGURO DA ORDER
   * =========================================
   */

  console.log(
    "RESPOSTA ORDER MERCADO PAGO:",
    {
      id:
        order?.id,

      status:
        order?.status,

      statusDetail:
        order?.status_detail,

      processingMode:
        order?.processing_mode,

      externalReference:
        order?.external_reference,

      totalAmount:
        order?.total_amount,

      paymentId:
        transacao?.id,

      paymentStatus:
        transacao?.status,

      paymentStatusDetail:
        transacao?.status_detail,

      paymentMethodId:
        transacao
          ?.payment_method
          ?.id,

      paymentMethodType:
        transacao
          ?.payment_method
          ?.type,
    }
  );


  /**
   * =========================================
   * RETORNO
   * =========================================
   *
   * Sempre retornamos a Order diretamente.
   *
   * Resposta normal:
   *
   * resultado = Order
   *
   * Resposta HTTP 402:
   *
   * resultado.data = Order
   *
   * Assim o restante do service não precisa
   * saber qual formato HTTP o Mercado Pago
   * utilizou para devolver a Order.
   */

  return order;
}

/**
 * =========================================
 * CONSULTAR ORDER
 * =========================================
 */

async function consultarOrderMercadoPago(
  orderId
) {
  if (!orderId) {
    throw new Error(
      "ID da Order do Mercado Pago não informado."
    );
  }

  const accessToken =
    obterAccessToken();

  const resposta =
    await fetch(
      `${MERCADO_PAGO_API}/v1/orders/${encodeURIComponent(
        orderId
      )}`,
      {
        method:
          "GET",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          Accept:
            "application/json",
        },
      }
    );

  const resultado =
    await lerRespostaJson(
      resposta
    );

  if (!resposta.ok) {
    console.error(
      "Erro ao consultar Order no Mercado Pago:",
      {
        orderId,

        status:
          resposta.status,

        message:
          resultado?.message,

        error:
          resultado?.error,

        cause:
          resultado?.cause,
      }
    );

    throw criarErroMercadoPago(
      resposta,
      resultado,
      "Erro ao consultar Order no Mercado Pago."
    );
  }

  return resultado;
}

async function reembolsarOrderMercadoPago(
  orderId,
  chaveIdempotencia
) {
  if (!orderId) {
    throw new Error(
      "ID da Order não informado para reembolso."
    );
  }


  if (!chaveIdempotencia) {
    throw new Error(
      "Chave de idempotência do reembolso não informada."
    );
  }


  const accessToken =
    obterAccessToken();


  const resposta = await fetch(
  `${MERCADO_PAGO_API}/v1/orders/${encodeURIComponent(orderId)}/refund`,
  {
    method: "POST",

    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Idempotency-Key": chaveIdempotencia,
    },
  }
);


  const resultado =
    await lerRespostaJson(
      resposta
    );


  /**
   * A API pode responder que a Order já
   * foi reembolsada.
   *
   * Nesse caso não devemos tentar devolver
   * dinheiro novamente.
   */

  const codigoErro =
    resultado?.code ||
    resultado?.error ||
    resultado?.errors?.[0]?.code;


  if (
    resposta.status === 409 &&
    codigoErro ===
      "order_already_refunded"
  ) {
    console.log(
      `Order ${orderId} já estava reembolsada.`
    );

    return await consultarOrderMercadoPago(
      orderId
    );
  }


  if (!resposta.ok) {
    console.error(
  "ERRO AO REEMBOLSAR ORDER:"
);

console.error(
  JSON.stringify(
    {
      orderId,
      statusHttp: resposta.status,
      resposta: sanitizarObjeto(resultado),
    },
    null,
    2
  )
);


    throw criarErroMercadoPago(
      resposta,
      resultado,
      "Erro ao reembolsar Order no Mercado Pago."
    );
  }


  console.log(
    "REEMBOLSO SOLICITADO AO MERCADO PAGO:",
    {
      orderId,

      status:
        resultado?.status,

      statusDetail:
        resultado?.status_detail,

      refunds:
        resultado
          ?.transactions
          ?.refunds
          ?.map((refund) => ({
            id:
              refund.id,

            status:
              refund.status,

            amount:
              refund.amount,
          })) || [],
    }
  );


  return resultado;
}

/**
 * =========================================
 * TRANSAÇÃO DA ORDER
 * =========================================
 */

function obterTransacaoPagamento(
  order
) {
  const pagamentos =
    order
      ?.transactions
      ?.payments;

  if (
    !Array.isArray(
      pagamentos
    ) ||
    pagamentos.length === 0
  ) {
    return null;
  }

  return pagamentos[0];
}

/**
 * =========================================
 * DIAGNÓSTICO
 * =========================================
 */

export async function diagnosticarMercadoPago() {
  const accessToken =
    obterAccessToken();

  const resposta =
    await fetch(
      `${MERCADO_PAGO_API}/v1/payment_methods`,
      {
        method:
          "GET",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          Accept:
            "application/json",
        },
      }
    );

  const resultado =
    await lerRespostaJson(
      resposta
    );

  if (!resposta.ok) {
    throw criarErroMercadoPago(
      resposta,
      resultado,
      "Erro ao consultar os meios de pagamento do Mercado Pago."
    );
  }

  const meiosPagamento =
    Array.isArray(resultado)
      ? resultado.map(
        (metodo) => ({
          id:
            metodo.id,

          nome:
            metodo.name,

          tipo:
            metodo.payment_type_id,

          status:
            metodo.status,
        })
      )
      : resultado;

  return {
    autenticado:
      true,

    statusHttp:
      resposta.status,

    meiosPagamento,
  };
}

/**
 * =========================================
 * STATUS DA ORDER
 * =========================================
 */

function interpretarStatusOrder(
  order
) {
  /**
   * =========================================
   * REEMBOLSO DA ORDER
   * =========================================
   */

  if (
    order?.status === "refunded" ||
    order?.status_detail === "refunded"
  ) {
    return "REEMBOLSADO";
  }


  const transacao =
    obterTransacaoPagamento(
      order
    );


  const status =
    transacao?.status ||
    order?.status;


  const detalhe =
    transacao?.status_detail ||
    order?.status_detail;


  if (
    status === "processed"
  ) {
    return "APROVADO";
  }


  if (
    status === "processing"
  ) {
    return "PROCESSANDO";
  }


  if (
    status === "action_required" ||
    status === "created"
  ) {
    return "PENDENTE";
  }


  if (
    status === "failed"
  ) {
    if (
      detalhe === "expired"
    ) {
      return "EXPIRADO";
    }

    return "RECUSADO";
  }


  if (
    status === "canceled"
  ) {
    if (
      detalhe === "expired"
    ) {
      return "EXPIRADO";
    }

    return "CANCELADO";
  }


  if (
    status === "expired"
  ) {
    return "EXPIRADO";
  }


  if (
    status === "refunded" ||
    status === "charged_back"
  ) {
    return "REEMBOLSADO";
  }


  return null;
}

/**
 * =========================================
 * TRANSIÇÃO DE STATUS
 * =========================================
 */

function podeAlterarStatus(
  statusAtual,
  novoStatus
) {
  if (
    statusAtual ===
    novoStatus
  ) {
    return false;
  }

  /**
   * Depois de aprovado não podemos
   * voltar para pendente/processando/etc.
   */

  if (
    statusAtual === "APROVADO" &&
    novoStatus !== "REEMBOLSADO"
  ) {
    return false;
  }

  /**
   * Reembolso é final.
   */

  if (
    statusAtual ===
    "REEMBOLSADO"
  ) {
    return false;
  }

  return true;
}

/**
 * =========================================
 * APLICAR ORDER AO PAGAMENTO LOCAL
 * =========================================
 */

async function aplicarOrderAoPagamento(
  pagamento,
  order,
  opcoes = {}
) {
  const {
    permitirReembolsoAutomatico = true,
  } = opcoes;

  if (!pagamento?.pedido) {
    throw new Error(
      "O pagamento local precisa incluir o pedido para aplicar a Order."
    );
  }


  /**
   * =========================================
   * VALIDAR REFERÊNCIA
   * =========================================
   */

  if (
    order?.external_reference &&
    order.external_reference !==
      pagamento.referenciaExterna
  ) {
    throw new Error(
      "A referência da Order não corresponde ao pagamento."
    );
  }


  /**
   * =========================================
   * INTERPRETAR STATUS
   * =========================================
   */

  const novoStatus =
    interpretarStatusOrder(
      order
    );


  if (!novoStatus) {
    throw new Error(
      `Status de Order não reconhecido: ${
        order?.status ||
        "desconhecido"
      } / ${
        order?.status_detail ||
        "sem detalhe"
      }`
    );
  }


  const transacao =
    obterTransacaoPagamento(
      order
    );


  /**
   * =========================================
   * DETALHES
   * =========================================
   */

  const detalhesAtuais =
    pagamento.detalhes &&
    typeof pagamento.detalhes ===
      "object"
      ? pagamento.detalhes
      : {};


  const novosDetalhes = {
    ...detalhesAtuais,

    ultimaOrder:
      sanitizarObjeto(
        order
      ),
  };


  const dadosAtualizacao = {
    provedorOrdemId:
      order?.id != null
        ? String(
            order.id
          )
        : pagamento.provedorOrdemId,

    provedorPagamentoId:
      transacao?.id != null
        ? String(
            transacao.id
          )
        : pagamento.provedorPagamentoId,

    detalhes:
      novosDetalhes,
  };


  /**
   * =========================================
   * STATUS NÃO MUDOU
   * =========================================
   */

  if (
    !podeAlterarStatus(
      pagamento.status,
      novoStatus
    )
  ) {
    console.log(
      `Pagamento ${pagamento.id}: ${pagamento.status} → ${novoStatus}. Nenhuma alteração de status necessária.`
    );


    const pagamentoAtualizado =
      await prisma.pagamento.update({
        where: {
          id:
            pagamento.id,
        },

        data:
          dadosAtualizacao,
      });


    /**
     * Buscamos o pedido novamente.
     *
     * Não retornamos o objeto antigo que
     * veio junto com pagamento.
     */

    const pedidoAtualizado =
      await prisma.pedido.findUnique({
        where: {
          id:
            pagamento.pedidoId,
        },
      });


    return {
      pagamento:
        pagamentoAtualizado,

      pedido:
        pedidoAtualizado,

      alterado:
        false,
    };
  }


  /**
   * =========================================
   * STATUS MUDOU
   * =========================================
   */

  const resultado =
    await prisma.$transaction(
      async (tx) => {

        /**
         * Primeiro atualizamos o pagamento.
         *
         * O pagamento representa aquilo que
         * aconteceu no Mercado Pago.
         *
         * Portanto, se o Mercado Pago recebeu
         * o dinheiro, o pagamento local pode
         * ficar APROVADO mesmo que o pedido
         * tenha expirado.
         */

        const pagamentoAtualizado =
          await tx.pagamento.update({
            where: {
              id:
                pagamento.id,
            },

            data: {
              ...dadosAtualizacao,

              status:
                novoStatus,
            },
          });


        /**
         * =====================================
         * BUSCAR ESTADO REAL DO PEDIDO
         * =====================================
         *
         * Não usamos:
         *
         * pagamento.pedido.status
         *
         * porque esse objeto pode ter sido
         * carregado antes da rotina de
         * expiração cancelar o pedido.
         */

        let pedidoAtualizado =
          await tx.pedido.findUnique({
            where: {
              id:
                pagamento.pedidoId,
            },
          });


        if (!pedidoAtualizado) {
          throw new Error(
            "Pedido do pagamento não encontrado."
          );
        }


        /**
         * =====================================
         * PAGAMENTO APROVADO
         * =====================================
         */

        if (
          novoStatus ===
          "APROVADO"
        ) {

          /**
           * ===================================
           * PAGAMENTO TARDIO
           * ===================================
           *
           * Se o pedido já foi cancelado,
           * NÃO podemos reativá-lo.
           *
           * O estoque já pode ter sido
           * devolvido e até vendido para
           * outra pessoa.
           */

          if (
            pedidoAtualizado.status ===
            "CANCELADO"
          ) {
            console.error(
              "PAGAMENTO APROVADO PARA PEDIDO CANCELADO:",
              {
                pedidoId:
                  pedidoAtualizado.id,

                pagamentoId:
                  pagamentoAtualizado.id,

                orderId:
                  order?.id,

                paymentId:
                  transacao?.id,
              }
            );


            /**
             * Registramos no pagamento que
             * houve uma aprovação tardia.
             *
             * Futuramente podemos usar isso
             * para iniciar reembolso
             * automático.
             */

            const detalhesPagamentoTardio = {
              ...novosDetalhes,

              pagamentoTardio: {
                detectado:
                  true,

                detectadoEm:
                  new Date()
                    .toISOString(),

                statusPedido:
                  pedidoAtualizado.status,

                expiraEm:
                  pedidoAtualizado.expiraEm
                    ? pedidoAtualizado
                        .expiraEm
                        .toISOString()
                    : null,
              },
            };


            const pagamentoTardio =
              await tx.pagamento.update({
                where: {
                  id:
                    pagamentoAtualizado.id,
                },

                data: {
                  detalhes:
                    detalhesPagamentoTardio,
                },
              });


            return {
              pagamento:
                pagamentoTardio,

              pedido:
                pedidoAtualizado,

              pagamentoTardio:
                true,
            };
          }


          /**
           * ===================================
           * PRAZO JÁ TERMINOU
           * ===================================
           *
           * Esta verificação protege a janela
           * entre:
           *
           * expiraEm
           *
           * e
           *
           * execução da rotina periódica.
           */

          const prazoExpirado =
            pedidoAtualizado.expiraEm &&
            pedidoAtualizado
              .expiraEm
              .getTime() <=
              Date.now();


          if (
            prazoExpirado
          ) {
            console.error(
              "PAGAMENTO APROVADO APÓS O PRAZO DO PEDIDO:",
              {
                pedidoId:
                  pedidoAtualizado.id,

                pagamentoId:
                  pagamentoAtualizado.id,

                expiraEm:
                  pedidoAtualizado.expiraEm,

                orderId:
                  order?.id,
              }
            );


            /**
             * Tentamos cancelar o pedido
             * SOMENTE se ele ainda estiver
             * PENDENTE.
             *
             * Isso funciona como um claim
             * atômico.
             */

            const cancelamento =
              await tx.pedido.updateMany({
                where: {
                  id:
                    pedidoAtualizado.id,

                  status:
                    "PENDENTE",
                },

                data: {
                  status:
                    "CANCELADO",
                },
              });


            /**
             * Se conseguimos cancelar agora,
             * precisamos devolver o estoque.
             *
             * A rotina periódica não irá
             * devolver novamente porque o
             * pedido já estará CANCELADO.
             */

            if (
              cancelamento.count === 1
            ) {
              const itens =
                await tx.itemPedido.findMany({
                  where: {
                    pedidoId:
                      pedidoAtualizado.id,
                  },
                });


              for (
                const item of itens
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


            pedidoAtualizado =
              await tx.pedido.findUnique({
                where: {
                  id:
                    pagamento.pedidoId,
                },
              });


            const detalhesPagamentoTardio = {
              ...novosDetalhes,

              pagamentoTardio: {
                detectado:
                  true,

                detectadoEm:
                  new Date()
                    .toISOString(),

                statusPedido:
                  pedidoAtualizado
                    ?.status,

                expiraEm:
                  pedidoAtualizado
                    ?.expiraEm
                    ? pedidoAtualizado
                        .expiraEm
                        .toISOString()
                    : null,
              },
            };


            const pagamentoTardio =
              await tx.pagamento.update({
                where: {
                  id:
                    pagamentoAtualizado.id,
                },

                data: {
                  detalhes:
                    detalhesPagamentoTardio,
                },
              });


            return {
              pagamento:
                pagamentoTardio,

              pedido:
                pedidoAtualizado,

              pagamentoTardio:
                true,
            };
          }


          /**
           * ===================================
           * PENDENTE → PAGO
           * ===================================
           *
           * Esta atualização é condicional.
           *
           * Portanto não existe:
           *
           * CANCELADO → PAGO
           *
           * nem:
           *
           * ENTREGUE → PAGO
           *
           * etc.
           */

          const atualizacaoPedido =
            await tx.pedido.updateMany({
              where: {
                id:
                  pagamento.pedidoId,

                status:
                  "PENDENTE",

                OR: [
                  {
                    expiraEm:
                      null,
                  },

                  {
                    expiraEm: {
                      gt:
                        new Date(),
                    },
                  },
                ],
              },

              data: {
                status:
                  "PAGO",
              },
            });


          /**
           * Buscamos novamente porque outra
           * operação pode ter alterado o
           * pedido concorrentemente.
           */

          pedidoAtualizado =
            await tx.pedido.findUnique({
              where: {
                id:
                  pagamento.pedidoId,
              },
            });


          /**
           * Se não atualizamos para PAGO,
           * significa que outra operação
           * ganhou a corrida.
           */

          if (
            atualizacaoPedido.count !==
              1 &&
            pedidoAtualizado?.status !==
              "PAGO"
          ) {
            console.warn(
              "Pagamento aprovado, mas pedido não pôde ser marcado como PAGO:",
              {
                pedidoId:
                  pagamento.pedidoId,

                statusPedido:
                  pedidoAtualizado
                    ?.status,

                pagamentoId:
                  pagamentoAtualizado.id,
              }
            );
          }
        }


        return {
          pagamento:
            pagamentoAtualizado,

          pedido:
            pedidoAtualizado,

          pagamentoTardio:
            false,
        };
      }
    );


  const respostaAplicacao = {
  ...resultado,

  alterado:
    true,
};


/**
 * =========================================
 * REEMBOLSO AUTOMÁTICO
 * =========================================
 *
 * Somente depois da transação do banco
 * ter terminado.
 */

if (
  permitirReembolsoAutomatico &&
  resultado.pagamentoTardio ===
    true &&
  resultado.pagamento?.status ===
    "APROVADO" &&
  resultado.pedido?.status ===
    "CANCELADO"
) {
  try {
    const reembolso =
      await processarReembolsoPagamentoTardio(
        resultado.pagamento,
        resultado.pedido
      );


    console.log(
      "RESULTADO DO REEMBOLSO AUTOMÁTICO:",
      {
        pagamentoId:
          resultado.pagamento.id,

        pedidoId:
          resultado.pedido.id,

        solicitado:
          reembolso.solicitado,

        statusPagamento:
          reembolso.pagamento
            ?.status ||
          resultado.pagamento
            .status,
      }
    );


    if (
      reembolso.pagamento
    ) {
      respostaAplicacao.pagamento =
        reembolso.pagamento;
    }
  } catch (erro) {
    /**
     * MUITO IMPORTANTE:
     *
     * falha no reembolso NÃO transforma
     * o pedido novamente em PAGO.
     */

    console.error(
      "FALHA NO REEMBOLSO AUTOMÁTICO DE PAGAMENTO TARDIO:",
      {
        pagamentoId:
          resultado.pagamento.id,

        pedidoId:
          resultado.pedido.id,

        orderId:
          resultado.pagamento
            .provedorOrdemId,

        erro:
          erro.message,
      }
    );


    /**
     * Registramos que o reembolso precisa
     * ser tentado novamente.
     */

    const detalhes =
      resultado.pagamento
        .detalhes &&
      typeof resultado.pagamento
        .detalhes === "object"
        ? resultado.pagamento
            .detalhes
        : {};


    await prisma.pagamento.update({
      where: {
        id:
          resultado.pagamento.id,
      },

      data: {
        detalhes: {
          ...detalhes,

          reembolsoAutomatico: {
            status:
              "FALHOU",

            ultimaTentativaEm:
              new Date()
                .toISOString(),

            erro:
              erro.message,
          },
        },
      },
    });
  }
}


return respostaAplicacao;
}

/**
 * =========================================
 * BUSCAR PEDIDO
 * =========================================
 */

async function buscarPedidoParaPagamento(
  pedidoId,
  usuarioId
) {
  if (!pedidoId) {
    const erro =
      new Error(
        "Pedido não informado."
      );

    erro.status = 400;

    throw erro;
  }


  const pedido =
    await prisma.pedido.findFirst({
      where: {
        id: pedidoId,
        usuarioId,
      },

      include: {
        usuario: true,
        itens: true,
      },
    });


  if (!pedido) {
    const erro =
      new Error(
        "Pedido não encontrado."
      );

    erro.status = 404;

    throw erro;
  }


  /**
   * =========================================
   * PEDIDO NÃO ESTÁ MAIS PENDENTE
   * =========================================
   */

  if (
    pedido.status !==
    "PENDENTE"
  ) {
    const erro =
      new Error(
        "Este pedido não está disponível para pagamento."
      );

    erro.status = 409;

    throw erro;
  }


  /**
   * =========================================
   * VALIDAR PRAZO DO PEDIDO
   * =========================================
   *
   * Não dependemos da rotina periódica para
   * bloquear um pagamento.
   *
   * Pode acontecer:
   *
   * 12:30:00 -> pedido vence
   * 12:30:20 -> rotina ainda não executou
   *
   * Nesse intervalo o status no banco ainda
   * poderia ser PENDENTE.
   *
   * Portanto expiraEm também é validado aqui.
   */

  if (
    pedido.expiraEm &&
    pedido.expiraEm.getTime() <=
      Date.now()
  ) {
    const erro =
      new Error(
        "O prazo para pagamento deste pedido expirou."
      );

    erro.status = 409;

    throw erro;
  }


  validarTotalPagamento(pedido);
  return pedido;
}

/**
 * =========================================
 * TENTATIVA ATIVA
 * =========================================
 */

async function validarAusenciaTentativaAtiva(
  pedidoId
) {
  const pagamentoExistente =
    await prisma.pagamento.findFirst({
      where: {
        pedidoId,

        status: {
          in: [
            "PENDENTE",
            "PROCESSANDO",
          ],
        },
      },

      orderBy: {
        criadoEm:
          "desc",
      },
    });

  if (
    pagamentoExistente
  ) {
    throw new Error(
      "Este pedido já possui uma tentativa de pagamento em andamento."
    );
  }
}

/**
 * =========================================
 * PAYER
 * =========================================
 */

function montarPayer(
  pedido,
  payerRecebido = {}
) {
  const email =
    payerRecebido?.email ||
    pedido?.usuario?.email;

  const tipoDocumento =
    payerRecebido
      ?.identification
      ?.type;

  const numeroDocumento =
    payerRecebido
      ?.identification
      ?.number;

  const payer = {};

  if (email) {
    payer.email =
      String(email)
        .trim()
        .toLowerCase();
  }

  if (
    tipoDocumento &&
    numeroDocumento
  ) {
    payer.identification = {
      type:
        String(
          tipoDocumento
        )
          .trim()
          .toUpperCase(),

      number:
        String(
          numeroDocumento
        ).replace(
          /\D/g,
          ""
        ),
    };
  }

  return payer;
}

/**
 * =========================================
 * EXTRAIR ORDER DE ERRO
 * =========================================
 */

function obterOrderDeErro(
  erro
) {
  const order =
    erro?.detalhes;

  if (
    order?.id &&
    order?.status
  ) {
    return order;
  }

  return null;
}

/**
 * =========================================
 * REGISTRAR FALHA
 * =========================================
 */

async function registrarFalhaParaReconciliacao(
  pagamento,
  erro,
  contexto
) {
  console.error(
    contexto,
    erro
  );

  try {
    const detalhesAtuais =
      pagamento.detalhes &&
        typeof pagamento.detalhes ===
        "object"
        ? pagamento.detalhes
        : {};

    await atualizarPagamento(
      pagamento.id,
      {
        detalhes: {
          ...detalhesAtuais,

          erro:
            erro.message,

          statusHttp:
            erro.status ||
            null,

          resposta:
            erro.detalhes
              ? sanitizarObjeto(
                erro.detalhes
              )
              : null,

          aguardandoReconciliacao:
            true,
        },
      }
    );
  } catch (
  erroBanco
  ) {
    console.error(
      "Erro ao registrar detalhes da falha:",
      erroBanco
    );
  }
}

/**
 * =========================================
 * PIX
 * =========================================
 *
 * Orders API
 *
 * POST /v1/orders
 */

export async function iniciarPagamentoPix(
  pedidoId,
  usuarioId
) {
  const pedido =
    await buscarPedidoParaPagamento(
      pedidoId,
      usuarioId
    );

  await validarAusenciaTentativaAtiva(
    pedidoId
  );

  const referenciaExterna =
    `AUR-${randomUUID()}`;

  const chaveIdempotencia =
    randomUUID();

  /**
   * Orders trabalha com valores
   * monetários como String.
   */

  const valor =
    pedido.valorTotal.toFixed(
      2
    );

  /**
   * Criamos primeiro nossa tentativa
   * local.
   */

  const pagamento =
    await criarPagamento({
      pedidoId:
        pedido.id,

      provedor:
        "MERCADO_PAGO",

      metodo:
        "PIX",

      status:
        "PROCESSANDO",

      valor,

      referenciaExterna,

      chaveIdempotencia,
    });

  const payer =
    montarPayer(
      pedido
    );

  /**
   * PAYLOAD ORDERS API - PIX
   */

  const dadosOrder = {
    type:
      "online",

    total_amount:
      valor,

    external_reference:
      referenciaExterna,

    processing_mode:
      "automatic",

    transactions: {
      payments: [
        {
          amount: valor,

          payment_method: {
            id: "pix",
            type: "bank_transfer",
          },

          expiration_time: "PT30M",
        },
      ],
    },

    payer,
  };

  try {
    const order =
      await criarOrderMercadoPago(
        dadosOrder,
        chaveIdempotencia
      );

    if (!order?.id) {
      throw new Error(
        "O Mercado Pago não retornou o identificador da Order Pix."
      );
    }

    const transacao =
      obterTransacaoPagamento(
        order
      );

    if (!transacao) {
      throw new Error(
        "A Order Pix foi criada, mas não retornou a transação de pagamento."
      );
    }

    const paymentMethod =
      transacao
        ?.payment_method;

    /**
     * PIX pode ser criado de forma
     * assíncrona.
     *
     * Portanto NÃO tratamos ausência
     * imediata de QR Code como erro fatal.
     */

    const pix =
      paymentMethod?.qr_code
        ? {
          codigo:
            paymentMethod.qr_code,

          imagemBase64:
            paymentMethod
              .qr_code_base64 ||
            null,

          linkPagamento:
            paymentMethod
              .ticket_url ||
            null,
        }
        : null;

    const detalhesAtuais =
      pagamento.detalhes &&
        typeof pagamento.detalhes ===
        "object"
        ? pagamento.detalhes
        : {};

    const pagamentoPreparado =
      await atualizarPagamento(
        pagamento.id,
        {
          provedorOrdemId:
            String(
              order.id
            ),

          provedorPagamentoId:
            transacao?.id != null
              ? String(
                transacao.id
              )
              : null,

          detalhes: {
            ...detalhesAtuais,

            ...(pix
              ? {
                pix,
              }
              : {}),
          },
        }
      );

    const aplicacao =
      await aplicarOrderAoPagamento(
        {
          ...pagamentoPreparado,

          pedido,
        },

        order
      );

    return {
      pagamentoId:
        aplicacao.pagamento.id,

      status:
        aplicacao.pagamento.status,

      metodo:
        aplicacao.pagamento.metodo,

      valor,

      pix,
    };
  } catch (erro) {
    const orderRetornada =
      obterOrderDeErro(
        erro
      );

    /**
     * Caso MP tenha criado a Order,
     * persistimos mesmo se a resposta
     * HTTP tiver sido considerada erro.
     */

    if (orderRetornada) {
      try {
        const transacao =
          obterTransacaoPagamento(
            orderRetornada
          );

        const paymentMethod =
          transacao
            ?.payment_method;

        const pix =
          paymentMethod?.qr_code
            ? {
              codigo:
                paymentMethod
                  .qr_code,

              imagemBase64:
                paymentMethod
                  .qr_code_base64 ||
                null,

              linkPagamento:
                paymentMethod
                  .ticket_url ||
                null,
            }
            : null;

        const detalhesAtuais =
          pagamento.detalhes &&
            typeof pagamento.detalhes ===
            "object"
            ? pagamento.detalhes
            : {};

        const pagamentoPreparado =
          await atualizarPagamento(
            pagamento.id,
            {
              provedorOrdemId:
                String(
                  orderRetornada.id
                ),

              provedorPagamentoId:
                transacao?.id != null
                  ? String(
                    transacao.id
                  )
                  : null,

              detalhes: {
                ...detalhesAtuais,

                ...(pix
                  ? {
                    pix,
                  }
                  : {}),
              },
            }
          );

        const aplicacao =
          await aplicarOrderAoPagamento(
            {
              ...pagamentoPreparado,

              pedido,
            },

            orderRetornada
          );

        return {
          pagamentoId:
            aplicacao.pagamento.id,

          status:
            aplicacao.pagamento.status,

          metodo:
            aplicacao.pagamento.metodo,

          valor,

          pix,
        };
      } catch (
      erroPersistir
      ) {
        console.error(
          "Erro ao persistir Order Pix retornada:",
          erroPersistir
        );

        throw erroPersistir;
      }
    }

    await registrarFalhaParaReconciliacao(
      pagamento,
      erro,
      "Erro ao iniciar pagamento Pix via Orders:"
    );

    throw erro;
  }
}

/**
 * =========================================
 * DETALHES DO CARTÃO
 * =========================================
 */

function montarDetalhesCartao(
  order,
  paymentMethodId,
  parcelas
) {
  const transacao =
    obterTransacaoPagamento(
      order
    );

  const paymentMethod =
    transacao
      ?.payment_method;

  const detalhesCartao = {
    bandeira:
      paymentMethod?.id ||
      paymentMethodId,

    parcelas:
      paymentMethod
        ?.installments ||
      parcelas ||
      1,
  };

  const ultimos4 =
    paymentMethod
      ?.card
      ?.last_four_digits ||
    transacao
      ?.card
      ?.last_four_digits;

  if (ultimos4) {
    detalhesCartao.ultimos4 =
      ultimos4;
  }

  return detalhesCartao;
}

/**
 * =========================================
 * PERSISTIR ORDER DE CARTÃO
 * =========================================
 */

async function persistirOrderCartao({
  pagamento,
  pedido,
  order,
  paymentMethodId,
  parcelas,
}) {
  if (!order?.id) {
    throw new Error(
      "O Mercado Pago não retornou o identificador da Order."
    );
  }

  const transacao =
    obterTransacaoPagamento(
      order
    );

  const detalhesCartao =
    montarDetalhesCartao(
      order,
      paymentMethodId,
      parcelas
    );

  const detalhesAtuais =
    pagamento.detalhes &&
      typeof pagamento.detalhes ===
      "object"
      ? pagamento.detalhes
      : {};

  const pagamentoPreparado =
    await atualizarPagamento(
      pagamento.id,
      {
        provedorOrdemId:
          String(
            order.id
          ),

        provedorPagamentoId:
          transacao?.id != null
            ? String(
              transacao.id
            )
            : null,

        detalhes: {
          ...detalhesAtuais,

          cartao:
            detalhesCartao,
        },
      }
    );

  const aplicacao =
    await aplicarOrderAoPagamento(
      {
        ...pagamentoPreparado,

        pedido,
      },

      order
    );

  return {
    pagamentoId:
      aplicacao.pagamento.id,

    status:
      aplicacao.pagamento.status,

    metodo:
      aplicacao.pagamento.metodo,

    valor:
      pagamento.valor.toString(),

    cartao:
      detalhesCartao,
  };
}

/**
 * =========================================
 * CARTÃO DE CRÉDITO
 * =========================================
 *
 * Orders API
 */

export async function iniciarPagamentoCartao(
  dados,
  usuarioId
) {
  const {
    pedidoId,
    token,
    paymentMethodId,
    installments,
    payer,
  } = dados;

  const pedido =
    await buscarPedidoParaPagamento(
      pedidoId,
      usuarioId
    );

  await validarAusenciaTentativaAtiva(
    pedidoId
  );

  /**
   * Token criado pelo
   * MercadoPago.js / Brick.
   */

  if (
    !token ||
    typeof token !==
    "string"
  ) {
    throw new Error(
      "Token do cartão não informado."
    );
  }

  /**
   * Bandeira identificada pelo Brick.
   *
   * visa
   * master
   * elo
   * amex
   * etc.
   */

  if (
    !paymentMethodId ||
    typeof paymentMethodId !==
    "string"
  ) {
    throw new Error(
      "Método do cartão não informado."
    );
  }

  const paymentMethodIdOrder =
    paymentMethodId
      .trim()
      .toLowerCase();

  const numeroParcelas =
    Number(
      installments
    );

  if (
    !Number.isInteger(
      numeroParcelas
    ) ||
    numeroParcelas < 1
  ) {
    throw new Error(
      "Quantidade de parcelas inválida."
    );
  }

  const referenciaExterna =
    `AUR-${randomUUID()}`;

  const chaveIdempotencia =
    randomUUID();

  const valor =
    pedido.valorTotal.toFixed(
      2
    );

  /**
   * Criamos a tentativa local
   * ANTES de chamar o Mercado Pago.
   */

  const pagamento =
    await criarPagamento({
      pedidoId:
        pedido.id,

      provedor:
        "MERCADO_PAGO",

      metodo:
        "CREDITO",

      status:
        "PROCESSANDO",

      valor,

      referenciaExterna,

      chaveIdempotencia,
    });

  const payerOrder =
    montarPayer(
      pedido,
      payer
    );

  /**
   * =========================================
   * PAYLOAD ORDERS API - CRÉDITO
   * =========================================
   */

  const dadosOrder = {
    type:
      "online",

    total_amount:
      valor,

    external_reference:
      referenciaExterna,

    processing_mode:
      "automatic",

    transactions: {
      payments: [
        {
          amount:
            valor,

          payment_method: {
            id:
              paymentMethodIdOrder,

            type:
              "credit_card",

            token,

            installments:
              numeroParcelas,
          },
        },
      ],
    },

    payer:
      payerOrder,
  };

  /**
   * Nunca logar o token real.
   */

  console.log(
    "INICIANDO PAGAMENTO VIA ORDERS API:",
    {
      pedidoId:
        pedido.id,

      pagamentoId:
        pagamento.id,

      metodo:
        "CREDITO",

      paymentMethodId:
        paymentMethodIdOrder,

      parcelas:
        numeroParcelas,

      valor,

      referenciaExterna,

      token:
        "[REMOVIDO]",
    }
  );

  try {
    const order =
      await criarOrderMercadoPago(
        dadosOrder,
        chaveIdempotencia
      );

    return await persistirOrderCartao({
      pagamento,

      pedido,

      order,

      paymentMethodId:
        paymentMethodIdOrder,

      parcelas:
        numeroParcelas,
    });
  } catch (erro) {
    const orderRetornada =
      obterOrderDeErro(
        erro
      );

    /**
     * Uma Order recusada pode ainda
     * existir e possuir ID/status.
     *
     * Precisamos persistir isso.
     */

    if (orderRetornada) {
      try {
        return await persistirOrderCartao({
          pagamento,

          pedido,

          order:
            orderRetornada,

          paymentMethodId:
            paymentMethodIdOrder,

          parcelas:
            numeroParcelas,
        });
      } catch (
      erroPersistir
      ) {
        console.error(
          "Erro ao persistir Order de cartão retornada:",
          erroPersistir
        );

        throw erroPersistir;
      }
    }

    await registrarFalhaParaReconciliacao(
      pagamento,
      erro,
      "Erro ao iniciar pagamento crédito via Orders:"
    );

    throw erro;
  }
}

/**
 * =========================================
 * DÉBITO
 * =========================================
 *
 * Removido do checkout.
 *
 * Este export fica temporariamente para
 * não quebrar imports antigos.
 */

export async function iniciarPagamentoDebito() {
  const erro =
    new Error(
      "Pagamento com cartão de débito não está disponível."
    );

  erro.status =
    400;

  throw erro;
}

/**
 * =========================================
 * RECONCILIAÇÃO
 * =========================================
 *
 * Agora usamos:
 *
 * provedorOrdemId
 *
 * GET /v1/orders/{id}
 */

export async function reconciliarPagamento(
  pagamentoId,
  usuarioId
) {
  const pagamento =
    await prisma.pagamento.findFirst({
      where: {
        id:
          pagamentoId,

        pedido: {
          usuarioId,
        },
      },

      include: {
        pedido:
          true,
      },
    });

  if (!pagamento) {
    throw new Error(
      "Pagamento não encontrado."
    );
  }

  if (
    !pagamento.provedorOrdemId
  ) {
    throw new Error(
      "O pagamento ainda não possui uma Order no Mercado Pago."
    );
  }

  const order =
    await consultarOrderMercadoPago(
      pagamento.provedorOrdemId
    );

  const resultado =
    await aplicarOrderAoPagamento(
      pagamento,
      order
    );

  return {
    pagamentoId:
      resultado.pagamento.id,

    status:
      resultado.pagamento.status,

    statusPedido:
      resultado.pedido.status,
  };
}

/**
 * =========================================
 * WEBHOOK - ORDER
 * =========================================
 */

export async function reconciliarPagamentoPorOrderId(
  orderId
) {
  if (!orderId) {
    throw new Error(
      "ID da Order não informado."
    );
  }

  /**
   * Não confiamos no conteúdo do webhook.
   *
   * Consultamos novamente o Mercado Pago.
   */

  const order =
    await consultarOrderMercadoPago(
      String(
        orderId
      )
    );

  /**
   * Caminho principal:
   *
   * localizar pela Order.
   */

  let pagamento =
    await prisma.pagamento.findFirst({
      where: {
        provedorOrdemId:
          String(
            orderId
          ),
      },

      include: {
        pedido:
          true,
      },
    });

  /**
   * Existe uma pequena janela:
   *
   * 1. Mercado Pago cria Order
   * 2. webhook chega
   * 3. aplicação ainda não salvou order.id
   *
   * Nesse caso usamos external_reference.
   */

  if (
    !pagamento &&
    order?.external_reference
  ) {
    pagamento =
      await prisma.pagamento.findFirst({
        where: {
          referenciaExterna:
            order.external_reference,
        },

        include: {
          pedido:
            true,
        },
      });
  }

  if (!pagamento) {
    throw new Error(
      "Pagamento não encontrado para esta Order."
    );
  }

  const resultado =
    await aplicarOrderAoPagamento(
      pagamento,
      order
    );

  return resultado.pagamento;
}

/**
 * =========================================
 * COMPATIBILIDADE TEMPORÁRIA
 * =========================================
 *
 * Nosso webhook antigo ainda pode importar
 * esta função.
 *
 * Depois que atualizarmos controller/webhook,
 * ela pode ser removida.
 */

export async function reconciliarPagamentoPorPaymentId() {
  const erro =
    new Error(
      "A integração agora utiliza Orders API. O webhook deve reconciliar pelo Order ID."
    );

  erro.status =
    400;

  throw erro;
}

/**
 * =========================================
 * BUSCAR ÚLTIMO PAGAMENTO DO PEDIDO
 * =========================================
 */

export async function buscarUltimoPagamentoPedido(
  pedidoId,
  usuarioId
) {
  const pagamento =
    await prisma.pagamento.findFirst({
      where: {
        pedidoId,

        pedido: {
          usuarioId,
        },
      },

      orderBy: {
        criadoEm:
          "desc",
      },
    });

  if (!pagamento) {
    return null;
  }

  const detalhes =
    pagamento.detalhes &&
      typeof pagamento.detalhes ===
      "object"
      ? pagamento.detalhes
      : {};

  /**
   * PIX
   */

  const pix =
    pagamento.metodo === "PIX" &&
      detalhes.pix?.codigo
      ? {
        codigo:
          detalhes.pix.codigo,

        imagemBase64:
          detalhes.pix
            .imagemBase64 ||
          null,

        linkPagamento:
          detalhes.pix
            .linkPagamento ||
          null,
      }
      : null;

  /**
   * CRÉDITO
   */

  const cartao =
    pagamento.metodo ===
      "CREDITO" &&
      detalhes.cartao
      ? detalhes.cartao
      : null;

  return {
    pagamentoId:
      pagamento.id,

    status:
      pagamento.status,

    metodo:
      pagamento.metodo,

    valor:
      pagamento.valor.toString(),

    pix,

    cartao,
  };
}

/**
 * =========================================
 * MÉTODOS DE DÉBITO
 * =========================================
 *
 * Mantido temporariamente para não quebrar
 * alguma rota de diagnóstico antiga.
 */

export async function testarMetodosDebitoMercadoPago() {
  return [];
}

/**
 * =========================================
 * LISTAR MÉTODOS DE PAGAMENTO
 * =========================================
 */

export async function listarMetodosPagamentoMercadoPago() {
  const accessToken =
    obterAccessToken();

  const resposta =
    await fetch(
      `${MERCADO_PAGO_API}/v1/payment_methods`,
      {
        method:
          "GET",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          Accept:
            "application/json",
        },
      }
    );

  const resultado =
    await lerRespostaJson(
      resposta
    );

  if (!resposta.ok) {
    console.error(
      "Erro ao buscar métodos de pagamento:",
      resultado
    );

    throw criarErroMercadoPago(
      resposta,
      resultado,
      "Não foi possível consultar os métodos de pagamento."
    );
  }

  return resultado;
}

function obterChaveIdempotenciaReembolso(
  pagamento
) {
  return `refund-${pagamento.id}`;
}

async function processarReembolsoPagamentoTardio(
  pagamento,
  pedido
) {
  /**
   * =========================================
   * VALIDAÇÕES
   * =========================================
   */

  if (!pagamento) {
    throw new Error(
      "Pagamento não informado para reembolso."
    );
  }


  if (!pedido) {
    throw new Error(
      "Pedido não informado para reembolso."
    );
  }


  /**
   * Só fazemos isso para pedido CANCELADO.
   */

  if (
    pedido.status !==
    "CANCELADO"
  ) {
    return {
      solicitado:
        false,

      motivo:
        "PEDIDO_NAO_CANCELADO",
    };
  }


  /**
   * O Mercado Pago precisa ter realmente
   * aprovado o pagamento.
   */

  if (
    pagamento.status !==
    "APROVADO"
  ) {
    return {
      solicitado:
        false,

      motivo:
        "PAGAMENTO_NAO_APROVADO",
    };
  }


  if (
    !pagamento.provedorOrdemId
  ) {
    throw new Error(
      "Pagamento tardio não possui Order para reembolso."
    );
  }


  const detalhes =
    pagamento.detalhes &&
    typeof pagamento.detalhes ===
      "object"
      ? pagamento.detalhes
      : {};


  /**
   * Segurança adicional:
   *
   * só reembolsamos automaticamente se nossa
   * proteção marcou explicitamente como
   * pagamento tardio.
   */

  if (
    detalhes
      ?.pagamentoTardio
      ?.detectado !== true
  ) {
    return {
      solicitado:
        false,

      motivo:
        "NAO_E_PAGAMENTO_TARDIO",
    };
  }


  /**
   * Se nosso banco já sabe que foi
   * reembolsado, acabou.
   */

  if (
    pagamento.status ===
    "REEMBOLSADO"
  ) {
    return {
      solicitado:
        false,

      motivo:
        "JA_REEMBOLSADO",
    };
  }


  const chaveIdempotencia =
    obterChaveIdempotenciaReembolso(
      pagamento
    );


  /**
   * =========================================
   * SOLICITAR REEMBOLSO
   * =========================================
   */

  const order =
    await reembolsarOrderMercadoPago(
      pagamento.provedorOrdemId,
      chaveIdempotencia
    );


  /**
   * Não inventamos o status local.
   *
   * Aplicamos novamente a Order devolvida
   * pelo Mercado Pago.
   */

  const pagamentoAtual =
    await prisma.pagamento.findUnique({
      where: {
        id:
          pagamento.id,
      },

      include: {
        pedido:
          true,
      },
    });


  if (!pagamentoAtual) {
    throw new Error(
      "Pagamento não encontrado após solicitar reembolso."
    );
  }


  const resultado =
  await aplicarOrderAoPagamento(
    pagamentoAtual,
    order,
    {
      permitirReembolsoAutomatico:
        false,
    }
  );


  return {
    solicitado:
      true,

    pagamento:
      resultado.pagamento,

    pedido:
      resultado.pedido,

    order,
  };
}
