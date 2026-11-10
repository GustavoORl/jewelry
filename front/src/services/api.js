
const API_URL = (
  import.meta.env?.VITE_API_URL || ""
).replace(/\/+$/, "");

let renovacaoEmAndamento = null;
let versaoSessao = 0;
const rotasSemRenovacao = new Set(["/entrar", "/google", "/renovar", "/sair"]);

async function criarErro(resposta) {
  const resultado = await resposta.json().catch(() => null);
  const erro = new Error(
    resultado?.erro || resultado?.mensagem || resultado?.message ||
      "Não foi possível concluir a requisição."
  );
  erro.status = resposta.status;
  return erro;
}

function renovarSessao() {
  if (!renovacaoEmAndamento) {
    renovacaoEmAndamento = (async () => {
      const resposta = await fetch(`${API_URL}/renovar`, {
        method: "POST",
        credentials: "include",
      });
      if (!resposta.ok) throw await criarErro(resposta);
      versaoSessao++;
    })().finally(() => {
      renovacaoEmAndamento = null;
    });
  }
  return renovacaoEmAndamento;
}

// Retorna a Response para também atender endpoints de imagens e outros binários.
export async function apiRequest(caminho, opcoes = {}) {
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

  const configuracao = {
    ...outrasOpcoes,
    body,
    headers,
    credentials: "include",
  };
  const versaoInicial = versaoSessao;
  let resposta = await fetch(`${API_URL}${caminho}`, configuracao);

  const rota = caminho.split("?")[0].replace(/\/+$/, "");
  if (resposta.status === 401 && !rotasSemRenovacao.has(rota)) {
    // Um 401 atrasado pode chegar depois de outra chamada já renovar os cookies.
    if (versaoInicial === versaoSessao) await renovarSessao();
    // Uma única repetição: refresh inválido ou novo 401 não gera um ciclo.
    resposta = await fetch(`${API_URL}${caminho}`, configuracao);
  }

  return resposta;
}

export async function apiFetch(caminho, opcoes = {}) {
  const resposta = await apiRequest(caminho, opcoes);

  if (!resposta.ok) throw await criarErro(resposta);

  const resultado =
    resposta.status === 204
      ? null
      : await resposta.json().catch(() => null);

  return resultado;
}
