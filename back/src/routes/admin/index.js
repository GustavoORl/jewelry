import { Router } from "express";

import { autenticar } from "../../middlewares/autenticar.js";
import { autorizarAdmin } from "../../middlewares/autorizarAdmin.js";

import usuarioRoutes from "./usuarioRoutes.js";
import produtoRoutes from "./produtoRoutes.js";
import categoriaRoutes from "./categoriaRoutes.js";
import materialRoutes from "./materialRoutes.js";
import pedidoRoutes from "./pedidoRoutes.js"
import dashboardRoutes from "./dashboardRoutes.js"

const router = Router();

// Todas as rotas abaixo exigem autenticação e perfil ADMIN.
router.use(autenticar, autorizarAdmin);

router.use("/usuarios", usuarioRoutes);
router.use("/produtos", produtoRoutes);
router.use("/categorias", categoriaRoutes);
router.use("/materiais", materialRoutes);
router.use("/pedidos", pedidoRoutes)
router.use("/dashboard", dashboardRoutes);

export default router;