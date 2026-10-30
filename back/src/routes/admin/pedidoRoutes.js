import { Router } from "express";

import * as pedidoController from "../../controllers/pedidos/pedidoController.js";

const router = Router();

router.get("/", pedidoController.listarTodos);

router.patch(
  "/:pedidoId/status",
  pedidoController.atualizarStatus
);

export default router;