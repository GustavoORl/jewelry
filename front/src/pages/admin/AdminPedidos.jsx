import { useMemo, useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import Sidebar from "../../components/admin/Sidebar.jsx";
import AdminHeader from "../../components/admin/AdminHeader.jsx";

const pedidosIniciais = [
  {
    id: "AUR-1048",
    cliente: "Mariana Oliveira",
    email: "mariana.oliveira@email.com",
    data: "16/10/2026",
    horario: "14:32",
    itens: 2,
    total: 489.9,
    pagamento: "Cartão de crédito",
    status: "Pendente",
    endereco: "Rua das Flores, 120 — Centro, Caraguatatuba/SP",
    produtos: [
      { nome: "Colar Dourado Aurora", quantidade: 1, preco: 289.9 },
      { nome: "Brinco Pérola Clássica", quantidade: 1, preco: 200 },
    ],
  },
  {
    id: "AUR-1047",
    cliente: "Beatriz Santos",
    email: "beatriz.santos@email.com",
    data: "16/10/2026",
    horario: "13:08",
    itens: 1,
    total: 219.9,
    pagamento: "Pix",
    status: "Pago",
    endereco: "Av. Anchieta, 450 — Indaiá, Caraguatatuba/SP",
    produtos: [
      { nome: "Pulseira Elo Delicado", quantidade: 1, preco: 219.9 },
    ],
  },
  {
    id: "AUR-1046",
    cliente: "Camila Ferreira",
    email: "camila.ferreira@email.com",
    data: "15/10/2026",
    horario: "18:45",
    itens: 3,
    total: 679.7,
    pagamento: "Cartão de crédito",
    status: "Em preparação",
    endereco: "Rua do Comércio, 88 — Sumaré, Caraguatatuba/SP",
    produtos: [
      { nome: "Anel Solitário Dourado", quantidade: 1, preco: 349.9 },
      { nome: "Brinco Argola Mini", quantidade: 2, preco: 164.9 },
    ],
  },
  {
    id: "AUR-1045",
    cliente: "Isabela Costa",
    email: "isabela.costa@email.com",
    data: "15/10/2026",
    horario: "16:12",
    itens: 1,
    total: 159.9,
    pagamento: "Pix",
    status: "Enviado",
    endereco: "Rua Sete, 32 — Martim de Sá, Caraguatatuba/SP",
    produtos: [
      { nome: "Brinco Pérola Clássica", quantidade: 1, preco: 159.9 },
    ],
  },
  {
    id: "AUR-1044",
    cliente: "Laura Martins",
    email: "laura.martins@email.com",
    data: "14/10/2026",
    horario: "10:26",
    itens: 2,
    total: 399.8,
    pagamento: "Pix",
    status: "Entregue",
    endereco: "Rua das Palmeiras, 51 — Massaguaçu, Caraguatatuba/SP",
    produtos: [
      { nome: "Colar Dourado Aurora", quantidade: 1, preco: 289.9 },
      { nome: "Anel Solitário Dourado", quantidade: 1, preco: 109.9 },
    ],
  },
  {
    id: "AUR-1043",
    cliente: "Ana Clara Ribeiro",
    email: "ana.ribeiro@email.com",
    data: "13/10/2026",
    horario: "09:14",
    itens: 1,
    total: 89.9,
    pagamento: "Cartão de crédito",
    status: "Cancelado",
    endereco: "Av. Brasil, 740 — Centro, São Sebastião/SP",
    produtos: [
      { nome: "Brinco Argola Mini", quantidade: 1, preco: 89.9 },
    ],
  },
];

const statusConfig = {
  Pendente: {
    className: "bg-[#f7efdc] text-[#8b6c2f]",
    icon: Clock3,
  },
  Pago: {
    className: "bg-[#e9f2e7] text-[#54764c]",
    icon: CheckCircle2,
  },
  "Em preparação": {
    className: "bg-[#f2e9dc] text-[#987344]",
    icon: Package,
  },
  Enviado: {
    className: "bg-[#e7eef5] text-[#4f6e8b]",
    icon: Truck,
  },
  Entregue: {
    className: "bg-[#e5f0e8] text-[#47775a]",
    icon: CheckCircle2,
  },
  Cancelado: {
    className: "bg-[#f7e8e4] text-[#a25549]",
    icon: XCircle,
  },
};

const filtros = [
  "Todos",
  "Pendente",
  "Pago",
  "Em preparação",
  "Enviado",
  "Entregue",
  "Cancelado",
];

const moeda = (valor) =>
  valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

function StatusBadge({ status }) {
  const config = statusConfig[status] ?? statusConfig.Pendente;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${config.className}`}
    >
      <Icon size={12} />
      {status}
    </span>
  );
}

export default function AdminPedidos() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pedidos, setPedidos] = useState(pedidosIniciais);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [filtroAberto, setFiltroAberto] = useState(false);

  const pedidosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return pedidos.filter((pedido) => {
      const correspondeBusca =
        !termo ||
        pedido.id.toLocaleLowerCase("pt-BR").includes(termo) ||
        pedido.cliente.toLocaleLowerCase("pt-BR").includes(termo) ||
        pedido.email.toLocaleLowerCase("pt-BR").includes(termo);

      const correspondeStatus =
        filtroStatus === "Todos" || pedido.status === filtroStatus;

      return correspondeBusca && correspondeStatus;
    });
  }, [pedidos, busca, filtroStatus]);

  const atualizarStatus = (id, novoStatus) => {
    setPedidos((atuais) =>
      atuais.map((pedido) =>
        pedido.id === id ? { ...pedido, status: novoStatus } : pedido
      )
    );

    setPedidoSelecionado((atual) =>
      atual?.id === id ? { ...atual, status: novoStatus } : atual
    );
  };

  const contagem = (status) =>
    pedidos.filter((pedido) => status === "Todos" || pedido.status === status)
      .length;

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
          {/* Intro */}
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

            <div className="flex items-center gap-2 self-start rounded-xl border border-[#e9dcc4] bg-[#fcfaf5] px-3.5 py-2.5 text-xs text-[#756b5a] sm:self-auto">
              <CalendarDays size={15} className="text-[#968052]" />
              <span>Visão de todos os pedidos</span>
            </div>
          </section>

          {/* Summary cards */}
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <SummaryCard
              label="Total de pedidos"
              value={pedidos.length}
              helper="No período demonstrativo"
              icon={Package}
            />
            <SummaryCard
              label="Aguardando"
              value={contagem("Pendente")}
              helper="Precisam de atenção"
              icon={Clock3}
            />
            <SummaryCard
              label="Em preparação"
              value={contagem("Em preparação")}
              helper="Pedidos em separação"
              icon={Package}
            />
            <SummaryCard
              label="Enviados"
              value={contagem("Enviado")}
              helper="A caminho dos clientes"
              icon={Truck}
            />
          </section>

          {/* Orders table */}
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
                      {filtro}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick filters */}
            <div className="flex gap-2 overflow-x-auto border-b border-[#eee5d5] px-4 py-3 sm:px-5">
              {["Todos", "Pendente", "Em preparação", "Enviado", "Entregue"].map(
                (filtro) => (
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
                    {filtro}
                    <span className="ml-2 text-[10px] opacity-70">
                      {contagem(filtro)}
                    </span>
                  </button>
                )
              )}
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
                  {pedidosFiltrados.map((pedido) => (
                    <tr
                      key={pedido.id}
                      className="transition hover:bg-[#faf6ee]"
                    >
                      <td className="px-5 py-4">
                        <p className="text-xs font-semibold text-[#393024]">
                          {pedido.id}
                        </p>
                        <p className="mt-1 text-[10px] text-[#a09582]">
                          {pedido.horario}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs font-medium text-[#393024]">
                          {pedido.cliente}
                        </p>
                        <p className="mt-1 text-[10px] text-[#a09582]">
                          {pedido.email}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-xs text-[#756b5a]">
                        {pedido.data}
                      </td>

                      <td className="px-5 py-4 text-xs text-[#756b5a]">
                        {pedido.itens} {pedido.itens === 1 ? "item" : "itens"}
                      </td>

                      <td className="px-5 py-4 text-xs font-semibold text-[#393024]">
                        {moeda(pedido.total)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={pedido.status} />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setPedidoSelecionado(pedido)}
                          aria-label={`Ver detalhes do pedido ${pedido.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#e9dcc4] px-3 py-2 text-[11px] text-[#75613b] transition hover:border-[#b9975b] hover:bg-[#f7f1e6]"
                        >
                          <Eye size={14} />
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}

                  {pedidosFiltrados.length === 0 && (
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
                            setFiltroStatus("Todos");
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

            <div className="flex items-center justify-between border-t border-[#eee5d5] px-4 py-4 sm:px-5">
              <p className="text-[11px] text-[#968b78]">
                Exibindo {pedidosFiltrados.length} de {pedidos.length} pedidos
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled
                  aria-label="Página anterior"
                  className="rounded-lg border border-[#e9dcc4] p-2 text-[#b9ad98] disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  aria-current="page"
                  className="rounded-lg bg-[#211c14] px-3 py-1.5 text-[11px] text-[#fcfaf5]"
                >
                  1
                </button>
                <button
                  type="button"
                  disabled
                  aria-label="Próxima página"
                  className="rounded-lg border border-[#e9dcc4] p-2 text-[#b9ad98] disabled:cursor-not-allowed"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </section>

          <p className="text-center text-[10px] text-[#a09582]">
            Dados demonstrativos • A integração com a API será feita na próxima etapa.
          </p>
        </div>
      </main>

      {/* Order details modal */}
      {pedidoSelecionado && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#211c14]/40 p-3 backdrop-blur-[2px] sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
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
                  {pedidoSelecionado.id}
                </h2>
                <p className="mt-1 text-xs text-[#968b78]">
                  Criado em {pedidoSelecionado.data}, às {pedidoSelecionado.horario}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPedidoSelecionado(null)}
                aria-label="Fechar detalhes"
                className="rounded-lg p-2 text-[#756b5a] transition hover:bg-[#f2ecdf]"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <StatusBadge status={pedidoSelecionado.status} />
                <p className="text-lg font-semibold text-[#211c14]">
                  {moeda(pedidoSelecionado.total)}
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#a09582]">
                    Dados do cliente
                  </h3>
                  <p className="mt-2 text-sm font-medium text-[#393024]">
                    {pedidoSelecionado.cliente}
                  </p>
                  <p className="mt-1 break-all text-xs text-[#817664]">
                    {pedidoSelecionado.email}
                  </p>
                </div>

                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#a09582]">
                    Pagamento
                  </h3>
                  <p className="mt-2 text-sm text-[#393024]">
                    {pedidoSelecionado.pagamento}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#a09582]">
                  Endereço de entrega
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#756b5a]">
                  {pedidoSelecionado.endereco}
                </p>
              </div>

              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#a09582]">
                  Itens do pedido
                </h3>

                <div className="mt-3 divide-y divide-[#eee5d5] rounded-xl border border-[#e9dcc4] px-4">
                  {pedidoSelecionado.produtos.map((produto, index) => (
                    <div
                      key={`${produto.nome}-${index}`}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <p className="text-xs font-medium text-[#393024]">
                          {produto.nome}
                        </p>
                        <p className="mt-1 text-[10px] text-[#968b78]">
                          Quantidade: {produto.quantidade}
                        </p>
                      </div>
                      <p className="whitespace-nowrap text-xs text-[#393024]">
                        {moeda(produto.preco * produto.quantidade)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

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
                  onChange={(event) =>
                    atualizarStatus(pedidoSelecionado.id, event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[#e9dcc4] bg-white px-3 py-3 text-sm text-[#393024] outline-none transition focus:border-[#b9975b]"
                >
                  {filtros.slice(1).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-[10px] leading-5 text-[#a09582]">
                  Esta alteração é apenas demonstrativa e será perdida ao atualizar
                  a página. A persistência será implementada na integração com a API.
                </p>
              </div>

              <div className="flex justify-end border-t border-[#eee5d5] pt-4">
                <button
                  type="button"
                  onClick={() => setPedidoSelecionado(null)}
                  className="rounded-xl bg-[#211c14] px-5 py-2.5 text-xs font-medium text-[#fcfaf5] transition hover:bg-[#403629]"
                >
                  Concluir
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
