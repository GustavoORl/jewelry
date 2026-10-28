import { useEffect, useState } from "react";

export default function useImagensCarregadas(ref) {
  const [imagensCarregadas, setImagensCarregadas] = useState(false);

  useEffect(() => {
    const elemento = ref.current;

    if (!elemento) return;

    let cancelado = false;

    async function verificarImagens() {
      const imagens = Array.from(elemento.querySelectorAll("img"));

      await Promise.all(
        imagens.map((imagem) => {
          if (imagem.complete) {
            return imagem.decode?.().catch(() => {});
          }

          return new Promise((resolve) => {
            imagem.addEventListener("load", resolve, { once: true });
            imagem.addEventListener("error", resolve, { once: true });
          });
        })
      );

      if (!cancelado) {
        setImagensCarregadas(true);
      }
    }

    verificarImagens();

    return () => {
      cancelado = true;
    };
  }, [ref]);

  return imagensCarregadas;
}