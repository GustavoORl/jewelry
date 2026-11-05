import { Router } from "express";

import * as promocaoController from "../../controllers/promocoes/promocaoController.js";

const router = Router();


router.get("/", promocaoController.listarAdmin);

router.get("/:id", promocaoController.buscar);

router.post("/", promocaoController.criar);

router.put("/:id", promocaoController.atualizar);

router.patch("/:id/status", promocaoController.alterarStatus);

router.delete("/:id", promocaoController.excluir);

export default router;