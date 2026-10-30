import { Router } from "express";
import * as favoritoController from "../../controllers/favoritos/favoritoController.js";
import { autenticar } from "../../middlewares/autenticar.js";

const router = Router();

router.use(autenticar);

router.get("/", favoritoController.listar);
router.post("/:produtoId", favoritoController.adicionar);
router.delete("/:produtoId", favoritoController.remover);

export default router;
