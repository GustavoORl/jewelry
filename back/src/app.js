
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/public/authRoutes.js";

import produtoPublicoRoutes from "./routes/public/produtoRoutes.js";
import categoriaPublicaRoutes from "./routes/public/categoriaRoutes.js";
import materialPublicoRoutes from "./routes/public/materialRoutes.js";

import sacolaUserRoutes from "./routes/user/sacolaRoutes.js"
import pedidoUserRoutes from "./routes/user/pedidoRoutes.js"
import favoritoUserRoutes from "./routes/user/favoritoRoutes.js"

import adminRoutes from "./routes/admin/index.js";

const app = express();


const origensPermitidas = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://192.168.100.64:5173",
  process.env.FRONT_URL,
];

app.use(
  cors({
    origin: origensPermitidas,
    credentials: true,
  })
);


app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.status(200).json({
    sucesso: true,
    mensagem: "API da AURORA funcionando!",
  });
});

// Rotas públicas
app.use("/", authRoutes);
app.use("/produtos", produtoPublicoRoutes);
app.use("/categorias", categoriaPublicaRoutes);
app.use("/materiais", materialPublicoRoutes);

// Rotas Usuários logados
app.use("/sacola",sacolaUserRoutes);
app.use("/pedidos", pedidoUserRoutes);
app.use("/favoritos", favoritoUserRoutes);

// Rotas administrativas
app.use("/admin", adminRoutes);

export default app;
