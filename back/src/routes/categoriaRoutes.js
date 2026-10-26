import { Router } from "express";
import {
  cadastrarCategoria,
  obterCategorias,
  obterCategoriaPorId,
  excluirCategoriaController,
  atualizarCategoriaController,
  atualizarStatusCategoriaController
} from "../controllers/categorias/categoriaController.js";

import { uploadImagem, } from "../middlewares/uploadMiddleware.js";

const router = Router();

router.get("/", obterCategorias);
router.get("/:id", obterCategoriaPorId);

router.post("/", uploadImagem.single("imagem"), cadastrarCategoria);

router.patch("/:id", uploadImagem.single("imagem"), atualizarCategoriaController);

router.patch("/:id/status", atualizarStatusCategoriaController);

router.delete("/delete/:id", excluirCategoriaController);

export default router;
