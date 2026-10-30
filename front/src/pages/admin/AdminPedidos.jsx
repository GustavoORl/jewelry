import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Eye,
  X,
  Package,
  Clock3,
  CheckCircle2,
  Truck,
  XCircle,
  CalendarDays,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
  MapPin,
} from "lucide-react";

import Sidebar from "../../components/admin/Sidebar.jsx";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import { apiFetch } from "../../services/api.js";

const statusConfig = {
  PENDENTE: {
    label: "Pendente",
    className: "bg-[#f7efdc] text-[#8b6c2f]",
    icon: Clock3,
  },
  PAGO: {
    label: "Pago",
    className: "bg-[#e9f2e7] text-[#54764c]",
    icon: CheckCircle2,
  },
  EM_PREPARACAO: {
    label: "Em preparação",
    className: "bg-[#f2e9dc] text-[#987344]",
    icon: Package,
  },
  ENVIADO: {
    label: "Enviado",
    className: "bg-[#e7eef5] text-[#4f6e8b]",
    icon: Truck,
  },
  ENTREGUE: {
    label: "Entregue",
    className: "bg-[#e5f0e8] text-[#47775a]",
    icon: CheckCircle2,
  },
  CANCELADO: {
    label: "Cancelado",
    className: "bg-[#f7e8e4] text-[#a25549]",
    icon: XCircle,
  },
};

const filtros = [
  "TODOS",
  "PENDENTE",
  "PAGO",
  "EM_PREPARACAO",
  "ENVIADO",
  "ENTREGUE",
  "CANCELADO",
];

const moeda = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

function formatarData(data) {
  if (!data) return "—";

  return new Date(data).toLocaleDateString("pt-BR");
}

function formatarHorario(data) {
  if (!data) return "—";

  return new Date(data).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }) {
  const config = statusConfig[status] ?? statusConfig.PENDENTE;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${config.className}`}
    >
      <Icon size={12} />
      {config.label}
    </span>
  );
}

export default function AdminPedidos() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);

  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [erro, setErro] = useState("");
  const [erroAtualizacao, setErroAtualizacao] = useState("");
  const [sucesso, setSucesso] = useState("");

  const carregarPedidos = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await apiFetch("/admin/pedidos");

      setPedidos(resposta.pedidos ?? []);
    } catch (error) {
      setErro(error.message || "Não foi possível carregar os pedidos.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarPedidos();
  }, [carregarPedidos]);

  const pedidosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return pedidos.filter((pedido) => {
      const nome = pedido.usuario?.nome ?? "";
      const email = pedido.usuario?.email ?? "";

      const correspondeBusca =
        !termo ||
        pedido.id.toLocaleLowerCase("pt-BR").includes(termo) ||
        nome.toLocaleLowerCase("pt-BR").includes(termo) ||
        email.toLocaleLowerCase("pt-BR").includes(termo);

      const correspondeStatus =
        filtroStatus === "TODOS" || pedido.status === filtroStatus;

      return correspondeBusca && correspondeStatus;
    });
  }, [pedidos, busca, filtroStatus]);

  const contagem = (status) =>
    pedidos.filter(
      (pedido) => status === "TODOS" || pedido.status === status
    ).length;

  async function atualizarStatus(pedidoId, novoStatus) {
    try {
      setAtualizando(true);
      setErroAtualizacao("");
      setSucesso("");

      await apiFetch(`/admin/pedidos/${pedidoId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: novoStatus }),
      });

      setPedidos((atuais) =>
        atuais.map((pedido) =>
          pedido.id === pedidoId
            ? { ...pedido, status: novoStatus }
            : pedido
        )
      );

      setPedidoSelecionado((atual) =>
        atual?.id === pedidoId
          ? { ...atual, status: novoStatus }
          : atual
      );

      setSucesso("Status do pedido atualizado com sucesso.");
    } catch (error) {
      setErroAtualizacao(
        error.message || "Não foi possível atualizar o pedido."
      );
    } finally {
      setAtualizando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f3e8] text-[#211c14]">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <main className="min-w-0 lg:ml-[258px]">
        <AdminHeader
          title="Pedidos"
          subtitle="Acompanhe e gerencie os pedidos da AURELIA."
          onMenuClick={() => setMobileOpen(true)}
        />

        <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
          {/* Introdução */}
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#968052]">
                Operação da loja
              </p>

              <h2 className="mt-2 font-serif text-2xl text-[#211c14] sm:text-3xl">
                Gestão de pedidos
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#817664]">
                Consulte compras, acompanhe pagamentos e atualize o andamento
                de cada pedido.
              </p>
            </div>

            <button
              type="button"
              onClick={carregarPedidos}
              disabled={carregando}
              className="inline-flex items-center gap-2 self-start rounded-xl border border-[#e9dcc4] bg-[#fcfaf5] px-3.5 py-2.5 text-xs text-[#756b5a] transition hover:bg-[#f1e8d8] disabled:opacity-50 sm:self-auto"
            >
              <RefreshCw
                size={14}
                className={carregando ? "animate-spin" : ""}
              />
              Atualizar pedidos
            </button>
          </section>

          {/* Indicadores */}
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <SummaryCard
              label="Total de pedidos"
              value={pedidos.length}
              helper="Pedidos registrados"
              icon={Package}
            />

            <SummaryCard
              label="Aguardando"
              value={contagem("PENDENTE")}
              helper="Aguardando pagamento"
              icon={Clock3}
            />

            <SummaryCard
              label="Em preparação"
              value={contagem("EM_PREPARACAO")}
              helper="Pedidos em separação"
              icon={Package}
            />

            <SummaryCard
              label="Enviados"
              value={contagem("ENVIADO")}
              helper="A caminho dos clientes"
              icon={Truck}
            />
          </section>

          {/* Mensagens */}
          {erro && (
            <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-red-700">
                <AlertCircle size={18} />
                {erro}
              </div>

              <button
                type="button"
                onClick={carregarPedidos}
                className="text-xs font-semibold text-red-700 underline"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {sucesso && (
            <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              <span>{sucesso}</span>
              <button
                type="button"
                onClick={() => setSucesso("")}
                aria-label="Fechar mensagem"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Tabela */}
          <section className="overflow-hidden rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] shadow-[0_4px_20px_rgba(33,28,20,0.025)]">
            <div className="flex flex-col gap-4 border-b border-[#eee5d5] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="font-serif text-lg text-[#292319]">
                  Todos os pedidos
                </h3>

                <p className="mt-1 text-xs text-[#968b78]">
                  {pedidosFiltrados.length} resultado(s) encontrado(s)
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex min-w-0 items-center gap-2 rounded-xl border border-[#e9dcc4] bg-white/70 px-3 py-2.5 sm:w-64">
                  <Search size={16} className="shrink-0 text-[#968052]" />

                  <input
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    placeholder="Buscar pedido ou cliente..."
                    aria-label="Buscar pedido ou cliente"
                    className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[#a59a87]"
                  />

                  {busca && (
                    <button
                      type="button"
                      onClick={() => setBusca("")}
                      aria-label="Limpar busca"
                      className="text-[#968b78] hover:text-[#211c14]"
                    >
                      <X size={14} />
                    </button>
                  )}
                </label>

                <button
                  type="button"
                  onClick={() => setFiltroAberto((aberto) => !aberto)}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs transition ${
                    filtroAberto
                      ? "border-[#b9975b] bg-[#f7f1e6] text-[#75613b]"
                      : "border-[#e9dcc4] text-[#6e6659] hover:bg-[#f7f1e6]"
                  }`}
                >
                  <SlidersHorizontal size={15} />
                  Filtrar status
                </button>
              </div>

              {filtroAberto && (
                <div className="flex flex-wrap gap-2 lg:ml-auto">
                  {filtros.map((filtro) => (
                    <button
                      key={filtro}
                      type="button"
                      onClick={() => setFiltroStatus(filtro)}
                      className={`rounded-full border px-3 py-1.5 text-[11px] transition ${
                        filtroStatus === filtro
                          ? "border-[#211c14] bg-[#211c14] text-[#fcfaf5]"
                          : "border-[#e9dcc4] text-[#756b5a] hover:bg-[#f7f1e6]"
                      }`}
                    >
                      {filtro === "TODOS"
                        ? "Todos"
                        : statusConfig[filtro].label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filtros rápidos */}
            <div className="flex gap-2 overflow-x-auto border-b border-[#eee5d5] px-4 py-3 sm:px-5">
              {[
                "TODOS",
                "PENDENTE",
                "EM_PREPARACAO",
                "ENVIADO",
                "ENTREGUE",
              ].map((filtro) => (
                <button
                  key={filtro}
                  type="button"
                  onClick={() => setFiltroStatus(filtro)}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-[11px] transition ${
                    filtroStatus === filtro
                      ? "bg-[#eee5d5] font-semibold text-[#5e4c2d]"
                      : "text-[#8c816f] hover:bg-[#f7f1e6] hover:text-[#211c14]"
                  }`}
                >
                  {filtro === "TODOS"
                    ? "Todos"
                    : statusConfig[filtro].label}

                  <span className="ml-2 text-[10px] opacity-70">
                    {contagem(filtro)}
                  </span>
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#f8f3e8]/70 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a09582]">
                    <th className="px-5 py-4">Pedido</th>
                    <th className="px-5 py-4">Cliente</th>
                    <th className="px-5 py-4">Data</th>
                    <th className="px-5 py-4">Itens</th>
                    <th className="px-5 py-4">Total</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Ação</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f0e8da]">
                  {carregando ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <LoaderCircle
                          size={28}
                          className="mx-auto animate-spin text-[#968052]"
                        />
                        <p className="mt-3 text-xs text-[#968b78]">
                          Carregando pedidos...
                        </p>
                      </td>
                    </tr>
                  ) : pedidosFiltrados.map((pedido) => {
                    const quantidadeItens = pedido.itens.reduce(
                      (total, item) => total + item.quantidade,
                      0
                    );

                    return (
                      <tr
                        key={pedido.id}
                        className="transition hover:bg-[#faf6ee]"
                      >
                        <td className="px-5 py-4">
                          <p className="text-xs font-semibold text-[#393024]">
                            #{pedido.id.slice(0, 8)}
                          </p>
                          <p className="mt-1 text-[10px] text-[#a09582]">
                            {formatarHorario(pedido.criadoEm)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-xs font-medium text-[#393024]">
                            {pedido.usuario?.nome ?? "Cliente não identificado"}
                          </p>
                          <p className="mt-1 text-[10px] text-[#a09582]">
                            {pedido.usuario?.email ?? "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-xs text-[#756b5a]">
                          {formatarData(pedido.criadoEm)}
                        </td>

                        <td className="px-5 py-4 text-xs text-[#756b5a]">
                          {quantidadeItens}{" "}
                          {quantidadeItens === 1 ? "item" : "itens"}
                        </td>

                        <td className="px-5 py-4 text-xs font-semibold text-[#393024]">
                          {moeda(pedido.valorTotal)}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={pedido.status} />
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setErroAtualizacao("");
                              setPedidoSelecionado(pedido);
                            }}
                            aria-label="Ver detalhes do pedido"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#e9dcc4] px-3 py-2 text-[11px] text-[#75613b] transition hover:border-[#b9975b] hover:bg-[#f7f1e6]"
                          >
                            <Eye size={14} />
                            Detalhes
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {!carregando && pedidosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-14 text-center">
                        <Package
                          size={28}
                          className="mx-auto text-[#c2b49b]"
                        />

                        <p className="mt-3 text-sm font-medium text-[#756b5a]">
                          Nenhum pedido encontrado
                        </p>

                        <p className="mt-1 text-xs text-[#a09582]">
                          Tente alterar a busca ou o filtro selecionado.
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            setBusca("");
                            setFiltroStatus("TODOS");
                          }}
                          className="mt-3 text-xs font-medium text-[#8b754d] underline underline-offset-4"
                        >
                          Limpar filtros
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-[#eee5d5] px-4 py-4 sm:px-5">
              <p className="text-[11px] text-[#968b78]">
                Exibindo {pedidosFiltrados.length} de {pedidos.length} pedidos
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Modal de detalhes */}
      {pedidoSelecionado && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#211c14]/40 p-3 backdrop-blur-[2px] sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !atualizando) {
              setPedidoSelecionado(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="pedido-modal-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-[#eee5d5] p-5 sm:p-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#968052]">
                  Detalhes do pedido
                </p>

                <h2
                  id="pedido-modal-title"
                  className="mt-2 font-serif text-2xl text-[#211c14]"
                >
                  #{pedidoSelecionado.id.slice(0, 8)}
                </h2>

                <p className="mt-1 text-xs text-[#968b78]">
                  Criado em {formatarData(pedidoSelecionado.criadoEm)}, às{" "}
                  {formatarHorario(pedidoSelecionado.criadoEm)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPedidoSelecionado(null)}
                disabled={atualizando}
                aria-label="Fechar detalhes"
                className="rounded-lg p-2 text-[#756b5a] transition hover:bg-[#f2ecdf] disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <StatusBadge status={pedidoSelecionado.status} />

                <p className="text-lg font-semibold text-[#211c14]">
                  {moeda(pedidoSelecionado.valorTotal)}
                </p>
              </div>

              {/* Cliente */}
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#a09582]">
                  Dados do cliente
                </h3>

                <p className="mt-2 text-sm font-medium text-[#393024]">
                  {pedidoSelecionado.usuario?.nome ?? "Não informado"}
                </p>

                <p className="mt-1 break-all text-xs text-[#817664]">
                  {pedidoSelecionado.usuario?.email ?? "Não informado"}
                </p>
              </div>

              {/* Endereço */}
              <div>
                <h3 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#a09582]">
                  <MapPin size={14} />
                  Endereço de entrega
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#756b5a]">
                  {pedidoSelecionado.destinatario}
                  <br />
                  {pedidoSelecionado.ruaEntrega},{" "}
                  {pedidoSelecionado.numeroEntrega}
                  {pedidoSelecionado.complementoEntrega
                    ? ` - ${pedidoSelecionado.complementoEntrega}`
                    : ""}
                  <br />
                  {pedidoSelecionado.bairroEntrega}
                  <br />
                  {pedidoSelecionado.cidadeEntrega} -{" "}
                  {pedidoSelecionado.estadoEntrega}
                  <br />
                  CEP: {pedidoSelecionado.cepEntrega}
                </p>
              </div>

              {/* Produtos */}
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#a09582]">
                  Itens do pedido
                </h3>

                <div className="mt-3 divide-y divide-[#eee5d5] rounded-xl border border-[#e9dcc4] px-4">
                  {pedidoSelecionado.itens.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <p className="text-xs font-medium text-[#393024]">
                          {item.nomeProduto}
                        </p>

                        <p className="mt-1 text-[10px] text-[#968b78]">
                          Quantidade: {item.quantidade}
                        </p>

                        <p className="mt-1 text-[10px] text-[#968b78]">
                          Unitário: {moeda(item.precoUnitario)}
                        </p>
                      </div>

                      <p className="whitespace-nowrap text-xs font-medium text-[#393024]">
                        {moeda(
                          Number(item.precoUnitario) * item.quantidade
                        )}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex justify-between rounded-xl bg-[#f1e8d8] p-4">
                  <span className="text-xs font-medium text-[#756b5a]">
                    Total do pedido
                  </span>

                  <span className="text-sm font-semibold text-[#211c14]">
                    {moeda(pedidoSelecionado.valorTotal)}
                  </span>
                </div>
              </div>

              {/* Atualização de status */}
              <div>
                <label
                  htmlFor="status-pedido"
                  className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#a09582]"
                >
                  Atualizar status
                </label>

                <select
                  id="status-pedido"
                  value={pedidoSelecionado.status}
                  disabled={atualizando}
                  onChange={(event) =>
                    atualizarStatus(pedidoSelecionado.id, event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[#e9dcc4] bg-white px-3 py-3 text-sm text-[#393024] outline-none transition focus:border-[#b9975b] disabled:opacity-50"
                >
                  {filtros.slice(1).map((status) => (
                    <option key={status} value={status}>
                      {statusConfig[status].label}
                    </option>
                  ))}
                </select>

                {atualizando && (
                  <p className="mt-2 flex items-center gap-2 text-xs text-[#968052]">
                    <LoaderCircle size={14} className="animate-spin" />
                    Atualizando pedido...
                  </p>
                )}

                {erroAtualizacao && (
                  <p className="mt-2 text-xs text-red-600">
                    {erroAtualizacao}
                  </p>
                )}

                <p className="mt-2 text-[10px] leading-5 text-[#a09582]">
                  A alteração será salva no banco de dados.
                </p>
              </div>

              <div className="flex justify-end border-t border-[#eee5d5] pt-4">
                <button
                  type="button"
                  disabled={atualizando}
                  onClick={() => setPedidoSelecionado(null)}
                  className="rounded-xl bg-[#211c14] px-5 py-2.5 text-xs font-medium text-[#fcfaf5] transition hover:bg-[#403629] disabled:opacity-50"
                >
                  Fechar detalhes
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, helper, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] text-[#817664] sm:text-xs">{label}</p>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f1e8d8] text-[#8b754d]">
          <Icon size={16} strokeWidth={1.7} />
        </div>
      </div>

      <p className="mt-3 font-serif text-2xl text-[#211c14] sm:text-3xl">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-[#a09582]">{helper}</p>
    </div>
  );
}
