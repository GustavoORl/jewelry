import { Router } from "express";
import { login, 
         loginGoogle,
         renovar, 
         logout, 
         obterUsuarioAutenticado } from "../../controllers/auth/authController.js";

import { autenticar } from "../../middlewares/autenticar.js";

const router = Router();

router.post("/entrar", login);

// Login com Google
router.post("/google", loginGoogle);

router.post("/renovar", renovar);
router.post("/sair", logout);

router.get("/me", autenticar, obterUsuarioAutenticado);

export default router;