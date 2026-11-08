import NotificacoesConta from "../NotificacoesConta.jsx";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  UserRound,
  Settings,
  LogOut,
  Menu,
  LoaderCircle,
} from "lucide-react";

import { apiFetch } from "../../services/api.js";

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

export default function AdminHeader({
  title = "Visão geral",
  subtitle = "Acompanhe o desempenho da sua loja.",
  onMenuClick,
}) {
  const navigate = useNavigate();

  const [pesquisa, setPesquisa] = useState("");
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const [perfilAberto, setPerfilAberto] = useState(false);

  const [usuario, setUsuario] = useState(null);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);
  const [saindo, setSaindo] = useState(false);
  const [erroLogout, setErroLogout] = useState("");

  const referenciaNotificacoes = useRef(null);
  const referenciaPerfil = useRef(null);

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
  // FECHAR MENUS AO CLICAR FORA
  // ==========================================

  useEffect(() => {
    function fecharAoClicarFora(evento) {
      if (
        referenciaNotificacoes.current &&
        !referenciaNotificacoes.current.contains(evento.target)
      ) {
        setNotificacoesAbertas(false);
      }

      if (
        referenciaPerfil.current &&
        !referenciaPerfil.current.contains(evento.target)
      ) {
        setPerfilAberto(false);
      }
    }

    function fecharAoPressionarEscape(evento) {
      if (evento.key === "Escape") {
        setNotificacoesAbertas(false);
        setPerfilAberto(false);
      }
    }

    document.addEventListener("mousedown", fecharAoClicarFora);
    document.addEventListener("keydown", fecharAoPressionarEscape);

    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
      document.removeEventListener("keydown", fecharAoPressionarEscape);
    };
  }, []);

  // ==========================================
  // NAVEGAÇÃO
  // ==========================================

  function navegarPara(caminho) {
    setPerfilAberto(false);
    setNotificacoesAbertas(false);
    setErroLogout("");

    navigate(caminho);
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  async function sairDaConta() {
    if (saindo) return;

    try {
      setSaindo(true);
      setErroLogout("");

      await apiFetch("/sair", {
        method: "POST",
      });

      setPerfilAberto(false);
      navigate("/login", { replace: true });
    } catch (erro) {
      console.error("Erro ao encerrar sessão:", erro);

      setErroLogout(
        erro.message || "Não foi possível sair da conta. Tente novamente."
      );
    } finally {
      setSaindo(false);
    }
  }

  // ==========================================
  // DADOS DO ADMINISTRADOR
  // ==========================================

  const nomeUsuario = usuario?.nome || "Administrador";
  const emailUsuario = usuario?.email || "E-mail indisponível";
  const iniciais = obterIniciais(usuario?.nome);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <header className="sticky top-0 z-30 border-b border-[#e9dcc4] bg-[#fcfaf5]/95 backdrop-blur-md">
      <div className="flex min-h-[88px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        {/* TÍTULO E BOTÃO MOBILE */}

        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Abrir menu"
            className="rounded-xl p-2 text-[#756b5a] transition hover:bg-[#f2ecdf] lg:hidden"
          >
            <Menu size={21} />
          </button>

          <div className="min-w-0">
            <h1 className="truncate font-serif text-xl text-[#211c14] sm:text-2xl">
              {title}
            </h1>

            <p className="mt-1 hidden text-xs text-[#8c816f] sm:block">
              {subtitle}
            </p>
          </div>
        </div>

        {/* PESQUISA E AÇÕES */}

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {/* PESQUISA */}

          <form
            onSubmit={(evento) => evento.preventDefault()}
            role="search"
            className="hidden w-44 items-center gap-2 rounded-xl border border-[#e9dcc4] bg-white/70 px-3 py-2.5 transition focus-within:border-[#b9975b] md:flex lg:w-64"
          >
            <Search size={17} className="shrink-0 text-[#968052]" />

            <input
              type="search"
              value={pesquisa}
              onChange={(evento) => setPesquisa(evento.target.value)}
              placeholder="Pesquisar..."
              aria-label="Pesquisar no painel"
              className="w-full bg-transparent text-xs text-[#211c14] outline-none placeholder:text-[#a59a87]"
            />
          </form>

          <div ref={referenciaNotificacoes} className="relative"><NotificacoesConta key={usuario?.id} usuarioId={usuario?.id} abertas={notificacoesAbertas} onAlternar={() => { setNotificacoesAbertas(a => !a); setPerfilAberto(false); }} onFechar={() => setNotificacoesAbertas(false)} /></div>

          {/* DIVISOR */}

          <div className="h-8 w-px bg-[#e9dcc4]" />

          {/* PERFIL DO ADMINISTRADOR */}

          <div ref={referenciaPerfil} className="relative">
            <button
              type="button"
              onClick={() => {
                setPerfilAberto((anterior) => !anterior);
                setNotificacoesAbertas(false);
                setErroLogout("");
              }}
              aria-expanded={perfilAberto}
              aria-label="Abrir menu do administrador"
              className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-[#f2ecdf] sm:gap-3"
            >
              {/* AVATAR */}

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#211c14] font-serif text-sm text-[#f8f3e8]">
                {carregandoUsuario ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : usuario ? (
                  iniciais
                ) : (
                  <UserRound size={18} />
                )}
              </div>

              {/* NOME */}

              <div className="hidden text-left sm:block">
                <p className="max-w-32 truncate text-xs font-semibold text-[#292319]">
                  {carregandoUsuario ? "Carregando..." : nomeUsuario}
                </p>

                <p className="mt-0.5 text-[10px] text-[#968b78]">
                  Administrador
                </p>
              </div>

              <ChevronDown
                size={15}
                className={`hidden text-[#968b78] transition-transform sm:block ${perfilAberto ? "rotate-180" : ""}`}
              />
            </button>

            {/* MENU DO PERFIL */}

            {perfilAberto && (
              <div className="absolute right-0 top-12 z-50 w-60 max-w-[calc(100vw-2rem)] rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] p-2 shadow-xl">
                {/* INFORMAÇÕES */}

                <div className="border-b border-[#e9dcc4] px-3 py-3">
                  <p className="truncate text-xs font-semibold text-[#292319]">
                    {nomeUsuario}
                  </p>

                  <p className="mt-1 truncate text-[10px] text-[#968b78]">
                    {emailUsuario}
                  </p>
                </div>

                {/* MEU PERFIL */}

                <button
                  type="button"
                  onClick={() => navegarPara("/perfil")}
                  className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-[#6e6659] transition hover:bg-[#f2ecdf] hover:text-[#211c14]"
                >
                  <UserRound size={16} />
                  Meu perfil
                </button>

                {/* CONFIGURAÇÕES */}

                <button
                  type="button"
                  onClick={() => navegarPara("/admin/configuracoes")}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-[#6e6659] transition hover:bg-[#f2ecdf] hover:text-[#211c14]"
                >
                  <Settings size={16} />
                  Configurações
                </button>

                {/* SAIR */}

                <button
                  type="button"
                  onClick={sairDaConta}
                  disabled={saindo}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-[#9b5146] transition hover:bg-[#f7ebe7] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saindo ? <LoaderCircle size={16} className="animate-spin" /> : <LogOut size={16} />}
                  {saindo ? "Saindo..." : "Sair"}
                </button>

                {/* ERRO NO LOGOUT */}

                {erroLogout && (
                  <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-[11px] leading-5 text-red-700">
                    {erroLogout}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
