import { Router } from "express";
import { editorialAdmin, devolucoesAdmin } from "../novidadesRoutes.js";

import { autenticar } from "../../middlewares/autenticar.js";
import { autorizarAdmin } from "../../middlewares/autorizarAdmin.js";

import usuarioRoutes from "./usuarioRoutes.js";
import produtoRoutes from "./produtoRoutes.js";
import categoriaRoutes from "./categoriaRoutes.js";
import materialRoutes from "./materialRoutes.js";
import pedidoRoutes from "./pedidoRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import promocaoRoutes from "./promocaoRoutes.js";

const router = Router();

// Todas as rotas abaixo exigem autenticação e perfil ADMIN.
router.use(autenticar, autorizarAdmin);
router.use("/editorial", editorialAdmin);
router.use("/devolucoes", devolucoesAdmin);

router.use("/usuarios", usuarioRoutes);
router.use("/produtos", produtoRoutes);
router.use("/categorias", categoriaRoutes);
router.use("/materiais", materialRoutes);
router.use("/pedidos", pedidoRoutes)
router.use("/dashboard", dashboardRoutes);
router.use("/promocao", promocaoRoutes);

export default router;
