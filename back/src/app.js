
import express from "express";
import cors from "cors";

import usuarioRoutes from "./routes/usuarioRoutes.js";
import produtoRoutes from "./routes/produtoRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
}));

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    sucesso: true,
    mensagem: "API da AURELIA funcionando!",
  });
});

app.use("/api/usuarios", usuarioRoutes);
app.use("/api/produtos", produtoRoutes);
app.use("/api/auth", authRoutes);

export default app;
