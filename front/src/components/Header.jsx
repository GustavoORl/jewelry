import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Heart,
  UserRound,
  ShoppingBag,
  Menu,
  X,
  Package,
  MapPin,
  Clock3,
  Settings,
  LogOut,
  ChevronRight,
  User,
  LogIn,
  UserPlus,
  Bell,
  CheckCheck,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext.jsx";

const categorias = [
  "Colares",
  "Brincos",
  "Anéis",
  "Pulseiras",
  "Tornozeleiras",
  "Coleções",
  "Outlet",
];

export default function Header() {
  const [busca, setBusca] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);
  const [contaAberta, setContaAberta] = useState(false);
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const [saindo, setSaindo] = useState(false);

  const { usuario, sair } = useAuth();
  const navigate = useNavigate();

  const contaRef = useRef(null);
  const notificacoesRef = useRef(null);

  // Fecha os dropdowns ao clicar fora ou pressionar Escape.
  useEffect(() => {
    function handleClickFora(event) {
      if (
        contaRef.current &&
        !contaRef.current.contains(event.target)
      ) {
        setContaAberta(false);
      }

      if (
        notificacoesRef.current &&
        !notificacoesRef.current.contains(event.target)
      ) {
        setNotificacoesAbertas(false);
      }
    }

    function handleTecla(event) {
      if (event.key === "Escape") {
        setContaAberta(false);
        setNotificacoesAbertas(false);
        setMenuAberto(false);
      }
    }

    document.addEventListener("mousedown", handleClickFora);
    document.addEventListener("keydown", handleTecla);

    return () => {
      document.removeEventListener("mousedown", handleClickFora);
      document.removeEventListener("keydown", handleTecla);
    };
  }, []);

  function handleSearch(event) {
    event.preventDefault();

    const termo = busca.trim();

    if (!termo) return;

    setMenuAberto(false);

    navigate(`/produtos?busca=${encodeURIComponent(termo)}`);
  }

  async function handleSair() {
    if (saindo) return;

    setSaindo(true);

    try {
      await sair();
    } catch (erro) {
      console.error("Erro ao sair:", erro);
    } finally {
      setContaAberta(false);
      setNotificacoesAbertas(false);
      setMenuAberto(false);
      setSaindo(false);

      navigate("/login", { replace: true });
    }
  }

  function abrirCategoria(categoria) {
    setMenuAberto(false);

    navigate(
      `/categoria/${encodeURIComponent(
        categoria.toLocaleLowerCase("pt-BR")
      )}`
    );
  }

  function fecharConta() {
    setContaAberta(false);
  }

  return (
    <header className="w-full bg-[#FAF9F5] text-[#211C14]">
      {/* Barra superior */}
      <div className="bg-[#211C14] py-3 text-[#F5F0E6] lg:px-12">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between max-sm:px-5 lg:px-0">
          <p className="text-[9px] tracking-[0.15em] sm:text-xs sm:tracking-[0.25em]">
            FRETE GRÁTIS ACIMA DE R$ 299 · TROCA EM ATÉ 30 DIAS
          </p>

          <div className="hidden items-center gap-8 text-sm md:flex">
            <a
              href="/lojas"
              className="transition-opacity hover:opacity-70"
            >
              Nossas lojas
            </a>

            <a
              href="/ajuda"
              className="transition-opacity hover:opacity-70"
            >
              Ajuda
            </a>

            <a
              href="/vender"
              className="transition-opacity hover:opacity-70"
            >
              Torne-se um afiliado
            </a>
          </div>
        </div>
      </div>

      {/* Cabeçalho principal */}
      <div className="mx-auto max-w-[1320px] max-sm:px-5 max-xl:px-12">
        <div className="flex min-h-[112px] items-center justify-between gap-5 py-5">
          {/* Logo */}
          <Link
            to="/"
            className="flex shrink-0 items-center gap-3"
            aria-label="AURORA - página inicial"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#211C14] font-serif text-2xl text-[#FAF9F5]">
              A
            </div>

            <div className="hidden sm:block">
              <h1 className="font-serif text-2xl leading-none tracking-tight text-[#211C14]">
                AURORA
              </h1>

              <p className="text-[10px] tracking-[0.34em] text-[#8A8172]">
                MARKETPLACE DE JOIAS
              </p>
            </div>
          </Link>

          {/* Pesquisa desktop */}
          <form
            onSubmit={handleSearch}
            role="search"
            className="hidden max-w-[680px] flex-1 items-center rounded-full border border-[#E7E0CE] bg-[#F3EFE3] px-6 py-4 transition-colors focus-within:border-[#B5A77F] md:flex"
          >
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por colar, brinco, ouro 18k..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#918879]"
              aria-label="Pesquisar produtos"
            />

            <button
              type="submit"
              className="ml-4 flex shrink-0 items-center gap-3 font-medium transition-opacity hover:opacity-60"
            >
              <Search size={23} strokeWidth={1.8} />
              <span>Buscar</span>
            </button>
          </form>

          {/* Ações */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            {/* Favoritos */}
            <Link
              to="/favoritos"
              aria-label="Favoritos"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E7E0CE] transition-colors hover:bg-[#F3EFE3] sm:h-12 sm:w-12"
            >
              <Heart size={21} strokeWidth={1.8} />
            </Link>

            {/* Notificações: somente para usuários logados */}
            {usuario && (
              <div ref={notificacoesRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotificacoesAbertas((aberta) => !aberta);
                    setContaAberta(false);
                  }}
                  aria-label="Abrir notificações"
                  aria-expanded={notificacoesAbertas}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E7E0CE] transition-colors hover:bg-[#F3EFE3] sm:h-12 sm:w-12"
                >
                  <Bell size={21} strokeWidth={1.8} />

                </button>

                {notificacoesAbertas && (
                  <div className="absolute right-0 top-full z-50 mt-3 w-[min(288px,calc(100vw-40px))] rounded-2xl border border-[#E7E0CE] bg-[#FAF9F5] p-2 shadow-xl">
                    <div className="border-b border-[#E7E0CE] px-3 py-3">
                      <p className="text-sm font-semibold text-[#292319]">
                        Notificações
                      </p>

                      <p className="mt-1 text-[10px] text-[#8A8172]">
                        Novidades da sua conta
                      </p>
                    </div>

                    <div className="flex flex-col items-center px-3 py-6 text-center">
                      <CheckCheck
                        size={25}
                        strokeWidth={1.5}
                        className="text-[#968052]"
                      />

                      <p className="mt-3 text-xs font-medium text-[#292319]">
                        Tudo tranquilo por aqui!
                      </p>

                      <p className="mt-1 text-[10px] leading-relaxed text-[#8A8172]">
                        Quando houver novidades, elas aparecerão aqui.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Usuário e dropdown */}
            <div ref={contaRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setContaAberta((aberta) => !aberta);
                  setNotificacoesAbertas(false);
                }}
                aria-label="Abrir menu da conta"
                aria-expanded={contaAberta}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E7E0CE] transition-colors hover:bg-[#F3EFE3] sm:h-12 sm:w-12"
              >
                <UserRound size={21} strokeWidth={1.8} />

                {/* Ponto dourado para indicar que o usuário está logado */}
                {usuario && (
                  <span className="absolute right-[5px] bottom-[5px] h-2 w-2 rounded-full bg-[#B9975B]" />
                )}
              </button>

              {contaAberta && (
                <div className="absolute right-0 top-full z-50 mt-3 w-[min(288px,calc(100vw-40px))] rounded-2xl border border-[#E7E0CE] bg-[#FAF9F5] p-2 shadow-xl">
                  {usuario ? (
                    <>
                      {/* Perfil */}
                      <div className="border-b border-[#E7E0CE] px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#211C14] font-serif text-sm uppercase text-[#FAF9F5]">
                            {usuario.nome?.charAt(0) || "U"}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-[#292319]">
                              {usuario.nome}
                            </p>

                            <p className="mt-1 truncate text-[10px] text-[#8A8172]">
                              {usuario.email}
                            </p>

                            <p className="mt-1 text-[10px] text-[#968052]">
                              {usuario.tipo === "ADMIN"
                                ? "Administrador"
                                : "Minha conta"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Opções do usuário */}
                      <nav className="py-1">
                        <Link
                          to="/minha-conta"
                          onClick={fecharConta}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-[#6E6659] transition-colors hover:bg-[#F3EFE3]"
                        >
                          <User size={16} strokeWidth={1.6} />
                          Minha conta
                          <ChevronRight
                            size={14}
                            className="ml-auto text-[#B5A77F]"
                          />
                        </Link>

                        <Link
                          to="/meus-pedidos"
                          onClick={fecharConta}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-[#6E6659] transition-colors hover:bg-[#F3EFE3]"
                        >
                          <Package size={16} strokeWidth={1.6} />
                          Meus pedidos
                          <ChevronRight
                            size={14}
                            className="ml-auto text-[#B5A77F]"
                          />
                        </Link>

                        <Link
                          to="/favoritos"
                          onClick={fecharConta}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-[#6E6659] transition-colors hover:bg-[#F3EFE3]"
                        >
                          <Heart size={16} strokeWidth={1.6} />
                          Meus favoritos
                          <ChevronRight
                            size={14}
                            className="ml-auto text-[#B5A77F]"
                          />
                        </Link>

                        <Link
                          to="/meus-enderecos"
                          onClick={fecharConta}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-[#6E6659] transition-colors hover:bg-[#F3EFE3]"
                        >
                          <MapPin size={16} strokeWidth={1.6} />
                          Meus endereços
                          <ChevronRight
                            size={14}
                            className="ml-auto text-[#B5A77F]"
                          />
                        </Link>

                        <Link
                          to="/historico-compras"
                          onClick={fecharConta}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-[#6E6659] transition-colors hover:bg-[#F3EFE3]"
                        >
                          <Clock3 size={16} strokeWidth={1.6} />
                          Histórico de compras
                          <ChevronRight
                            size={14}
                            className="ml-auto text-[#B5A77F]"
                          />
                        </Link>

                        <Link
                          to="/configuracoes"
                          onClick={fecharConta}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-[#6E6659] transition-colors hover:bg-[#F3EFE3]"
                        >
                          <Settings size={16} strokeWidth={1.6} />
                          Configurações
                          <ChevronRight
                            size={14}
                            className="ml-auto text-[#B5A77F]"
                          />
                        </Link>

                        {usuario.tipo === "ADMIN" && (
                          <Link
                            to="/admin"
                            onClick={fecharConta}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-[#968052] transition-colors hover:bg-[#F3EFE3]"
                          >
                            <Settings size={16} strokeWidth={1.6} />
                            Painel administrativo
                            <ChevronRight
                              size={14}
                              className="ml-auto"
                            />
                          </Link>
                        )}
                      </nav>

                      {/* Sair */}
                      <div className="border-t border-[#E7E0CE] pt-1">
                        <button
                          type="button"
                          onClick={handleSair}
                          disabled={saindo}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-[#9B5146] transition-colors hover:bg-[#F7EBE7] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <LogOut size={16} strokeWidth={1.6} />
                          {saindo ? "Saindo..." : "Sair da conta"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Visitante */}
                      <div className="border-b border-[#E7E0CE] px-3 py-3">
                        <p className="text-sm font-semibold text-[#292319]">
                          Bem-vindo à AURORA
                        </p>

                        <p className="mt-1 text-[11px] leading-relaxed text-[#8A8172]">
                          Entre na sua conta para acompanhar seus pedidos
                          e favoritos.
                        </p>
                      </div>

                      <div className="space-y-1 p-1 pt-2">
                        <Link
                          to="/login"
                          onClick={fecharConta}
                          className="flex w-full items-center gap-3 rounded-lg bg-[#211C14] px-3 py-2.5 text-xs text-[#FAF9F5] transition-colors hover:bg-[#40372A]"
                        >
                          <LogIn size={16} />
                          Entrar na conta
                        </Link>

                        <Link
                          to="/login?modo=cadastro"
                          onClick={fecharConta}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-[#6E6659] transition-colors hover:bg-[#F3EFE3]"
                        >
                          <UserPlus size={16} />
                          Criar uma conta
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Sacola */}
            <Link
              to="/sacola"
              className="flex h-10 items-center justify-center gap-2 rounded-full bg-[#211C14] px-3 text-sm text-white transition-colors hover:bg-[#40372A] sm:h-12 sm:px-5"
            >
              <ShoppingBag size={19} />
              <span className="hidden sm:inline">Sacola</span>
            </Link>

            {/* Menu mobile */}
            <button
              type="button"
              onClick={() => setMenuAberto((atual) => !atual)}
              aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuAberto}
              className="flex h-10 w-10 items-center justify-center md:hidden"
            >
              {menuAberto ? <X size={25} /> : <Menu size={25} />}
            </button>
          </div>
        </div>

        {/* Pesquisa mobile */}
        <form
          onSubmit={handleSearch}
          role="search"
          className="mb-5 flex items-center rounded-full border border-[#E7E0CE] bg-[#F3EFE3] px-4 py-3 transition-colors focus-within:border-[#B5A77F] md:hidden"
        >
          <Search
            size={20}
            className="shrink-0 text-[#6F6049]"
          />

          <input
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar joias..."
            aria-label="Pesquisar produtos"
            className="ml-3 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#918879]"
          />

          <button
            type="submit"
            aria-label="Buscar produtos"
            className="ml-2 rounded-full p-1 text-[#211C14] transition-opacity hover:opacity-60"
          >
            <Search size={19} />
          </button>
        </form>

        {/* Navegação desktop */}
        <nav className="hidden items-center justify-center gap-8 pb-5 md:flex lg:gap-11">
          {categorias.map((categoria) => (
            <button
              key={categoria}
              type="button"
              onClick={() => abrirCategoria(categoria)}
              className="relative whitespace-nowrap text-base transition-colors duration-300 hover:text-[#968052] after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:origin-center after:scale-x-0 after:bg-[#B9975B] after:transition-transform after:duration-300 hover:after:scale-x-100"
            >
              {categoria}
            </button>
          ))}
        </nav>

        {/* Navegação mobile */}
        {menuAberto && (
          <nav className="flex flex-col border-t border-[#E7E0CE] py-3 md:hidden">
            {categorias.map((categoria) => (
              <button
                key={categoria}
                type="button"
                onClick={() => abrirCategoria(categoria)}
                className="border-b border-[#E7E0CE]/70 px-2 py-3 text-left text-sm transition-colors hover:bg-[#F3EFE3]"
              >
                {categoria}
              </button>
            ))}

            <Link
              to="/minha-conta"
              onClick={() => setMenuAberto(false)}
              className="px-2 py-3 text-sm"
            >
              Minha conta
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
