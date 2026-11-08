
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Heart,
  ShoppingBag,
  LoaderCircle,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { apiFetch } from "../../services/api.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import AcessoNecessario from "../../components/common/AcessoNecessario.jsx";
import FaixaNavegacao from "../../components/common/FaixaNavegacao.jsx";

// ============================================================
// FORMATADORES
// ============================================================

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// ============================================================
// SKELETON
// ============================================================

function SkeletonFavorito() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[#EAE0D1] bg-white p-2.5 animate-pulse">
      <div className="aspect-[3/4] rounded-[17px] bg-[#EEE7DC]" />

      <div className="space-y-3 px-2 pb-4 pt-5">
        <div className="h-2.5 w-20 rounded bg-[#EEE7DC]" />
        <div className="h-4 w-4/5 rounded bg-[#EEE7DC]" />
        <div className="h-4 w-2/5 rounded bg-[#EEE7DC]" />
        <div className="h-8 w-full rounded-full bg-[#F3EEE6]" />
      </div>
    </div>
  );
}

// ============================================================
// CARD DO PRODUTO
// ============================================================


function CardFavorito({ produto, removendo, onRemover }) {
  const imagem =
    produto.imagens?.[0]?.url ||
    produto.imagem ||
    produto.imagemUrl ||
    null;

  const nome = produto.nome || "Joia";
  const categoria = produto.categoria?.nome || "Joias";
  const linkProduto = `/produtos/${produto.id}`;
  const estaRemovendo = removendo === produto.id;

  return (
    <article className="group min-w-0">
      {/* IMAGEM DO PRODUTO */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-[#F1EDE5]">
        <Link
          to={linkProduto}
          aria-label={`Ver ${nome}`}
          className="block h-full w-full"
        >
          {imagem ? (
            <img
              src={imagem}
              alt={
                produto.imagens?.[0]?.textoAlternativo ||
                nome
              }
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#B9A77F]">
              <ShoppingBag size={30} strokeWidth={1.3} />
            </div>
          )}
        </Link>

        {/* REMOVER DOS FAVORITOS */}
        <button
          type="button"
          onClick={() => onRemover(produto.id)}
          disabled={estaRemovendo}
          aria-label={`Remover ${nome} dos favoritos`}
          title="Remover dos favoritos"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#A47B43] shadow-sm transition hover:scale-105 hover:text-[#B35D59] disabled:cursor-wait disabled:opacity-50"
        >
          {estaRemovendo ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <Heart size={18} fill="currentColor" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* INFORMAÇÕES */}
      <div className="px-1 pt-4">
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[#A47B43]">
          {categoria}
        </p>

        <Link to={linkProduto}>
          <h2 className="line-clamp-2 min-h-[40px] text-sm font-medium leading-5 text-[#211C14] transition-colors hover:text-[#968052]">
            {nome}
          </h2>
        </Link>

        <p className="mt-2 text-[15px] font-semibold text-[#211C14]">
          {formatarMoeda(produto.preco)}
        </p>

        <Link
          to={linkProduto}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#968052] transition hover:text-[#211C14]"
        >
          Ver detalhes
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </article>
  );
}


// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function FavoritoUser() {
  const [favoritos, setFavoritos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [removendo, setRemovendo] = useState(null);

  const { usuario, carregandoAuth } = useAuth();

  // ==========================================
  // CARREGAR FAVORITOS
  // ==========================================

  const carregarFavoritos = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await apiFetch("/favoritos");

      setFavoritos(
        Array.isArray(resposta?.favoritos)
          ? resposta.favoritos
          : []
      );
    } catch (error) {
      console.error("Erro ao carregar favoritos:", error);

      setErro(
        error.message ||
          "Não foi possível carregar seus favoritos."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (carregandoAuth) return;

    if (!usuario) {
      setCarregando(false);
      setFavoritos([]);
      return;
    }

    carregarFavoritos();
  }, [carregandoAuth, usuario, carregarFavoritos]);

  // ==========================================
  // REMOVER FAVORITO
  // ==========================================

  async function removerFavorito(produtoId) {
    if (removendo !== null) return;

    try {
      setRemovendo(produtoId);
      setErro("");

      await apiFetch(`/favoritos/${produtoId}`, {
        method: "DELETE",
      });

      setFavoritos((anteriores) =>
        anteriores.filter(
          (favorito) => favorito.produto?.id !== produtoId
        )
      );
    } catch (error) {
      console.error("Erro ao remover favorito:", error);

      setErro(
        error.message ||
          "Não foi possível remover o favorito."
      );
    } finally {
      setRemovendo(null);
    }
  }

  // ==========================================
  // AUTENTICAÇÃO
  // ==========================================

  if (carregandoAuth) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#FCFAF6]">
        <LoaderCircle
          size={32}
          className="animate-spin text-[#968052]"
        />
      </main>
    );
  }

  if (!usuario) {
    return (
      <AcessoNecessario
        tipo="favorito"
        titulo="Sua coleção começa aqui"
        descricao="Entre na sua conta para salvar suas joias favoritas e encontrá-las facilmente sempre que quiser."
      />
    );
  }

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  return (
    <main className="min-h-screen bg-[#FCFAF6] text-[#211C14]">
      {/* NAVEGAÇÃO */}

      <div className="max-md:hidden">
        <FaixaNavegacao
          mostrarVoltar={false}
          itens={[
            { label: "Início", to: "/" },
            { label: "Favoritos" },
          ]}
        />
      </div>

      <div className="mx-auto max-w-[1180px] px-5 pb-20 pt-10 sm:px-8 lg:px-10 lg:pt-14">
        {/* ===================================== */}
        {/* CABEÇALHO */}
        {/* ===================================== */}

        <div className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#A47B43]">
              <Heart size={13} strokeWidth={1.8} />
              Minha coleção
            </p>

            <h1 className="font-serif text-3xl tracking-tight text-[#211C14] sm:text-4xl">
              Meus favoritos
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#81776A]">
              As peças que conquistaram seu coração, reunidas
              em um só lugar.
            </p>
          </div>

          {!carregando && favoritos.length > 0 && (
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E5D9C6] bg-white px-4 py-2.5">
              <Heart
                size={15}
                fill="currentColor"
                className="text-[#968052]"
              />

              <span className="text-xs font-medium text-[#514635]">
                {favoritos.length}{" "}
                {favoritos.length === 1
                  ? "peça favorita"
                  : "peças favoritas"}
              </span>
            </div>
          )}
        </div>

        {/* ===================================== */}
        {/* ERRO */}
        {/* ===================================== */}

        {erro && (
          <div
            role="alert"
            className="mb-7 flex flex-col gap-3 rounded-[18px] border border-[#F0D8D5] bg-[#FBEEEE] p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-[#A45B52]"
              />

              <p className="text-xs leading-relaxed text-[#A45B52]">
                {erro}
              </p>
            </div>

            <button
              type="button"
              onClick={carregarFavoritos}
              className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-[#A45B52] transition hover:opacity-70"
            >
              <RefreshCw size={14} />
              Atualizar favoritos
            </button>
          </div>
        )}

        {/* ===================================== */}
        {/* CARREGAMENTO */}
        {/* ===================================== */}

        {carregando ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <SkeletonFavorito key={item} />
            ))}
          </div>
        ) : favoritos.length === 0 && !erro ? (
          /* ===================================== */
          /* LISTA VAZIA */
          /* ===================================== */

          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[24px] border border-[#EAE0D1] bg-white px-6 py-14 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#F7F2E8] text-[#968052]">
              <Heart size={32} strokeWidth={1.4} />
            </div>

            <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A47B43]">
              <Sparkles size={13} />
              Sua seleção especial
            </p>

            <h2 className="font-serif text-2xl text-[#211C14] sm:text-3xl">
              Sua coleção está vazia
            </h2>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#81776A]">
              Explore nossas coleções e salve as joias que
              combinam com você. Seus favoritos aparecerão aqui.
            </p>

            <Link
              to="/produtos"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#211C14] px-6 py-3 text-xs font-medium text-white transition hover:bg-[#4A3D2B]"
            >
              <ShoppingBag size={16} />
              Explorar produtos
              <ArrowUpRight size={15} />
            </Link>
          </div>
        ) : (
          /* ===================================== */
          /* PRODUTOS */
          /* ===================================== */

          <>
            <div className="mb-5 flex items-center justify-between gap-3">
              <p className="text-xs text-[#81776A]">
                <span className="font-semibold text-[#211C14]">
                  {favoritos.length}
                </span>{" "}
                {favoritos.length === 1
                  ? "produto salvo"
                  : "produtos salvos"}
              </p>

              <span className="text-[11px] text-[#A49A8C]">
                Sua seleção especial
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {favoritos
                .filter((favorito) => favorito.produto)
                .map(({ produto }) => (
                  <CardFavorito
                    key={produto.id}
                    produto={produto}
                    removendo={removendo}
                    onRemover={removerFavorito}
                  />
                ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
