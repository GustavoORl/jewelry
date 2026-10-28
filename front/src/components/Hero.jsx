
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  Star,
  Play,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import { apiFetch } from "../services/api.js";
import { ocultarCapa } from "../utils/loadingScreen.js";

const imagemPadrao =
  "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=600&q=80";

function obterImagem(produto) {
  if (Array.isArray(produto.imagens)) {
    const imagem = produto.imagens.find((item) => item?.url)?.url;

    if (imagem) return imagem;
  }

  return produto.imagem || produto.imagemUrl || imagemPadrao;
}

function formatarPreco(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function Hero() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [imagensCarregadas, setImagensCarregadas] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function carregarProdutos() {
      try {
        const resposta = await apiFetch("/produtos");

        const lista = Array.isArray(resposta)
          ? resposta
          : resposta?.produtos || resposta?.dados || [];

        const produtosAtivos = lista.filter(
          (produto) => produto.ativo !== false
        );

        if (!cancelado) {
          setProdutos(produtosAtivos.slice(0, 3));
        }
      } catch (erro) {
        console.error("Erro ao carregar produtos do Hero:", erro);

        if (!cancelado) {
          setProdutos([]);
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    carregarProdutos();

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (carregando) return;

    if (produtos.length === 0) {
      setImagensCarregadas(true);
      return;
    }

    let cancelado = false;

    async function verificarImagens() {
      await Promise.all(
        produtos.map(
          (produto) =>
            new Promise((resolve) => {
              const imagem = new Image();

              imagem.onload = () => resolve();
              imagem.onerror = () => resolve();
              imagem.src = obterImagem(produto);

              if (imagem.complete) resolve();
            })
        )
      );

      if (!cancelado) {
        setImagensCarregadas(true);
      }
    }

    verificarImagens();

    return () => {
      cancelado = true;
    };
  }, [carregando, produtos]);

  useEffect(() => {
    if (imagensCarregadas) {
      ocultarCapa();
    }
  }, [imagensCarregadas]);

  const produtoPrincipal = produtos[0];
  const produtoSecundario = produtos[1];
  const produtoDestaque = produtos[2];

  return (
    <section className="overflow-hidden bg-[#F8F3E8] px-5 py-5 text-[#211C14] sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-[1320px] items-center gap-10 lg:min-h-[520px] lg:grid-cols-[0.9fr_1.1fr] lg:gap-3">
        {/* COLUNA ESQUERDA */}
        <div className="flex flex-col items-start">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#E9DCC4] bg-[#FCFAF5] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B9975B]" />

            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8A6531]">
              Nova coleção · AURORA
            </span>
          </div>

          <h1 className="max-w-[500px] font-serif text-4xl leading-[1.05] tracking-[-0.035em] sm:text-5xl lg:text-[45px] xl:text-[55px]">
            Brilho de alta joalheria, preço de semijoia
          </h1>

          <p className="mt-5 max-w-[390px] text-sm leading-[1.65] text-[#857C6F]">
            Descubra peças selecionadas para valorizar sua
            beleza. Encontre sua próxima joia favorita na
            curadoria da AURORA.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/produtos"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#211C14] px-6 text-xs font-medium text-white transition-all duration-300 hover:bg-[#4A3D2B] hover:shadow-md"
            >
              Explorar coleções
            </Link>

            <a
              href="#editorial"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#B7A78C] px-6 text-xs font-medium transition-all duration-300 hover:bg-[#EDE3D1]"
            >
              <Play size={14} />
              Ver editorial
            </a>
          </div>

          <div className="mt-8 grid w-full max-w-[440px] grid-cols-3">
            <div className="border-r border-[#E7DCC9] pr-3">
              <p className="font-serif text-2xl leading-none">AURORA</p>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-[#958777]">
                <Star size={11} fill="currentColor" />
                Curadoria especial
              </p>
            </div>

            <div className="border-r border-[#E7DCC9] px-4">
              <p className="font-serif text-2xl leading-none">Exclusiva</p>
              <p className="mt-1 text-[10px] text-[#958777]">
                Sua próxima joia
              </p>
            </div>

            <div className="pl-4">
              <p className="font-serif text-2xl leading-none">Detalhes</p>
              <p className="mt-1 text-[10px] text-[#958777]">
                Que encantam
              </p>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="relative mx-auto w-full max-w-[520px] lg:max-w-none">
          <div className="grid grid-cols-[1.05fr_0.95fr] items-center gap-3 sm:gap-5">
            {/* PRODUTO PRINCIPAL */}
            {produtoPrincipal ? (
              <Link
                to={`/produtos/${produtoPrincipal.id}`}
                aria-label={`Ver ${produtoPrincipal.nome}`}
                className="group block h-[250px] overflow-hidden rounded-[22px] bg-[#E6D9C4] sm:h-[365px] lg:h-[375px] xl:h-[420px]"
              >
                <img
                  src={obterImagem(produtoPrincipal)}
                  alt={produtoPrincipal.nome}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </Link>
            ) : (
              <div className="flex h-[250px] items-center justify-center rounded-[22px] bg-[#E6D9C4] sm:h-[365px] lg:h-[375px] xl:h-[420px]">
                <Sparkles size={32} className="text-[#968052]" />
              </div>
            )}

            {/* COLUNA SECUNDÁRIA */}
            <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
              {produtoSecundario ? (
                <Link
                  to={`/produtos/${produtoSecundario.id}`}
                  aria-label={`Ver ${produtoSecundario.nome}`}
                  className="group block h-[175px] overflow-hidden rounded-[20px] bg-[#E6D9C4] sm:h-[275px] lg:h-[245px]"
                >
                  <img
                    src={obterImagem(produtoSecundario)}
                    alt={produtoSecundario.nome}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </Link>
              ) : (
                <div className="flex h-[175px] items-center justify-center rounded-[20px] bg-[#E6D9C4] sm:h-[275px] lg:h-[245px]">
                  <Sparkles size={28} className="text-[#968052]" />
                </div>
              )}

              {/* TERCEIRO PRODUTO */}
              {produtoDestaque ? (
                <div className="flex min-h-[76px] items-center gap-2 rounded-[18px] border border-[#E9DCC4] bg-[#FCFAF5] p-2 sm:min-h-[88px] sm:gap-3 sm:p-3">
                  <Link
                    to={`/produtos/${produtoDestaque.id}`}
                    aria-label={`Ver ${produtoDestaque.nome}`}
                    className="h-10 w-10 shrink-0 overflow-hidden rounded-xl sm:h-12 sm:w-12"
                  >
                    <img
                      src={obterImagem(produtoDestaque)}
                      alt={produtoDestaque.nome}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <p className="text-[8px] uppercase tracking-[0.12em] text-[#9B7947] sm:text-[9px] sm:tracking-[0.18em]">
                      Em destaque
                    </p>

                    <Link
                      to={`/produtos/${produtoDestaque.id}`}
                      className="block truncate text-[10px] font-medium hover:underline sm:text-xs"
                    >
                      {produtoDestaque.nome}
                    </Link>

                    <p className="mt-1 whitespace-nowrap text-[10px] font-semibold sm:text-xs">
                      {formatarPreco(produtoDestaque.preco)}
                    </p>
                  </div>

                  <Link
                    to={`/produtos/${produtoDestaque.id}`}
                    aria-label={`Ver detalhes de ${produtoDestaque.nome}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#211C14] text-white transition-transform duration-300 hover:translate-x-1 sm:h-9 sm:w-9"
                  >
                    <ArrowRight size={17} />
                  </Link>
                </div>
              ) : (
                <Link
                  to="/produtos"
                  className="flex min-h-[76px] items-center justify-center gap-2 rounded-[18px] border border-[#E9DCC4] bg-[#FCFAF5] p-3 text-xs transition hover:bg-[#F0E8D9]"
                >
                  Conheça nossos produtos
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>

          <div className="absolute left-1/2 top-4 z-20 inline-flex max-w-[calc(100%-16px)] -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-[#E9DCC4] bg-[#FCFAF5] px-3 py-2 shadow-sm sm:left-[42%] sm:px-4">
            <BadgeCheck size={14} className="shrink-0" />

            <span className="text-[9px] font-medium sm:text-[10px]">
              Seleção especial AURORA
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
