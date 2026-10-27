
import { Router } from "express";
import {
  cadastrarUsuario,
  obterUsuarios,
  obterUsuarioPorId,
} from "../../controllers/usuarios/usuarioController.js";

const router = Router();

router.post("/", cadastrarUsuario);
router.get("/", obterUsuarios);
router.get("/:id", obterUsuarioPorId);

export default router;
