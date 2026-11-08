
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  Package,
  Clock3,
  CheckCircle2,
  Truck,
  XCircle,
  ChevronRight,
  ShoppingBag,
  RefreshCw,
  CreditCard,
  SlidersHorizontal,
  ArrowUpDown,
  CalendarDays,
  ArrowUpRight,
  RotateCcw,
} from "lucide-react";

import { filtrarPedidos } from "../../utils/filtrosCompras.js";
import { apiFetch } from "../../services/api";
import FaixaNavegacao from "../../components/common/FaixaNavegacao";

// ============================================================
// CONFIGURAÇÃO DOS STATUS
// ============================================================

const statusConfig = {
  PENDENTE: {
    label: "Aguardando pagamento",
    icon: Clock3,
    color: "text-[#9B6A2C]",
    background: "bg-[#FBF3E6]",
    border: "border-[#EEDDBD]",
  },
  PAGO: {
    label: "Pagamento confirmado",
    icon: CheckCircle2,
    color: "text-[#537B72]",
    background: "bg-[#EAF3F0]",
    border: "border-[#D1E5DE]",
  },
  EM_PREPARACAO: {
    label: "Em preparação",
    icon: Package,
    color: "text-[#876A9B]",
    background: "bg-[#F3EDF7]",
    border: "border-[#E5D9EC]",
  },
  ENVIADO: {
    label: "Enviado",
    icon: Truck,
    color: "text-[#587A9B]",
    background: "bg-[#EDF3F9]",
    border: "border-[#D8E5F0]",
  },
  ENTREGUE: {
    label: "Entregue",
    icon: CheckCircle2,
    color: "text-[#547D5D]",
    background: "bg-[#EDF5EC]",
    border: "border-[#D7E7D5]",
  },
  CANCELADO: {
    label: "Cancelado",
    icon: XCircle,
    color: "text-[#A45B52]",
    background: "bg-[#FBEEEE]",
    border: "border-[#F0D8D5]",
  },
};

const etapasPedido = [
  { status: "PAGO", label: "Pago" },
  { status: "EM_PREPARACAO", label: "Preparando" },
  { status: "ENVIADO", label: "Enviado" },
  { status: "ENTREGUE", label: "Entregue" },
];

// ============================================================
// FORMATADORES
// ============================================================

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

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarIdPedido(id) {
  if (!id) return "—";
  return String(id).slice(-8).toUpperCase();
}

function obterEtapaAtual(status) {
  const indice = etapasPedido.findIndex(
    (etapa) => etapa.status === status
  );

  return indice === -1 ? 0 : indice + 1;
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.PENDENTE;
  const Icone = config.icon;

  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium ${config.background} ${config.border} ${config.color}`}
    >
      <Icone size={14} strokeWidth={1.8} />
      {config.label}
    </span>
  );
}

function ProgressoPedido({ status }) {
  const etapaAtual = obterEtapaAtual(status);

  return (
    <div className="mt-6 rounded-2xl bg-[#FAF7F1] px-4 py-5 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#968052]">
          Acompanhamento do pedido
        </p>

        <span className="text-[10px] text-[#9B9183]">
          Etapa {etapaAtual} de 4
        </span>
      </div>

      <div className="flex items-center">
        {etapasPedido.map((etapa, indice) => {
          const concluida = indice < etapaAtual;
          const ultima = indice === etapasPedido.length - 1;

          return (
            <div
              key={etapa.status}
              className={`flex items-center ${
                ultima ? "" : "flex-1"
              }`}
            >
              <div
                className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  concluida
                    ? "border-[#968052] bg-[#968052] text-white"
                    : "border-[#E4D9C8] bg-white text-[#B7AA98]"
                }`}
              >
                {concluida ? (
                  <CheckCircle2 size={15} strokeWidth={2} />
                ) : (
                  <span className="text-[10px] font-medium">
                    {indice + 1}
                  </span>
                )}
              </div>

              {!ultima && (
                <div
                  className={`mx-1.5 h-[2px] flex-1 rounded-full sm:mx-3 ${
                    indice < etapaAtual - 1
                      ? "bg-[#968052]"
                      : "bg-[#E4D9C8]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1 text-center">
        {etapasPedido.map((etapa, indice) => (
          <span
            key={etapa.status}
            className={`text-[9px] sm:text-[11px] ${
              indice < etapaAtual
                ? "font-medium text-[#968052]"
                : "text-[#A49A8C]"
            }`}
          >
            {etapa.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function InfoPedido({ titulo, valor, destaque = false }) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-[11px] text-[#9A9083]">
        {titulo}
      </p>

      <p
        className={`break-words ${
          destaque
            ? "text-base font-semibold text-[#211C14]"
            : "text-sm font-medium text-[#40382F]"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}

function SkeletonPedido() {
  return (
    <div className="animate-pulse rounded-[22px] border border-[#EAE0D1] bg-white p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="h-3 w-20 rounded bg-[#EEE7DC]" />
          <div className="h-5 w-36 rounded bg-[#EEE7DC]" />
          <div className="h-3 w-28 rounded bg-[#EEE7DC]" />
        </div>

        <div className="h-8 w-32 rounded-full bg-[#EEE7DC]" />
      </div>

      <div className="mt-6 h-24 rounded-2xl bg-[#F7F3EB]" />

      <div className="mt-6 grid grid-cols-3 gap-4">
        {[1, 2, 3].map((item) => (
          <div key={item} className="space-y-2">
            <div className="h-3 w-16 rounded bg-[#EEE7DC]" />
            <div className="h-4 w-24 max-w-full rounded bg-[#EEE7DC]" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function PedidoUser() {
  const [todosPedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");

  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [ordem, setOrdem] = useState("RECENTES");

  const pedidos = useMemo(
    () =>
      filtrarPedidos(todosPedidos, {
        status: filtroStatus,
        ordem,
      }),
    [todosPedidos, filtroStatus, ordem]
  );

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

      const lista = Array.isArray(resposta)
        ? resposta
        : resposta?.pedidos ?? [];

      setPedidos(lista);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);

      setErro(
        error.message || "Não foi possível carregar seus pedidos."
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
  // RESUMO DOS PEDIDOS
  // ==========================================

  const resumo = useMemo(() => {
    return {
      total: todosPedidos.length,
      andamento: todosPedidos.filter((pedido) =>
        ["PAGO", "EM_PREPARACAO", "ENVIADO"].includes(
          pedido.status
        )
      ).length,
      entregues: todosPedidos.filter(
        (pedido) => pedido.status === "ENTREGUE"
      ).length,
    };
  }, [todosPedidos]);

  function limparFiltros() {
    setFiltroStatus("TODOS");
    setOrdem("RECENTES");
  }

  const filtrosAtivos =
    filtroStatus !== "TODOS" || ordem !== "RECENTES";

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  return (
    <main className="min-h-screen bg-[#FCFAF6] text-[#211C14]">
      {/* BREADCRUMB */}

      <div className="max-md:hidden">
        <FaixaNavegacao
          mostrarVoltar={false}
          itens={[
            { label: "Início", to: "/" },
            { label: "Meus pedidos", to: "/pedidos" },
          ]}
        />
      </div>

      <div className="mx-auto max-w-[1180px] px-5 pb-20 pt-10 sm:px-8 lg:px-10 lg:pt-14">
        {/* ===================================== */}
        {/* CABEÇALHO */}
        {/* ===================================== */}

        <div className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#A47B43]">
              Minha conta
            </p>

            <h1 className="font-serif text-3xl tracking-tight text-[#211C14] sm:text-4xl">
              Meus pedidos
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#81776A]">
              Acompanhe suas compras, confira o andamento das
              entregas e consulte os detalhes dos seus pedidos.
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
            Atualizar pedidos
          </button>
        </div>

        {/* ===================================== */}
        {/* RESUMO */}
        {/* ===================================== */}

        {!carregando && !erro && todosPedidos.length > 0 && (
          <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
            {[
              {
                titulo: "Total de pedidos",
                valor: resumo.total,
                icon: ShoppingBag,
              },
              {
                titulo: "Em andamento",
                valor: resumo.andamento,
                icon: Truck,
              },
              {
                titulo: "Entregues",
                valor: resumo.entregues,
                icon: CheckCircle2,
              },
            ].map((item) => {
              const Icone = item.icon;

              return (
                <div
                  key={item.titulo}
                  className="rounded-[18px] border border-[#EAE0D1] bg-white p-3.5 sm:rounded-[20px] sm:p-5"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F2E8] text-[#968052]">
                    <Icone size={17} strokeWidth={1.7} />
                  </div>

                  <p className="text-xl font-semibold text-[#211C14] sm:text-2xl">
                    {item.valor}
                  </p>

                  <p className="mt-1 text-[10px] leading-snug text-[#8B8174] sm:text-xs">
                    {item.titulo}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* ===================================== */}
        {/* FILTROS */}
        {/* ===================================== */}

        <section
          aria-label="Filtros de pedidos"
          className="mb-8 rounded-[20px] border border-[#EAE0D1] bg-white p-4 sm:p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal
              size={16}
              className="text-[#968052]"
            />

            <h2 className="text-sm font-semibold text-[#211C14]">
              Filtrar pedidos
            </h2>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="mb-2 block text-[11px] font-medium text-[#746B60]">
                Status do pedido
              </span>

              <div className="relative">
                <select
                  value={filtroStatus}
                  onChange={(event) =>
                    setFiltroStatus(event.target.value)
                  }
                  className="w-full appearance-none rounded-xl border border-[#E8DDCA] bg-[#FCFAF6] px-4 py-3 pr-10 text-xs text-[#40382F] outline-none transition focus:border-[#968052] sm:text-sm"
                >
                  <option value="TODOS">Todos os status</option>

                  {Object.entries(statusConfig).map(
                    ([valor, config]) => (
                      <option key={valor} value={valor}>
                        {config.label}
                      </option>
                    )
                  )}
                </select>

                <ChevronRight
                  size={15}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 text-[#968052]"
                />
              </div>
            </label>

            <label className="flex-1">
              <span className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-[#746B60]">
                <ArrowUpDown size={12} />
                Ordenar por
              </span>

              <div className="relative">
                <select
                  value={ordem}
                  onChange={(event) =>
                    setOrdem(event.target.value)
                  }
                  className="w-full appearance-none rounded-xl border border-[#E8DDCA] bg-[#FCFAF6] px-4 py-3 pr-10 text-xs text-[#40382F] outline-none transition focus:border-[#968052] sm:text-sm"
                >
                  <option value="RECENTES">Mais recentes</option>
                  <option value="ANTIGOS">Mais antigos</option>
                  <option value="MAIOR_VALOR">Maior valor</option>
                  <option value="MENOR_VALOR">Menor valor</option>
                </select>

                <ChevronRight
                  size={15}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 text-[#968052]"
                />
              </div>
            </label>

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
        </section>

        {/* ===================================== */}
        {/* CARREGANDO */}
        {/* ===================================== */}

        {carregando ? (
          <div className="space-y-5">
            {[1, 2].map((item) => (
              <SkeletonPedido key={item} />
            ))}
          </div>
        ) : erro ? (
          /* ERRO */

          <div className="rounded-[22px] border border-[#EAE0D1] bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FBEEEE] text-[#A45B52]">
              <XCircle size={25} />
            </div>

            <h2 className="mt-5 font-serif text-xl">
              Não foi possível carregar seus pedidos
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
          /* NENHUM PEDIDO */

          <div className="rounded-[22px] border border-[#EAE0D1] bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F7F2E8] text-[#968052]">
              <ShoppingBag size={28} strokeWidth={1.5} />
            </div>

            <h2 className="mt-5 font-serif text-2xl text-[#211C14]">
              {todosPedidos.length === 0
                ? "Sua jornada começa aqui"
                : "Nenhum pedido encontrado"}
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#81776A]">
              {todosPedidos.length === 0
                ? "Você ainda não realizou nenhuma compra. Descubra as peças que preparamos para você."
                : "Não encontramos pedidos com os filtros selecionados. Experimente outras opções."}
            </p>

            {todosPedidos.length === 0 ? (
              <Link
                to="/produtos"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#211C14] px-6 py-3 text-xs font-medium text-white transition hover:bg-[#4A3D2B]"
              >
                Explorar produtos
                <ArrowUpRight size={15} />
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
          /* LISTA DE PEDIDOS */

          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-[#81776A]">
                <span className="font-semibold text-[#211C14]">
                  {pedidos.length}
                </span>{" "}
                {pedidos.length === 1
                  ? "pedido encontrado"
                  : "pedidos encontrados"}
              </p>

              <span className="text-[11px] text-[#A49A8C]">
                Histórico de compras
              </span>
            </div>

            {pedidos.map((pedido) => {
              const status =
                statusConfig[pedido.status] ||
                statusConfig.PENDENTE;

              const itens = Array.isArray(pedido.itens)
                ? pedido.itens
                : [];

              const quantidadeItens = itens.reduce(
                (total, item) =>
                  total + Number(item.quantidade || 0),
                0
              );

              const aguardandoPagamento =
                pedido.status === "PENDENTE";

              const cancelado =
                pedido.status === "CANCELADO";

              return (
                <article
                  key={pedido.id}
                  className="group overflow-hidden rounded-[22px] border border-[#EAE0D1] bg-white transition-all duration-300 hover:border-[#C9B692] hover:shadow-lg hover:shadow-[#211C14]/[0.035]"
                >
                  {/* CABEÇALHO DO CARD */}

                  <div className="flex flex-col gap-4 px-5 pb-5 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:pt-6">
                    <div>
                      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#A47B43]">
                        Pedido
                      </p>

                      <h2
                        className="text-lg font-semibold tracking-tight text-[#211C14]"
                        title={pedido.id}
                      >
                        #{formatarIdPedido(pedido.id)}
                      </h2>

                      <p className="mt-2 flex items-center gap-1.5 text-xs text-[#918679]">
                        <CalendarDays size={13} />
                        {formatarData(pedido.criadoEm)}
                      </p>
                    </div>

                    <StatusBadge status={pedido.status} />
                  </div>

                  {/* PROGRESSO */}

                  {!aguardandoPagamento && !cancelado && (
                    <div className="px-5 sm:px-7">
                      <ProgressoPedido status={pedido.status} />
                    </div>
                  )}

                  {/* INFORMAÇÕES DO PEDIDO */}

                  <div className="mx-5 mt-6 grid grid-cols-2 gap-x-5 gap-y-5 border-t border-[#F0EADF] py-5 sm:mx-7 sm:grid-cols-3">
                    <InfoPedido
                      titulo="Quantidade de itens"
                      valor={`${quantidadeItens} ${
                        quantidadeItens === 1
                          ? "produto"
                          : "produtos"
                      }`}
                    />

                    <InfoPedido
                      titulo="Destinatário"
                      valor={
                        pedido.destinatario || "Não informado"
                      }
                    />

                    <div className="col-span-2 sm:col-span-1">
                      <InfoPedido
                        titulo="Valor total"
                        valor={formatarMoeda(pedido.valorTotal)}
                        destaque
                      />
                    </div>
                  </div>

                  {/* PAGAMENTO PENDENTE */}

                  {aguardandoPagamento && (
                    <div className="mx-5 mb-5 flex flex-col gap-4 rounded-2xl border border-[#EEDDBD] bg-[#FBF7EF] p-4 sm:mx-7 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3E6CE] text-[#9B6A2C]">
                          <Clock3 size={17} />
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-[#6C502C]">
                            Pagamento pendente
                          </p>

                          <p className="mt-1 text-xs leading-relaxed text-[#987B54]">
                            Finalize o pagamento para confirmar
                            seu pedido.
                          </p>
                        </div>
                      </div>

                      <Link
                        to={`/pagamento/${pedido.id}`}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#211C14] px-5 py-2.5 text-xs font-medium text-white transition hover:bg-[#4A3D2B]"
                      >
                        <CreditCard size={15} />
                        Pagar agora
                      </Link>
                    </div>
                  )}

                  {/* RODAPÉ */}

                  <div className="flex items-center justify-end border-t border-[#F0EADF] bg-[#FDFBF8] px-5 py-4 sm:px-7">
                    <Link
                      to={`/pedidos/${pedido.id}`}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-[#968052] transition-colors hover:text-[#211C14]"
                    >
                      Ver detalhes do pedido
                      <ChevronRight
                        size={16}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
