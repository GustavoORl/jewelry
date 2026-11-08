// Upload temporário no bucket de imagens públicas do editorial, removido ao final.
import "dotenv/config";
import assert from "node:assert/strict";
import { enviarImagem, excluirImagem } from "../src/services/imagemService.js";
const buffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf2kAAAAASUVORK5CYII=", "base64");
let imagem;
try {
  imagem = await enviarImagem({ mimetype: "image/png", size: buffer.length, buffer }, "editorial-qa");
  assert.ok(imagem.url.startsWith("https://"));
  const resposta = await fetch(imagem.url);
  assert.equal(resposta.status, 200);
  assert.deepEqual(Buffer.from(await resposta.arrayBuffer()), buffer);
  console.log("Armazenamento: upload e leitura de foto editorial aprovados.");
} finally {
  if (imagem) { await excluirImagem(imagem.caminho); console.log("Foto temporária removida."); }
}
