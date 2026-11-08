
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Package,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  SlidersHorizontal,
  Truck,
  XCircle,
} from "lucide-react";

import { filtrarHistorico } from "../../utils/filtrosCompras.js";
import { apiFetch } from "../../services/api.js";
import FaixaNavegacao from "../../components/common/FaixaNavegacao.jsx";

// ============================================================
// FORMATAÇÃO
// ============================================================

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  if (!data) return "Data indisponível";

  const dataConvertida = new Date(data);

  if (Number.isNaN(dataConvertida.getTime())) {
    return "Data indisponível";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(dataConvertida);
}

function reduzirId(id) {
  if (!id) return "—";
  return String(id).slice(-8).toUpperCase();
}

// ============================================================
// STATUS
// ============================================================

const STATUS_PEDIDO = {
  PENDENTE: {
    texto: "Aguardando pagamento",
    descricao:
      "Seu pedido foi criado e está aguardando a conclusão do pagamento.",
    Icone: Clock3,
    classe:
      "border-[#EEDDBD] bg-[#FBF3E6] text-[#9B6A2C]",
  },

  PAGO: {
    texto: "Pagamento aprovado",
    descricao:
      "Recebemos seu pagamento e o pedido será preparado em breve.",
    Icone: CheckCircle2,
    classe:
      "border-[#D1E5DE] bg-[#EAF3F0] text-[#537B72]",
  },

  EM_PREPARACAO: {
    texto: "Em preparação",
    descricao:
      "Seu pedido está sendo preparado com todo cuidado.",
    Icone: Package,
    classe:
      "border-[#E5D9EC] bg-[#F3EDF7] text-[#876A9B]",
  },

  ENVIADO: {
    texto: "Pedido enviado",
    descricao: "Seu pedido já saiu para entrega.",
    Icone: Truck,
    classe:
      "border-[#D8E5F0] bg-[#EDF3F9] text-[#587A9B]",
  },

  ENTREGUE: {
    texto: "Pedido entregue",
    descricao: "Seu pedido foi entregue.",
    Icone: PackageCheck,
    classe:
      "border-[#D7E7D5] bg-[#EDF5EC] text-[#547D5D]",
  },

  CANCELADO: {
    texto: "Pedido cancelado",
    descricao: "Este pedido foi cancelado.",
    Icone: XCircle,
    classe:
      "border-[#F0D8D5] bg-[#FBEEEE] text-[#A45B52]",
  },
};

function obterStatusPedido(status) {
  return (
    STATUS_PEDIDO[status] || {
      texto:
        status?.replaceAll("_", " ").toLowerCase() ||
        "Pedido",
      descricao: "Consulte os detalhes do pedido.",
      Icone: Package,
      classe:
        "border-[#EAE0D1] bg-[#F7F2E8] text-[#746B60]",
    }
  );
}

// ============================================================
// PAGAMENTO
// ============================================================

function formatarMetodoPagamento(metodo) {
  if (!metodo) return null;

  const metodos = {
    PIX: "Pix",
    CREDITO: "Cartão de crédito",
    CREDITO_CARTAO: "Cartão de crédito",
    CARTAO_CREDITO: "Cartão de crédito",
    DEBITO: "Cartão de débito",
    DEBITO_CARTAO: "Cartão de débito",
    CARTAO_DEBITO: "Cartão de débito",
    BOLETO: "Boleto",
  };

  return (
    metodos[metodo] ||
    String(metodo)
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letra) => letra.toUpperCase())
  );
}

function formatarStatusPagamento(status) {
  if (!status) return null;

  const statusPagamento = {
    PENDENTE: "Pendente",
    PROCESSANDO: "Processando",
    APROVADO: "Aprovado",
    RECUSADO: "Recusado",
    CANCELADO: "Cancelado",
    REEMBOLSADO: "Reembolsado",
    EXPIRADO: "Expirado",
  };

  return (
    statusPagamento[status] ||
    String(status)
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letra) => letra.toUpperCase())
  );
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function StatusBadge({ status }) {
  const config = obterStatusPedido(status);
  const Icone = config.Icone;

  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium ${config.classe}`}
    >
      <Icone size={14} strokeWidth={1.8} />
      {config.texto}
    </span>
  );
}

function ProdutoHistorico({ item, ultimo }) {
  const imagem =
    item.produto?.imagens?.[0]?.url ||
    item.produto?.imagem ||
    item.produto?.imagemUrl ||
    null;

  const textoAlternativo =
    item.produto?.imagens?.[0]?.textoAlternativo ||
    item.nomeProduto ||
    "Produto";

  const produtoId = item.produtoId;

  const subtotal =
    Number(item.precoUnitario || 0) *
    Number(item.quantidade || 0);

  const imagemConteudo = imagem ? (
    <img
      src={imagem}
      alt={textoAlternativo}
      loading="lazy"
      className="h-full w-full object-cover transition-transform duration-500 group-hover/produto:scale-105"
    />
  ) : (
    <Package
      size={25}
      strokeWidth={1.4}
      className="text-[#B9A77F]"
    />
  );

  return (
    <div
      className={`flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${
        ultimo ? "" : "border-b border-[#F0EADF]"
      }`}
    >
      <div className="flex min-w-0 items-center gap-4">
        {produtoId ? (
          <Link
            to={`/produtos/${produtoId}`}
            className="group/produto flex h-[82px] w-[82px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F7F2E8] sm:h-[90px] sm:w-[90px]"
          >
            {imagemConteudo}
          </Link>
        ) : (
          <div className="flex h-[82px] w-[82px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F7F2E8] sm:h-[90px] sm:w-[90px]">
            {imagemConteudo}
          </div>
        )}

        <div className="min-w-0">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#A47B43]">
            AURELIA
          </p>

          {produtoId ? (
            <Link
              to={`/produtos/${produtoId}`}
              className="line-clamp-2 text-sm font-medium leading-relaxed text-[#211C14] transition hover:text-[#968052]"
            >
              {item.nomeProduto || "Produto"}
            </Link>
          ) : (
            <p className="line-clamp-2 text-sm font-medium leading-relaxed text-[#211C14]">
              {item.nomeProduto || "Produto"}
            </p>
          )}

          <p className="mt-2 text-xs text-[#81776A]">
            Quantidade: {item.quantidade}
          </p>

          <p className="mt-1 text-[11px] text-[#9B9183]">
            Unitário: {formatarMoeda(item.precoUnitario)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#F3EDE3] pt-3 sm:block sm:border-0 sm:pt-0 sm:text-right">
        <p className="text-[11px] text-[#9B9183]">
          Subtotal
        </p>

        <p className="text-sm font-semibold text-[#211C14]">
          {formatarMoeda(subtotal)}
        </p>
      </div>
    </div>
  );
}

function InformacaoComplementar({
  Icone,
  titulo,
  principal,
  secundario,
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl bg-[#FAF7F1] p-4 sm:p-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#968052]">
        <Icone size={17} strokeWidth={1.7} />
      </div>

      <div className="min-w-0">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A47B43]">
          {titulo}
        </p>

        <p className="break-words text-sm font-medium text-[#211C14]">
          {principal}
        </p>

        {secundario && (
          <p className="mt-1.5 text-xs leading-relaxed text-[#81776A]">
            {secundario}
          </p>
        )}
      </div>
    </div>
  );
}

function SkeletonHistorico() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[22px] border border-[#EAE0D1] bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-[#F0EADF] p-6">
        <div className="space-y-3">
          <div className="h-3 w-20 rounded bg-[#EEE7DC]" />
          <div className="h-5 w-36 rounded bg-[#EEE7DC]" />
        </div>

        <div className="h-8 w-32 rounded-full bg-[#EEE7DC]" />
      </div>

      <div className="space-y-4 p-6">
        <div className="flex gap-4">
          <div className="h-20 w-20 rounded-xl bg-[#EEE7DC]" />

          <div className="flex-1 space-y-3">
            <div className="h-4 w-2/3 rounded bg-[#EEE7DC]" />
            <div className="h-3 w-1/3 rounded bg-[#EEE7DC]" />
          </div>
        </div>

        <div className="h-20 rounded-2xl bg-[#F7F3EB]" />
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function HistoricoCompras() {
  const [todosPedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");

  const [periodo, setPeriodo] = useState("TODOS");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  // ==========================================
  // CARREGAR PEDIDOS
  // ==========================================

  const carregarPedidos = useCallback(async (silencioso = false) => {
    try {
      if (silencioso) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }

      setErro("");

      const resposta = await apiFetch("/pedidos");

      if (!resposta || !Array.isArray(resposta.pedidos)) {
        throw new Error(
          "A API não retornou os pedidos corretamente."
        );
      }

      setPedidos(resposta.pedidos);
    } catch (error) {
      console.error(
        "Erro ao carregar histórico de compras:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível carregar suas compras."
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregarPedidos();
  }, [carregarPedidos]);

  // ==========================================
  // FILTROS
  // ==========================================

  const pedidos = useMemo(
    () =>
      filtrarHistorico(todosPedidos, {
        periodo,
        inicio,
        fim,
      }),
    [todosPedidos, periodo, inicio, fim]
  );

  const periodoInvalido =
    periodo === "PERSONALIZADO" &&
    inicio &&
    fim &&
    inicio > fim;

  const filtrosAtivos =
    periodo !== "TODOS" || inicio !== "" || fim !== "";

  function limparFiltros() {
    setPeriodo("TODOS");
    setInicio("");
    setFim("");
  }

  // ==========================================
  // RESUMO
  // ==========================================

  const quantidadePedidos = pedidos.length;

  const quantidadeProdutos = useMemo(() => {
    return pedidos.reduce((total, pedido) => {
      const quantidade =
        pedido.itens?.reduce(
          (subtotal, item) =>
            subtotal + Number(item.quantidade || 0),
          0
        ) || 0;

      return total + quantidade;
    }, 0);
  }, [pedidos]);

  const totalCompras = useMemo(() => {
    return pedidos.reduce(
      (total, pedido) =>
        total + Number(pedido.valorTotal || 0),
      0
    );
  }, [pedidos]);

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  return (
    <main className="min-h-screen bg-[#FCFAF6] text-[#211C14]">
      {/* NAVEGAÇÃO */}

      <div className="w-full max-md:hidden">
        <FaixaNavegacao
          mostrarVoltar={false}
          itens={[
            { label: "Início", to: "/" },
            { label: "Compras" },
          ]}
        />
      </div>

      <div className="mx-auto max-w-[1180px] px-5 pb-20 pt-10 sm:px-8 lg:px-10 lg:pt-14">
        {/* ===================================== */}
        {/* CABEÇALHO */}
        {/* ===================================== */}

        <section className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#A47B43]">
              Minha conta
            </p>

            <h1 className="font-serif text-3xl tracking-tight text-[#211C14] sm:text-4xl">
              Minhas compras
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#81776A]">
              Consulte seus pedidos entregues, cancelados e
              reembolsados. Use o período para encontrar suas compras.
            </p>
          </div>

          <button
            type="button"
            onClick={() => carregarPedidos(true)}
            disabled={carregando || atualizando}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E5D9C6] bg-white px-4 py-2.5 text-xs font-medium text-[#514635] transition hover:border-[#B9975B] hover:bg-[#F7F2E8] disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              className={atualizando ? "animate-spin" : ""}
            />
            Atualizar compras
          </button>
        </section>

        {/* ===================================== */}
        {/* FILTROS */}
        {/* ===================================== */}

        <section
          aria-label="Filtrar histórico por período"
          className="mb-8 rounded-[20px] border border-[#EAE0D1] bg-white p-4 sm:p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal
              size={16}
              className="text-[#968052]"
            />

            <h2 className="text-sm font-semibold text-[#211C14]">
              Filtrar compras
            </h2>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="mb-2 block text-[11px] font-medium text-[#746B60]">
                Período
              </span>

              <div className="relative">
                <select
                  aria-label="Período das compras"
                  value={periodo}
                  onChange={(event) =>
                    setPeriodo(event.target.value)
                  }
                  className="w-full appearance-none rounded-xl border border-[#E8DDCA] bg-[#FCFAF6] px-4 py-3 pr-10 text-xs text-[#40382F] outline-none transition focus:border-[#968052] sm:text-sm"
                >
                  <option value="TODOS">Todo o período</option>
                  <option value="30">Últimos 30 dias</option>
                  <option value="90">Últimos 90 dias</option>
                  <option value="365">Últimos 365 dias</option>
                  <option value="PERSONALIZADO">
                    Escolher datas
                  </option>
                </select>

                <ChevronRight
                  size={15}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 text-[#968052]"
                />
              </div>
            </label>

            {periodo === "PERSONALIZADO" && (
              <>
                <label className="flex-1">
                  <span className="mb-2 block text-[11px] font-medium text-[#746B60]">
                    Data inicial
                  </span>

                  <input
                    type="date"
                    aria-label="Data inicial das compras"
                    value={inicio}
                    onChange={(event) =>
                      setInicio(event.target.value)
                    }
                    className="w-full rounded-xl border border-[#E8DDCA] bg-[#FCFAF6] px-4 py-3 text-xs text-[#40382F] outline-none transition focus:border-[#968052] sm:text-sm"
                  />
                </label>

                <label className="flex-1">
                  <span className="mb-2 block text-[11px] font-medium text-[#746B60]">
                    Data final
                  </span>

                  <input
                    type="date"
                    aria-label="Data final das compras"
                    value={fim}
                    min={inicio || undefined}
                    onChange={(event) =>
                      setFim(event.target.value)
                    }
                    className="w-full rounded-xl border border-[#E8DDCA] bg-[#FCFAF6] px-4 py-3 text-xs text-[#40382F] outline-none transition focus:border-[#968052] sm:text-sm"
                  />
                </label>
              </>
            )}

            {filtrosAtivos && (
              <button
                type="button"
                onClick={limparFiltros}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-medium text-[#968052] transition hover:bg-[#F7F2E8]"
              >
                <RotateCcw size={14} />
                Limpar filtros
              </button>
            )}
          </div>

          {periodoInvalido && (
            <p
              role="alert"
              className="mt-4 flex items-center gap-2 text-xs text-[#A45B52]"
            >
              <AlertCircle size={14} />
              A data inicial deve ser anterior ou igual à data
              final.
            </p>
          )}
        </section>

        {/* ===================================== */}
        {/* CARREGAMENTO */}
        {/* ===================================== */}

        {carregando ? (
          <div className="space-y-5">
            {[1, 2].map((item) => (
              <SkeletonHistorico key={item} />
            ))}
          </div>
        ) : erro ? (
          /* ERRO */

          <div className="rounded-[22px] border border-[#EAE0D1] bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FBEEEE] text-[#A45B52]">
              <AlertCircle size={25} />
            </div>

            <h2 className="mt-5 font-serif text-xl">
              Não foi possível carregar suas compras
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-[#81776A]">
              {erro}
            </p>

            <button
              type="button"
              onClick={() => carregarPedidos()}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#211C14] px-6 py-3 text-xs font-medium text-white transition hover:bg-[#4A3D2B]"
            >
              <RefreshCw size={15} />
              Tentar novamente
            </button>
          </div>
        ) : pedidos.length === 0 ? (
          /* SEM COMPRAS */

          <div className="rounded-[22px] border border-[#EAE0D1] bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F7F2E8] text-[#968052]">
              <ShoppingBag size={28} strokeWidth={1.5} />
            </div>

            <h2 className="mt-5 font-serif text-2xl text-[#211C14]">
              {todosPedidos.length === 0
                ? "Sua coleção começa aqui"
                : "Nenhuma compra neste período"}
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#81776A]">
              {todosPedidos.length === 0
                ? "Você ainda não possui compras registradas. Explore nossas coleções e encontre suas próximas peças favoritas."
                : "Não encontramos compras para o período selecionado. Experimente ajustar as datas."}
            </p>

            {todosPedidos.length === 0 ? (
              <Link
                to="/produtos"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#211C14] px-6 py-3 text-xs font-medium text-white transition hover:bg-[#4A3D2B]"
              >
                Explorar produtos
                <ArrowRight size={15} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={limparFiltros}
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#211C14] px-6 py-3 text-xs font-medium text-white transition hover:bg-[#4A3D2B]"
              >
                <RotateCcw size={14} />
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          /* HISTÓRICO */

          <>
            {/* RESUMO */}

            <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
              {[
                {
                  titulo: "Compras",
                  valor: quantidadePedidos,
                  Icone: ShoppingBag,
                },
                {
                  titulo: "Peças adquiridas",
                  valor: quantidadeProdutos,
                  Icone: Package,
                },
                {
                  titulo: "Valor das compras",
                  valor: formatarMoeda(totalCompras),
                  Icone: CreditCard,
                },
              ].map((item) => {
                const Icone = item.Icone;

                return (
                  <div
                    key={item.titulo}
                    className="min-w-0 rounded-[18px] border border-[#EAE0D1] bg-white p-3.5 sm:rounded-[20px] sm:p-5"
                  >
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F2E8] text-[#968052]">
                      <Icone size={17} strokeWidth={1.7} />
                    </div>

                    <p className="break-words text-lg font-semibold text-[#211C14] sm:text-2xl">
                      {item.valor}
                    </p>

                    <p className="mt-1 text-[10px] leading-snug text-[#8B8174] sm:text-xs">
                      {item.titulo}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mb-5 flex items-center justify-between gap-3">
              <p className="text-xs text-[#81776A]">
                <span className="font-semibold text-[#211C14]">
                  {quantidadePedidos}
                </span>{" "}
                {quantidadePedidos === 1
                  ? "compra encontrada"
                  : "compras encontradas"}
              </p>

              <span className="text-[11px] text-[#A49A8C]">
                Histórico de compras
              </span>
            </div>

            {/* LISTA */}

            <div className="space-y-5">
              {pedidos.map((pedido) => {
                const status = obterStatusPedido(
                  pedido.status
                );

                const IconeStatus = status.Icone;

                const pagamentos = Array.isArray(
                  pedido.pagamentos
                )
                  ? pedido.pagamentos
                  : [];

                const pagamentoAprovado = pagamentos.find(
                  (pagamento) =>
                    pagamento.status === "APROVADO"
                );

                const pagamento =
                  pagamentoAprovado || pagamentos[0] || null;

                const itens = Array.isArray(pedido.itens)
                  ? pedido.itens
                  : [];

                return (
                  <article
                    key={pedido.id}
                    className="overflow-hidden rounded-[22px] border border-[#EAE0D1] bg-white transition-all duration-300 hover:border-[#C9B692] hover:shadow-lg hover:shadow-[#211C14]/[0.035]"
                  >
                    {/* CABEÇALHO DO PEDIDO */}

                    <div className="flex flex-col gap-4 px-5 pb-5 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:pt-6">
                      <div>
                        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#A47B43]">
                          Pedido
                        </p>

                        <h2
                          className="text-lg font-semibold tracking-tight text-[#211C14]"
                          title={pedido.id}
                        >
                          #{reduzirId(pedido.id)}
                        </h2>

                        <p className="mt-2 flex items-center gap-1.5 text-xs text-[#918679]">
                          <CalendarDays size={13} />
                          {formatarData(pedido.criadoEm)}
                        </p>
                      </div>

                      <StatusBadge status={pedido.status} />
                    </div>

                    {/* STATUS */}

                    <div className="mx-5 flex items-start gap-3 rounded-2xl bg-[#FAF7F1] p-4 sm:mx-7 sm:p-5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#968052]">
                        <IconeStatus
                          size={18}
                          strokeWidth={1.7}
                        />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-[#211C14]">
                          {status.texto}
                        </p>

                        <p className="mt-1 text-xs leading-relaxed text-[#81776A]">
                          {status.descricao}
                        </p>
                      </div>
                    </div>

                    {/* PRODUTOS */}

                    <div className="px-5 pt-6 sm:px-7">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A47B43]">
                          Peças do pedido
                        </h3>

                        <span className="text-[11px] text-[#9B9183]">
                          {itens.reduce(
                            (total, item) =>
                              total +
                              Number(item.quantidade || 0),
                            0
                          )}{" "}
                          itens
                        </span>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-[#EAE0D1]">
                        {itens.length === 0 ? (
                          <div className="px-5 py-8 text-center text-sm text-[#81776A]">
                            Nenhum produto encontrado neste pedido.
                          </div>
                        ) : (
                          itens.map((item, index) => (
                            <ProdutoHistorico
                              key={item.id ?? index}
                              item={item}
                              ultimo={
                                index === itens.length - 1
                              }
                            />
                          ))
                        )}
                      </div>
                    </div>

                    {/* PAGAMENTO E DESTINATÁRIO */}

                    <div className="mt-5 grid gap-3 px-5 sm:grid-cols-2 sm:px-7">
                      <InformacaoComplementar
                        Icone={CreditCard}
                        titulo="Pagamento"
                        principal={
                          pagamento
                            ? formatarMetodoPagamento(
                                pagamento.metodo
                              )
                            : "Nenhum pagamento iniciado"
                        }
                        secundario={
                          pagamento
                            ? `Status: ${formatarStatusPagamento(
                                pagamento.status
                              )}`
                            : null
                        }
                      />

                      <InformacaoComplementar
                        Icone={ReceiptText}
                        titulo="Destinatário"
                        principal={
                          pedido.destinatario ||
                          "Não informado"
                        }
                        secundario="Consulte os detalhes para visualizar as informações completas."
                      />
                    </div>

                    {/* TOTAL */}

                    <div className="mx-5 mt-5 flex items-center justify-between rounded-2xl border border-[#EAE0D1] bg-[#FDFBF8] px-5 py-4 sm:mx-7">
                      <div>
                        <p className="text-[11px] text-[#81776A]">
                          Valor total do pedido
                        </p>

                        <p className="mt-1 text-[10px] text-[#A49A8C]">
                          {itens.length}{" "}
                          {itens.length === 1
                            ? "produto diferente"
                            : "produtos diferentes"}
                        </p>
                      </div>

                      <p className="text-lg font-semibold text-[#211C14] sm:text-xl">
                        {formatarMoeda(pedido.valorTotal)}
                      </p>
                    </div>

                    {/* RODAPÉ */}

                    <div className="mt-6 flex items-center justify-end border-t border-[#F0EADF] bg-[#FDFBF8] px-5 py-4 sm:px-7">
                      <Link
                        to={`/pedidos/${pedido.id}`}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-[#968052] transition-colors hover:text-[#211C14]"
                      >
                        Ver detalhes do pedido
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
