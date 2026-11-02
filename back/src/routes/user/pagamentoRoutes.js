import { Router } from "express";

import {
  criarPagamentoPix,
  criarPagamentoCartao,
  consultarPagamento,
  recuperarPagamentoPedido,
  diagnosticarIntegracaoMercadoPago,
} from "../../controllers/pagamentos/pagamentoController.js";

import {
  listarMetodosPagamentoMercadoPago,
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
 * Cria uma Order no Mercado Pago:
 *
 * POST /v1/orders
 *
 * processing_mode = automatic
 *
 * payment_method:
 *
 * id   = pix
 * type = bank_transfer
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
 * Cria uma Order no Mercado Pago:
 *
 * POST /v1/orders
 *
 * processing_mode = automatic
 *
 * O token do cartão é gerado no frontend
 * pelo MercadoPago.js / Card Payment Brick.
 *
 * O backend recebe:
 *
 * - pedidoId
 * - token
 * - paymentMethodId
 * - installments
 * - payer
 *
 * e cria a transação dentro da Order.
 */

router.post(
  "/cartao",
  autenticar,
  criarPagamentoCartao
);


/**
 * =========================================
 * RECUPERAR ÚLTIMO PAGAMENTO DO PEDIDO
 * =========================================
 *
 * GET /pagamentos/pedido/:pedidoId
 *
 * Recupera o pagamento local mais recente
 * associado ao pedido.
 *
 * Pode retornar informações de:
 *
 * - PIX
 * - CREDITO
 *
 * Essa rota é útil quando:
 *
 * - a página é recarregada;
 * - o usuário retorna ao checkout;
 * - precisamos recuperar o QR Code Pix;
 * - precisamos verificar o último status
 *   conhecido localmente.
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
 * Utiliza:
 *
 * MERCADO_PAGO_ACCESS_TOKEN
 *
 * da aplicação utilizada pelos pagamentos:
 *
 * - PIX
 * - crédito
 *
 * Os pagamentos são processados
 * através da Orders API.
 */

router.get(
  "/diagnostico/mercado-pago",
  autenticar,
  diagnosticarIntegracaoMercadoPago
);


/**
 * =========================================
 * DEBUG - MÉTODOS DE PAGAMENTO
 * =========================================
 *
 * GET /pagamentos/debug/metodos-pagamento
 *
 * Consulta:
 *
 * GET /v1/payment_methods
 *
 * Esta rota não cria pagamentos.
 *
 * Ela existe apenas para diagnóstico e
 * permite verificar os métodos disponíveis
 * para as credenciais atuais.
 */

router.get(
  "/debug/metodos-pagamento",
  autenticar,
  async (
    req,
    res
  ) => {
    try {
      const metodos =
        await listarMetodosPagamentoMercadoPago();

      return res
        .status(200)
        .json({
          sucesso:
            true,

          metodos,
        });
    } catch (
      erro
    ) {
      console.error(
        "Erro ao consultar métodos de pagamento:",
        erro
      );

      return res
        .status(
          erro.status ||
          500
        )
        .json({
          sucesso:
            false,

          mensagem:
            erro.message ||
            "Não foi possível consultar os métodos de pagamento.",

          statusMercadoPago:
            erro.status ||
            null,

          detalhes:
            erro.detalhes ||
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
 * IMPORTANTE:
 *
 * :id continua sendo o ID LOCAL
 * da tabela Pagamento.
 *
 * O frontend NÃO precisa conhecer
 * diretamente o ID da Order.
 *
 * Fluxo:
 *
 * pagamento.id
 *      ↓
 * buscar Pagamento local
 *      ↓
 * provedorOrdemId
 *      ↓
 * GET /v1/orders/{orderId}
 *      ↓
 * Mercado Pago
 *      ↓
 * interpretar status da Order
 *      ↓
 * atualizar Pagamento local
 *      ↓
 * se aprovado:
 * Pedido -> PAGO
 */

router.get(
  "/:id",
  autenticar,
  consultarPagamento
);


export default router;