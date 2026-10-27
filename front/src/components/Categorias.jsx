import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const imagemPadrao =
  "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=600&q=80";

async function requisicao(endpoint) {
  if (!API_URL) {
    throw new Error(
      "A variável VITE_API_URL não está configurada no frontend."
    );
  }

  const resposta = await fetch(
    `${API_URL.replace(/\/$/, "")}${endpoint}`
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

function gerarSlug(nome) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizarCategoria(categoria) {
  return {
    ...categoria,
    nome: categoria.nome || "Categoria",
    slug: categoria.slug || gerarSlug(categoria.nome || "categoria"),
    imagem:
      categoria.imagem ||
      categoria.imagemUrl ||
      categoria.imagens?.[0]?.url ||
      imagemPadrao,
  };
}

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregarCategorias = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const resultado = await requisicao("/categorias");

      const lista = Array.isArray(resultado)
        ? resultado
        : resultado.categorias || resultado.dados;

      if (!Array.isArray(lista)) {
        throw new Error(
          "A API não retornou uma lista de categorias."
        );
      }

      setCategorias(
        lista
          .filter((categoria) => categoria.ativo !== false)
          .map(normalizarCategoria)
      );
    } catch (error) {
      setErro(
        error.message || "Não foi possível carregar as categorias."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarCategorias();
  }, [carregarCategorias]);

  return (
    <section className="bg-[#FCFAF6] px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-[1320px]">
        {/* Cabeçalho */}
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-[#A47B43]">
              Compre por categoria
            </p>

            <h2 className="font-serif text-2xl leading-tight tracking-tight text-[#211C14] sm:text-3xl">
              Coleções que vestem todos os momentos
            </h2>
          </div>

          <a
            href="/colecoes"
            className="group hidden shrink-0 items-center gap-2 pb-1 text-xs font-medium sm:inline-flex"
          >
            <span>Ver todas as coleções</span>
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </a>
        </div>

        {/* Carregamento */}
        {carregando && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-[240px] animate-pulse rounded-[20px] bg-[#E9E0D1] sm:h-[300px] lg:h-[312px]"
              />
            ))}
          </div>
        )}

        {/* Erro */}
        {!carregando && erro && (
          <div className="rounded-2xl border border-[#E8DDCA] bg-white p-6 text-center">
            <p className="text-sm text-[#8A4B3C]">{erro}</p>

            <button
              type="button"
              onClick={carregarCategorias}
              className="mt-4 rounded-full bg-[#211C14] px-5 py-2.5 text-xs text-white transition hover:bg-[#4A3D2B]"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Categorias cadastradas */}
        {!carregando && !erro && (
          <>
            {categorias.length === 0 ? (
              <div className="rounded-2xl border border-[#EAE0CE] bg-[#F7F2E8] px-5 py-12 text-center">
                <p className="font-serif text-xl text-[#211C14]">
                  Nenhuma categoria disponível
                </p>

                <p className="mt-2 text-sm text-[#958777]">
                  As categorias cadastradas aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
                {categorias.map((categoria) => (
                  <a
                    key={categoria.id ?? categoria.slug}
                    href={`/categoria/${categoria.slug}`}
                    className="group relative block h-[240px] overflow-hidden rounded-[20px] bg-[#E9E0D1] sm:h-[300px] lg:h-[312px]"
                  >
                    {/* Imagem */}
                    <img
                      src={categoria.imagem}
                      alt={`Joias da categoria ${categoria.nome}`}
                      loading="lazy"
                      onError={(event) => {
                        if (event.currentTarget.src !== imagemPadrao) {
                          event.currentTarget.src = imagemPadrao;
                        }
                      }}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />

                    {/* Gradiente */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-70" />

                    {/* Informações */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 rounded-xl border border-white/60 bg-[#FCFAF6]/95 px-3 py-2.5 backdrop-blur-sm transition-all duration-300 group-hover:bg-white">
                      <div className="min-w-0">
                        <h3 className="truncate text-xs font-medium text-[#211C14] sm:text-sm">
                          {categoria.nome}
                        </h3>

                        {categoria.quantidadeProdutos != null && (
                          <p className="mt-0.5 text-[10px] text-[#8B8174]">
                            {categoria.quantidadeProdutos}{" "}
                            {categoria.quantidadeProdutos === 1
                              ? "peça"
                              : "peças"}
                          </p>
                        )}
                      </div>

                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E9DCC4] text-[#211C14] transition-all duration-300 group-hover:border-[#211C14] group-hover:bg-[#211C14] group-hover:text-white">
                        <ArrowUpRight size={16} />
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </>
        )}

        {/* Link para telas pequenas */}
        <div className="mt-6 sm:hidden">
          <a
            href="/colecoes"
            className="inline-flex items-center gap-2 text-sm font-medium"
          >
            Ver todas as coleções
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
