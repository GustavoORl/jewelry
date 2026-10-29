import { Router } from "express";

import * as sacolaController from "../../controllers/sacolas/sacolaController.js";
import { autenticar } from "../../middlewares/autenticar.js";

const router = Router();

// Todas as rotas exigem autenticação.
router.use(autenticar);

// Consultar a sacola do usuário autenticado.
router.get("/", sacolaController.consultar);

// Adicionar um produto à sacola.
router.post("/itens", sacolaController.adicionarItem);

// Alterar a quantidade de um item.
router.patch("/itens/:itemId", sacolaController.alterarQuantidade);

// Remover um item da sacola.
router.delete("/itens/:itemId", sacolaController.removerItem);

// Esvaziar a sacola.
router.delete("/", sacolaController.esvaziar);

export default router;
