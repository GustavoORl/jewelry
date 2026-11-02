    import * as pedidoModel from "../models/pedidoModel.js";


/**
 * Intervalo entre as verificações.
 *
 * A cada 60 segundos verificamos se existem
 * pedidos pendentes cujo prazo de pagamento
 * terminou.
 */
const INTERVALO_VERIFICACAO_MS =
  60 * 1000;


let intervalo = null;

let verificacaoEmAndamento = false;


/**
 * =========================================
 * PROCESSAR PEDIDOS EXPIRADOS
 * =========================================
 */

export async function processarPedidosExpirados() {
  /**
   * Evita executar duas verificações
   * simultaneamente dentro deste processo.
   *
   * Exemplo:
   *
   * uma execução demora mais de 1 minuto
   * e o próximo intervalo dispara.
   */

  if (verificacaoEmAndamento) {
    console.log(
      "Verificação de pedidos expirados já está em andamento."
    );

    return;
  }


  verificacaoEmAndamento = true;


  try {
    const pedidos =
      await pedidoModel
        .buscarPedidosPendentesVencidos();


    if (
      pedidos.length === 0
    ) {
      return;
    }


    console.log(
      `${pedidos.length} pedido(s) pendente(s) expirado(s) encontrado(s).`
    );


    for (
      const pedido of pedidos
    ) {
      try {
        const pedidoExpirado =
          await pedidoModel
            .expirarPedidoPendente(
              pedido.id
            );


        /**
         * null significa que outra operação
         * alterou o pedido antes de nós.
         *
         * Por exemplo:
         *
         * PENDENTE -> PAGO
         *
         * realizado pelo webhook.
         */

        if (!pedidoExpirado) {
          continue;
        }


        console.log(
          `Pedido ${pedido.id} expirado. Estoque devolvido.`
        );
      } catch (error) {
        /**
         * Um pedido com problema não deve
         * impedir o processamento dos demais.
         */

        console.error(
          `Erro ao expirar pedido ${pedido.id}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error(
      "Erro ao verificar pedidos expirados:",
      error
    );
  } finally {
    verificacaoEmAndamento =
      false;
  }
}


/**
 * =========================================
 * INICIAR ROTINA
 * =========================================
 */

export function iniciarRotinaExpiracaoPedidos() {
  /**
   * Evita iniciar dois intervals no mesmo
   * processo Node.
   */

  if (intervalo) {
    console.log(
      "Rotina de expiração de pedidos já está ativa."
    );

    return;
  }


  console.log(
    "Rotina de expiração de pedidos iniciada."
  );


  /**
   * Executa imediatamente.
   *
   * Isso é importante caso o servidor tenha
   * ficado desligado enquanto algum pedido
   * venceu.
   */

  processarPedidosExpirados()
    .catch((error) => {
      console.error(
        "Erro na verificação inicial de pedidos expirados:",
        error
      );
    });


  /**
   * Depois verifica a cada minuto.
   */

  intervalo =
    setInterval(() => {
      processarPedidosExpirados()
        .catch((error) => {
          console.error(
            "Erro na rotina de pedidos expirados:",
            error
          );
        });
    }, INTERVALO_VERIFICACAO_MS);
}


/**
 * =========================================
 * PARAR ROTINA
 * =========================================
 *
 * Útil principalmente para testes e
 * encerramento controlado da aplicação.
 */

export function pararRotinaExpiracaoPedidos() {
  if (!intervalo) {
    return;
  }


  clearInterval(
    intervalo
  );


  intervalo = null;


  console.log(
    "Rotina de expiração de pedidos encerrada."
  );
}