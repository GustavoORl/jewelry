import { randomUUID } from "node:crypto";
import { supabase } from "../config/supabase.js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "aurora-imagens";

const TIPOS_PERMITIDOS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function enviarImagem(arquivo, pasta = "produtos") {
  if (!arquivo) {
    throw new Error("Nenhuma imagem foi enviada.");
  }

  const extensao = TIPOS_PERMITIDOS[arquivo.mimetype];

  if (!extensao) {
    throw new Error("Formato inválido. Envie uma imagem JPG, PNG ou WebP.");
  }

  // Limite de 5 MB
  if (arquivo.size > 5 * 1024 * 1024) {
    throw new Error("A imagem deve ter no máximo 5 MB.");
  }

  const caminho = `${pasta}/${randomUUID()}.${extensao}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, arquivo.buffer, {
      contentType: arquivo.mimetype,
      upsert: false,
    });

  if (error) {
    console.error("Erro no upload para o Supabase:", error.message);
    throw new Error("Não foi possível enviar a imagem.");
  }

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(caminho);

  return {
    caminho,
    url: data.publicUrl,
  };
}

export async function excluirImagem(caminho) {
  if (!caminho) return;

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([caminho]);

  if (error) {
    console.error("Erro ao excluir imagem:", error.message);
    throw new Error("Não foi possível excluir a imagem do armazenamento.");
  }
}