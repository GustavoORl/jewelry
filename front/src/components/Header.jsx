
import { useState } from "react";
import {
    Search,
    Heart,
    UserRound,
    ShoppingBag,
    Menu,
    X,
} from "lucide-react";

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


    function handleSearch(e) {
        e.preventDefault();

        if (!busca.trim()) return;

        console.log("Pesquisar:", busca);
        // Aqui você pode integrar a pesquisa ao catálogo.
    }

    return (
        <header className="w-full bg-[#FAF9F5] text-[#211C14]">
            <div className="bg-[#211C14] px-5 py-3 text-[#F5F0E6]">
                <div className="mx-auto flex max-w-[1320px] px-5 items-center justify-between">
                    <p className="text-[10px] tracking-[0.2em] sm:text-xs sm:tracking-[0.25em]">
                        FRETE GRÁTIS ACIMA DE R$ 299 · TROCA EM ATÉ 30 DIAS
                    </p>

                    <div className="hidden items-center gap-8 text-sm md:flex">
                        <a href="/lojas" className="transition-opacity hover:opacity-70">
                            Nossas lojas
                        </a>
                        <a href="/ajuda" className="transition-opacity hover:opacity-70">
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
            <div className="mx-auto max-w-[1320px] sm:px-8 lg:px-12">
                <div className="flex min-h-[112px] items-center justify-between gap-5 py-5">
                    {/* Logo */}
                    <a
                        href="/"
                        className="flex shrink-0 items-center gap-3"
                        aria-label="Aurora - página inicial"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#211C14] text-2xl font-serif text-[#FAF9F5]">
                            A
                        </div>

                        <div className="hidden sm:block">
                            <h1 className="font-serif text-2xl text-[#211c14] leading-none tracking-tight">
                                AURORA
                            </h1>
                            <p className="text-[10px] tracking-[0.34em] text-[#8A8172]">
                                MARKETPLACE DE JOIAS
                            </p>
                        </div>
                    </a>

                    {/* Pesquisa desktop */}
                    <form
                        onSubmit={handleSearch}
                        className="hidden max-w-[680px] flex-1 items-center rounded-full border border-[#E7E0CE] bg-[#F3EFE3] px-6 py-4 transition-colors focus-within:border-[#B5A77F] md:flex"
                    >
                        <input
                            type="search"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Buscar por colar, brinco, ouro 18k..."
                            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#918879]"
                            aria-label="Pesquisar produtos"
                        />

                        <button
                            type="submit"
                            className="ml-4 flex shrink-0 items-center gap-3 font-medium transition-opacity hover:opacity-60"
                        >
                            <Search size={25} strokeWidth={1.8} />
                            <span>Buscar</span>
                        </button>
                    </form>

                    {/* Ações */}
                    <div className="flex shrink-0 items-center gap-3 sm:gap-4">
                        <a
                            href="/favoritos"
                            aria-label="Favoritos"
                            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#E7E0CE] transition-colors hover:bg-[#F3EFE3]"
                        >
                            <Heart size={23} strokeWidth={2} />
                        </a>

                        <a
                            href="/minha-conta"
                            aria-label="Minha conta"
                            className="hidden h-12 w-12 items-center justify-center rounded-full border border-[#E7E0CE] transition-colors hover:bg-[#F3EFE3] sm:flex"
                        >
                            <UserRound size={23} strokeWidth={2} />
                        </a>

                        <a
                            href="/sacola"
                            className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#211C14] px-4 text-sm text-white transition-colors hover:bg-[#40372A] sm:px-5"
                        >
                            <ShoppingBag size={21} />
                            <span className="hidden sm:inline">Sacola (2)</span>
                        </a>

                        {/* Menu mobile */}
                        <button
                            type="button"
                            onClick={() => setMenuAberto(!menuAberto)}
                            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
                            aria-expanded={menuAberto}
                            className="flex h-11 w-11 items-center justify-center md:hidden"
                        >
                            {menuAberto ? <X size={25} /> : <Menu size={25} />}
                        </button>
                    </div>
                </div>

                {/* Pesquisa mobile */}
                <form
                    onSubmit={handleSearch}
                    className="mb-5 flex items-center rounded-full border border-[#E7E0CE] bg-[#F3EFE3] px-4 py-3 md:hidden"
                >
                    <Search size={21} className="shrink-0" />

                    <input
                        type="search"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar joias..."
                        aria-label="Pesquisar produtos"
                        className="ml-3 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#918879]"
                    />

                    <button type="submit" className="ml-2 text-sm font-medium">
                        Buscar
                    </button>
                </form>

                {/* Navegação desktop */}
                <nav className="hidden items-center justify-center gap-8 pb-5 lg:gap-11 md:flex">
                    {categorias.map((categoria) => (
                        <a
                            key={categoria}
                            href={`/categoria/${encodeURIComponent(
                                categoria.toLowerCase()
                            )}`}
                            className={`relative whitespace-nowrap text-base transition-colors duration-300 hover:text-[#968052] after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:origin-center after:scale-x-0 after:bg-[#b9975b]  after:transition-transform after:duration-300 hover:after:scale-x-100`}
                        >
                            {categoria}
                        </a>
                    ))}
                </nav>

                {/* Navegação mobile */}
                {menuAberto && (
                    <nav className="flex flex-col border-t border-[#E7E0CE] py-3 md:hidden">
                        {categorias.map((categoria) => (
                            <a
                                key={categoria}
                                href={`/categoria/${encodeURIComponent(
                                    categoria.toLowerCase()
                                )}`}
                                className="border-b border-[#E7E0CE]/70 px-2 py-3 text-sm transition-colors hover:bg-[#F3EFE3]"
                            >
                                {categoria}
                            </a>
                        ))}

                        <a href="/minha-conta" className="px-2 py-3 text-sm">
                            Minha conta
                        </a>
                    </nav>
                )}
            </div>
        </header>
    );
}