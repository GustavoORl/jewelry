import { Router } from "express";

import {
  cadastrarUsuario,
} from "../../controllers/usuarios/usuarioController.js";

const router = Router();


/**
 * POST /usuarios
 *
 * Cadastro de um novo cliente.
 */
router.post(
  "/",
  cadastrarUsuario
);


export default router;