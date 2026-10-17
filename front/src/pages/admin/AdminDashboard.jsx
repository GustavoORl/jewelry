import { useState } from "react";
import Sidebar from "../../components/admin/Sidebar.jsx";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import {
  Package,
  Search,
  Bell,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  CircleDollarSign,
  ShoppingCart,
  UserRound,
  Menu,
  Plus,
  MoreHorizontal,
  Eye,
  ArrowRight,
} from "lucide-react";

const stats = [
  {
    label: "Faturamento total",
    value: "R$ 24.680,00",
    change: "+12,8%",
    positive: true,
    note: "em relação ao mês passado",
    icon: CircleDollarSign,
  },
  {
    label: "Pedidos recebidos",
    value: "186",
    change: "+8,2%",
    positive: true,
    note: "em relação ao mês passado",
    icon: ShoppingCart,
  },
  {
    label: "Produtos ativos",
    value: "64",
    change: "+4",
    positive: true,
    note: "novos produtos cadastrados",
    icon: Package,
  },
  {
    label: "Clientes cadastrados",
    value: "1.284",
    change: "+6,4%",
    positive: true,
    note: "em relação ao mês passado",
    icon: UserRound,
  },
];

const orders = [
  { id: "#AU-1048", customer: "Mariana Costa", initials: "MC", date: "16 out, 2026", total: "R$ 489,90", status: "Pago", tone: "green" },
  { id: "#AU-1047", customer: "Beatriz Almeida", initials: "BA", date: "16 out, 2026", total: "R$ 259,00", status: "Em preparação", tone: "gold" },
  { id: "#AU-1046", customer: "Camila Oliveira", initials: "CO", date: "15 out, 2026", total: "R$ 799,90", status: "Enviado", tone: "blue" },
  { id: "#AU-1045", customer: "Isabela Martins", initials: "IM", date: "15 out, 2026", total: "R$ 189,90", status: "Pendente", tone: "gray" },
];

const products = [
  { name: "Colar Aurora", category: "Colares", sold: "48 vendidos", price: "R$ 289,90", initials: "CA", bg: "bg-[#e9ddc9]" },
  { name: "Brinco Pérola", category: "Brincos", sold: "36 vendidos", price: "R$ 159,90", initials: "BP", bg: "bg-[#eee7dc]" },
  { name: "Anel Solitário", category: "Anéis", sold: "29 vendidos", price: "R$ 349,90", initials: "AS", bg: "bg-[#e6d7bd]" },
];

const chartValues = [32, 45, 38, 59, 50, 66, 54, 72, 61, 84, 69, 94];
const months = ["Nov", "Dez", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out"];

function StatCard({ item }) {
  const Icon = item.icon;
  return (
    <article className="rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] p-5 transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(55,43,22,0.05)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium text-[#817664]">{item.label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1e8d8] text-[#8d7547]"><Icon size={17} strokeWidth={1.7} /></span>
      </div>
      <p className="mt-4 font-serif text-[27px] tracking-[-0.04em] text-[#211c14] sm:text-[30px]">{item.value}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#4e8063]"><ArrowUpRight size={13} />{item.change}</span>
        <span className="text-[10px] text-[#a09787]">{item.note}</span>
      </div>
    </article>
  );
}

function SalesChart() {
  const points = chartValues.map((value, index) => `${28 + index * 54},${142 - value * 1.18}`).join(" ");
  const areaPoints = `28,150 ${points} 622,150`;
  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-4 text-[10px] text-[#948977]"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#a88c56]" />Faturamento</span><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#d9cdb8]" />Período anterior</span></div>
      <div className="mt-4 overflow-hidden">
        <svg viewBox="0 0 650 180" className="h-[185px] w-full" role="img" aria-label="Gráfico ilustrativo de faturamento crescente">
          {[30, 65, 100, 135, 150].map((y) => <line key={y} x1="20" y1={y} x2="630" y2={y} stroke="#eee5d6" strokeDasharray="3 5" />)}
          <polygon points={areaPoints} fill="url(#goldFill)" />
          <polyline points={points} fill="none" stroke="#a88c56" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {chartValues.map((value, index) => <circle key={index} cx={28 + index * 54} cy={142 - value * 1.18} r={index === chartValues.length - 1 ? 4.5 : 2.5} fill={index === chartValues.length - 1 ? "#fcfaf5" : "#a88c56"} stroke="#a88c56" strokeWidth={index === chartValues.length - 1 ? 2.5 : 0} />)}
          <defs><linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c9b17f" stopOpacity="0.28" /><stop offset="100%" stopColor="#c9b17f" stopOpacity="0.015" /></linearGradient></defs>
        </svg>
      </div>
      <div className="-mt-1 grid grid-cols-6 gap-1 text-center text-[10px] text-[#a09787] sm:grid-cols-12">{months.map((month) => <span key={month}>{month}</span>)}</div>
    </div>
  );
}

function StatusBadge({ status, tone }) {
  const styles = {
    green: "bg-[#e7f1e8] text-[#477254]",
    gold: "bg-[#f4ead5] text-[#8c6d31]",
    blue: "bg-[#e7edf4] text-[#55718e]",
    gray: "bg-[#efede8] text-[#81796c]",
  };
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${styles[tone]}`}>{status}</span>;
}

export default function AdminDashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [period, setPeriod] = useState("Últimos 12 meses");
  return (
    <div className="min-h-screen bg-[#f8f3e8] font-sans text-[#211c14]">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className="min-h-screen lg:pl-[258px]">
        <AdminHeader
          title="Visão geral"
          subtitle="Acompanhe o desempenho da sua loja."
          onMenuClick={() => setMobileOpen(true)}
        />

        <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10">
          <section className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="text-[11px] uppercase tracking-[0.18em] text-[#a88c56]">Seu negócio em um olhar</p><h2 className="mt-2 font-serif text-[29px] tracking-[-0.035em] sm:text-[34px]">Bom dia, administrador<span className="text-[#b9975b]">.</span></h2><p className="mt-2 max-w-xl text-[12px] leading-6 text-[#8c8170]">Aqui está o resumo da sua loja. Pequenos detalhes, grandes momentos.</p></div>
            <button className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#211c14] px-4 text-[11px] font-medium text-[#fcfaf5] shadow-sm transition hover:bg-[#3a3022] sm:self-auto"><Plus size={15} /> Novo produto</button>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores da loja">{stats.map((item) => <StatCard key={item.label} item={item} />)}</section>

          <section className="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-[1.55fr_1fr]">
            <article className="rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-serif text-[19px]">Desempenho de vendas</h3><p className="mt-1 text-[11px] text-[#978b78]">Acompanhe a evolução do faturamento</p></div><select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-lg border border-[#e9dcc4] bg-[#fcfaf5] px-3 py-2 text-[10px] text-[#6f6554] outline-none focus:border-[#b9975b]"><option>Últimos 12 meses</option><option>Últimos 30 dias</option><option>Últimos 7 dias</option></select></div>
              <div className="mt-5 flex items-end gap-3"><p className="font-serif text-[29px] tracking-[-0.04em]">R$ 24.680,00</p><span className="mb-1 inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#4e8063]"><ArrowUpRight size={13} />12,8%</span></div>
              <SalesChart />
            </article>

            <article className="rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] p-5 sm:p-6">
              <div className="flex items-start justify-between"><div><h3 className="font-serif text-[19px]">Resumo dos pedidos</h3><p className="mt-1 text-[11px] text-[#978b78]">Status dos pedidos recebidos</p></div><button className="rounded-lg p-1.5 text-[#9a8d78] hover:bg-[#f3ede2]" aria-label="Mais opções"><MoreHorizontal size={19} /></button></div>
              <div className="mt-6 flex items-center gap-5"><div className="relative flex h-[132px] w-[132px] shrink-0 items-center justify-center rounded-full" style={{ background: "conic-gradient(#a88c56 0deg 174deg, #d8c6a3 174deg 250deg, #e8e1d5 250deg 318deg, #7c9580 318deg 360deg)" }}><div className="flex h-[91px] w-[91px] flex-col items-center justify-center rounded-full bg-[#fcfaf5]"><span className="font-serif text-[26px]">186</span><span className="text-[9px] text-[#978b78]">pedidos</span></div></div><div className="min-w-0 flex-1 space-y-3"><div className="flex items-center justify-between gap-2 text-[11px]"><span className="flex items-center gap-2 text-[#766c5b]"><span className="h-2 w-2 rounded-full bg-[#a88c56]" />Pago</span><span className="font-semibold">48%</span></div><div className="flex items-center justify-between gap-2 text-[11px]"><span className="flex items-center gap-2 text-[#766c5b]"><span className="h-2 w-2 rounded-full bg-[#d8c6a3]" />Em preparação</span><span className="font-semibold">21%</span></div><div className="flex items-center justify-between gap-2 text-[11px]"><span className="flex items-center gap-2 text-[#766c5b]"><span className="h-2 w-2 rounded-full bg-[#e8e1d5]" />Pendente</span><span className="font-semibold">19%</span></div><div className="flex items-center justify-between gap-2 text-[11px]"><span className="flex items-center gap-2 text-[#766c5b]"><span className="h-2 w-2 rounded-full bg-[#7c9580]" />Enviado</span><span className="font-semibold">12%</span></div></div></div>
              <div className="mt-6 rounded-xl bg-[#f6f0e5] px-4 py-3"><p className="text-[10px] leading-5 text-[#827763]">Você recebeu <strong className="font-semibold text-[#514632]">18 pedidos novos</strong> nesta semana. Continue acompanhando as atualizações.</p></div>
            </article>
          </section>

          <section className="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-[1.55fr_1fr]">
            <article className="min-w-0 rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3"><div><h3 className="font-serif text-[19px]">Pedidos recentes</h3><p className="mt-1 text-[11px] text-[#978b78]">Acompanhe as últimas compras da loja</p></div><button className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-[#8d7547] hover:text-[#5d4927]">Ver todos <ArrowRight size={13} /></button></div>
              <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] border-collapse text-left"><thead><tr className="border-b border-[#eee5d6] text-[9px] uppercase tracking-[0.12em] text-[#a09787]"><th className="pb-3 pr-4 font-medium">Pedido</th><th className="pb-3 pr-4 font-medium">Cliente</th><th className="pb-3 pr-4 font-medium">Data</th><th className="pb-3 pr-4 font-medium">Valor</th><th className="pb-3 pr-4 font-medium">Status</th><th className="pb-3 font-medium"> </th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-b border-[#f0e9dd] last:border-0"><td className="whitespace-nowrap py-4 pr-4 text-[11px] font-semibold text-[#514632]">{order.id}</td><td className="whitespace-nowrap py-4 pr-4"><span className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eee5d6] font-serif text-[10px] text-[#806b43]">{order.initials}</span><span className="text-[11px] text-[#615848]">{order.customer}</span></span></td><td className="whitespace-nowrap py-4 pr-4 text-[10px] text-[#978b78]">{order.date}</td><td className="whitespace-nowrap py-4 pr-4 text-[11px] font-medium">{order.total}</td><td className="py-4 pr-4"><StatusBadge status={order.status} tone={order.tone} /></td><td className="py-4"><button aria-label={`Ver pedido ${order.id}`} className="rounded-lg p-2 text-[#a09787] hover:bg-[#f3ede2] hover:text-[#514632]"><Eye size={15} /></button></td></tr>)}</tbody></table></div>
            </article>

            <article className="rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3"><div><h3 className="font-serif text-[19px]">Mais vendidos</h3><p className="mt-1 text-[11px] text-[#978b78]">Os favoritos das clientes</p></div><button className="rounded-lg p-1.5 text-[#9a8d78] hover:bg-[#f3ede2]" aria-label="Mais opções"><MoreHorizontal size={19} /></button></div>
              <div className="mt-4 divide-y divide-[#f0e9dd]">{products.map((product, index) => <div key={product.name} className="flex items-center gap-3 py-4 first:pt-2 last:pb-1"><div className={`flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-xl ${product.bg} font-serif text-[13px] text-[#8b754d]`}>{product.initials}</div><div className="min-w-0 flex-1"><p className="truncate text-[12px] font-medium text-[#514632]">{product.name}</p><p className="mt-1 text-[10px] text-[#a09787]">{product.category} · {product.sold}</p></div><div className="text-right"><p className="whitespace-nowrap text-[11px] font-semibold">{product.price}</p><p className="mt-1 text-[9px] text-[#a09787]">#{index + 1} em vendas</p></div></div>)}</div>
              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#e9dcc4] py-3 text-[10px] font-medium text-[#75613b] transition hover:bg-[#f6f0e5]">Ver catálogo completo <ArrowRight size={13} /></button>
            </article>
          </section>
          <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-[#e9dcc4] py-5 text-[10px] text-[#a09787] sm:flex-row sm:items-center"><span>© 2026 AURELIA. Todos os direitos reservados.</span><span>Feito com cuidado, em cada detalhe.</span></footer>
        </div>
      </main>
    </div>
  );
}
