import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { apiFetch } from "../services/api.js";

const imagemPadrao =
  "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1200&q=85";

function extrairProduto(resultado) {
  if (resultado?.produto) return resultado.produto;
  if (resultado?.dados?.produto) return resultado.dados.produto;
  if (resultado?.dados && !Array.isArray(resultado.dados)) {
    return resultado.dados;
  }

  return resultado;
}

function normalizarImagens(produto) {
  const imagens = Array.isArray(produto.imagens)
    ? produto.imagens
      .map((imagem) => {
        if (typeof imagem === "string") return imagem;

        return (
          imagem?.url ||
          imagem?.urlImagem ||
          imagem?.caminho ||
          imagem?.imagem ||
          null
        );
      })
      .filter(Boolean)
    : [];

  const imagemPrincipal =
    produto.imagem ||
    produto.imagemUrl ||
    produto.urlImagem;

  if (imagemPrincipal && !imagens.includes(imagemPrincipal)) {
    imagens.unshift(imagemPrincipal);
  }

  return imagens.length ? imagens : [imagemPadrao];
}

function formatarPreco(valor) {
  const preco = Number(valor);

  if (!Number.isFinite(preco)) return "Consulte o preço";

  return preco.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function obterMateriais(produto) {
  if (!Array.isArray(produto.materiais)) return [];

  return produto.materiais
    .map((item) => {
      if (typeof item === "string") return item;

      return (
        item?.material?.nome ||
        item?.material?.nomeMaterial ||
        item?.nome ||
        item?.nomeMaterial ||
        null
      );
    })
    .filter(Boolean);
}

function obterFavoritos() {
  try {
    const favoritos = JSON.parse(
      localStorage.getItem("aurelia_favoritos") || "[]"
    );

    return Array.isArray(favoritos) ? favoritos : [];
  } catch {
    return [];
  }
}

export default function ProdutoDetalhado() {
  const { id } = useParams();

  const [produto, setProduto] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [imagemSelecionada, setImagemSelecionada] = useState(0);
  const [quantidade, setQuantidade] = useState(1);
  const [favoritado, setFavoritado] = useState(false);
  const [adicionado, setAdicionado] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [erroSacola, setErroSacola] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarProduto() {
      setCarregando(true);
      setErro("");
      setProduto(null);
      setImagemSelecionada(0);
      setQuantidade(1);
      setAdicionado(false);

      try {
        const resultado = await apiFetch(`/produtos/${id}`);
        const dados = extrairProduto(resultado);

        if (!dados || !dados.id) {
          throw new Error("Produto não encontrado.");
        }

        if (ativo) {
          setProduto(dados);
          setFavoritado(
            obterFavoritos().some(
              (favorito) => String(favorito) === String(dados.id)
            )
          );
        }
      } catch (erroApi) {
        if (ativo) {
          setErro(
            erroApi.message ||
            "Não foi possível carregar os dados deste produto."
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarProduto();

    return () => {
      ativo = false;
    };
  }, [id]);

  function alternarFavorito() {
    if (!produto) return;

    const favoritos = obterFavoritos();
    const jaFavoritado = favoritos.some(
      (favorito) => String(favorito) === String(produto.id)
    );

    const atualizados = jaFavoritado
      ? favoritos.filter(
        (favorito) => String(favorito) !== String(produto.id)
      )
      : [...favoritos, produto.id];

    localStorage.setItem(
      "aurelia_favoritos",
      JSON.stringify(atualizados)
    );

    setFavoritado(!jaFavoritado);
    window.dispatchEvent(new Event("favoritosAtualizados"));
  }

  
async function adicionarSacola() {
  if (!produto || adicionando || esgotado) return;

  setAdicionando(true);
  setAdicionado(false);
  setErroSacola("");

  try {
    await apiFetch("/sacola/itens", {
      method: "POST",
      body: JSON.stringify({
        produtoId: produto.id,
        quantidade,
      }),
    });

    setAdicionado(true);

    window.dispatchEvent(new Event("carrinhoAtualizado"));
  } catch (erroApi) {
    setErroSacola(
      erroApi.message ||
        "Não foi possível adicionar o produto à sacola."
    );
  } finally {
    setAdicionando(false);
  }
}


  if (carregando) {
    return (
      <main className="min-h-[60vh] bg-[#FCFAF5] px-5 py-24">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="mb-8 h-4 w-40 rounded bg-[#E9DCC4]" />
          <div className="grid gap-10 md:grid-cols-2">
            <div className="aspect-[4/5] rounded-sm bg-[#E9DCC4]" />
            <div className="space-y-5 py-8">
              <div className="h-4 w-24 rounded bg-[#E9DCC4]" />
              <div className="h-10 w-4/5 rounded bg-[#E9DCC4]" />
              <div className="h-6 w-2/5 rounded bg-[#E9DCC4]" />
              <div className="h-24 rounded bg-[#E9DCC4]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (erro || !produto) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#FCFAF5] px-5 py-20 text-center">
        <div className="max-w-md">
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#968052]">
            AURELIA
          </p>

          <h1 className="font-serif text-3xl text-[#211C14]">
            Não encontramos este produto
          </h1>

          <p className="mt-4 text-sm leading-6 text-[#756D61]">
            {erro ||
              "O produto pode ter sido removido ou não está disponível."}
          </p>

          <Link
            to="/produtos"
            className="mt-8 inline-flex items-center gap-2 bg-[#211C14] px-6 py-3 text-xs uppercase tracking-[0.15em] text-white transition hover:bg-[#968052]"
          >
            <ArrowLeft size={16} />
            Voltar aos produtos
          </Link>
        </div>
      </main>
    );
  }

  const imagens = normalizarImagens(produto);
  const materiais = obterMateriais(produto);
  const categoria =
    typeof produto.categoria === "string"
      ? produto.categoria
      : produto.categoria?.nome ||
      produto.categoria?.nomeCategoria ||
      "";

  const preco = Number(produto.preco);
  const precoOriginal = Number(
    produto.precoOriginal ?? produto.precoAntigo
  );

  const estoque = Number(
    produto.estoque ?? produto.quantidadeEstoque
  );

  const controlaEstoque =
    produto.estoque != null ||
    produto.quantidadeEstoque != null;

  const esgotado =
    produto.ativo === false ||
    (controlaEstoque && estoque <= 0);

  const descricao =
    produto.descricao ||
    "Uma peça selecionada para complementar seu estilo com elegância e delicadeza.";

  return (
    <main className="min-h-screen bg-[#FCFAF5] text-[#211C14]">
      <div className="mx-auto max-w-[1320px] px-5 pb-20 pt-8 sm:px-8 lg:px-12 lg:pt-12">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-xs text-[#8B8173]">
          <Link to="/" className="transition hover:text-[#968052]">
            Início
          </Link>
          <span>/</span>
          <Link
            to="/produtos"
            className="transition hover:text-[#968052]"
          >
            Produtos
          </Link>
          {categoria && (
            <>
              <span>/</span>
              <span>{categoria}</span>
            </>
          )}
        </nav>

        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Galeria */}
          <section className="min-w-0">
            <div className="relative overflow-hidden bg-[#F3EDE2]">
              <img
                src={imagens[imagemSelecionada]}
                alt={produto.nome}
                className="aspect-[4/5] w-full object-cover"
                onError={(evento) => {
                  evento.currentTarget.onerror = null;
                  evento.currentTarget.src = imagemPadrao;
                }}
              />

              <button
                type="button"
                onClick={alternarFavorito}
                aria-label={
                  favoritado
                    ? "Remover dos favoritos"
                    : "Adicionar aos favoritos"
                }
                className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#FCFAF5]/90 transition hover:bg-white"
              >
                <Heart
                  size={19}
                  strokeWidth={1.5}
                  className={
                    favoritado
                      ? "fill-[#968052] text-[#968052]"
                      : "text-[#211C14]"
                  }
                />
              </button>

              {produto.destaque && (
                <span className="absolute left-4 top-4 bg-[#FCFAF5]/95 px-3 py-2 text-[10px] uppercase tracking-[0.16em]">
                  Destaque
                </span>
              )}
            </div>

            {imagens.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
                {imagens.map((imagem, indice) => (
                  <button
                    key={`${imagem}-${indice}`}
                    type="button"
                    onClick={() => setImagemSelecionada(indice)}
                    aria-label={`Ver imagem ${indice + 1}`}
                    className={`overflow-hidden border transition ${imagemSelecionada === indice
                      ? "border-[#968052]"
                      : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                  >
                    <img
                      src={imagem}
                      alt={`${produto.nome} — imagem ${indice + 1}`}
                      className="aspect-square w-full object-cover"
                      onError={(evento) => {
                        evento.currentTarget.onerror = null;
                        evento.currentTarget.src = imagemPadrao;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Informações */}
          <section className="pt-1 lg:sticky lg:top-8">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#968052]">
              {produto.marca || "AURELIA"}
            </p>

            <h1 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl lg:text-5xl">
              {produto.nome}
            </h1>

            {categoria && (
              <p className="mt-3 text-sm text-[#82796D]">
                {categoria}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="text-2xl font-medium">
                {formatarPreco(produto.preco)}
              </span>

              {Number.isFinite(precoOriginal) &&
                precoOriginal > preco &&
                preco > 0 && (
                  <span className="text-sm text-[#968B7D] line-through">
                    {formatarPreco(precoOriginal)}
                  </span>
                )}
            </div>

            {Number.isFinite(precoOriginal) &&
              precoOriginal > preco &&
              preco > 0 && (
                <p className="mt-2 text-xs text-[#968052]">
                  Você economiza{" "}
                  {formatarPreco(precoOriginal - preco)}
                </p>
              )}

            <div className="my-8 h-px bg-[#E9DCC4]" />

            <div className="whitespace-pre-line text-sm leading-7 text-[#655D52]">
              {descricao}
            </div>

            {materiais.length > 0 && (
              <div className="mt-7">
                <h2 className="text-xs uppercase tracking-[0.16em]">
                  Materiais
                </h2>

                <div className="mt-3 flex flex-wrap gap-2">
                  {materiais.map((material, indice) => (
                    <span
                      key={`${material}-${indice}`}
                      className="border border-[#E9DCC4] px-3 py-2 text-xs text-[#655D52]"
                    >
                      {material}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {produto.sku && (
              <p className="mt-5 text-xs text-[#8B8173]">
                Referência: {produto.sku}
              </p>
            )}

            <div className="my-8 h-px bg-[#E9DCC4]" />

            {/* Quantidade */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs uppercase tracking-[0.15em]">
                Quantidade
              </span>

              <div className="flex h-11 items-center border border-[#DCCDB5]">
                <button
                  type="button"
                  onClick={() =>
                    setQuantidade((atual) => Math.max(1, atual - 1))
                  }
                  disabled={quantidade <= 1}
                  aria-label="Diminuir quantidade"
                  className="flex h-full w-11 items-center justify-center transition hover:bg-[#F3EDE2] disabled:opacity-30"
                >
                  <Minus size={15} />
                </button>

                <span className="min-w-10 text-center text-sm">
                  {quantidade}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantidade((atual) =>
                      Math.min(
                        controlaEstoque ? estoque : 99,
                        atual + 1
                      )
                    )
                  }
                  disabled={
                    esgotado ||
                    (controlaEstoque && quantidade >= estoque)
                  }
                  aria-label="Aumentar quantidade"
                  className="flex h-full w-11 items-center justify-center transition hover:bg-[#F3EDE2] disabled:opacity-30"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={adicionarSacola}
              disabled={esgotado || adicionando}
              className="mt-5 flex min-h-14 w-full items-center justify-center gap-3 bg-[#211C14] px-6 py-4 text-xs uppercase tracking-[0.18em] text-white transition hover:bg-[#968052] disabled:cursor-not-allowed disabled:bg-[#B9B1A5]"
            >
              {adicionando ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : adicionado ? (
                <Check size={18} />
              ) : (
                <ShoppingBag size={18} />
              )}

              {esgotado
                ? "Produto indisponível"
                : adicionando
                  ? "Adicionando..."
                  : adicionado
                    ? "Adicionado à sacola"
                    : "Adicionar à sacola"}
            </button>

            {adicionado && (
              <p
                role="status"
                className="mt-3 text-center text-sm text-[#71654F]"
              >
                Produto adicionado à sacola com sucesso.
              </p>
            )}

            {erroSacola && (
              <p
                role="alert"
                className="mt-3 text-center text-sm text-red-700"
              >
                {erroSacola}
              </p>
            )}

            <div className="mt-8 space-y-5 border-t border-[#E9DCC4] pt-6">
              <div className="flex items-start gap-3">
                <Truck
                  size={19}
                  strokeWidth={1.5}
                  className="mt-0.5 shrink-0 text-[#968052]"
                />
                <div>
                  <p className="text-sm">Entrega</p>
                  <p className="mt-1 text-xs leading-5 text-[#82796D]">
                    Consulte as opções e os prazos de entrega no checkout.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={19}
                  strokeWidth={1.5}
                  className="mt-0.5 shrink-0 text-[#968052]"
                />
                <div>
                  <p className="text-sm">Compra segura</p>
                  <p className="mt-1 text-xs leading-5 text-[#82796D]">
                    Finalize seu pedido pelos canais oficiais da AURELIA.
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/produtos"
              className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#71654F] transition hover:text-[#211C14]"
            >
              Continuar explorando
              <ArrowRight size={15} />
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
