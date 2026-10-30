import { Router } from "express";
import * as pedidoController from "../../controllers/pedidos/pedidoController.js";
import { autenticar } from "../../middlewares/autenticar.js";

const router = Router();

router.use(autenticar);

router.get("/", pedidoController.listar);
router.get("/:pedidoId", pedidoController.buscarPorId);
router.post("/", pedidoController.criar);

export default router;