
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  LoaderCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from "lucide-react";

import FaixaNavegacao from "../components/common/FaixaNavegacao";
import ModalAutenticacao from "../components/common/ModalAutenticacao";
import SacolaFlutuante from "../components/common/SacolaFlutuante.jsx";

import { apiFetch } from "../services/api.js";
import { useAuth } from "../contexts/AuthContext";

// ============================================================
// CONFIGURAÇÕES
// ============================================================

const imagemPadrao =
  "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1200&q=85";

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function extrairProduto(resultado) {
  if (resultado?.produto) return resultado.produto;

  if (resultado?.dados?.produto) {
    return resultado.dados.produto;
  }

  if (resultado?.dados && !Array.isArray(resultado.dados)) {
    return resultado.dados;
  }

  return resultado;
}

function normalizarImagens(produto) {
  const imagens = Array.isArray(produto.imagens)
    ? produto.imagens
        .map((imagem) => {
          if (typeof imagem === "string") {
            return imagem;
          }

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

  if (!Number.isFinite(preco)) {
    return "Consulte o preço";
  }

  return preco.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function obterPrecoVenda(produto) {
  const precoOriginal = Number(produto.preco);
  const precoPromocional = Number(produto.precoPromocional);

  if (
    produto.emPromocao === true &&
    Number.isFinite(precoPromocional) &&
    precoPromocional >= 0 &&
    precoPromocional < precoOriginal
  ) {
    return precoPromocional;
  }

  return precoOriginal;
}

function obterDadosPromocao(produto) {
  const precoOriginal = Number(produto.preco);
  const precoVenda = obterPrecoVenda(produto);

  const emPromocao =
    Number.isFinite(precoOriginal) &&
    Number.isFinite(precoVenda) &&
    precoOriginal > 0 &&
    precoVenda < precoOriginal;

  const valorDesconto = emPromocao
    ? Number((precoOriginal - precoVenda).toFixed(2))
    : 0;

  const percentualDesconto = emPromocao
    ? Math.round((valorDesconto / precoOriginal) * 100)
    : 0;

  return {
    precoOriginal,
    precoVenda,
    emPromocao,
    valorDesconto,
    percentualDesconto,
  };
}

function obterMateriais(produto) {
  if (!Array.isArray(produto.materiais)) {
    return [];
  }

  return produto.materiais
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

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

function extrairListaFavoritos(resultado) {
  if (Array.isArray(resultado)) {
    return resultado;
  }

  if (Array.isArray(resultado?.favoritos)) {
    return resultado.favoritos;
  }

  if (Array.isArray(resultado?.dados?.favoritos)) {
    return resultado.dados.favoritos;
  }

  if (Array.isArray(resultado?.dados)) {
    return resultado.dados;
  }

  return [];
}

// ============================================================
// GALERIA DO PRODUTO
// ============================================================

function GaleriaProduto({
  produto,
  imagens,
  imagemSelecionada,
  setImagemSelecionada,
  favoritado,
  carregandoFavorito,
  alternarFavorito,
  emPromocao,
  percentualDesconto,
}) {
  const inicioToque = useRef(null);

  function mudarImagem(direcao) {
    if (imagens.length <= 1) return;

    setImagemSelecionada((atual) => {
      return (atual + direcao + imagens.length) % imagens.length;
    });
  }

  // ============================================================
  // SWIPE MOBILE
  // ============================================================

  function iniciarToque(evento) {
    if (imagens.length <= 1) return;

    inicioToque.current = {
      x: evento.touches[0].clientX,
      y: evento.touches[0].clientY,
    };
  }

  function finalizarToque(evento) {
    if (!inicioToque.current || imagens.length <= 1) {
      return;
    }

    const diferencaX =
      evento.changedTouches[0].clientX - inicioToque.current.x;

    const diferencaY =
      evento.changedTouches[0].clientY - inicioToque.current.y;

    inicioToque.current = null;

    // Preserva a rolagem vertical da página.
    if (Math.abs(diferencaY) > Math.abs(diferencaX)) {
      return;
    }

    // Ignora movimentos muito curtos.
    if (Math.abs(diferencaX) < 50) {
      return;
    }

    mudarImagem(diferencaX < 0 ? 1 : -1);
  }

  return (
    <section className="min-w-0">
      {/* IMAGEM PRINCIPAL */}

      <div
        className="relative overflow-hidden rounded-[26px] border border-[#EAE0D1] bg-[#F5F0E7] p-2 sm:rounded-[30px] sm:p-3"
        onTouchStart={iniciarToque}
        onTouchEnd={finalizarToque}
        onTouchCancel={() => {
          inicioToque.current = null;
        }}
        style={{ touchAction: "pan-y" }}
      >
        <div className="relative overflow-hidden rounded-[20px] bg-[#F3EDE2] sm:rounded-[24px]">
          <img
            key={imagemSelecionada}
            src={imagens[imagemSelecionada]}
            alt={`${produto.nome} — imagem ${imagemSelecionada + 1}`}
            draggable={false}
            className="aspect-[4/4.7] w-full select-none object-cover"
            onError={(evento) => {
              evento.currentTarget.onerror = null;
              evento.currentTarget.src = imagemPadrao;
            }}
          />

          {/* SELOS */}

          <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
            {emPromocao && (
              <span className="rounded-full bg-[#211C14] px-3.5 py-2 text-[10px] font-semibold text-white shadow-sm">
                -{percentualDesconto}% OFF
              </span>
            )}

            {produto.destaque && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-[10px] font-medium text-[#968052] shadow-sm">
                <Sparkles size={12} />
                Destaque
              </span>
            )}
          </div>

          {/* FAVORITO */}

          <button
            type="button"
            onClick={alternarFavorito}
            disabled={carregandoFavorito}
            aria-label={
              favoritado
                ? "Remover dos favoritos"
                : "Adicionar aos favoritos"
            }
            aria-pressed={favoritado}
            className={`absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border bg-white/95 shadow-sm backdrop-blur-sm transition-all hover:scale-105 disabled:cursor-wait disabled:opacity-50 ${
              favoritado
                ? "border-[#D8C5A6] text-[#A47B43]"
                : "border-white text-[#211C14] hover:text-[#968052]"
            }`}
          >
            {carregandoFavorito ? (
              <LoaderCircle size={19} className="animate-spin" />
            ) : (
              <Heart
                size={19}
                strokeWidth={1.7}
                fill={favoritado ? "currentColor" : "none"}
              />
            )}
          </button>
        </div>
      </div>

      {/* CONTROLES ABAIXO DA IMAGEM */}

      {imagens.length > 1 && (
        <div className="mt-4 flex items-center justify-between gap-4 px-1">
          <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 text-xs font-medium tabular-nums text-[#81776A]">
              {String(imagemSelecionada + 1).padStart(2, "0")}

              <span className="mx-1.5 text-[#C5B9A7]">/</span>

              {String(imagens.length).padStart(2, "0")}
            </span>

            {/* INDICADORES */}

            <div className="flex max-w-[140px] items-center gap-1.5 overflow-x-auto">
              {imagens.map((_, indice) => (
                <button
                  key={indice}
                  type="button"
                  onClick={() => setImagemSelecionada(indice)}
                  aria-label={`Ir para imagem ${indice + 1}`}
                  aria-current={
                    imagemSelecionada === indice
                      ? "true"
                      : undefined
                  }
                  className={`h-1.5 shrink-0 rounded-full transition-all duration-300 ${
                    imagemSelecionada === indice
                      ? "w-5 bg-[#968052]"
                      : "w-1.5 bg-[#D8CCBA] hover:bg-[#B6A58B]"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* SETAS À DIREITA */}

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => mudarImagem(-1)}
              aria-label="Imagem anterior"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5D9C6] bg-white text-[#514635] transition-all hover:border-[#968052] hover:bg-[#F7F2E8] active:scale-95"
            >
              <ChevronLeft size={19} strokeWidth={1.7} />
            </button>

            <button
              type="button"
              onClick={() => mudarImagem(1)}
              aria-label="Próxima imagem"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5D9C6] bg-white text-[#514635] transition-all hover:border-[#968052] hover:bg-[#F7F2E8] active:scale-95"
            >
              <ChevronRight size={19} strokeWidth={1.7} />
            </button>
          </div>
        </div>
      )}

      {/* MINIATURAS */}

      {imagens.length > 1 && (
        <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
          {imagens.map((imagem, indice) => (
            <button
              key={`${imagem}-${indice}`}
              type="button"
              onClick={() => setImagemSelecionada(indice)}
              aria-label={`Ver imagem ${indice + 1}`}
              aria-pressed={imagemSelecionada === indice}
              className={`h-[76px] w-[66px] shrink-0 overflow-hidden rounded-[13px] border-2 p-0.5 transition-all sm:h-[88px] sm:w-[76px] ${
                imagemSelecionada === indice
                  ? "border-[#968052]"
                  : "border-transparent opacity-65 hover:opacity-100"
              }`}
            >
              <img
                src={imagem}
                alt={`${produto.nome} — miniatura ${indice + 1}`}
                loading="lazy"
                draggable={false}
                className="h-full w-full rounded-[9px] object-cover"
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
  );
}

// ============================================================
// INFORMAÇÕES DE COMPRA
// ============================================================

function InformacoesCompra() {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      <div className="flex items-start gap-3 rounded-[18px] border border-[#EAE0D1] bg-white p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7F2E8] text-[#968052]">
          <Truck size={19} strokeWidth={1.6} />
        </div>

        <div>
          <p className="text-xs font-semibold text-[#211C14]">
            Entrega
          </p>

          <p className="mt-1 text-[11px] leading-5 text-[#81776A]">
            Consulte opções e prazos de entrega no checkout.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-[18px] border border-[#EAE0D1] bg-white p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7F2E8] text-[#968052]">
          <ShieldCheck size={19} strokeWidth={1.6} />
        </div>

        <div>
          <p className="text-xs font-semibold text-[#211C14]">
            Compra segura
          </p>

          <p className="mt-1 text-[11px] leading-5 text-[#81776A]">
            Finalize seu pedido pelos canais oficiais da AURELIA.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function ProdutoDetalhado() {
  const { id } = useParams();
  const { usuario, carregandoAuth } = useAuth();

  // ============================================================
  // ESTADOS
  // ============================================================

  const [produto, setProduto] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [imagemSelecionada, setImagemSelecionada] = useState(0);
  const [quantidade, setQuantidade] = useState(1);

  const [favoritado, setFavoritado] = useState(false);
  const [carregandoFavorito, setCarregandoFavorito] = useState(false);

  const [adicionando, setAdicionando] = useState(false);
  const [erroSacola, setErroSacola] = useState("");

  // NOTIFICAÇÃO DE SUCESSO

  const [notificacao, setNotificacao] = useState("");
  const timeoutNotificacao = useRef(null);

  // MODAL DE AUTENTICAÇÃO

  const [modalAutenticacao, setModalAutenticacao] = useState(false);
  const [motivoAutenticacao, setMotivoAutenticacao] = useState("geral");

  // ============================================================
  // ESTOQUE
  // ============================================================

  const estoque = Number(
    produto?.estoque ?? produto?.quantidadeEstoque ?? 0
  );

  const controlaEstoque =
    produto?.estoque != null ||
    produto?.quantidadeEstoque != null;

  const esgotado =
    !produto ||
    produto.ativo === false ||
    (controlaEstoque && estoque <= 0);

  const limiteQuantidade = controlaEstoque
    ? Math.max(1, estoque)
    : 99;

  // ============================================================
  // NOTIFICAÇÃO TEMPORÁRIA
  // ============================================================

  function fecharNotificacao() {
    setNotificacao("");

    if (timeoutNotificacao.current) {
      clearTimeout(timeoutNotificacao.current);
      timeoutNotificacao.current = null;
    }
  }

  function mostrarNotificacao(texto) {
    if (timeoutNotificacao.current) {
      clearTimeout(timeoutNotificacao.current);
    }

    setNotificacao(texto);

    timeoutNotificacao.current = setTimeout(() => {
      setNotificacao("");
      timeoutNotificacao.current = null;
    }, 5000);
  }

  useEffect(() => {
    return () => {
      if (timeoutNotificacao.current) {
        clearTimeout(timeoutNotificacao.current);
      }
    };
  }, []);

  // ============================================================
  // AUTENTICAÇÃO
  // ============================================================

  function abrirModalAutenticacao(motivo) {
    setMotivoAutenticacao(motivo);
    setModalAutenticacao(true);
  }

  // ============================================================
  // CARREGAR PRODUTO
  // ============================================================

  useEffect(() => {
    let ativo = true;

    async function carregarProduto() {
      setCarregando(true);
      setErro("");
      setProduto(null);
      setImagemSelecionada(0);
      setQuantidade(1);
      setErroSacola("");

      try {
        const resultado = await apiFetch(`/produtos/${id}`);
        const dados = extrairProduto(resultado);

        if (!dados || !dados.id) {
          throw new Error("Produto não encontrado.");
        }

        if (ativo) {
          setProduto(dados);
        }
      } catch (erroApi) {
        if (ativo) {
          setErro(
            erroApi.message ||
              "Não foi possível carregar os dados deste produto."
          );
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarProduto();

    return () => {
      ativo = false;
    };
  }, [id]);

  // ============================================================
  // CONSULTAR FAVORITOS
  // ============================================================

  useEffect(() => {
    let ativo = true;

    async function verificarFavorito() {
      if (carregandoAuth || !usuario || !produto?.id) {
        if (ativo) {
          setFavoritado(false);
        }

        return;
      }

      try {
        const resultado = await apiFetch("/favoritos");
        const favoritos = extrairListaFavoritos(resultado);

        const encontrado = favoritos.some((favorito) => {
          const produtoFavorito = favorito?.produto || favorito;

          const idFavorito =
            produtoFavorito?.id ||
            favorito?.produtoId ||
            favorito?.idProduto;

          return String(idFavorito) === String(produto.id);
        });

        if (ativo) {
          setFavoritado(encontrado);
        }
      } catch (erroApi) {
        console.error("Erro ao consultar favoritos:", erroApi);
      }
    }

    verificarFavorito();

    return () => {
      ativo = false;
    };
  }, [usuario, carregandoAuth, produto?.id]);

  // ============================================================
  // ALTERNAR FAVORITO
  // ============================================================

  async function alternarFavorito() {
    if (!produto || carregandoFavorito) {
      return;
    }

    if (!usuario) {
      abrirModalAutenticacao("favoritos");
      return;
    }

    setErroSacola("");
    setCarregandoFavorito(true);

    try {
      if (favoritado) {
        await apiFetch(`/favoritos/${produto.id}`, {
          method: "DELETE",
        });

        setFavoritado(false);
      } else {
        await apiFetch(`/favoritos/${produto.id}`, {
          method: "POST",
        });

        setFavoritado(true);
      }

      window.dispatchEvent(new Event("favoritosAtualizados"));
    } catch (erroApi) {
      setErroSacola(
        erroApi.message ||
          "Não foi possível atualizar seus favoritos."
      );
    } finally {
      setCarregandoFavorito(false);
    }
  }

  // ============================================================
  // ADICIONAR À SACOLA
  // ============================================================

  async function adicionarSacola() {
    if (!produto || adicionando || esgotado) {
      return;
    }

    if (!usuario) {
      abrirModalAutenticacao("sacola");
      return;
    }

    setAdicionando(true);
    setErroSacola("");

    try {
      await apiFetch("/sacola/itens", {
        method: "POST",
        body: JSON.stringify({
          produtoId: produto.id,
          quantidade,
        }),
      });

      // Atualiza o contador global e a sacola flutuante.
      window.dispatchEvent(new Event("carrinhoAtualizado"));

      // Mostra a notificação durante 5 segundos.
      mostrarNotificacao(
        `${quantidade} ${
          quantidade === 1
            ? "unidade adicionada"
            : "unidades adicionadas"
        } à sacola com sucesso!`
      );
    } catch (erroApi) {
      setErroSacola(
        erroApi.message ||
          "Não foi possível adicionar o produto à sacola."
      );
    } finally {
      setAdicionando(false);
    }
  }

  // ============================================================
  // CARREGAMENTO
  // ============================================================

  if (carregando || carregandoAuth) {
    return (
      <main className="min-h-[70vh] bg-[#FCFAF6] px-5 py-16">
        <div className="mx-auto max-w-[1320px] animate-pulse">
          <div className="mb-10 h-3 w-40 rounded-full bg-[#EAE0D1]" />

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="aspect-[4/4.7] rounded-[28px] bg-[#EAE0D1]" />

            <div className="space-y-6 py-8">
              <div className="h-3 w-24 rounded-full bg-[#EAE0D1]" />
              <div className="h-10 w-4/5 rounded-full bg-[#EAE0D1]" />
              <div className="h-5 w-2/5 rounded-full bg-[#EAE0D1]" />
              <div className="h-20 rounded-[18px] bg-[#EAE0D1]" />
              <div className="h-14 rounded-full bg-[#EAE0D1]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // ERRO
  // ============================================================

  if (erro || !produto) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center bg-[#FCFAF6] px-5 py-20 text-center">
        <div className="max-w-md">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#F7F2E8] text-[#968052]">
            <ShoppingBag size={25} strokeWidth={1.5} />
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#968052]">
            AURELIA
          </p>

          <h1 className="mt-4 font-serif text-3xl text-[#211C14]">
            Não encontramos este produto
          </h1>

          <p className="mt-4 text-sm leading-7 text-[#81776A]">
            {erro ||
              "O produto pode ter sido removido ou não está disponível."}
          </p>

          <Link
            to="/produtos"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#211C14] px-6 py-3.5 text-xs font-medium text-white transition hover:bg-[#4A3D2B]"
          >
            <ArrowLeft size={16} />
            Voltar aos produtos
          </Link>
        </div>
      </main>
    );
  }

  // ============================================================
  // INFORMAÇÕES DO PRODUTO
  // ============================================================

  const imagens = normalizarImagens(produto);
  const materiais = obterMateriais(produto);

  const categoria =
    typeof produto.categoria === "string"
      ? produto.categoria
      : produto.categoria?.nome ||
        produto.categoria?.nomeCategoria ||
        "";

  const {
    precoOriginal,
    precoVenda,
    emPromocao,
    valorDesconto,
    percentualDesconto,
  } = obterDadosPromocao(produto);

  const descricao =
    produto.descricao ||
    "Uma peça selecionada para complementar seu estilo com elegância e delicadeza.";

  // ============================================================
  // INTERFACE
  // ============================================================

  return (
    <main className="min-h-screen bg-[#FCFAF6] text-[#211C14]">
      {/* NAVEGAÇÃO */}

      <div className="max-md:hidden">
        <FaixaNavegacao
          mostrarVoltar={false}
          itens={[
            { label: "Início", to: "/" },
            { label: "Produtos", to: "/produtos" },
            ...(categoria ? [{ label: categoria }] : []),
            { label: produto.nome },
          ]}
        />
      </div>

      <div className="mx-auto max-w-[1320px] px-4 pb-20 pt-8 sm:px-8 lg:px-12 lg:pt-12">
        {/* VOLTAR MOBILE */}

        <Link
          to="/produtos"
          className="mb-6 inline-flex items-center gap-2 text-xs text-[#81776A] transition hover:text-[#211C14] md:hidden"
        >
          <ArrowLeft size={16} />
          Voltar à coleção
        </Link>

        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-20">
          {/* GALERIA */}

          <GaleriaProduto
            produto={produto}
            imagens={imagens}
            imagemSelecionada={imagemSelecionada}
            setImagemSelecionada={setImagemSelecionada}
            favoritado={favoritado}
            carregandoFavorito={carregandoFavorito}
            alternarFavorito={alternarFavorito}
            emPromocao={emPromocao}
            percentualDesconto={percentualDesconto}
          />

          {/* INFORMAÇÕES */}

          <section className="min-w-0 lg:pt-3">
            {/* MARCA */}

            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A47B43]">
                {produto.marca || "AURELIA"}
              </p>

              {produto.destaque && (
                <span className="h-1 w-1 rounded-full bg-[#C5B496]" />
              )}

              {produto.destaque && (
                <span className="text-[10px] text-[#968052]">
                  Seleção especial
                </span>
              )}
            </div>

            {/* NOME */}

            <h1 className="mt-4 font-serif text-3xl leading-tight tracking-tight sm:text-4xl xl:text-[44px]">
              {produto.nome}
            </h1>

            {categoria && (
              <p className="mt-3 text-sm text-[#81776A]">
                {categoria}
              </p>
            )}

            {/* PREÇO */}

            <div className="mt-8 rounded-[22px] border border-[#EAE0D1] bg-white p-5 sm:p-6">
              {emPromocao ? (
                <>
                  <p className="text-xs text-[#918679]">
                    De{" "}
                    <span className="line-through">
                      {formatarPreco(precoOriginal)}
                    </span>
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="font-serif text-3xl font-medium text-[#211C14] sm:text-4xl">
                      {formatarPreco(precoVenda)}
                    </span>

                    <span className="rounded-full bg-[#211C14] px-3 py-1.5 text-[10px] font-semibold text-white">
                      -{percentualDesconto}%
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-[#968052]">
                    Você economiza {formatarPreco(valorDesconto)}
                  </p>

                  {produto.promocao?.nome && (
                    <p className="mt-2 text-xs text-[#81776A]">
                      Oferta:{" "}
                      <span className="font-medium text-[#968052]">
                        {produto.promocao.nome}
                      </span>
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[#968052]">
                    Valor da peça
                  </p>

                  <p className="font-serif text-3xl font-medium sm:text-4xl">
                    {formatarPreco(precoVenda)}
                  </p>
                </>
              )}

              {/* DISPONIBILIDADE */}

              <div className="mt-5 flex items-center gap-2 border-t border-[#F0EADF] pt-4">
                <span
                  className={`h-2 w-2 rounded-full ${
                    esgotado
                      ? "bg-[#C56A60]"
                      : "bg-[#79936B]"
                  }`}
                />

                <span
                  className={`text-xs font-medium ${
                    esgotado
                      ? "text-[#A75B53]"
                      : "text-[#657C58]"
                  }`}
                >
                  {esgotado
                    ? "Produto indisponível"
                    : "Disponível para compra"}
                </span>
              </div>
            </div>

            {/* DESCRIÇÃO */}

            <div className="mt-8">
              <h2 className="mb-3 font-serif text-xl">
                Sobre esta peça
              </h2>

              <p className="whitespace-pre-line text-sm leading-7 text-[#71675B]">
                {descricao}
              </p>
            </div>

            {/* MATERIAIS */}

            {materiais.length > 0 && (
              <div className="mt-7">
                <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#968052]">
                  Materiais
                </h2>

                <div className="flex flex-wrap gap-2">
                  {materiais.map((material, indice) => (
                    <span
                      key={`${material}-${indice}`}
                      className="rounded-full border border-[#E6D9C5] bg-white px-4 py-2 text-xs text-[#655D52]"
                    >
                      {material}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* REFERÊNCIA */}

            {produto.sku && (
              <p className="mt-5 text-[11px] text-[#918679]">
                Referência: {produto.sku}
              </p>
            )}

            {/* ÁREA DE COMPRA */}

            <div className="mt-8 border-t border-[#EAE0D1] pt-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">
                    Quantidade
                  </p>

                  {controlaEstoque && !esgotado && (
                    <p className="mt-1 text-[11px] text-[#918679]">
                      {estoque}{" "}
                      {estoque === 1
                        ? "unidade disponível"
                        : "unidades disponíveis"}
                    </p>
                  )}
                </div>

                {/* SELETOR DE QUANTIDADE */}

                <div className="flex h-12 items-center overflow-hidden rounded-full border border-[#DCCDB5] bg-white">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantidade((atual) =>
                        Math.max(1, atual - 1)
                      )
                    }
                    disabled={esgotado || quantidade <= 1}
                    aria-label="Diminuir quantidade"
                    className="flex h-full w-12 items-center justify-center transition hover:bg-[#F7F2E8] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Minus size={16} />
                  </button>

                  <span className="min-w-10 text-center text-sm font-semibold">
                    {quantidade}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setQuantidade((atual) =>
                        Math.min(limiteQuantidade, atual + 1)
                      )
                    }
                    disabled={
                      esgotado || quantidade >= limiteQuantidade
                    }
                    aria-label="Aumentar quantidade"
                    className="flex h-full w-12 items-center justify-center transition hover:bg-[#F7F2E8] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* BOTÃO PRINCIPAL */}

              <button
                type="button"
                onClick={adicionarSacola}
                disabled={esgotado || adicionando}
                className="mt-6 flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-[#211C14] px-6 py-4 text-xs font-semibold tracking-[0.04em] text-white transition-all hover:bg-[#4A3D2B] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#B9B1A5]"
              >
                {adicionando ? (
                  <LoaderCircle
                    size={19}
                    className="animate-spin"
                  />
                ) : (
                  <ShoppingBag size={19} strokeWidth={1.7} />
                )}

                {esgotado
                  ? "Produto indisponível"
                  : adicionando
                    ? "Adicionando à sacola..."
                    : "Adicionar à sacola"}
              </button>

              {/* ERRO AO ADICIONAR */}

              {erroSacola && (
                <p
                  role="alert"
                  className="mt-4 rounded-[14px] border border-[#F1D5D1] bg-[#FFF7F5] px-4 py-3 text-center text-xs text-[#A75B53]"
                >
                  {erroSacola}
                </p>
              )}
            </div>

            {/* BENEFÍCIOS */}

            <InformacoesCompra />

            {/* CONTINUAR EXPLORANDO */}

            <Link
              to="/produtos"
              className="mt-8 inline-flex items-center gap-2 text-xs font-medium text-[#968052] transition hover:text-[#211C14]"
            >
              Continuar explorando
              <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </div>

      {/* ===================================== */}
      {/* NOTIFICAÇÃO DE SUCESSO */}
      {/* ===================================== */}

      {notificacao && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 top-5 z-[100] flex w-[calc(100%-2rem)] max-w-[390px] items-start gap-3 rounded-[18px] border border-[#EAE0D1] bg-white px-4 py-4 shadow-[0_15px_50px_rgba(33,28,20,0.15)] sm:right-6 sm:top-6"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F0F5ED] text-[#657C58]">
            <Check size={18} strokeWidth={2} />
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-xs font-semibold text-[#211C14]">
              Adicionado à sacola!
            </p>

            <p className="mt-1 text-[11px] leading-relaxed text-[#81776A]">
              {notificacao}
            </p>
          </div>

          <button
            type="button"
            onClick={fecharNotificacao}
            aria-label="Fechar notificação"
            className="text-[#918679] transition hover:text-[#211C14]"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* ===================================== */}
      {/* SACOLA FLUTUANTE REUTILIZÁVEL */}
      {/* ===================================== */}

      <SacolaFlutuante />

      {/* ===================================== */}
      {/* MODAL DE AUTENTICAÇÃO */}
      {/* ===================================== */}

      <ModalAutenticacao
        aberto={modalAutenticacao}
        onFechar={() => setModalAutenticacao(false)}
        motivo={motivoAutenticacao}
      />
    </main>
  );
}
