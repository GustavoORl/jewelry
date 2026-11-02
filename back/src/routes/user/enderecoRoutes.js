import { Router } from "express";

import { autenticar } from "../../middlewares/autenticar.js";

import {
  criarEnderecoController,
  listarEnderecosController,
  buscarEnderecoController,
  atualizarEnderecoController,
  definirEnderecoPrincipalController,
  excluirEnderecoController,
} from "../../controllers/enderecos/enderecoController.js";


const router =
  Router();


/**
 * =========================================
 * CRIAR ENDEREÇO
 * =========================================
 *
 * POST /enderecos
 */

router.post(
  "/",
  autenticar,
  criarEnderecoController
);


/**
 * =========================================
 * LISTAR ENDEREÇOS
 * =========================================
 *
 * GET /enderecos
 */

router.get(
  "/",
  autenticar,
  listarEnderecosController
);


/**
 * =========================================
 * DEFINIR ENDEREÇO PRINCIPAL
 * =========================================
 *
 * PATCH /enderecos/:id/principal
 */

router.patch(
  "/:id/principal",
  autenticar,
  definirEnderecoPrincipalController
);


/**
 * =========================================
 * BUSCAR ENDEREÇO
 * =========================================
 *
 * GET /enderecos/:id
 */

router.get(
  "/:id",
  autenticar,
  buscarEnderecoController
);


/**
 * =========================================
 * ATUALIZAR ENDEREÇO
 * =========================================
 *
 * PATCH /enderecos/:id
 */

router.patch(
  "/:id",
  autenticar,
  atualizarEnderecoController
);


/**
 * =========================================
 * EXCLUIR ENDEREÇO
 * =========================================
 *
 * DELETE /enderecos/:id
 */

router.delete(
  "/:id",
  autenticar,
  excluirEnderecoController
);


export default router;