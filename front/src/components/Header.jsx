
import { useEffect, useRef, useState } from "react";
import {
    Link,
    useLocation,
    useNavigate,
    useSearchParams,
} from "react-router-dom";
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
import { apiFetch } from "../services/api.js";

const LIMITE_CATEGORIAS = 6;

const imagemLogo = "A";

function extrairLista(resultado, chave) {
    if (Array.isArray(resultado)) return resultado;
    if (Array.isArray(resultado?.[chave])) return resultado[chave];
    if (Array.isArray(resultado?.dados)) return resultado.dados;

    return [];
}

function gerarSlugCategoria(nome = "") {
    return String(nome)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

export default function Header() {
    const [busca, setBusca] = useState("");
    const [categorias, setCategorias] = useState([]);
    const [menuAberto, setMenuAberto] = useState(false);
    const [contaAberta, setContaAberta] = useState(false);
    const [notificacoesAbertas, setNotificacoesAbertas] =
        useState(false);
    const [saindo, setSaindo] = useState(false);
    const [erroCategorias, setErroCategorias] = useState(false);

    const { usuario, sair } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const contaRef = useRef(null);
    const notificacoesRef = useRef(null);

    // Carrega as categorias cadastradas no banco pela API.
    useEffect(() => {
        let ativo = true;

        async function carregarCategorias() {
            try {
                setErroCategorias(false);

                const resultado = await apiFetch("/categorias");
                const lista = extrairLista(resultado, "categorias");

                if (!ativo) return;

                const categoriasAtivas = lista
                    .filter(
                        (categoria) =>
                            categoria.ativo !== false &&
                            categoria.nome
                    )
                    .map((categoria) => ({
                        ...categoria,
                        slug:
                            categoria.slug ||
                            gerarSlugCategoria(categoria.nome),
                    }))
                    .filter((categoria) => categoria.slug);

                // Evita categorias duplicadas pelo slug.
                const categoriasUnicas = [
                    ...new Map(
                        categoriasAtivas.map((categoria) => [
                            categoria.slug,
                            categoria,
                        ])
                    ).values(),
                ];

                // São exibidas até 6 categorias, além do link Produtos.
                setCategorias(
                    categoriasUnicas.slice(0, LIMITE_CATEGORIAS)
                );
            } catch (error) {
                console.error(
                    "Não foi possível carregar as categorias:",
                    error
                );

                if (ativo) {
                    setCategorias([]);
                    setErroCategorias(true);
                }
            }
        }

        carregarCategorias();

        return () => {
            ativo = false;
        };
    }, []);

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

    // Fecha o menu mobile e dropdowns ao navegar.
    useEffect(() => {
        setMenuAberto(false);
        setContaAberta(false);
        setNotificacoesAbertas(false);
    }, [location.pathname, location.search]);

    function handleSearch(event) {
        event.preventDefault();

        const termo = busca.trim();

        if (!termo) return;

        setMenuAberto(false);

        navigate(
            `/produtos?busca=${encodeURIComponent(termo)}`
        );
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

    // Link Produtos: abre a listagem completa, sem filtros.
    function abrirProdutos() {
        setMenuAberto(false);
        navigate("/produtos");
    }

    // As demais opções abrem a listagem filtrada pela categoria.
    function abrirCategoria(categoria) {
        const slug =
            categoria.slug ||
            gerarSlugCategoria(categoria.nome);

        setMenuAberto(false);

        navigate(
            `/produtos?categoria=${encodeURIComponent(slug)}`
        );
    }

    function categoriaEstaAtiva(categoria) {
        if (location.pathname !== "/produtos") {
            return false;
        }

        const categoriaSelecionada =
            searchParams.get("categoria") || "";

        if (!categoriaSelecionada) return false;

        return (
            gerarSlugCategoria(categoriaSelecionada) ===
            gerarSlugCategoria(
                categoria.slug || categoria.nome
            )
        );
    }

    // Produtos fica ativo quando não existe filtro de categoria.
    const produtosAtivo =
        location.pathname === "/produtos" &&
        !searchParams.has("categoria");

    function classesCategoria(ativa) {
        return `relative whitespace-nowrap py-1 text-sm transition-colors duration-300
            ${
                ativa
                    ? "font-medium text-[#968052] after:scale-x-100"
                    : "text-[#211C14] after:scale-x-0 hover:text-[#968052] hover:after:scale-x-100"
            }
            after:absolute after:-bottom-1 after:left-0 after:h-[2px]
            after:w-full after:origin-center after:bg-[#B9975B]
            after:transition-transform after:duration-300`;
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
                        <Link
                            to="/lojas"
                            className="transition-opacity hover:opacity-70"
                        >
                            Nossas lojas
                        </Link>

                        <Link
                            to="/ajuda"
                            className="transition-opacity hover:opacity-70"
                        >
                            Ajuda
                        </Link>

                        <Link
                            to="/vender"
                            className="transition-opacity hover:opacity-70"
                        >
                            Torne-se um afiliado
                        </Link>
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
                            {imagemLogo}
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
                            onChange={(event) =>
                                setBusca(event.target.value)
                            }
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
                        <Link
                            to="/favoritos"
                            aria-label="Favoritos"
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E7E0CE] transition-colors hover:bg-[#F3EFE3] sm:h-12 sm:w-12"
                        >
                            <Heart size={21} strokeWidth={1.8} />
                        </Link>

                        {/* Notificações */}
                        {usuario && (
                            <div
                                ref={notificacoesRef}
                                className="relative"
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNotificacoesAbertas(
                                            (aberta) => !aberta
                                        );
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
                                                Quando houver novidades,
                                                elas aparecerão aqui.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Conta */}
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

                                {usuario && (
                                    <span className="absolute bottom-[5px] right-[5px] h-2 w-2 rounded-full bg-[#B9975B]" />
                                )}
                            </button>

                            {contaAberta && (
                                <div className="absolute right-0 top-full z-50 mt-3 w-[min(288px,calc(100vw-40px))] rounded-2xl border border-[#E7E0CE] bg-[#FAF9F5] p-2 shadow-xl">
                                    {usuario ? (
                                        <>
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

                                            <nav className="py-1">
                                                {[
                                                    {
                                                        to: "/minha-conta",
                                                        texto: "Minha conta",
                                                        Icone: User,
                                                    },
                                                    {
                                                        to: "/meus-pedidos",
                                                        texto: "Meus pedidos",
                                                        Icone: Package,
                                                    },
                                                    {
                                                        to: "/favoritos",
                                                        texto: "Meus favoritos",
                                                        Icone: Heart,
                                                    },
                                                    {
                                                        to: "/meus-enderecos",
                                                        texto: "Meus endereços",
                                                        Icone: MapPin,
                                                    },
                                                    {
                                                        to: "/historico-compras",
                                                        texto: "Histórico de compras",
                                                        Icone: Clock3,
                                                    },
                                                    {
                                                        to: "/configuracoes",
                                                        texto: "Configurações",
                                                        Icone: Settings,
                                                    },
                                                ].map(({ to, texto, Icone }) => (
                                                    <Link
                                                        key={to}
                                                        to={to}
                                                        onClick={fecharConta}
                                                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-[#6E6659] transition-colors hover:bg-[#F3EFE3]"
                                                    >
                                                        <Icone
                                                            size={16}
                                                            strokeWidth={1.6}
                                                        />
                                                        {texto}
                                                        <ChevronRight
                                                            size={14}
                                                            className="ml-auto text-[#B5A77F]"
                                                        />
                                                    </Link>
                                                ))}

                                                {usuario.tipo === "ADMIN" && (
                                                    <Link
                                                        to="/admin"
                                                        onClick={fecharConta}
                                                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-[#968052] transition-colors hover:bg-[#F3EFE3]"
                                                    >
                                                        <Settings size={16} />
                                                        Painel administrativo
                                                        <ChevronRight
                                                            size={14}
                                                            className="ml-auto"
                                                        />
                                                    </Link>
                                                )}
                                            </nav>

                                            <div className="border-t border-[#E7E0CE] pt-1">
                                                <button
                                                    type="button"
                                                    onClick={handleSair}
                                                    disabled={saindo}
                                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-[#9B5146] transition-colors hover:bg-[#F7EBE7] disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <LogOut size={16} />
                                                    {saindo
                                                        ? "Saindo..."
                                                        : "Sair da conta"}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="border-b border-[#E7E0CE] px-3 py-3">
                                                <p className="text-sm font-semibold text-[#292319]">
                                                    Bem-vindo à AURORA
                                                </p>
                                                <p className="mt-1 text-[11px] leading-relaxed text-[#8A8172]">
                                                    Entre na sua conta para
                                                    acompanhar seus pedidos e
                                                    favoritos.
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
                            <span className="hidden sm:inline">
                                Sacola
                            </span>
                        </Link>

                        {/* Menu mobile */}
                        <button
                            type="button"
                            onClick={() =>
                                setMenuAberto((atual) => !atual)
                            }
                            aria-label={
                                menuAberto
                                    ? "Fechar menu"
                                    : "Abrir menu"
                            }
                            aria-expanded={menuAberto}
                            className="flex h-10 w-10 items-center justify-center md:hidden"
                        >
                            {menuAberto ? (
                                <X size={25} />
                            ) : (
                                <Menu size={25} />
                            )}
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
                        onChange={(event) =>
                            setBusca(event.target.value)
                        }
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
                <nav
                    aria-label="Navegação de produtos"
                    className="hidden items-center justify-center gap-6 overflow-x-auto pb-5 md:flex lg:gap-11"
                >
                    {/* Primeiro link: Produtos */}
                    <button
                        type="button"
                        onClick={abrirProdutos}
                        aria-current={produtosAtivo ? "page" : undefined}
                        className={classesCategoria(produtosAtivo)}
                    >
                        Produtos
                    </button>

                    {/* Categorias reais carregadas pela API */}
                    {categorias.map((categoria) => (
                        <button
                            key={categoria.slug}
                            type="button"
                            onClick={() => abrirCategoria(categoria)}
                            aria-current={
                                categoriaEstaAtiva(categoria)
                                    ? "page"
                                    : undefined
                            }
                            className={classesCategoria(
                                categoriaEstaAtiva(categoria)
                            )}
                        >
                            {categoria.nome}
                        </button>
                    ))}

                    {erroCategorias && (
                        <span className="text-xs text-[#8A8172]">
                            Não foi possível carregar as categorias.
                        </span>
                    )}
                </nav>

                {/* Navegação mobile */}
                {menuAberto && (
                    <nav
                        aria-label="Navegação de produtos"
                        className="flex flex-col border-t border-[#E7E0CE] py-3 md:hidden"
                    >
                        {/* Primeiro link: Produtos */}
                        <button
                            type="button"
                            onClick={abrirProdutos}
                            aria-current={produtosAtivo ? "page" : undefined}
                            className={`relative border-b border-[#E7E0CE]/70 px-2 py-3 text-left text-sm transition-colors ${
                                produtosAtivo
                                    ? "font-medium text-[#968052]"
                                    : "text-[#211C14] hover:bg-[#F3EFE3]"
                            }`}
                        >
                            Produtos

                            {produtosAtivo && (
                                <span className="absolute bottom-0 left-2 h-[2px] w-12 bg-[#B9975B]" />
                            )}
                        </button>

                        {/* Categorias reais carregadas pela API */}
                        {categorias.map((categoria) => {
                            const ativa = categoriaEstaAtiva(categoria);

                            return (
                                <button
                                    key={categoria.slug}
                                    type="button"
                                    onClick={() =>
                                        abrirCategoria(categoria)
                                    }
                                    aria-current={
                                        ativa ? "page" : undefined
                                    }
                                    className={`relative border-b border-[#E7E0CE]/70 px-2 py-3 text-left text-sm transition-colors ${
                                        ativa
                                            ? "font-medium text-[#968052]"
                                            : "text-[#211C14] hover:bg-[#F3EFE3]"
                                    }`}
                                >
                                    {categoria.nome}

                                    {ativa && (
                                        <span className="absolute bottom-0 left-2 h-[2px] w-12 bg-[#B9975B]" />
                                    )}
                                </button>
                            );
                        })}

                        {erroCategorias && (
                            <p className="px-2 py-3 text-xs text-[#8A8172]">
                                Não foi possível carregar as categorias.
                            </p>
                        )}

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
