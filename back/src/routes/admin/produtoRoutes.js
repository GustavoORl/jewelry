import { Router } from "express";
import {
  cadastrarProduto,
  obterProdutosAdmin,
  obterProdutoPorId,
  excluirProdutoController,
  atualizarProdutoController,
  atualizarStatusProdutoController
} from "../../controllers/produtos/produtoController.js";

import { uploadImagem } from "../../middlewares/uploadMiddleware.js";

const router = Router();

router.get("/", obterProdutosAdmin);
router.get("/:id", obterProdutoPorId);

router.post("/", uploadImagem.array("imagens", 10), cadastrarProduto);

router.patch("/:id", uploadImagem.array("imagens", 10), atualizarProdutoController);
router.patch("/:id/status", atualizarStatusProdutoController);

router.delete("/:id", excluirProdutoController);

export default router;