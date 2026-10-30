import "dotenv/config";
import { MercadoPagoConfig } from "mercadopago";

if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
  throw new Error("MERCADO_PAGO_ACCESS_TOKEN não foi configurado.");
}

export const mercadoPago = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});