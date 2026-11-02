import { Router } from "express";

import {
  criarPagamentoPix,
  criarPagamentoCartao,
  criarPagamentoDebito,
  consultarPagamento,
  recuperarPagamentoPedido,
  diagnosticarIntegracaoMercadoPago,
} from "../../controllers/pagamentos/pagamentoController.js";

import {
  testarMetodosDebitoMercadoPago,
  listarMetodosPagamentoMercadoPago
} from "../../services/pagamentoService.js";

import {
  autenticar,
} from "../../middlewares/autenticar.js";


const router = Router();


/**
 * =========================================
 * CRIAR PAGAMENTO PIX
 * =========================================
 *
 * POST /pagamentos/pix
 *
 * Cria uma Order no Mercado Pago
 * utilizando Pix.
 */

router.post(
  "/pix",
  autenticar,
  criarPagamentoPix
);


/**
 * =========================================
 * CRIAR PAGAMENTO COM CRÉDITO
 * =========================================
 *
 * POST /pagamentos/cartao
 *
 * Cria uma Order utilizando:
 *
 * payment_method.type = credit_card
 */

router.post(
  "/cartao",
  autenticar,
  criarPagamentoCartao
);


/**
 * =========================================
 * CRIAR PAGAMENTO COM DÉBITO
 * =========================================
 *
 * POST /pagamentos/debito
 *
 * Agora também utiliza:
 *
 * POST /v1/orders
 *
 * com:
 *
 * payment_method.type = debit_card
 */

router.post(
  "/debito",
  autenticar,
  criarPagamentoDebito
);


/**
 * =========================================
 * RECUPERAR ÚLTIMO PAGAMENTO DO PEDIDO
 * =========================================
 *
 * GET /pagamentos/pedido/:pedidoId
 */

router.get(
  "/pedido/:pedidoId",
  autenticar,
  recuperarPagamentoPedido
);


/**
 * =========================================
 * DIAGNÓSTICO MERCADO PAGO
 * =========================================
 *
 * GET /pagamentos/diagnostico/mercado-pago
 *
 * Utiliza a mesma aplicação/Access Token
 * responsável pelas Orders.
 */

router.get(
  "/diagnostico/mercado-pago",
  autenticar,
  diagnosticarIntegracaoMercadoPago
);

router.get(
  "/debug/metodos-pagamento",
  autenticar,
  async (req, res) => {
    try {
      const metodos =
        await listarMetodosPagamentoMercadoPago();

      return res.json({
        sucesso: true,
        metodos,
      });
    } catch (erro) {
      console.error(
        "Erro ao consultar métodos:",
        erro
      );

      return res
        .status(erro.status || 500)
        .json({
          sucesso: false,
          mensagem:
            erro.message,
          detalhes:
            erro.detalhes || null,
        });
    }
  }
);

/**
 * =========================================
 * DEBUG - MÉTODOS DE DÉBITO
 * =========================================
 *
 * GET /pagamentos/debug/metodos-debito
 *
 * IMPORTANTE:
 *
 * Esta rota precisa ficar ANTES de /:id,
 * caso contrário o Express pode interpretar
 * "debug" como sendo o parâmetro :id.
 *
 * Também protegemos a rota com autenticação.
 */

router.get(
  "/debug/metodos-debito",
  autenticar,
  async (
    req,
    res
  ) => {
    try {
      const metodos =
        await testarMetodosDebitoMercadoPago();


      return res
        .status(200)
        .json({
          sucesso:
            true,

          quantidade:
            metodos.length,

          metodos,
        });
    } catch (
      erro
    ) {
      console.error(
        "Erro ao consultar métodos de débito:",
        erro
      );


      return res
        .status(
          erro.status || 500
        )
        .json({
          sucesso:
            false,

          mensagem:
            erro.message ||
            "Não foi possível consultar os métodos de débito.",

          statusMercadoPago:
            erro.status ||
            null,
        });
    }
  }
);


/**
 * =========================================
 * CONSULTAR / RECONCILIAR PAGAMENTO
 * =========================================
 *
 * GET /pagamentos/:id
 *
 * :id é o ID LOCAL da tabela Pagamento.
 *
 * O service utiliza:
 *
 * pagamento.provedorOrdemId
 *
 * para consultar:
 *
 * GET /v1/orders/{orderId}
 */

router.get(
  "/:id",
  autenticar,
  consultarPagamento
);


export default router;