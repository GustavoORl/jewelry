import { Router } from "express";

import {
  receberWebhookPagamento,
} from "../../controllers/pagamentos/webhookPagamentoController.js";

const router = Router();

router.post("/mercado-pago", receberWebhookPagamento);

export default router;