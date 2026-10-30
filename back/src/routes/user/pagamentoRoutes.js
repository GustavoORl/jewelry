import { Router } from "express";
import { criarPagamentoPix, consultarPagamento } from "../../controllers/pagamentos/pagamentoController.js";
import { autenticar } from "../../middlewares/autenticar.js";

const router = Router();

router.post("/pix", autenticar, criarPagamentoPix);
router.get("/:id", autenticar, consultarPagamento);

export default router;