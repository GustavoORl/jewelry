import { useCallback, useEffect, useMemo, useState } from "react";

import Sidebar from "../../components/admin/Sidebar.jsx";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import { apiFetch } from "../../services/api.js";

import {
  Package,
  ArrowUpRight,
  CircleDollarSign,
  ShoppingCart,
  UserRound,
  Menu,
  Plus,
  MoreHorizontal,
  Eye,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Clock3,
  CheckCircle2,
  Truck,
  XCircle,
  CreditCard,
} from "lucide-react";

const PERIODOS = [
  { label: "Últimos 12 meses", value: "12m" },
  { label: "Últimos 30 dias", value: "30d" },
  { label: "Últimos 7 dias", value: "7d" },
];

const STATUS_PEDIDOS = {
  PENDENTE: {
    label: "Pendente",
    cor: "bg-[#efede8] text-[#81796c]",
    grafico: "#d8c6a3",
    icone: Clock3,
  },
  PAGO: {
    label: "Pago",
    cor: "bg-[#e7f1e8] text-[#477254]",
    grafico: "#a88c56",
    icone: CheckCircle2,
  },
  EM_PREPARACAO: {
    label: "Em preparação",
    cor: "bg-[#f4ead5] text-[#8c6d31]",
    grafico: "#d8c6a3",
    icone: Package,
  },
  ENVIADO: {
    label: "Enviado",
    cor: "bg-[#e7edf4] text-[#55718e]",
    grafico: "#8ba3bd",
    icone: Truck,
  },
  ENTREGUE: {
    label: "Entregue",
    cor: "bg-[#e7f1e8] text-[#477254]",
    grafico: "#7c9580",
    icone: CheckCircle2,
  },
  CANCELADO: {
    label: "Cancelado",
    cor: "bg-[#f8e7e4] text-[#a34e43]",
    grafico: "#c78176",
    icone: XCircle,
  },
};

const CORES_GRAFICO = [
  "#a88c56",
  "#d8c6a3",
  "#7c9580",
  "#8ba3bd",
  "#c78176",
  "#b9a6c9",
];

const moeda = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);

const numero = (valor) =>
  new Intl.NumberFormat("pt-BR").format(Number(valor) || 0);

const dataFormatada = (data) => {
  if (!data) return "—";

  const dataValida = new Date(data);

  if (Number.isNaN(dataValida.getTime())) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(dataValida);
};

const dataCurta = (data) => {
  if (!data) return "";

  const dataValida = new Date(`${data}T12:00:00`);

  if (Number.isNaN(dataValida.getTime())) return data;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(dataValida);
};

function obterStatus(status) {
  return (
    STATUS_PEDIDOS[status] || {
      label: status || "Desconhecido",
      cor: "bg-[#efede8] text-[#81796c]",
      grafico: "#d8c6a3",
      icone: Clock3,
    }
  );
}

function obterIniciais(nome) {
  if (!nome) return "?";

  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

function StatCard({ item }) {
  const Icon = item.icon;

  return (
    <article className="rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] p-5 transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(55,43,22,0.05)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium text-[#817664]">
          {item.label}
        </p>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1e8d8] text-[#8d7547]">
          <Icon size={17} strokeWidth={1.7} />
        </span>
      </div>

      <p className="mt-4 break-words font-serif text-[27px] tracking-[-0.04em] text-[#211c14] sm:text-[30px]">
        {item.value}
      </p>

      <p className="mt-3 text-[10px] text-[#a09787]">
        {item.note}
      </p>
    </article>
  );
}

function SalesChart({ vendas, periodo }) {
  const pontos = useMemo(() => {
    return (vendas || []).map((item) => ({
      data: item.data,
      valor: Number(item.valor) || 0,
    }));
  }, [vendas]);

  if (!pontos.length) {
    return (
      <div className="mt-5 flex h-[220px] flex-col items-center justify-center text-center">
        <CircleDollarSign size={30} className="text-[#c9b17f]" />

        <p className="mt-3 text-sm text-[#817664]">
          Nenhuma venda encontrada neste período.
        </p>

        <p className="mt-1 text-xs text-[#a09787]">
          Quando houver vendas confirmadas, o gráfico aparecerá aqui.
        </p>
      </div>
    );
  }

  const largura = 650;
  const altura = 180;
  const margemX = 25;
  const margemY = 20;

  const maiorValor = Math.max(...pontos.map((ponto) => ponto.valor), 1);
  const menorValor = Math.min(...pontos.map((ponto) => ponto.valor), 0);

  const variacao = maiorValor - menorValor || 1;

  const coordenadas = pontos.map((ponto, index) => {
    const x =
      pontos.length === 1
        ? largura / 2
        : margemX +
          (index * (largura - margemX * 2)) / (pontos.length - 1);

    const y =
      altura -
      margemY -
      ((ponto.valor - menorValor) / variacao) *
        (altura - margemY * 2);

    return { ...ponto, x, y };
  });

  const linha = coordenadas
    .map((ponto) => `${ponto.x},${ponto.y}`)
    .join(" ");

  const area = [
    `${coordenadas[0].x},${altura}`,
    ...coordenadas.map((ponto) => `${ponto.x},${ponto.y}`),
    `${coordenadas[coordenadas.length - 1].x},${altura}`,
  ].join(" ");

  const quantidadeRotulos = Math.min(
    pontos.length,
    periodo === "12m" ? 12 : 7
  );

  const intervaloRotulos = Math.max(
    1,
    Math.ceil(pontos.length / quantidadeRotulos)
  );

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-4 text-[10px] text-[#948977]">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#a88c56]" />
          Faturamento
        </span>
      </div>

      <div className="mt-4 overflow-hidden">
        <svg
          viewBox={`0 0 ${largura} ${altura + 5}`}
          className="h-[185px] w-full"
          role="img"
          aria-label="Gráfico de faturamento por data"
        >
          {[30, 65, 100, 135, 165].map((y) => (
            <line
              key={y}
              x1="15"
              y1={y}
              x2={largura - 15}
              y2={y}
              stroke="#eee5d6"
              strokeDasharray="3 5"
            />
          ))}

          <polygon points={area} fill="url(#goldFill)" />

          {coordenadas.length > 1 && (
            <polyline
              points={linha}
              fill="none"
              stroke="#a88c56"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {coordenadas.map((ponto, index) => (
            <circle
              key={`${ponto.data}-${index}`}
              cx={ponto.x}
              cy={ponto.y}
              r={index === coordenadas.length - 1 ? 4 : 2.5}
              fill="#fcfaf5"
              stroke="#a88c56"
              strokeWidth="2"
            >
              <title>
                {dataFormatada(ponto.data)}: {moeda(ponto.valor)}
              </title>
            </circle>
          ))}

          <defs>
            <linearGradient
              id="goldFill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#c9b17f"
                stopOpacity="0.28"
              />

              <stop
                offset="100%"
                stopColor="#c9b17f"
                stopOpacity="0.015"
              />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="mt-1 flex justify-between gap-2 text-[10px] text-[#a09787]">
        {pontos
          .filter(
            (_, index) =>
              index % intervaloRotulos === 0 ||
              index === pontos.length - 1
          )
          .map((ponto, index) => (
            <span key={`${ponto.data}-${index}`}>
              {dataCurta(ponto.data)}
            </span>
          ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const configuracao = obterStatus(status);

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${configuracao.cor}`}
    >
      {configuracao.label}
    </span>
  );
}

function LoadingDashboard() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-36 animate-pulse rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5]"
        />
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [periodo, setPeriodo] = useState("12m");
  const [dashboard, setDashboard] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregarDashboard = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const resposta = await apiFetch(
        `/admin/dashboard?periodo=${periodo}`
      );

      const dados = resposta?.dashboard ?? resposta;

      if (!dados || !dados.indicadores) {
        throw new Error(
          "A API retornou uma resposta diferente do esperado."
        );
      }

      setDashboard(dados);
    } catch (error) {
      setErro(
        error.message ||
          "Não foi possível carregar os dados do dashboard."
      );
    } finally {
      setCarregando(false);
    }
  }, [periodo]);

  useEffect(() => {
    carregarDashboard();
  }, [carregarDashboard]);

  const indicadores = dashboard?.indicadores ?? {};

  const stats = [
    {
      label: "Faturamento no período",
      value: moeda(indicadores.faturamento),
      note: "Vendas confirmadas no período",
      icon: CircleDollarSign,
    },
    {
      label: "Pedidos recebidos",
      value: numero(indicadores.totalPedidos),
      note: "Pedidos criados no período",
      icon: ShoppingCart,
    },
    {
      label: "Produtos ativos",
      value: numero(indicadores.produtosAtivos),
      note: "Produtos ativos atualmente",
      icon: Package,
    },
    {
      label: "Clientes cadastrados",
      value: numero(indicadores.clientes),
      note: "Clientes ativos atualmente",
      icon: UserRound,
    },
  ];

  const pedidosRecentes = dashboard?.pedidosRecentes ?? [];
  const pedidosPorStatus = dashboard?.pedidosPorStatus ?? [];
  const produtosMaisVendidos = dashboard?.produtosMaisVendidos ?? [];
  const vendas = dashboard?.vendas ?? [];

  const totalStatus = pedidosPorStatus.reduce(
    (total, item) => total + Number(item.quantidade || 0),
    0
  );

  const gradienteStatus = useMemo(() => {
    if (!pedidosPorStatus.length || totalStatus === 0) {
      return "#e8e1d5 0deg 360deg";
    }

    let anguloAtual = 0;

    const partes = pedidosPorStatus.map((item, index) => {
      const quantidade = Number(item.quantidade) || 0;
      const angulo = (quantidade / totalStatus) * 360;
      const inicio = anguloAtual;
      const fim = anguloAtual + angulo;

      anguloAtual = fim;

      return `${obterStatus(item.status).grafico} ${inicio}deg ${fim}deg`;
    });

    return partes.join(", ");
  }, [pedidosPorStatus, totalStatus]);

  const nomesPeriodos = {
    "7d": "últimos 7 dias",
    "30d": "últimos 30 dias",
    "12m": "últimos 12 meses",
  };

  function irParaNovoProduto() {
    window.location.href = "/admin/produtos";
  }

  function irParaPedidos() {
    window.location.href = "/admin/pedidos";
  }

  function irParaProdutos() {
    window.location.href = "/admin/produtos";
  }

  return (
    <div className="min-h-screen bg-[#f8f3e8] font-sans text-[#211c14]">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <main className="min-h-screen lg:pl-[258px]">
        <AdminHeader
          title="Visão geral"
          subtitle="Acompanhe o desempenho da sua loja."
          onMenuClick={() => setMobileOpen(true)}
        />

        <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10">
          <section className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#a88c56]">
                Seu negócio em um olhar
              </p>

              <h2 className="mt-2 font-serif text-[29px] tracking-[-0.035em] sm:text-[34px]">
                Bom dia, administrador
                <span className="text-[#b9975b]">.</span>
              </h2>

              <p className="mt-2 max-w-xl text-[12px] leading-6 text-[#8c8170]">
                Aqui está o resumo da sua loja. Pequenos detalhes,
                grandes momentos.
              </p>
            </div>

            <button
              onClick={irParaNovoProduto}
              className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#211c14] px-4 text-[11px] font-medium text-[#fcfaf5] shadow-sm transition hover:bg-[#3a3022] sm:self-auto"
            >
              <Plus size={15} />
              Novo produto
            </button>
          </section>

          {erro && (
            <div
              role="alert"
              className="mb-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <AlertCircle size={19} className="mt-0.5 shrink-0" />

                <div>
                  <p className="font-semibold">
                    Não foi possível carregar o dashboard.
                  </p>

                  <p className="mt-1 text-xs leading-5">
                    {erro}
                  </p>
                </div>
              </div>

              <button
                onClick={carregarDashboard}
                className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-red-200 px-3 py-2 text-xs font-medium transition hover:bg-red-100 sm:self-auto"
              >
                <RefreshCw size={14} />
                Tentar novamente
              </button>
            </div>
          )}

          {carregando && !dashboard ? (
            <LoadingDashboard />
          ) : (
            <>
              <section
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
                aria-label="Indicadores da loja"
              >
                {stats.map((item) => (
                  <StatCard key={item.label} item={item} />
                ))}
              </section>

              <section className="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-[1.55fr_1fr]">
                <article className="rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-[19px]">
                        Desempenho de vendas
                      </h3>

                      <p className="mt-1 text-[11px] text-[#978b78]">
                        Faturamento nos {nomesPeriodos[periodo]}
                      </p>
                    </div>

                    <select
                      value={periodo}
                      onChange={(event) =>
                        setPeriodo(event.target.value)
                      }
                      disabled={carregando}
                      className="rounded-lg border border-[#e9dcc4] bg-[#fcfaf5] px-3 py-2 text-[10px] text-[#6f6554] outline-none focus:border-[#b9975b] disabled:opacity-60"
                    >
                      {PERIODOS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-5 flex items-end gap-3">
                    <p className="font-serif text-[29px] tracking-[-0.04em]">
                      {moeda(indicadores.faturamento)}
                    </p>

                    {carregando && (
                      <RefreshCw
                        size={15}
                        className="mb-2 animate-spin text-[#a88c56]"
                      />
                    )}
                  </div>

                  <SalesChart vendas={vendas} periodo={periodo} />
                </article>

                <article className="rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] p-5 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-serif text-[19px]">
                        Resumo dos pedidos
                      </h3>

                      <p className="mt-1 text-[11px] text-[#978b78]">
                        Status dos pedidos no período
                      </p>
                    </div>

                    <button
                      onClick={irParaPedidos}
                      className="rounded-lg p-1.5 text-[#9a8d78] hover:bg-[#f3ede2]"
                      aria-label="Ver pedidos"
                    >
                      <MoreHorizontal size={19} />
                    </button>
                  </div>

                  <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-5">
                    <div
                      className="relative flex h-[132px] w-[132px] shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: `conic-gradient(${gradienteStatus})`,
                      }}
                    >
                      <div className="flex h-[91px] w-[91px] flex-col items-center justify-center rounded-full bg-[#fcfaf5]">
                        <span className="font-serif text-[26px]">
                          {numero(totalStatus)}
                        </span>

                        <span className="text-[9px] text-[#978b78]">
                          pedidos
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0 w-full flex-1 space-y-3">
                      {pedidosPorStatus.length === 0 ? (
                        <p className="text-xs leading-5 text-[#978b78]">
                          Nenhum pedido encontrado neste período.
                        </p>
                      ) : (
                        pedidosPorStatus.map((item) => {
                          const status = obterStatus(item.status);

                          const percentual =
                            totalStatus > 0
                              ? (Number(item.quantidade) / totalStatus) *
                                100
                              : 0;

                          return (
                            <div
                              key={item.status}
                              className="flex items-center justify-between gap-2 text-[11px]"
                            >
                              <span className="flex min-w-0 items-center gap-2 text-[#766c5b]">
                                <span
                                  className="h-2 w-2 shrink-0 rounded-full"
                                  style={{
                                    backgroundColor: status.grafico,
                                  }}
                                />

                                <span className="truncate">
                                  {status.label}
                                </span>
                              </span>

                              <span className="shrink-0 font-semibold">
                                {percentual.toLocaleString("pt-BR", {
                                  maximumFractionDigits: 1,
                                })}
                                %
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl bg-[#f6f0e5] px-4 py-3">
                    <p className="text-[10px] leading-5 text-[#827763]">
                      Os dados representam os pedidos criados nos{" "}
                      <strong className="font-semibold text-[#514632]">
                        {nomesPeriodos[periodo]}
                      </strong>
                      .
                    </p>
                  </div>
                </article>
              </section>

              <section className="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-[1.55fr_1fr]">
                <article className="min-w-0 rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-[19px]">
                        Pedidos recentes
                      </h3>

                      <p className="mt-1 text-[11px] text-[#978b78]">
                        Últimas compras nos {nomesPeriodos[periodo]}
                      </p>
                    </div>

                    <button
                      onClick={irParaPedidos}
                      className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-[#8d7547] hover:text-[#5d4927]"
                    >
                      Ver todos
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[620px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-[#eee5d6] text-[9px] uppercase tracking-[0.12em] text-[#a09787]">
                          <th className="pb-3 pr-4 font-medium">
                            Pedido
                          </th>

                          <th className="pb-3 pr-4 font-medium">
                            Cliente
                          </th>

                          <th className="pb-3 pr-4 font-medium">
                            Data
                          </th>

                          <th className="pb-3 pr-4 font-medium">
                            Valor
                          </th>

                          <th className="pb-3 font-medium">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {pedidosRecentes.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="py-10 text-center text-xs text-[#978b78]"
                            >
                              Nenhum pedido encontrado neste período.
                            </td>
                          </tr>
                        ) : (
                          pedidosRecentes.map((pedido) => (
                            <tr
                              key={pedido.id}
                              className="border-b border-[#f0e9dd] last:border-0"
                            >
                              <td className="whitespace-nowrap py-4 pr-4 text-[11px] font-semibold text-[#514632]">
                                #{pedido.id.slice(-8).toUpperCase()}
                              </td>

                              <td className="whitespace-nowrap py-4 pr-4">
                                <span className="flex items-center gap-2.5">
                                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eee5d6] font-serif text-[10px] text-[#806b43]">
                                    {obterIniciais(
                                      pedido.usuario?.nome ||
                                        pedido.destinatario
                                    )}
                                  </span>

                                  <span className="text-[11px] text-[#615848]">
                                    {pedido.usuario?.nome ||
                                      pedido.destinatario ||
                                      "Cliente"}
                                  </span>
                                </span>
                              </td>

                              <td className="whitespace-nowrap py-4 pr-4 text-[10px] text-[#978b78]">
                                {dataFormatada(pedido.criadoEm)}
                              </td>

                              <td className="whitespace-nowrap py-4 pr-4 text-[11px] font-medium">
                                {moeda(pedido.valorTotal)}
                              </td>

                              <td className="py-4">
                                <StatusBadge status={pedido.status} />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-[19px]">
                        Mais vendidos
                      </h3>

                      <p className="mt-1 text-[11px] text-[#978b78]">
                        Produtos com mais unidades vendidas
                      </p>
                    </div>

                    <button
                      onClick={irParaProdutos}
                      className="rounded-lg p-1.5 text-[#9a8d78] hover:bg-[#f3ede2]"
                      aria-label="Ver catálogo"
                    >
                      <Package size={18} />
                    </button>
                  </div>

                  <div className="mt-4 divide-y divide-[#f0e9dd]">
                    {produtosMaisVendidos.length === 0 ? (
                      <div className="py-10 text-center">
                        <Package
                          size={28}
                          className="mx-auto text-[#c9b17f]"
                        />

                        <p className="mt-3 text-xs text-[#978b78]">
                          Nenhum produto vendido no período.
                        </p>
                      </div>
                    ) : (
                      produtosMaisVendidos.map((produto, index) => (
                        <div
                          key={produto.produtoId}
                          className="flex items-center gap-3 py-4 first:pt-2 last:pb-1"
                        >
                          <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-xl bg-[#e9ddc9] font-serif text-[13px] text-[#8b754d]">
                            {obterIniciais(produto.nome)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12px] font-medium text-[#514632]">
                              {produto.nome}
                            </p>

                            <p className="mt-1 text-[10px] text-[#a09787]">
                              {numero(produto.quantidadeVendida)}{" "}
                              {Number(produto.quantidadeVendida) === 1
                                ? "unidade vendida"
                                : "unidades vendidas"}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="whitespace-nowrap text-[11px] font-semibold">
                              {moeda(produto.faturamento)}
                            </p>

                            <p className="mt-1 text-[9px] text-[#a09787]">
                              #{index + 1} em vendas
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={irParaProdutos}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#e9dcc4] py-3 text-[10px] font-medium text-[#75613b] transition hover:bg-[#f6f0e5]"
                  >
                    Ver catálogo completo
                    <ArrowRight size={13} />
                  </button>
                </article>
              </section>
            </>
          )}

          <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-[#e9dcc4] py-5 text-[10px] text-[#a09787] sm:flex-row sm:items-center">
            <span>© 2026 AURELIA. Todos os direitos reservados.</span>

            <span>Feito com cuidado, em cada detalhe.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}