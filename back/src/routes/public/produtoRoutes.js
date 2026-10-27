import { Router } from "express";

import { obterProdutos, obterProdutoPorId } from "../../controllers/produtos/produtoController.js";

const router = Router();

router.get("/", obterProdutos);
router.get("/:id", obterProdutoPorId);

export default router;