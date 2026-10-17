import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Users,
  UserRound,
  ShoppingBag,
  CircleDollarSign,
  Eye,
  X,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
} from "lucide-react";
import Sidebar from "../../components/admin/Sidebar.jsx";
import AdminHeader from "../../components/admin/AdminHeader.jsx";

const clientesIniciais = [
  {
    id: "CLI-001",
    nome: "Mariana Oliveira",
    email: "mariana.oliveira@email.com",
    telefone: "(12) 99123-4567",
    cadastro: "16/10/2026",
    pedidos: 8,
    totalGasto: 1849.4,
    status: "Ativo",
    endereco: "Centro, Caraguatatuba/SP",
    ultimoPedido: "AUR-1048",
  },
  {
    id: "CLI-002",
    nome: "Beatriz Santos",
    email: "beatriz.santos@email.com",
    telefone: "(12) 99234-5678",
    cadastro: "14/10/2026",
    pedidos: 5,
    totalGasto: 1260.0,
    status: "Ativo",
    endereco: "Indaiá, Caraguatatuba/SP",
    ultimoPedido: "AUR-1047",
  },
  {
    id: "CLI-003",
    nome: "Camila Ferreira",
    email: "camila.ferreira@email.com",
    telefone: "(12) 99345-6789",
    cadastro: "12/10/2026",
    pedidos: 3,
    totalGasto: 879.7,
    status: "Ativo",
    endereco: "Sumaré, Caraguatatuba/SP",
    ultimoPedido: "AUR-1046",
  },
  {
    id: "CLI-004",
    nome: "Isabela Costa",
    email: "isabela.costa@email.com",
    telefone: "(12) 99456-7890",
    cadastro: "08/10/2026",
    pedidos: 2,
    totalGasto: 319.8,
    status: "Inativo",
    endereco: "Martim de Sá, Caraguatatuba/SP",
    ultimoPedido: "AUR-1045",
  },
  {
    id: "CLI-005",
    nome: "Laura Martins",
    email: "laura.martins@email.com",
    telefone: "(12) 99567-8901",
    cadastro: "03/10/2026",
    pedidos: 6,
    totalGasto: 2109.2,
    status: "Ativo",
    endereco: "Massaguaçu, Caraguatatuba/SP",
    ultimoPedido: "AUR-1044",
  },
  {
    id: "CLI-006",
    nome: "Ana Clara Ribeiro",
    email: "ana.ribeiro@email.com",
    telefone: "Não informado",
    cadastro: "28/09/2026",
    pedidos: 1,
    totalGasto: 89.9,
    status: "Inativo",
    endereco: "Centro, São Sebastião/SP",
    ultimoPedido: "AUR-1043",
  },
];

const moeda = (valor) =>
  valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

function StatusBadge({ status }) {
  const ativo = status === "Ativo";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
        ativo
          ? "bg-[#e9f2e7] text-[#54764c]"
          : "bg-[#f1ece4] text-[#8c816f]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          ativo ? "bg-[#6d9463]" : "bg-[#a59a87]"
        }`}
      />
      {status}
    </span>
  );
}

function Avatar({ nome, size = "normal" }) {
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#eee5d5] font-serif text-[#806b43] ${
        size === "large" ? "h-14 w-14 text-base" : "h-10 w-10 text-xs"
      }`}
      aria-hidden="true"
    >
      {iniciais}
    </div>
  );
}

export default function AdminClientes() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clientes, setClientes] = useState(clientesIniciais);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return clientes.filter((cliente) => {
      const correspondeBusca =
        !termo ||
        cliente.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
        cliente.email.toLocaleLowerCase("pt-BR").includes(termo) ||
        cliente.id.toLocaleLowerCase("pt-BR").includes(termo);

      const correspondeStatus =
        filtroStatus === "Todos" || cliente.status === filtroStatus;

      return correspondeBusca && correspondeStatus;
    });
  }, [clientes, busca, filtroStatus]);

  const clientesAtivos = clientes.filter(
    (cliente) => cliente.status === "Ativo"
  ).length;

  const totalPedidos = clientes.reduce(
    (total, cliente) => total + cliente.pedidos,
    0
  );

  const faturamentoClientes = clientes.reduce(
    (total, cliente) => total + cliente.totalGasto,
    0
  );

  const alterarStatus = (id) => {
    setClientes((atuais) =>
      atuais.map((cliente) =>
        cliente.id === id
          ? {
              ...cliente,
              status: cliente.status === "Ativo" ? "Inativo" : "Ativo",
            }
          : cliente
      )
    );

    setClienteSelecionado((atual) =>
      atual?.id === id
        ? {
            ...atual,
            status: atual.status === "Ativo" ? "Inativo" : "Ativo",
          }
        : atual
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f3e8] text-[#211c14]">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <main className="min-w-0 lg:ml-[258px]">
        <AdminHeader
          title="Clientes"
          subtitle="Conheça e acompanhe os clientes da AURELIA."
          onMenuClick={() => setMobileOpen(true)}
        />

        <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#968052]">
                Relacionamento
              </p>
              <h2 className="mt-2 font-serif text-2xl text-[#211c14] sm:text-3xl">
                Gestão de clientes
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#817664]">
                Consulte os cadastros, acompanhe o histórico de compras e
                visualize o relacionamento de cada cliente com a loja.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start rounded-xl border border-[#e9dcc4] bg-[#fcfaf5] px-3.5 py-2.5 text-xs text-[#756b5a] sm:self-auto">
              <Users size={15} className="text-[#968052]" />
              <span>{clientes.length} clientes cadastrados</span>
            </div>
          </section>

          {/* Summary cards */}
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <SummaryCard
              label="Total de clientes"
              value={clientes.length}
              helper="Cadastros demonstrativos"
              icon={Users}
            />
            <SummaryCard
              label="Clientes ativos"
              value={clientesAtivos}
              helper="Status da conta"
              icon={UserCheck}
            />
            <SummaryCard
              label="Pedidos realizados"
              value={totalPedidos}
              helper="Somatório do histórico fictício"
              icon={ShoppingBag}
            />
            <SummaryCard
              label="Total comprado"
              value={moeda(faturamentoClientes)}
              helper="Valor acumulado demonstrativo"
              icon={CircleDollarSign}
              compact
            />
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] shadow-[0_4px_20px_rgba(33,28,20,0.025)]">
            <div className="flex flex-col gap-4 border-b border-[#eee5d5] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="font-serif text-lg text-[#292319]">
                  Todos os clientes
                </h3>
                <p className="mt-1 text-xs text-[#968b78]">
                  {clientesFiltrados.length} resultado(s) encontrado(s)
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex min-w-0 items-center gap-2 rounded-xl border border-[#e9dcc4] bg-white/70 px-3 py-2.5 sm:w-64">
                  <Search size={16} className="shrink-0 text-[#968052]" />
                  <input
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    placeholder="Buscar nome, e-mail ou código..."
                    aria-label="Buscar clientes"
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
                  {["Todos", "Ativo", "Inativo"].map((filtro) => (
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

            <div className="flex gap-2 overflow-x-auto border-b border-[#eee5d5] px-4 py-3 sm:px-5">
              {["Todos", "Ativo", "Inativo"].map((filtro) => (
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
                    {filtro === "Todos"
                      ? clientes.length
                      : clientes.filter((cliente) => cliente.status === filtro)
                          .length}
                  </span>
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#f8f3e8]/70 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a09582]">
                    <th className="px-5 py-4">Cliente</th>
                    <th className="px-5 py-4">Código</th>
                    <th className="px-5 py-4">Cadastro</th>
                    <th className="px-5 py-4">Pedidos</th>
                    <th className="px-5 py-4">Total comprado</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Ação</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f0e8da]">
                  {clientesFiltrados.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="transition hover:bg-[#faf6ee]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar nome={cliente.nome} />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[#393024]">
                              {cliente.nome}
                            </p>
                            <p className="mt-1 max-w-56 truncate text-[10px] text-[#a09582]">
                              {cliente.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs font-medium text-[#756b5a]">
                        {cliente.id}
                      </td>

                      <td className="px-5 py-4 text-xs text-[#756b5a]">
                        {cliente.cadastro}
                      </td>

                      <td className="px-5 py-4 text-xs text-[#756b5a]">
                        {cliente.pedidos}
                      </td>

                      <td className="px-5 py-4 text-xs font-semibold text-[#393024]">
                        {moeda(cliente.totalGasto)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={cliente.status} />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setClienteSelecionado(cliente)}
                          aria-label={`Ver detalhes de ${cliente.nome}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#e9dcc4] px-3 py-2 text-[11px] text-[#75613b] transition hover:border-[#b9975b] hover:bg-[#f7f1e6]"
                        >
                          <Eye size={14} />
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}

                  {clientesFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-14 text-center">
                        <Users size={28} className="mx-auto text-[#c2b49b]" />
                        <p className="mt-3 text-sm font-medium text-[#756b5a]">
                          Nenhum cliente encontrado
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
                Exibindo {clientesFiltrados.length} de {clientes.length} clientes
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

      {/* Client details modal */}
      {clienteSelecionado && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#211c14]/40 p-3 backdrop-blur-[2px] sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setClienteSelecionado(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cliente-modal-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-[#eee5d5] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Avatar nome={clienteSelecionado.nome} size="large" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#968052]">
                    Perfil do cliente
                  </p>
                  <h2
                    id="cliente-modal-title"
                    className="mt-1 font-serif text-xl text-[#211c14]"
                  >
                    {clienteSelecionado.nome}
                  </h2>
                  <p className="mt-1 text-xs text-[#968b78]">
                    {clienteSelecionado.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setClienteSelecionado(null)}
                aria-label="Fechar detalhes"
                className="rounded-lg p-2 text-[#756b5a] transition hover:bg-[#f2ecdf]"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <StatusBadge status={clienteSelecionado.status} />
                <button
                  type="button"
                  onClick={() => alterarStatus(clienteSelecionado.id)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] transition ${
                    clienteSelecionado.status === "Ativo"
                      ? "border-[#e9c9c2] text-[#9b5146] hover:bg-[#f7ebe7]"
                      : "border-[#d4e3cf] text-[#54764c] hover:bg-[#edf4ea]"
                  }`}
                >
                  {clienteSelecionado.status === "Ativo" ? (
                    <UserX size={14} />
                  ) : (
                    <UserCheck size={14} />
                  )}
                  {clienteSelecionado.status === "Ativo"
                    ? "Marcar inativo"
                    : "Ativar cliente"}
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={Mail}
                  label="E-mail"
                  value={clienteSelecionado.email}
                />
                <DetailItem
                  icon={Phone}
                  label="Telefone"
                  value={clienteSelecionado.telefone}
                />
                <DetailItem
                  icon={CalendarDays}
                  label="Data de cadastro"
                  value={clienteSelecionado.cadastro}
                />
                <DetailItem
                  icon={MapPin}
                  label="Localidade"
                  value={clienteSelecionado.endereco}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#e9dcc4] bg-white/60 p-4">
                  <ShoppingBag size={17} className="text-[#968052]" />
                  <p className="mt-3 font-serif text-2xl text-[#211c14]">
                    {clienteSelecionado.pedidos}
                  </p>
                  <p className="mt-1 text-[10px] text-[#968b78]">
                    Pedidos realizados
                  </p>
                </div>

                <div className="rounded-xl border border-[#e9dcc4] bg-white/60 p-4">
                  <CircleDollarSign size={17} className="text-[#968052]" />
                  <p className="mt-3 font-serif text-xl text-[#211c14]">
                    {moeda(clienteSelecionado.totalGasto)}
                  </p>
                  <p className="mt-1 text-[10px] text-[#968b78]">
                    Total comprado
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[#e9dcc4] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#a09582]">
                  Último pedido
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[#393024]">
                    {clienteSelecionado.ultimoPedido}
                  </span>
                  <span className="text-xs text-[#968b78]">
                    Histórico demonstrativo
                  </span>
                </div>
              </div>

              <p className="text-[10px] leading-5 text-[#a09582]">
                Os dados e a alteração de status são demonstrativos. A
                integração com os clientes reais será feita pela API.
              </p>

              <div className="flex justify-end border-t border-[#eee5d5] pt-4">
                <button
                  type="button"
                  onClick={() => setClienteSelecionado(null)}
                  className="rounded-xl bg-[#211c14] px-5 py-2.5 text-xs font-medium text-[#fcfaf5] transition hover:bg-[#403629]"
                >
                  Fechar
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, helper, icon: Icon, compact = false }) {
  return (
    <div className="rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] text-[#817664] sm:text-xs">{label}</p>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f1e8d8] text-[#8b754d]">
          <Icon size={16} strokeWidth={1.7} />
        </div>
      </div>
      <p
        className={`mt-3 font-serif text-[#211c14] ${
          compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] text-[#a09582]">{helper}</p>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1e8d8] text-[#8b754d]">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-[#a09582]">{label}</p>
        <p className="mt-1 break-words text-xs leading-5 text-[#393024]">
          {value}
        </p>
      </div>
    </div>
  );
}
