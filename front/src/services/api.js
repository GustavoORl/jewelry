
const API_URL = (
  import.meta.env.VITE_API_URL
).replace(/\/+$/, "");

export async function apiFetch(caminho, opcoes = {}) {
  const { headers: headersOriginais, body, ...outrasOpcoes } = opcoes;

  const headers = { ...headersOriginais };
  const ehFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  // FormData precisa que o navegador defina o Content-Type
  // automaticamente, incluindo o boundary do multipart.
  if (ehFormData) {
    delete headers["Content-Type"];
    delete headers["content-type"];
  } else if (body != null && !(body instanceof Blob)) {
    if (!headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json";
    }
  }

  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...outrasOpcoes,
    body,
    headers,
    credentials: "include",
  });

  const resultado =
    resposta.status === 204
      ? null
      : await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new Error(
      resultado?.mensagem ||
        resultado?.message ||
        "Não foi possível concluir a requisição."
    );
  }

  return resultado;
}
