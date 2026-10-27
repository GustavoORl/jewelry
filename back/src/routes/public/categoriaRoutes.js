import { Router } from "express";
import { obterCategorias, obterCategoriaPorId } from "../../controllers/categorias/categoriaController.js";

const router = Router();

router.get("/", obterCategorias);
router.get("/:id", obterCategoriaPorId);


export default router;
