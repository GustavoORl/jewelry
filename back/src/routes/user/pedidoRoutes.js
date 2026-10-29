
import { Router } from "express";

import * as pedidoController from "../../controllers/pedidos/pedidoController.js";
import { autenticar } from "../../middlewares/autenticar.js";

const router = Router();

// Todas as rotas exigem autenticação.
router.use(autenticar);

// Criar um pedido a partir da sacola do usuário.
router.post("/", pedidoController.criar);

export default router;
