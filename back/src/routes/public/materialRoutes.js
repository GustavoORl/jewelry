import { Router } from "express";

import {
  obterMateriais,
  obterMaterialPorId,
} from "../../controllers/materiais/materialController.js";

const router = Router();

router.get("/", obterMateriais);
router.get("/:id", obterMaterialPorId);

export default router;