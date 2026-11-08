
import express from "express";
import { conversaRoutes, notificacaoRoutes } from "./routes/contatoRoutes.js";
import { editorialPublico, devolucoesCliente } from "./routes/novidadesRoutes.js";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/public/authRoutes.js";

import produtoPublicoRoutes from "./routes/public/produtoRoutes.js";
import categoriaPublicaRoutes from "./routes/public/categoriaRoutes.js";
import materialPublicoRoutes from "./routes/public/materialRoutes.js";
import webhookRoutes from "./routes/public/webhookRoutes.js"
import usuarioPublicoRoutes from "./routes/public/usuarioRoutes.js";
import promocaoPublicoRoutes from "./routes/public/promocaoRoutes.js";

import sacolaUserRoutes from "./routes/user/sacolaRoutes.js"
import pedidoUserRoutes from "./routes/user/pedidoRoutes.js"
import favoritoUserRoutes from "./routes/user/favoritoRoutes.js"
import pagamentoUserRoutes from "./routes/user/pagamentoRoutes.js";
import enderecoRoutes from "./routes/user/enderecoRoutes.js";
import usuarioUserRoutes from "./routes/user/usuarioRoutes.js";

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


app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/devolucoes", conversaRoutes);
app.use("/notificacoes", notificacaoRoutes);

app.use("/webhooks", webhookRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    sucesso: true,
    mensagem: "API da AURORA funcionando!",
  });
});

// Rotas públicas
app.use("/editorial", editorialPublico);
app.use("/devolucoes", devolucoesCliente);
app.use("/", authRoutes);
app.use("/usuario", usuarioPublicoRoutes);
app.use("/produtos", produtoPublicoRoutes);
app.use("/categorias", categoriaPublicaRoutes);
app.use("/materiais", materialPublicoRoutes);
app.use("/promocoes", promocaoPublicoRoutes);

// Rotas Usuários logados
app.use("/usuario", usuarioUserRoutes);
app.use("/sacola",sacolaUserRoutes);
app.use("/pedidos", pedidoUserRoutes);
app.use("/favoritos", favoritoUserRoutes);
app.use("/pagamentos", pagamentoUserRoutes);
app.use("/enderecos", enderecoRoutes);

// Rotas administrativas
app.use("/admin", adminRoutes);

export default app;
