
import multer from "multer";

const tiposPermitidos = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const uploadImagem = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 4 * 1024 * 1024, // 4 MB por imagem
    files: 10, // Até 10 imagens por requisição
  },

  fileFilter: (req, arquivo, callback) => {
    if (!tiposPermitidos.includes(arquivo.mimetype)) {
      return callback(
        new Error("Formato inválido. Envie JPG, PNG ou WebP.")
      );
    }

    callback(null, true);
  },
});
