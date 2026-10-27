import { Router } from "express";
import {
  cadastrarProduto,
  obterProdutos,
  obterProdutoPorId,
  excluirProdutoController,
  atualizarProdutoController,
  atualizarStatusProdutoController
} from "../../controllers/produtos/produtoController.js";

import { uploadImagem } from "../../middlewares/uploadMiddleware.js";

const router = Router();

router.get("/", obterProdutos);
router.get("/:id", obterProdutoPorId);

router.post("/", uploadImagem.single("imagem"), cadastrarProduto);

router.patch("/:id", uploadImagem.single("imagem"), atualizarProdutoController);
router.patch("/:id/status", atualizarStatusProdutoController);

router.delete("/:id", excluirProdutoController);

export default router;