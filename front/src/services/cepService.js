export async function buscarCep(cep, { signal, fetchImpl = fetch } = {}) {
  const numeros = String(cep).replace(/\D/g, "");
  if (!/^\d{8}$/.test(numeros)) throw new Error("Informe um CEP com 8 dígitos.");
  const resposta = await fetchImpl(`https://viacep.com.br/ws/${numeros}/json/`, { signal, credentials: "omit" });
  if (!resposta.ok) throw new Error("Não foi possível consultar o CEP. Preencha o endereço manualmente.");
  const dados = await resposta.json();
  if (dados.erro) throw new Error("CEP não encontrado. Confira o número ou preencha o endereço manualmente.");
  if (!dados.localidade || !dados.uf) throw new Error("O serviço de CEP não retornou o endereço. Preencha manualmente.");
  return { rua: dados.logradouro || "", bairro: dados.bairro || "", cidade: dados.localidade, estado: dados.uf };
}
