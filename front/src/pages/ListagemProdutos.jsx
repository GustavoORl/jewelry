
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Link, useSearchParams } from "react-router-dom";

import {
  ArrowDownUp,
  Check,
  Heart,
  LoaderCircle,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  X,
} from "lucide-react";

import FaixaNavegacao from "../components/common/FaixaNavegacao";
import ModalAutenticacao from "../components/common/ModalAutenticacao";
import SacolaFlutuante from "../components/common/SacolaFlutuante.jsx";

import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../services/api.js";

// ============================================================
// CONFIGURAÇÕES
// ============================================================

const imagemPadrao =
  "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=600&q=80";

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function normalizarNome(nome = "") {
  const normalizado = String(nome)
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const equivalencias = {
    perolas: "perola",
    zirconias: "zirconia",
  };

  return equivalencias[normalizado] || normalizado;
}

function gerarSlugCategoria(nome = "") {
  return String(nome)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatarPreco(valor) {
  const preco = Number(valor);

  if (!Number.isFinite(preco)) {
    return "R$ 0,00";
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

function produtoEstaEmPromocao(produto) {
  const precoOriginal = Number(produto.preco);
  const precoVenda = obterPrecoVenda(produto);

  return (
    Number.isFinite(precoOriginal) &&
    Number.isFinite(precoVenda) &&
    precoVenda < precoOriginal
  );
}

function normalizarProduto(produto) {
  const imagens = Array.isArray(produto.imagens)
    ? produto.imagens
    : [];

  const materiais = Array.isArray(produto.materiais)
    ? produto.materiais
        .map((item) => item.material || item)
        .filter((item) => item?.nome)
    : [];

  const primeiraImagem = imagens
    .map((item) =>
      typeof item === "string" ? item : item?.url
    )
    .find(Boolean);

  return {
    ...produto,

    imagem:
      primeiraImagem ||
      produto.imagem ||
      produto.imagemUrl ||
      imagemPadrao,

    categoriaNome:
      typeof produto.categoria === "string"
        ? produto.categoria
        : produto.categoria?.nome || "",

    materiais,

    marca: produto.marca || "AURELIA",

    avaliacoes: produto.avaliacoes ?? 0,

    ativo: produto.ativo !== false,
  };
}

function extrairLista(resultado, chave) {
  if (Array.isArray(resultado)) {
    return resultado;
  }

  if (Array.isArray(resultado?.[chave])) {
    return resultado[chave];
  }

  if (Array.isArray(resultado?.dados?.[chave])) {
    return resultado.dados[chave];
  }

  if (Array.isArray(resultado?.dados)) {
    return resultado.dados;
  }

  return [];
}

// ============================================================
// CARD DE PRODUTO
// ============================================================

function CardProduto({
  produto,
  favorito,
  aoAlternarFavorito,
  aoAdicionarSacola,
  processandoFavorito,
  processandoSacola,
}) {
  const precoOriginal = Number(produto.preco);
  const precoVenda = obterPrecoVenda(produto);

  const emPromocao = produtoEstaEmPromocao(produto);

  const percentualDesconto =
    emPromocao && precoOriginal > 0
      ? Math.round(
          ((precoOriginal - precoVenda) / precoOriginal) * 100
        )
      : 0;

  const estoque = Number(
    produto.estoque ?? produto.quantidadeEstoque ?? 0
  );

  const controlaEstoque =
    produto.estoque != null ||
    produto.quantidadeEstoque != null;

  const esgotado =
    !produto.ativo ||
    (controlaEstoque && estoque <= 0);

  return (
    <article className="group overflow-hidden rounded-2xl border border-[#EAE0CE] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#211C14]/5">
      {/* ===================================== */}
      {/* IMAGEM */}
      {/* ===================================== */}

      <div className="relative aspect-[4/4.5] overflow-hidden bg-[#F7F2E8]">
        <Link
          to={`/produtos/${produto.id}`}
          aria-label={`Ver ${produto.nome}`}
          className="block h-full w-full"
        >
          <img
            src={produto.imagem}
            alt={produto.nome}
            loading="lazy"
            onError={(evento) => {
              evento.currentTarget.onerror = null;
              evento.currentTarget.src = imagemPadrao;
            }}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>

        {/* SELOS */}

        {emPromocao && (
          <div className="absolute left-3 top-3 flex flex-col items-start gap-2">
            <span className="rounded-full bg-[#211C14] px-3 py-1.5 text-[10px] font-semibold tracking-wide text-white shadow-sm">
              {percentualDesconto}% OFF
            </span>

            {produto.promocao?.nome && (
              <span className="max-w-[160px] truncate rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-medium text-[#968052] shadow-sm">
                {produto.promocao.nome}
              </span>
            )}
          </div>
        )}

        {/* FAVORITOS */}

        <button
          type="button"
          onClick={() => aoAlternarFavorito(produto.id)}
          disabled={processandoFavorito}
          aria-label={
            favorito
              ? "Remover dos favoritos"
              : "Adicionar aos favoritos"
          }
          aria-pressed={favorito}
          className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border bg-white/95 transition-colors disabled:cursor-wait disabled:opacity-50 ${
            favorito
              ? "border-[#B9975B] text-[#A47B43]"
              : "border-[#E8DDCA] text-[#211C14] hover:border-[#B9975B]"
          }`}
        >
          {processandoFavorito ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <Heart
              size={18}
              fill={favorito ? "currentColor" : "none"}
            />
          )}
        </button>
      </div>

      {/* ===================================== */}
      {/* INFORMAÇÕES */}
      {/* ===================================== */}

      <div className="p-4 sm:p-5">
        <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.2em] text-[#9B805D]">
          {produto.marca}
        </p>

        <Link
          to={`/produtos/${produto.id}`}
          className="line-clamp-2 min-h-10 text-sm font-medium text-[#211C14] transition-colors hover:text-[#9B805D]"
        >
          {produto.nome}
        </Link>

        {produto.categoriaNome && (
          <p className="mt-1 text-xs text-[#958777]">
            {produto.categoriaNome}
          </p>
        )}

        {/* PREÇO E SACOLA */}

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span
              className={`text-xs leading-4 ${
                emPromocao
                  ? "text-[#958777] line-through decoration-[#B9A998]"
                  : "invisible"
              }`}
            >
              {formatarPreco(precoOriginal)}
            </span>

            <span className="text-base font-semibold leading-6 text-[#211C14]">
              {formatarPreco(precoVenda)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => aoAdicionarSacola(produto.id)}
            disabled={processandoSacola || esgotado}
            aria-label={`Adicionar ${produto.nome} à sacola`}
            className="inline-flex items-center gap-2 rounded-full bg-[#211C14] px-3.5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-[#4A3D2B] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processandoSacola ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              <ShoppingBag size={14} />
            )}

            {esgotado
              ? "Indisponível"
              : processandoSacola
                ? "Adicionando..."
                : "Adicionar"}
          </button>
        </div>
      </div>
    </article>
  );
}

// ============================================================
// NOTIFICAÇÃO
// ============================================================

function Notificacao({ mensagem, tipo, aoFechar }) {
  if (!mensagem) return null;

  const sucesso = tipo === "sucesso";

  return (
    <div
      role={sucesso ? "status" : "alert"}
      aria-live={sucesso ? "polite" : "assertive"}
      className="fixed right-4 top-5 z-[100] flex w-[calc(100%-2rem)] max-w-[390px] items-start gap-3 rounded-[18px] border border-[#EAE0D1] bg-white px-4 py-4 shadow-[0_15px_50px_rgba(33,28,20,0.15)] sm:right-6 sm:top-6"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          sucesso
            ? "bg-[#F0F5ED] text-[#657C58]"
            : "bg-[#FFF1EE] text-[#A75B53]"
        }`}
      >
        {sucesso ? <Check size={18} /> : <X size={18} />}
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-xs font-semibold text-[#211C14]">
          {sucesso ? "Tudo certo!" : "Não foi possível concluir"}
        </p>

        <p className="mt-1 text-[11px] leading-relaxed text-[#81776A]">
          {mensagem}
        </p>
      </div>

      <button
        type="button"
        onClick={aoFechar}
        aria-label="Fechar notificação"
        className="text-[#918679] transition hover:text-[#211C14]"
      >
        <X size={17} />
      </button>
    </div>
  );
}

// ============================================================
// PÁGINA DE LISTAGEM
// ============================================================

export default function ListagemProdutos() {
  const [searchParams, setSearchParams] = useSearchParams();

  const { usuario, carregandoAuth } = useAuth();

  // ============================================================
  // PARÂMETROS DA URL
  // ============================================================

  const buscaUrl = searchParams.get("busca") || "";
  const categoriaUrl = searchParams.get("categoria") || "";
  const promocaoUrl = searchParams.get("promocao") || "";

  // ============================================================
  // ESTADOS
  // ============================================================

  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [materiais, setMateriais] = useState([]);

  const [busca, setBusca] = useState(buscaUrl);

  const [categoriaAtiva, setCategoriaAtiva] = useState("Todas");
  const [materialAtivo, setMaterialAtivo] = useState("Todos");

  const [promocaoAtiva, setPromocaoAtiva] = useState(() =>
    ["sim", "nao"].includes(promocaoUrl)
      ? promocaoUrl
      : "todos"
  );

  const [ordenacao, setOrdenacao] = useState("recentes");

  const [favoritos, setFavoritos] = useState([]);

  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [processandoFavoritos, setProcessandoFavoritos] =
    useState([]);

  const [processandoSacola, setProcessandoSacola] =
    useState([]);

  // NOTIFICAÇÃO

  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("sucesso");

  const timeoutNotificacao = useRef(null);

  // AUTENTICAÇÃO

  const [modalAutenticacao, setModalAutenticacao] =
    useState(false);

  const [motivoAutenticacao, setMotivoAutenticacao] =
    useState("geral");

  // ============================================================
  // NOTIFICAÇÕES
  // ============================================================

  function fecharNotificacao() {
    setMensagem("");

    if (timeoutNotificacao.current) {
      clearTimeout(timeoutNotificacao.current);
      timeoutNotificacao.current = null;
    }
  }

  function mostrarNotificacao(texto, tipo = "sucesso") {
    if (timeoutNotificacao.current) {
      clearTimeout(timeoutNotificacao.current);
    }

    setMensagem(texto);
    setTipoMensagem(tipo);

    timeoutNotificacao.current = setTimeout(() => {
      setMensagem("");
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
  // CATEGORIAS DISPONÍVEIS
  // ============================================================

  const categoriasDisponiveis = useMemo(() => {
    const nomes = [
      ...categorias.map((categoria) => categoria.nome),
      ...produtos.map((produto) => produto.categoriaNome),
    ].filter(Boolean);

    return [...new Set(nomes)].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
  }, [categorias, produtos]);

  // ============================================================
  // MATERIAIS DISPONÍVEIS
  // ============================================================

  const materiaisDisponiveis = useMemo(() => {
    const nomes = [
      ...materiais.map((material) => material.nome),

      ...produtos.flatMap((produto) =>
        produto.materiais.map((material) => material.nome)
      ),
    ].filter(Boolean);

    return [...new Set(nomes)].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
  }, [materiais, produtos]);

  // ============================================================
  // CARREGAR PRODUTOS, CATEGORIAS E MATERIAIS
  // ============================================================

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const [
        resultadoProdutos,
        resultadoCategorias,
        resultadoMateriais,
      ] = await Promise.all([
        apiFetch("/produtos"),
        apiFetch("/categorias"),
        apiFetch("/materiais"),
      ]);

      const listaProdutos = extrairLista(
        resultadoProdutos,
        "produtos"
      );

      const listaCategorias = extrairLista(
        resultadoCategorias,
        "categorias"
      );

      const listaMateriais = extrairLista(
        resultadoMateriais,
        "materiais"
      );

      setProdutos(
        listaProdutos
          .filter((produto) => produto.ativo !== false)
          .map(normalizarProduto)
      );

      setCategorias(
        listaCategorias.filter(
          (categoria) => categoria.ativo !== false
        )
      );

      setMateriais(
        listaMateriais.filter(
          (material) => material.ativo !== false
        )
      );
    } catch (error) {
      setErro(
        error.message ||
          "Não foi possível carregar o catálogo."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  // ============================================================
  // CARREGAR FAVORITOS
  // ============================================================

  const carregarFavoritos = useCallback(async () => {
    if (!usuario) {
      setFavoritos([]);
      return;
    }

    try {
      const resultado = await apiFetch("/favoritos");

      const lista = extrairLista(resultado, "favoritos");

      setFavoritos(
        lista
          .map((item) => {
            const produto = item?.produto || item;

            return (
              produto?.id ||
              item?.produtoId ||
              item?.idProduto
            );
          })
          .filter(Boolean)
      );
    } catch (error) {
      console.error("Erro ao carregar favoritos:", error);
      setFavoritos([]);
    }
  }, [usuario]);

  // ============================================================
  // EFEITOS
  // ============================================================

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  useEffect(() => {
    if (carregandoAuth) return;

    carregarFavoritos();
  }, [carregandoAuth, carregarFavoritos]);

  // SINCRONIZAR FAVORITOS

  useEffect(() => {
    function atualizarFavoritos() {
      if (!carregandoAuth) {
        carregarFavoritos();
      }
    }

    window.addEventListener(
      "favoritosAtualizados",
      atualizarFavoritos
    );

    return () => {
      window.removeEventListener(
        "favoritosAtualizados",
        atualizarFavoritos
      );
    };
  }, [carregandoAuth, carregarFavoritos]);

  // SINCRONIZAR BUSCA

  useEffect(() => {
    setBusca(buscaUrl);
  }, [buscaUrl]);

  // SINCRONIZAR PROMOÇÃO

  useEffect(() => {
    setPromocaoAtiva(
      ["sim", "nao"].includes(promocaoUrl)
        ? promocaoUrl
        : "todos"
    );
  }, [promocaoUrl]);

  // SELECIONAR CATEGORIA DA URL

  useEffect(() => {
    if (!categoriaUrl) {
      setCategoriaAtiva("Todas");
      return;
    }

    const slugUrl = gerarSlugCategoria(categoriaUrl);

    const categoriaEncontrada = categorias.find(
      (categoria) => {
        const slugCategoria = gerarSlugCategoria(
          categoria.slug || categoria.nome || ""
        );

        return slugCategoria === slugUrl;
      }
    );

    if (categoriaEncontrada) {
      setCategoriaAtiva(categoriaEncontrada.nome);
      return;
    }

    const categoriaPorNome = categoriasDisponiveis.find(
      (nome) =>
        normalizarNome(nome) === normalizarNome(categoriaUrl)
    );

    setCategoriaAtiva(categoriaPorNome || "Todas");
  }, [categoriaUrl, categorias, categoriasDisponiveis]);

  // ============================================================
  // ALTERNAR FAVORITO
  // ============================================================

  async function alternarFavorito(produtoId) {
    if (!usuario) {
      abrirModalAutenticacao("favoritos");
      return;
    }

    if (processandoFavoritos.includes(produtoId)) {
      return;
    }

    setProcessandoFavoritos((atuais) => [
      ...atuais,
      produtoId,
    ]);

    try {
      if (favoritos.includes(produtoId)) {
        await apiFetch(`/favoritos/${produtoId}`, {
          method: "DELETE",
        });

        setFavoritos((atuais) =>
          atuais.filter((id) => id !== produtoId)
        );

        window.dispatchEvent(
          new Event("favoritosAtualizados")
        );

        mostrarNotificacao(
          "Produto removido dos favoritos."
        );
      } else {
        await apiFetch(`/favoritos/${produtoId}`, {
          method: "POST",
        });

        setFavoritos((atuais) =>
          atuais.includes(produtoId)
            ? atuais
            : [...atuais, produtoId]
        );

        window.dispatchEvent(
          new Event("favoritosAtualizados")
        );

        mostrarNotificacao(
          "Produto adicionado aos favoritos."
        );
      }
    } catch (error) {
      mostrarNotificacao(
        error.status === 401 || error.status === 403
          ? "Entre na sua conta para favoritar produtos."
          : error.message ||
              "Não foi possível atualizar seus favoritos.",
        "erro"
      );
    } finally {
      setProcessandoFavoritos((atuais) =>
        atuais.filter((id) => id !== produtoId)
      );
    }
  }

  // ============================================================
  // ADICIONAR À SACOLA
  // ============================================================

  async function adicionarSacola(produtoId) {
    if (!usuario) {
      abrirModalAutenticacao("sacola");
      return;
    }

    if (processandoSacola.includes(produtoId)) {
      return;
    }

    setProcessandoSacola((atuais) => [
      ...atuais,
      produtoId,
    ]);

    try {
      await apiFetch("/sacola/itens", {
        method: "POST",
        body: JSON.stringify({
          produtoId,
          quantidade: 1,
        }),
      });

      // O componente SacolaFlutuante escuta esse evento
      // e consulta novamente a quantidade real no backend.

      window.dispatchEvent(
        new Event("carrinhoAtualizado")
      );

      mostrarNotificacao(
        "Produto adicionado à sacola com sucesso!"
      );
    } catch (error) {
      mostrarNotificacao(
        error.status === 401 || error.status === 403
          ? "Entre na sua conta para adicionar produtos à sacola."
          : error.message ||
              "Não foi possível adicionar o produto à sacola.",
        "erro"
      );
    } finally {
      setProcessandoSacola((atuais) =>
        atuais.filter((id) => id !== produtoId)
      );
    }
  }

  // ============================================================
  // FILTRAR E ORDENAR PRODUTOS
  // ============================================================

  const produtosFiltrados = useMemo(() => {
    const resultado = produtos.filter((produto) => {
      const nomeProduto = (produto.nome || "")
        .toLocaleLowerCase("pt-BR");

      const termoBusca = busca
        .trim()
        .toLocaleLowerCase("pt-BR");

      const correspondeBusca =
        nomeProduto.includes(termoBusca);

      const correspondeCategoria =
        categoriaAtiva === "Todas" ||
        normalizarNome(produto.categoriaNome) ===
          normalizarNome(categoriaAtiva);

      const correspondeMaterial =
        materialAtivo === "Todos" ||
        produto.materiais.some(
          (material) =>
            normalizarNome(material.nome) ===
            normalizarNome(materialAtivo)
        );

      const emPromocao =
        produtoEstaEmPromocao(produto);

      const correspondePromocao =
        promocaoAtiva === "todos" ||
        (promocaoAtiva === "sim" && emPromocao) ||
        (promocaoAtiva === "nao" && !emPromocao);

      return (
        correspondeBusca &&
        correspondeCategoria &&
        correspondeMaterial &&
        correspondePromocao
      );
    });

    switch (ordenacao) {
      case "menor-preco":
        resultado.sort(
          (a, b) =>
            obterPrecoVenda(a) - obterPrecoVenda(b)
        );
        break;

      case "maior-preco":
        resultado.sort(
          (a, b) =>
            obterPrecoVenda(b) - obterPrecoVenda(a)
        );
        break;

      case "nome":
        resultado.sort((a, b) =>
          (a.nome || "").localeCompare(
            b.nome || "",
            "pt-BR"
          )
        );
        break;

      case "recentes":
      default:
        resultado.sort((a, b) => {
          const dataA = new Date(
            a.createdAt || a.criadoEm || 0
          ).getTime();

          const dataB = new Date(
            b.createdAt || b.criadoEm || 0
          ).getTime();

          return dataB - dataA;
        });
        break;
    }

    return resultado;
  }, [
    produtos,
    busca,
    categoriaAtiva,
    materialAtivo,
    promocaoAtiva,
    ordenacao,
  ]);

  // ============================================================
  // SELECIONAR CATEGORIA
  // ============================================================

  function selecionarCategoria(categoria) {
    setCategoriaAtiva(categoria);

    const novosParametros =
      new URLSearchParams(searchParams);

    if (categoria === "Todas") {
      novosParametros.delete("categoria");
    } else {
      const categoriaEncontrada = categorias.find(
        (item) =>
          normalizarNome(item.nome) ===
          normalizarNome(categoria)
      );

      novosParametros.set(
        "categoria",
        categoriaEncontrada?.slug ||
          gerarSlugCategoria(categoria)
      );
    }

    setSearchParams(novosParametros, {
      replace: true,
    });
  }

  // ============================================================
  // SELECIONAR PROMOÇÃO
  // ============================================================

  function selecionarPromocao(valor) {
    setPromocaoAtiva(valor);

    const novosParametros =
      new URLSearchParams(searchParams);

    if (valor === "todos") {
      novosParametros.delete("promocao");
    } else {
      novosParametros.set("promocao", valor);
    }

    setSearchParams(novosParametros, {
      replace: true,
    });
  }

  // ============================================================
  // REMOVER BUSCA
  // ============================================================

  function removerBusca() {
    setBusca("");

    const novosParametros =
      new URLSearchParams(searchParams);

    novosParametros.delete("busca");

    setSearchParams(novosParametros, {
      replace: true,
    });
  }

  // ============================================================
  // LIMPAR FILTROS
  // ============================================================

  function limparFiltros() {
    setBusca("");
    setCategoriaAtiva("Todas");
    setMaterialAtivo("Todos");
    setPromocaoAtiva("todos");
    setOrdenacao("recentes");

    const novosParametros =
      new URLSearchParams(searchParams);

    novosParametros.delete("busca");
    novosParametros.delete("categoria");
    novosParametros.delete("promocao");

    setSearchParams(novosParametros, {
      replace: true,
    });
  }

  const possuiFiltros =
    busca.trim() !== "" ||
    categoriaAtiva !== "Todas" ||
    materialAtivo !== "Todos" ||
    promocaoAtiva !== "todos";

  // ============================================================
  // INTERFACE
  // ============================================================

  return (
    <main className="min-h-screen bg-[#FCFAF6] text-[#211C14]">
      {/* ===================================== */}
      {/* CABEÇALHO */}
      {/* ===================================== */}

      <div className="max-md:hidden">
        <FaixaNavegacao
          mostrarVoltar={false}
          itens={[
            {
              label: "Início",
              to: "/",
            },
            {
              label: "Produtos",
            },
          ]}
          informacaoDireita={
            carregando
              ? "Carregando coleção..."
              : `${produtosFiltrados.length} ${
                  produtosFiltrados.length === 1
                    ? "peça encontrada"
                    : "peças encontradas"
                }`
          }
        />
      </div>

      {/* ===================================== */}
      {/* NOTIFICAÇÃO */}
      {/* ===================================== */}

      <Notificacao
        mensagem={mensagem}
        tipo={tipoMensagem}
        aoFechar={fecharNotificacao}
      />

      {/* ===================================== */}
      {/* CATÁLOGO */}
      {/* ===================================== */}

      <section className="px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <div className="mx-auto max-w-[1320px]">
          {/* ===================================== */}
          {/* ORDENAÇÃO E FILTROS MOBILE */}
          {/* ===================================== */}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  setMostrarFiltros((atual) => !atual)
                }
                aria-expanded={mostrarFiltros}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E8DDCA] px-5 py-3 text-sm transition-colors hover:border-[#B9975B] lg:hidden"
              >
                <SlidersHorizontal size={16} />
                Filtros
              </button>

              <label className="flex items-center gap-3 rounded-full border border-[#E8DDCA] bg-white px-4 py-2.5">
                <ArrowDownUp
                  size={16}
                  className="shrink-0 text-[#968052]"
                />

                <span className="whitespace-nowrap text-xs text-[#847A6C]">
                  Ordenar:
                </span>

                <select
                  value={ordenacao}
                  onChange={(evento) =>
                    setOrdenacao(evento.target.value)
                  }
                  aria-label="Ordenar produtos"
                  className="min-w-0 bg-transparent text-xs outline-none"
                >
                  <option value="recentes">
                    Mais recentes
                  </option>

                  <option value="menor-preco">
                    Menor preço
                  </option>

                  <option value="maior-preco">
                    Maior preço
                  </option>

                  <option value="nome">
                    Nome A–Z
                  </option>
                </select>
              </label>
            </div>
          </div>

          {/* ===================================== */}
          {/* LAYOUT PRINCIPAL */}
          {/* ===================================== */}

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
            {/* ===================================== */}
            {/* SIDEBAR DE FILTROS */}
            {/* ===================================== */}

            <aside
              className={
                mostrarFiltros
                  ? "block lg:block"
                  : "hidden lg:block"
              }
            >
              <div className="rounded-2xl border border-[#EAE0CE] bg-white p-5">
                {/* CABEÇALHO */}

                <div className="mb-5 flex items-center justify-between">
                  <h2 className="font-serif text-xl">
                    Filtrar por
                  </h2>

                  {possuiFiltros && (
                    <button
                      type="button"
                      onClick={limparFiltros}
                      className="text-xs text-[#968052] underline underline-offset-4 hover:text-[#211C14]"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* ===================================== */}
                {/* CATEGORIAS */}
                {/* ===================================== */}

                <div className="border-b border-[#EFE7DA] pb-6">
                  <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9B805D]">
                    Categorias
                  </h3>

                  <div className="space-y-3">
                    <label className="flex cursor-pointer items-center gap-3 text-sm">
                      <input
                        type="radio"
                        name="categoria"
                        checked={categoriaAtiva === "Todas"}
                        onChange={() =>
                          selecionarCategoria("Todas")
                        }
                        className="accent-[#968052]"
                      />

                      Todas as categorias
                    </label>

                    {categoriasDisponiveis.map((categoria) => (
                      <label
                        key={categoria}
                        className="flex cursor-pointer items-center gap-3 text-sm"
                      >
                        <input
                          type="radio"
                          name="categoria"
                          checked={
                            categoriaAtiva === categoria
                          }
                          onChange={() =>
                            selecionarCategoria(categoria)
                          }
                          className="accent-[#968052]"
                        />

                        {categoria}
                      </label>
                    ))}
                  </div>
                </div>

                {/* ===================================== */}
                {/* MATERIAIS */}
                {/* ===================================== */}

                <div className="border-b border-[#EFE7DA] py-6">
                  <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9B805D]">
                    Materiais
                  </h3>

                  <div className="space-y-3">
                    <label className="flex cursor-pointer items-center gap-3 text-sm">
                      <input
                        type="radio"
                        name="material"
                        checked={materialAtivo === "Todos"}
                        onChange={() =>
                          setMaterialAtivo("Todos")
                        }
                        className="accent-[#968052]"
                      />

                      Todos os materiais
                    </label>

                    {materiaisDisponiveis.map((material) => (
                      <label
                        key={material}
                        className="flex cursor-pointer items-center gap-3 text-sm"
                      >
                        <input
                          type="radio"
                          name="material"
                          checked={
                            materialAtivo === material
                          }
                          onChange={() =>
                            setMaterialAtivo(material)
                          }
                          className="accent-[#968052]"
                        />

                        {material}
                      </label>
                    ))}
                  </div>
                </div>

                {/* ===================================== */}
                {/* PROMOÇÕES */}
                {/* ===================================== */}

                <div className="pt-6">
                  <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9B805D]">
                    Promoções
                  </h3>

                  <div className="space-y-3">
                    {[
                      {
                        valor: "todos",
                        texto: "Todos os produtos",
                      },
                      {
                        valor: "sim",
                        texto: "Em promoção",
                      },
                    ].map((opcao) => (
                      <label
                        key={opcao.valor}
                        className="flex cursor-pointer items-center gap-3 text-sm"
                      >
                        <input
                          type="radio"
                          name="promocao"
                          value={opcao.valor}
                          checked={
                            promocaoAtiva === opcao.valor
                          }
                          onChange={() =>
                            selecionarPromocao(opcao.valor)
                          }
                          className="accent-[#968052]"
                        />

                        <span className="text-[#211C14]">
                          {opcao.texto}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* ===================================== */}
            {/* RESULTADOS */}
            {/* ===================================== */}

            <div className="min-w-0">
              {/* FILTROS ATIVOS */}

              {possuiFiltros && (
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-xs text-[#847A6C]">
                    Filtros ativos:
                  </span>

                  {/* BUSCA */}

                  {busca.trim() && (
                    <button
                      type="button"
                      onClick={removerBusca}
                      className="inline-flex items-center gap-2 rounded-full bg-[#F0E8D9] px-3 py-1.5 text-xs"
                    >
                      Busca: {busca}
                      <X size={13} />
                    </button>
                  )}

                  {/* CATEGORIA */}

                  {categoriaAtiva !== "Todas" && (
                    <button
                      type="button"
                      onClick={() =>
                        selecionarCategoria("Todas")
                      }
                      className="inline-flex items-center gap-2 rounded-full bg-[#F0E8D9] px-3 py-1.5 text-xs"
                    >
                      {categoriaAtiva}
                      <X size={13} />
                    </button>
                  )}

                  {/* MATERIAL */}

                  {materialAtivo !== "Todos" && (
                    <button
                      type="button"
                      onClick={() =>
                        setMaterialAtivo("Todos")
                      }
                      className="inline-flex items-center gap-2 rounded-full bg-[#F0E8D9] px-3 py-1.5 text-xs"
                    >
                      {materialAtivo}
                      <X size={13} />
                    </button>
                  )}

                  {/* PROMOÇÃO */}

                  {promocaoAtiva !== "todos" && (
                    <button
                      type="button"
                      onClick={() =>
                        selecionarPromocao("todos")
                      }
                      className="inline-flex items-center gap-2 rounded-full bg-[#F0E8D9] px-3 py-1.5 text-xs"
                    >
                      {promocaoAtiva === "sim"
                        ? "Em promoção"
                        : "Sem promoção"}

                      <X size={13} />
                    </button>
                  )}
                </div>
              )}

              {/* ===================================== */}
              {/* CARREGAMENTO */}
              {/* ===================================== */}

              {carregando ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div
                      key={item}
                      className="animate-pulse overflow-hidden rounded-2xl border border-[#EAE0CE] bg-white"
                    >
                      <div className="aspect-[4/4.5] bg-[#EAE0CE]" />

                      <div className="space-y-3 p-5">
                        <div className="h-3 w-1/3 rounded bg-[#EAE0CE]" />
                        <div className="h-4 w-3/4 rounded bg-[#EAE0CE]" />
                        <div className="h-4 w-1/2 rounded bg-[#EAE0CE]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : erro ? (
                /* ===================================== */
                /* ERRO */
                /* ===================================== */

                <div className="rounded-2xl border border-[#EAE0CE] bg-white px-5 py-14 text-center">
                  <h2 className="font-serif text-2xl">
                    Não foi possível carregar a coleção
                  </h2>

                  <p className="mt-3 text-sm text-[#847A6C]">
                    {erro}
                  </p>

                  <button
                    type="button"
                    onClick={carregarDados}
                    className="mt-6 rounded-full bg-[#211C14] px-6 py-3 text-sm text-white transition-colors hover:bg-[#4A3D2B]"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : produtosFiltrados.length === 0 ? (
                /* ===================================== */
                /* NENHUM RESULTADO */
                /* ===================================== */

                <div className="rounded-2xl border border-[#EAE0CE] bg-white px-5 py-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F2E8]">
                    <Search
                      size={22}
                      className="text-[#968052]"
                    />
                  </div>

                  <h2 className="mt-5 font-serif text-2xl">
                    Nenhuma joia encontrada
                  </h2>

                  <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#847A6C]">
                    Não encontramos produtos com esses critérios.
                    Experimente mudar sua busca ou seus filtros.
                  </p>

                  <button
                    type="button"
                    onClick={limparFiltros}
                    className="mt-6 rounded-full bg-[#211C14] px-6 py-3 text-sm text-white transition-colors hover:bg-[#4A3D2B]"
                  >
                    Limpar filtros
                  </button>
                </div>
              ) : (
                /* ===================================== */
                /* GRID DE PRODUTOS */
                /* ===================================== */

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {produtosFiltrados.map((produto) => (
                    <CardProduto
                      key={produto.id}
                      produto={produto}
                      favorito={favoritos.includes(produto.id)}
                      aoAlternarFavorito={alternarFavorito}
                      aoAdicionarSacola={adicionarSacola}
                      processandoFavorito={processandoFavoritos.includes(
                        produto.id
                      )}
                      processandoSacola={processandoSacola.includes(
                        produto.id
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================== */}
      {/* SACOLA FLUTUANTE */}
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
