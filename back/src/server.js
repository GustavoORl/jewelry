import "dotenv/config";
import app from "./app.js";

import {
  iniciarRotinaExpiracaoPedidos,
} from "./services/expiracaoPedidoService.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", ()=>{
    console.log(`Api rodando na porta ${PORT}`);

    iniciarRotinaExpiracaoPedidos();
});
