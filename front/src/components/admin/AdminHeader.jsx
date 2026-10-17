import { useState } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  UserRound,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";

export default function AdminHeader({
  title = "Visão geral",
  subtitle = "Acompanhe o desempenho da sua loja.",
  onMenuClick,
  adminName = "Administrador",
}) {
  const [pesquisa, setPesquisa] = useState("");
  const [notificacoesAbertas, setNotificacoesAbertas] =
    useState(false);
  const [perfilAberto, setPerfilAberto] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[#e9dcc4] bg-[#fcfaf5]/95 backdrop-blur-md">
      <div className="flex min-h-[88px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        {/* Título e botão mobile */}
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

        {/* Pesquisa e ações */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <form
            onSubmit={(event) => event.preventDefault()}
            role="search"
            className="hidden w-44 items-center gap-2 rounded-xl border border-[#e9dcc4] bg-white/70 px-3 py-2.5 transition focus-within:border-[#b9975b] md:flex lg:w-64"
          >
            <Search
              size={17}
              className="shrink-0 text-[#968052]"
            />

            <input
              type="search"
              value={pesquisa}
              onChange={(event) => setPesquisa(event.target.value)}
              placeholder="Pesquisar..."
              aria-label="Pesquisar no painel"
              className="w-full bg-transparent text-xs text-[#211c14] outline-none placeholder:text-[#a59a87]"
            />
          </form>

          {/* Notificações */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificacoesAbertas(!notificacoesAbertas);
                setPerfilAberto(false);
              }}
              aria-label="Notificações"
              aria-expanded={notificacoesAbertas}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#756b5a] transition hover:bg-[#f2ecdf]"
            >
              <Bell size={19} strokeWidth={1.7} />

              <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-[#fcfaf5] bg-[#b9975b]" />
            </button>

            {notificacoesAbertas && (
              <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] p-4 shadow-xl">
                <h2 className="font-serif text-base text-[#211c14]">
                  Notificações
                </h2>

                <p className="mt-3 text-xs leading-5 text-[#817664]">
                  Você verá aqui avisos sobre novos pedidos,
                  estoque e atividades da loja.
                </p>

                <p className="mt-3 border-t border-[#e9dcc4] pt-3 text-[10px] text-[#a59a87]">
                  As notificações reais serão integradas futuramente.
                </p>
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-[#e9dcc4]" />

          {/* Perfil */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setPerfilAberto(!perfilAberto);
                setNotificacoesAbertas(false);
              }}
              aria-expanded={perfilAberto}
              className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-[#f2ecdf] sm:gap-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#211c14] font-serif text-sm text-[#f8f3e8]">
                {adminName.charAt(0).toUpperCase()}
              </div>

              <div className="hidden text-left sm:block">
                <p className="max-w-32 truncate text-xs font-semibold text-[#292319]">
                  {adminName}
                </p>

                <p className="mt-0.5 text-[10px] text-[#968b78]">
                  Administrador
                </p>
              </div>

              <ChevronDown
                size={15}
                className="hidden text-[#968b78] sm:block"
              />
            </button>

            {perfilAberto && (
              <div className="absolute right-0 top-12 z-50 w-52 rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] p-2 shadow-xl">
                <div className="border-b border-[#e9dcc4] px-3 py-3">
                  <p className="truncate text-xs font-semibold text-[#292319]">
                    {adminName}
                  </p>
                  <p className="mt-1 text-[10px] text-[#968b78]">
                    Conta administrativa
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPerfilAberto(false)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-[#6e6659] transition hover:bg-[#f2ecdf]"
                >
                  <UserRound size={16} />
                  Meu perfil
                </button>

                <button
                  type="button"
                  onClick={() => setPerfilAberto(false)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-[#6e6659] transition hover:bg-[#f2ecdf]"
                >
                  <Settings size={16} />
                  Configurações
                </button>

                <button
                  type="button"
                  onClick={() => setPerfilAberto(false)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-[#9b5146] transition hover:bg-[#f7ebe7]"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
