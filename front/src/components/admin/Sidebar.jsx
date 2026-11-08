
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
  LogOut,
  UserRound,
  LoaderCircle,
  ChevronDown,
} from "lucide-react";

import { apiFetch } from "../../services/api.js";

// ==========================================
// NAVEGAÇÃO
// ==========================================

const navigation = [
  { label: "Visão geral", icon: LayoutDashboard, to: "/admin", end: true },
  { label: "Produtos", icon: Package, to: "/admin/produtos" },
  { label: "Pedidos", icon: ShoppingBag, to: "/admin/pedidos" },
  { label: "Editorial / Blog", icon: Tags, to: "/admin/editorial" },
  { label: "Devoluções", icon: ShoppingBag, to: "/admin/devolucoes" },
  { label: "Clientes", icon: Users, to: "/admin/clientes" },
  { label: "Categorias", icon: Tags, to: "/admin/categorias" },
  { label: "Materiais", icon: Gem, to: "/admin/materiais" },
  { label: "Promoções", icon: Tags, to: "/admin/promocoes" },
  { label: "Ir para Loja", icon: Store, to: "/" },
];

// ==========================================
// FORMATADORES
// ==========================================

function obterIniciais(nome) {
  if (!nome?.trim()) return "A";

  const partes = nome.trim().split(/\s+/);

  if (partes.length === 1) {
    return partes[0].charAt(0).toUpperCase();
  }

  return `${partes[0].charAt(0)}${partes[partes.length - 1].charAt(0)}`.toUpperCase();
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function Sidebar({ mobileOpen, onClose }) {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);

  // ==========================================
  // CARREGAR ADMINISTRADOR
  // ==========================================

  useEffect(() => {
    let ativo = true;

    async function carregarUsuario() {
      try {
        setCarregandoUsuario(true);

        const resposta = await apiFetch("/me");

        if (!ativo) return;

        setUsuario(resposta?.usuario || null);
      } catch (erro) {
        console.error("Erro ao carregar administrador:", erro);

        if (ativo) {
          setUsuario(null);
        }
      } finally {
        if (ativo) {
          setCarregandoUsuario(false);
        }
      }
    }

    carregarUsuario();

    return () => {
      ativo = false;
    };
  }, []);

  // ==========================================
  // NAVEGAR
  // ==========================================

  function fecharMenu() {
    setMenuPerfilAberto(false);
    onClose?.();
  }

  function navegarParaConfiguracoes() {
    fecharMenu();
    navigate("/admin/configuracoes");
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  async function sairDaConta() {
    if (saindo) return;

    try {
      setSaindo(true);

      await apiFetch("/sair", {
        method: "POST",
      });

      fecharMenu();
      navigate("/login", { replace: true });
    } catch (erro) {
      console.error("Erro ao encerrar sessão:", erro);
      alert("Não foi possível encerrar sua sessão. Tente novamente.");
    } finally {
      setSaindo(false);
    }
  }

  // ==========================================
  // DADOS DO PERFIL
  // ==========================================

  const nomeUsuario = usuario?.nome || "Administrador";
  const emailUsuario = usuario?.email || "E-mail indisponível";
  const iniciais = obterIniciais(usuario?.nome);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      {/* OVERLAY MOBILE */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={fecharMenu}
          className="fixed inset-0 z-40 bg-[#211c14]/30 lg:hidden"
        />
      )}

      {/* SIDEBAR */}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[258px] flex-col border-r border-[#e9dcc4] bg-[#fcfaf5] px-5 py-6 transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* LOGO */}

        <div className="flex items-center justify-between px-2">
          <NavLink to="/admin" end onClick={fecharMenu} className="inline-flex flex-col leading-none" aria-label="AURORA início administrativo">
            <span className="font-serif text-[28px] tracking-[0.19em] text-[#211c14]">AURORA</span>
            <span className="mt-2 text-[9px] font-medium uppercase tracking-[0.27em] text-[#968052]">Painel administrativo</span>
          </NavLink>

          <button type="button" onClick={fecharMenu} className="rounded-lg p-2 text-[#756b5a] hover:bg-[#f3ede2] lg:hidden" aria-label="Fechar menu">
            <X size={19} />
          </button>
        </div>

        {/* NAVEGAÇÃO PRINCIPAL */}

        <div className="mt-10 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a59a87]">
          Menu principal
        </div>

        <nav className="mt-3 space-y-1">
          {navigation.map(({ label, icon: Icon, to, end }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              onClick={fecharMenu}
              className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] transition ${isActive ? "bg-[#211c14] font-medium text-[#fcfaf5] shadow-sm" : "text-[#6e6659] hover:bg-[#f2ecdf] hover:text-[#211c14]"}`}
            >
              <Icon size={17} strokeWidth={1.7} />
              <span className="flex-1">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* PREFERÊNCIAS */}

        <div className="mt-9 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a59a87]">
          Preferências
        </div>

        <nav className="mt-3 space-y-1">
          <NavLink
            to="/admin/configuracoes"
            onClick={fecharMenu}
            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] transition ${isActive ? "bg-[#211c14] font-medium text-[#fcfaf5] shadow-sm" : "text-[#6e6659] hover:bg-[#f2ecdf] hover:text-[#211c14]"}`}
          >
            <Settings size={17} strokeWidth={1.7} />
            Configurações
          </NavLink>
        </nav>

        {/* ÁREA INFERIOR */}

        <div className="mt-auto min-h-0 overflow-y-auto pt-5">

          {/* PERFIL DO ADMINISTRADOR */}

          <div className="mt-5 flex items-center gap-3 border-t border-[#e9dcc4] px-1 pt-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#211c14] font-serif text-sm text-[#f8f3e8]">
              {carregandoUsuario ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : usuario ? (
                iniciais
              ) : (
                <UserRound size={18} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-[#292319]">
                {carregandoUsuario ? "Carregando..." : nomeUsuario}
              </p>

              <p className="mt-0.5 truncate text-[10px] text-[#968b78]">
                {carregandoUsuario ? "Buscando informações" : emailUsuario}
              </p>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
}
