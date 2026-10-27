import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Heart,
  ShoppingBag,
  Star,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const filtrosPrincipais = [
  "Todos",
  "Ouro",
  "Prata",
  "Pérola",
  "Zircônia",
];

const imagemPadrao =
  "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=600&q=80";

async function requisicao(endpoint, opcoes = {}) {
  if (!API_URL) {
    throw new Error(
      "A variável VITE_API_URL não está configurada no arquivo .env do frontend."
    );
  }

  const token = sessionStorage.getItem("aurora_token");
  const temBody = opcoes.body !== undefined && opcoes.body !== null;

  const resposta = await fetch(
    `${API_URL.replace(/\/$/, "")}${endpoint}`,
    {
      ...opcoes,
      headers: {
        ...(temBody ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opcoes.headers,
      },
    }
  );

  const resultado =
    resposta.status === 204
      ? {}
      : await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(
      resultado.mensagem ||
        resultado.message ||
        `Erro na requisição (${resposta.status}).`
    );
  }

  return resultado;
}

function formatarPreco(valor) {
  const preco = Number(valor);

  if (!Number.isFinite(preco)) {
    return "R$ 0,00";
  }

  return preco.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Padroniza nomes para comparar materiais com e sem acentos
// e com pequenas variações entre singular e plural.
function normalizarNomeMaterial(nome = "") {
  const nomeNormalizado = nome
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const equivalencias = {
    perolas: "perola",
    zirconias: "zirconia",
  };

  return equivalencias[nomeNormalizado] || nomeNormalizado;
}

function normalizarProduto(produto) {
  const imagens = Array.isArray(produto.imagens)
    ? produto.imagens
    : [];

  const imagem =
    imagens.find((item) => item?.url)?.url ||
    produto.imagem ||
    produto.imagemUrl ||
    imagemPadrao;

  const nomeCategoria =
    typeof produto.categoria === "string"
      ? produto.categoria
      : produto.categoria?.nome || "";

  const materiaisProduto = Array.isArray(produto.materiais)
    ? produto.materiais
        .map((item) => item.material || item)
        .filter((material) => material?.nome)
    : [];

  return {
    ...produto,
    imagem,
    categoriaNome: nomeCategoria,
    ativo: produto.ativo !== false,
    descricao: produto.descricao || "",
    marca: produto.marca || "AURELIA",
    desconto: produto.desconto || "",
    avaliacoes: produto.avaliacoes ?? 0,
    precoAntigo: produto.precoAntigo ?? null,
    materiais: materiaisProduto,
  };
}

function selecionarProdutosAleatorios(produtos, quantidade = 4) {
  const listaEmbaralhada = [...produtos];

  for (let i = listaEmbaralhada.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [listaEmbaralhada[i], listaEmbaralhada[j]] = [
      listaEmbaralhada[j],
      listaEmbaralhada[i],
    ];
  }

  return listaEmbaralhada.slice(0, quantidade);
}

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [filtroAtivo, setFiltroAtivo] = useState("Todos");
  const [favoritos, setFavoritos] = useState([]);
  const [sacola, setSacola] = useState([]);
  const [erroGeral, setErroGeral] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [produtosDestaque, setProdutosDestaque] = useState([]);
  const [materiais, setMateriais] = useState([]);

  const carregarProdutos = useCallback(async () => {
    try {
      setCarregando(true);
      setErroGeral("");

      const [resultado, resultadoMateriais] = await Promise.all([
        requisicao("/produtos"),
        requisicao("/materiais"),
      ]);

      const listaMateriais = Array.isArray(resultadoMateriais)
        ? resultadoMateriais
        : resultadoMateriais.materiais ||
          resultadoMateriais.dados ||
          [];

      setMateriais(
        listaMateriais.filter((material) => material.ativo !== false)
      );

      const lista = Array.isArray(resultado)
        ? resultado
        : resultado.produtos || resultado.dados;

      if (!Array.isArray(lista)) {
        throw new Error("A API não retornou uma lista de produtos.");
      }

      const produtosAtivos = lista
        .filter((produto) => produto.ativo !== false)
        .map(normalizarProduto);

      setProdutos(produtosAtivos);
      setProdutosDestaque(
        selecionarProdutosAleatorios(produtosAtivos, 4)
      );
    } catch (error) {
      setErroGeral(
        error.message || "Não foi possível carregar os produtos."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  // Evita filtros duplicados.
const filtrosVisiveis = [
  ...filtrosPrincipais,
].filter(
  (filtro, indice, lista) =>
    lista.findIndex(
      (item) =>
        normalizarNomeMaterial(item) ===
        normalizarNomeMaterial(filtro)
    ) === indice
);


  // Filtra os produtos pelos materiais associados.
  const produtosFiltrados = (
    normalizarNomeMaterial(filtroAtivo) === "todos"
      ? produtosDestaque
      : produtos.filter((produto) =>
          produto.materiais.some(
            (material) =>
              normalizarNomeMaterial(material.nome) ===
              normalizarNomeMaterial(filtroAtivo)
          )
        )
  ).slice(0, 4);

  function alternarFavorito(id) {
    setFavoritos((atuais) =>
      atuais.includes(id)
        ? atuais.filter((item) => item !== id)
        : [...atuais, id]
    );
  }

  function adicionarSacola(id) {
    setSacola((atuais) => [...atuais, id]);
  }

  return (
    <section className="bg-[#FCFAF6] px-5 py-14 text-[#211C14] sm:px-8 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-[1320px]">
        {/* Cabeçalho e filtros */}
        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-[#A47B43]">
              Seleção da semana
            </p>

            <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
              Os mais desejados
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {filtrosVisiveis.map((filtro) => {
              const ativo =
                normalizarNomeMaterial(filtroAtivo) ===
                normalizarNomeMaterial(filtro);

              return (
                <button
                  key={filtro}
                  type="button"
                  onClick={() => setFiltroAtivo(filtro)}
                  aria-pressed={ativo}
                  className={`rounded-full border px-4 py-2 text-xs transition-all duration-300 ${
                    ativo
                      ? "border-[#211C14] bg-[#211C14] text-white"
                      : "border-[#E8DDCA] bg-transparent hover:border-[#B9975B] hover:bg-[#F3EFE3]"
                  }`}
                >
                  {filtro}
                </button>
              );
            })}
          </div>
        </div>

        {/* Carregamento */}
        {carregando && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="animate-pulse overflow-hidden rounded-[20px] border border-[#EAE0CE] bg-[#F7F2E8]"
              >
                <div className="h-[300px] bg-[#EAE0CE] sm:h-[270px] lg:h-[232px]" />

                <div className="space-y-3 p-4">
                  <div className="h-3 w-1/3 rounded bg-[#EAE0CE]" />
                  <div className="h-4 w-3/4 rounded bg-[#EAE0CE]" />
                  <div className="h-4 w-1/2 rounded bg-[#EAE0CE]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Erro */}
        {!carregando && erroGeral && (
          <div className="rounded-2xl border border-[#E8DDCA] bg-white p-6 text-center">
            <p className="text-sm text-[#8A4B3C]">
              {erroGeral}
            </p>

            <button
              type="button"
              onClick={carregarProdutos}
              className="mt-4 rounded-full bg-[#211C14] px-5 py-2.5 text-xs text-white transition hover:bg-[#4A3D2B]"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Grade de produtos */}
        {!carregando && !erroGeral && (
          <>
            {produtosFiltrados.length === 0 ? (
              <div className="rounded-2xl border border-[#EAE0CE] bg-[#F7F2E8] px-5 py-12 text-center">
                <p className="font-serif text-xl">
                  Nenhuma peça encontrada
                </p>

                <p className="mt-2 text-sm text-[#958777]">
                  Não há produtos disponíveis neste filtro.
                </p>

                <button
                  type="button"
                  onClick={() => setFiltroAtivo("Todos")}
                  className="mt-5 text-sm text-[#968052] underline underline-offset-4 hover:text-[#211C14]"
                >
                  Ver produtos em destaque
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
                {produtosFiltrados.map((produto) => {
                  const favorito = favoritos.includes(produto.id);

                  return (
                    <article
                      key={produto.id}
                      className="group overflow-hidden rounded-[20px] border border-[#EAE0CE] bg-[#F7F2E8] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#211C14]/5"
                    >
                      {/* Imagem e etiquetas */}
                      <div className="relative h-[300px] overflow-hidden bg-white sm:h-[270px] lg:h-[232px]">
                        <Link
                          to={`/produtos/${produto.id}`}
                          aria-label={`Ver ${produto.nome}`}
                          className="block h-full w-full"
                        >
                          <img
                            src={produto.imagem}
                            alt={produto.nome}
                            loading="lazy"
                            onError={(event) => {
                              if (
                                event.currentTarget.src !== imagemPadrao
                              ) {
                                event.currentTarget.src = imagemPadrao;
                              }
                            }}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </Link>

                        {produto.desconto && (
                          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-medium">
                            {produto.desconto}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => alternarFavorito(produto.id)}
                          aria-label={
                            favorito
                              ? "Remover dos favoritos"
                              : "Adicionar aos favoritos"
                          }
                          aria-pressed={favorito}
                          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border bg-white/95 transition-all duration-300 ${
                            favorito
                              ? "border-[#B9975B] text-[#A47B43]"
                              : "border-[#E8DDCA] hover:border-[#B9975B]"
                          }`}
                        >
                          <Heart
                            size={18}
                            fill={favorito ? "currentColor" : "none"}
                          />
                        </button>
                      </div>

                      {/* Informações */}
                      <div className="p-4">
                        <p className="mb-1 text-[9px] tracking-[0.18em] text-[#9B805D]">
                          {produto.marca}
                        </p>

                        <Link
                          to={`/produtos/${produto.id}`}
                          className="block truncate text-xs font-medium transition-colors hover:text-[#9B805D]"
                        >
                          {produto.nome}
                        </Link>

                        {/* Avaliações */}
                        <div className="mt-2 flex items-center gap-2">
                          <div
                            className="flex items-center gap-0.5"
                            aria-label="Avaliação ilustrativa de 5 estrelas"
                          >
                            {[1, 2, 3, 4, 5].map((estrela) => (
                              <Star
                                key={estrela}
                                size={12}
                                strokeWidth={2.5}
                              />
                            ))}
                          </div>

                          <span className="text-[10px] text-[#958777]">
                            ({produto.avaliacoes})
                          </span>
                        </div>

                        {/* Preço e botão */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold">
                              {formatarPreco(produto.preco)}
                            </span>

                            {produto.precoAntigo != null && (
                              <span className="text-[10px] text-[#A69B8B] line-through">
                                {formatarPreco(produto.precoAntigo)}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => adicionarSacola(produto.id)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#211C14] px-3 py-2 text-[10px] font-medium text-white transition-all duration-300 hover:bg-[#4A3D2B] active:scale-95"
                          >
                            <ShoppingBag size={13} />
                            Adicionar
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Novo botão: direciona para a página de catálogo */}
            <div className="mt-10 flex justify-center">
              <Link
                to="/produtos"
                className="group inline-flex items-center gap-3 border border-[#968052] px-7 py-3 text-sm font-medium text-[#968052] transition-all duration-300 hover:bg-[#968052] hover:text-white"
              >
                Ver todos os produtos

                <ArrowRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </div>
          </>
        )}

        {/* Retorno de interação */}
        {sacola.length > 0 && (
          <p className="mt-5 text-right text-xs text-[#857C6F]">
            {sacola.length}{" "}
            {sacola.length === 1
              ? "item adicionado"
              : "itens adicionados"}{" "}
            à sacola
          </p>
        )}
      </div>
    </section>
  );
}
