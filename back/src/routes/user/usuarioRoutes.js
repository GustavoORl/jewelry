import { Router } from "express";

import {
  atualizarMeuPerfil,
  alterarMinhaSenha,
} from "../../controllers/usuarios/usuarioController.js";

import {
  autenticar,
} from "../../middlewares/autenticar.js";


const router = Router();


router.use(autenticar);


/**
 * PATCH /usuarios/me
 *
 * Atualiza os dados do usuário autenticado.
 */
router.patch(
  "/me",
  atualizarMeuPerfil
);


/**
 * PATCH /usuarios/me/senha
 *
 * Altera a senha do usuário autenticado.
 */
router.patch(
  "/me/senha",
  alterarMinhaSenha
);


export default router;