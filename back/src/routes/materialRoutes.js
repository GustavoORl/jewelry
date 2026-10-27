
import { Router } from "express";

import {
  cadastrarMaterial,
  obterMateriais,
  obterMaterialPorId,
  atualizarMaterialController,
  excluirMaterialController,
} from "../controllers/materiais/materialController.js";

const router = Router();

router.post("/", cadastrarMaterial);
router.get("/", obterMateriais);
router.get("/:id", obterMaterialPorId);
router.patch("/:id", atualizarMaterialController);
router.delete("/:id", excluirMaterialController);

export default router;
