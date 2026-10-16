
import { Router } from "express";
import {
  cadastrarProduto,
  obterProdutos,
  obterProdutoPorId,
} from "../controllers/produtos/produtoController";

const router = Router();

router.get("/", obterProdutos);
router.get("/:id", obterProdutoPorId);
router.post("/", cadastrarProduto);

export default router;
