import { Router } from "express";

import * as promocaoController from "../../controllers/promocoes/promocaoController.js";

const router = Router();

router.get("/", promocaoController.listar);

export default router;
