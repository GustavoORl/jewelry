
import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api.js";

import {
  AlertCircle,
  ExternalLink,
  LoaderCircle,
} from "lucide-react";

export default function FotoDevolucao({
  id,
  indice = 0,
}) {
  const [url, setUrl] = useState("");
  const [erro, setErro] = useState(false);

  useEffect(() => {
    const controle = new AbortController();
    let urlTemporaria;

    setUrl("");
    setErro(false);

    apiRequest(
      `/devolucoes/fotos/${id}`,
      {
        credentials: "include",
        signal: controle.signal,
      }
    )
      .then((resposta) => {
        if (!resposta.ok) {
          throw new Error(
            "Não foi possível carregar a imagem."
          );
        }

        return resposta.blob();
      })
      .then((blob) => {
        if (controle.signal.aborted) return;

        urlTemporaria =
          URL.createObjectURL(blob);

        setUrl(urlTemporaria);
      })
      .catch(() => {
        if (!controle.signal.aborted) {
          setErro(true);
        }
      });

    return () => {
      controle.abort();

      if (urlTemporaria) {
        URL.revokeObjectURL(
          urlTemporaria
        );
      }
    };
  }, [id]);

  // ============================================================
  // ERRO
  // ============================================================

  if (erro) {
    return (
      <div className="flex h-28 w-28 flex-col items-center justify-center gap-2 rounded-xl border border-[#EAE5DC] bg-[#FAF9F6] p-3 text-center">
        <AlertCircle
          size={20}
          className="text-[#968052]"
        />

        <span className="text-[10px] leading-4 text-[#756C5C]">
          Imagem indisponível
        </span>
      </div>
    );
  }

  // ============================================================
  // CARREGAMENTO
  // ============================================================

  if (!url) {
    return (
      <div
        role="status"
        className="flex h-28 w-28 flex-col items-center justify-center gap-2 rounded-xl border border-[#EAE5DC] bg-[#FAF9F6]"
      >
        <LoaderCircle
          size={20}
          className="animate-spin text-[#968052]"
        />

        <span className="text-[10px] text-[#898174]">
          Carregando...
        </span>
      </div>
    );
  }

  // ============================================================
  // IMAGEM
  // ============================================================

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label={`Abrir imagem ${indice + 1}`}
      className="group relative block h-28 w-28 overflow-hidden rounded-xl border border-[#EAE5DC] bg-white transition-all duration-300 hover:border-[#968052] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#968052]"
    >
      <img
        src={url}
        alt={`Imagem ${indice + 1} da devolução`}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      <div className="absolute inset-0 flex items-center justify-center bg-[#211C14]/0 opacity-0 transition-all duration-300 group-hover:bg-[#211C14]/35 group-hover:opacity-100">
        <ExternalLink
          size={20}
          className="text-white"
        />
      </div>
    </a>
  );
}
