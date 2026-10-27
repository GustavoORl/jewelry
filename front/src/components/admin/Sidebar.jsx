import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tags,
  Settings,
  TrendingUp,
  MoreHorizontal,
  X,
  Gem,
  Store,
} from "lucide-react";

const navigation = [
  { label: "Visão geral", icon: LayoutDashboard, to: "/admin", end: true },
  { label: "Produtos", icon: Package, to: "/admin/produtos" },
  { label: "Pedidos", icon: ShoppingBag, to: "/admin/pedidos", count: "8" },
  { label: "Clientes", icon: Users, to: "/admin/clientes" },
  { label: "Categorias", icon: Tags, to: "/admin/categorias" },
  { label: "Materiais", icon: Gem, to: "/admin/materiais"},
  { label: "Ir para Loja", icon: Store, to: "/"},
];

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Fechar menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#211c14]/30 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[258px] flex-col border-r border-[#e9dcc4] bg-[#fcfaf5] px-5 py-6 transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-2">
          <NavLink
            to="/admin"
            end
            onClick={onClose}
            className="inline-flex flex-col leading-none"
            aria-label="AURELIA início administrativo"
          >
            <span className="font-serif text-[28px] tracking-[0.19em] text-[#211c14]">AURORA</span>
            <span className="mt-2 text-[9px] font-medium uppercase tracking-[0.27em] text-[#968052]">Painel administrativo</span>
          </NavLink>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[#756b5a] hover:bg-[#f3ede2] lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={19} />
          </button>
        </div>

        <div className="mt-10 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a59a87]">Menu principal</div>
        <nav className="mt-3 space-y-1">
          {navigation.map(({ label, icon: Icon, to, end, count }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] transition ${isActive ? "bg-[#211c14] font-medium text-[#fcfaf5] shadow-sm" : "text-[#6e6659] hover:bg-[#f2ecdf] hover:text-[#211c14]"}`}
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} strokeWidth={1.7} />
                  <span className="flex-1">{label}</span>
                  {count && (
                    <span className={`rounded-md px-2 py-0.5 text-[10px] ${isActive ? "bg-white/15 text-white" : "bg-[#eee5d5] text-[#75613b]"}`}>
                      {count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-9 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a59a87]">Preferências</div>
        <nav className="mt-3 space-y-1">
          <NavLink
            to="/admin/configuracoes"
            onClick={onClose}
            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] transition ${isActive ? "bg-[#211c14] font-medium text-[#fcfaf5] shadow-sm" : "text-[#6e6659] hover:bg-[#f2ecdf] hover:text-[#211c14]"}`}
          >
            <Settings size={17} strokeWidth={1.7} /> Configurações
          </NavLink>
        </nav>

        <div className="mt-auto rounded-2xl border border-[#e9dcc4] bg-[#f7f1e6] p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8dcc5] text-[#7e6840]"><TrendingUp size={17} /></div>
          <p className="mt-3 font-serif text-[16px] text-[#292319]">Sua loja, em harmonia.</p>
          <p className="mt-1 text-[11px] leading-5 text-[#817664]">Acompanhe os resultados e cuide de cada detalhe da AURELIA.</p>
        </div>

        <div className="mt-5 flex items-center gap-3 border-t border-[#e9dcc4] px-1 pt-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#211c14] font-serif text-sm text-[#f8f3e8]">A</div>
          <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-semibold text-[#292319]">Administrador</p><p className="mt-0.5 text-[10px] text-[#968b78]">Gestão da loja</p></div>
          <MoreHorizontal size={18} className="text-[#968b78]" />
        </div>
      </aside>
    </>
  );
}
