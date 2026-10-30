
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
    ArrowDownUp,
    Heart,
    Search,
    ShoppingBag,
    SlidersHorizontal,
    X,
} from "lucide-react";

import { apiFetch } from "../services/api.js";

const imagemPadrao =
    "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=600&q=80";

function normalizarNome(nome = "") {
    const normalizado = String(nome)
        .trim()
        .toLocaleLowerCase("pt-BR")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const equivalencias = {
        perolas: "perola",
        zirconias: "zirconia",
    };

    return equivalencias[normalizado] || normalizado;
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

function formatarPreco(valor) {
    const preco = Number(valor);

    if (!Number.isFinite(preco)) {
        return "R$ 0,00";
    }

    return preco.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function normalizarProduto(produto) {
    const imagens = Array.isArray(produto.imagens)
        ? produto.imagens
        : [];

    const materiais = Array.isArray(produto.materiais)
        ? produto.materiais
            .map((item) => item.material || item)
            .filter((item) => item?.nome)
        : [];

    return {
        ...produto,
        imagem:
            imagens.find((item) => item?.url)?.url ||
            produto.imagem ||
            produto.imagemUrl ||
            imagemPadrao,
        categoriaNome:
            typeof produto.categoria === "string"
                ? produto.categoria
                : produto.categoria?.nome || "",
        materiais,
        marca: produto.marca || "AURELIA",
        avaliacoes: produto.avaliacoes ?? 0,
        ativo: produto.ativo !== false,
    };
}

function extrairLista(resultado, chave) {
    if (Array.isArray(resultado)) return resultado;
    if (Array.isArray(resultado?.[chave])) return resultado[chave];
    if (Array.isArray(resultado?.dados)) return resultado.dados;

    return [];
}

function CardProduto({
    produto,
    favorito,
    aoAlternarFavorito,
    aoAdicionarSacola,
    processandoFavorito,
    processandoSacola,
}) {
    return (
        <article className="group overflow-hidden rounded-2xl border border-[#EAE0CE] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#211C14]/5">
            <div className="relative aspect-[4/4.5] overflow-hidden bg-[#F7F2E8]">
                <Link
                    to={`/produtos/${produto.id}`}
                    aria-label={`Ver ${produto.nome}`}
                    className="block h-full w-full"
                >
                    <img
                        src={produto.imagem}
                        alt={produto.nome}
                        loading="lazy"
                        onError={(event) => {
                            if (event.currentTarget.src !== imagemPadrao) {
                                event.currentTarget.src = imagemPadrao;
                            }
                        }}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                </Link>

                {produto.desconto && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-medium text-[#211C14]">
                        {produto.desconto}
                    </span>
                )}

                <button
                    type="button"
                    onClick={() => aoAlternarFavorito(produto.id)}
                    disabled={processandoFavorito}
                    aria-label={
                        favorito
                            ? "Remover dos favoritos"
                            : "Adicionar aos favoritos"
                    }
                    aria-pressed={favorito}
                    className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border bg-white/95 transition-colors disabled:cursor-wait disabled:opacity-50 ${
                        favorito
                            ? "border-[#B9975B] text-[#A47B43]"
                            : "border-[#E8DDCA] text-[#211C14] hover:border-[#B9975B]"
                    }`}
                >
                    <Heart
                        size={18}
                        fill={favorito ? "currentColor" : "none"}
                    />
                </button>
            </div>

            <div className="p-4 sm:p-5">
                <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.2em] text-[#9B805D]">
                    {produto.marca}
                </p>

                <Link
                    to={`/produtos/${produto.id}`}
                    className="line-clamp-2 min-h-10 text-sm font-medium text-[#211C14] transition-colors hover:text-[#9B805D]"
                >
                    {produto.nome}
                </Link>

                {produto.categoriaNome && (
                    <p className="mt-1 text-xs text-[#958777]">
                        {produto.categoriaNome}
                    </p>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-base font-semibold text-[#211C14]">
                        {formatarPreco(produto.preco)}
                    </span>

                    <button
                        type="button"
                        onClick={() => aoAdicionarSacola(produto.id)}
                        disabled={processandoSacola}
                        aria-label={`Adicionar ${produto.nome} à sacola`}
                        className="inline-flex items-center gap-2 rounded-full bg-[#211C14] px-3.5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-[#4A3D2B] active:scale-95 disabled:cursor-wait disabled:opacity-50"
                    >
                        <ShoppingBag size={14} />
                        {processandoSacola
                            ? "Adicionando..."
                            : "Adicionar"}
                    </button>
                </div>
            </div>
        </article>
    );
}

export default function ListagemProdutos() {
    const [searchParams, setSearchParams] = useSearchParams();

    const buscaUrl = searchParams.get("busca") || "";
    const categoriaUrl = searchParams.get("categoria") || "";

    const [produtos, setProdutos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [materiais, setMateriais] = useState([]);

    const [busca, setBusca] = useState(buscaUrl);
    const [categoriaAtiva, setCategoriaAtiva] = useState("Todas");
    const [materialAtivo, setMaterialAtivo] = useState("Todos");
    const [ordenacao, setOrdenacao] = useState("recentes");

    const [favoritos, setFavoritos] = useState([]);
    const [sacola, setSacola] = useState([]);

    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    const [processandoFavoritos, setProcessandoFavoritos] = useState([]);
    const [processandoSacola, setProcessandoSacola] = useState([]);
    const [mensagem, setMensagem] = useState("");

    // IMPORTANTE:
    // As categorias e os materiais disponíveis são calculados
    // antes de qualquer efeito que dependa deles.

    const categoriasDisponiveis = useMemo(() => {
        const nomes = [
            ...categorias.map((categoria) => categoria.nome),
            ...produtos.map((produto) => produto.categoriaNome),
        ].filter(Boolean);

        return [...new Set(nomes)].sort((a, b) =>
            a.localeCompare(b, "pt-BR")
        );
    }, [categorias, produtos]);

    const materiaisDisponiveis = useMemo(() => {
        const nomes = [
            ...materiais.map((material) => material.nome),
            ...produtos.flatMap((produto) =>
                produto.materiais.map((material) => material.nome)
            ),
        ].filter(Boolean);

        return [...new Set(nomes)].sort((a, b) =>
            a.localeCompare(b, "pt-BR")
        );
    }, [materiais, produtos]);

    // Carregar produtos, categorias e materiais.

    const carregarDados = useCallback(async () => {
        try {
            setCarregando(true);
            setErro("");

            const [
                resultadoProdutos,
                resultadoCategorias,
                resultadoMateriais,
            ] = await Promise.all([
                apiFetch("/produtos"),
                apiFetch("/categorias"),
                apiFetch("/materiais"),
            ]);

            const listaProdutos = extrairLista(
                resultadoProdutos,
                "produtos"
            );

            const listaCategorias = extrairLista(
                resultadoCategorias,
                "categorias"
            );

            const listaMateriais = extrairLista(
                resultadoMateriais,
                "materiais"
            );

            setProdutos(
                listaProdutos
                    .filter((produto) => produto.ativo !== false)
                    .map(normalizarProduto)
            );

            setCategorias(
                listaCategorias.filter(
                    (categoria) => categoria.ativo !== false
                )
            );

            setMateriais(
                listaMateriais.filter(
                    (material) => material.ativo !== false
                )
            );
        } catch (error) {
            setErro(
                error.message ||
                "Não foi possível carregar o catálogo."
            );
        } finally {
            setCarregando(false);
        }
    }, []);

    // Carregar favoritos do usuário autenticado.

    const carregarFavoritos = useCallback(async () => {
        try {
            const resultado = await apiFetch("/favoritos");

            const lista = extrairLista(resultado, "favoritos");

            setFavoritos(
                lista
                    .map((item) => item.produtoId || item.produto?.id)
                    .filter(Boolean)
            );
        } catch (error) {
            if (error.status === 401 || error.status === 403) {
                setFavoritos([]);
                return;
            }

            console.error("Erro ao carregar favoritos:", error);
        }
    }, []);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    useEffect(() => {
        carregarFavoritos();
    }, [carregarFavoritos]);

    // Sincronizar busca com a URL.

    useEffect(() => {
        setBusca(buscaUrl);
    }, [buscaUrl]);

    // Selecionar categoria informada na URL.

    useEffect(() => {
        if (!categoriaUrl) {
            setCategoriaAtiva("Todas");
            return;
        }

        const slugUrl = gerarSlugCategoria(categoriaUrl);

        const categoriaEncontrada = categorias.find((categoria) => {
            const slugCategoria = gerarSlugCategoria(
                categoria.slug || categoria.nome || ""
            );

            return slugCategoria === slugUrl;
        });

        if (categoriaEncontrada) {
            setCategoriaAtiva(categoriaEncontrada.nome);
            return;
        }

        const categoriaPorNome = categoriasDisponiveis.find(
            (nome) =>
                normalizarNome(nome) === normalizarNome(categoriaUrl)
        );

        setCategoriaAtiva(categoriaPorNome || "Todas");
    }, [categoriaUrl, categorias, categoriasDisponiveis]);

    // Alternar favorito.

    async function alternarFavorito(produtoId) {
        if (processandoFavoritos.includes(produtoId)) return;

        setProcessandoFavoritos((atuais) => [
            ...atuais,
            produtoId,
        ]);

        setMensagem("");

        try {
            if (favoritos.includes(produtoId)) {
                await apiFetch(`/favoritos/${produtoId}`, {
                    method: "DELETE",
                });

                setFavoritos((atuais) =>
                    atuais.filter((id) => id !== produtoId)
                );

                setMensagem("Produto removido dos favoritos.");
            } else {
                await apiFetch(`/favoritos/${produtoId}`, {
                    method: "POST",
                });

                setFavoritos((atuais) =>
                    atuais.includes(produtoId)
                        ? atuais
                        : [...atuais, produtoId]
                );

                setMensagem("Produto adicionado aos favoritos.");
            }
        } catch (error) {
            setMensagem(
                error.status === 401 || error.status === 403
                    ? "Entre na sua conta para favoritar produtos."
                    : error.message ||
                        "Não foi possível atualizar seus favoritos."
            );
        } finally {
            setProcessandoFavoritos((atuais) =>
                atuais.filter((id) => id !== produtoId)
            );
        }
    }

    // Adicionar produto à sacola.

    async function adicionarSacola(produtoId) {
        if (processandoSacola.includes(produtoId)) return;

        setProcessandoSacola((atuais) => [
            ...atuais,
            produtoId,
        ]);

        setMensagem("");

        try {
            await apiFetch("/sacola/itens", {
                method: "POST",
                body: JSON.stringify({
                    produtoId,
                    quantidade: 1,
                }),
            });

            setSacola((atuais) => [...atuais, produtoId]);

            setMensagem("Produto adicionado à sacola!");
        } catch (error) {
            setMensagem(
                error.status === 401 || error.status === 403
                    ? "Entre na sua conta para adicionar produtos à sacola."
                    : error.message ||
                        "Não foi possível adicionar o produto à sacola."
            );
        } finally {
            setProcessandoSacola((atuais) =>
                atuais.filter((id) => id !== produtoId)
            );
        }
    }

    // Filtrar e ordenar produtos.

    const produtosFiltrados = useMemo(() => {
        const resultado = produtos.filter((produto) => {
            const nomeProduto = (produto.nome || "")
                .toLocaleLowerCase("pt-BR");

            const termoBusca = busca
                .trim()
                .toLocaleLowerCase("pt-BR");

            const correspondeBusca =
                nomeProduto.includes(termoBusca);

            const correspondeCategoria =
                categoriaAtiva === "Todas" ||
                normalizarNome(produto.categoriaNome) ===
                    normalizarNome(categoriaAtiva);

            const correspondeMaterial =
                materialAtivo === "Todos" ||
                produto.materiais.some(
                    (material) =>
                        normalizarNome(material.nome) ===
                        normalizarNome(materialAtivo)
                );

            return (
                correspondeBusca &&
                correspondeCategoria &&
                correspondeMaterial
            );
        });

        switch (ordenacao) {
            case "menor-preco":
                resultado.sort(
                    (a, b) => Number(a.preco) - Number(b.preco)
                );
                break;

            case "maior-preco":
                resultado.sort(
                    (a, b) => Number(b.preco) - Number(a.preco)
                );
                break;

            case "nome":
                resultado.sort((a, b) =>
                    (a.nome || "").localeCompare(
                        b.nome || "",
                        "pt-BR"
                    )
                );
                break;

            case "recentes":
            default:
                resultado.sort((a, b) => {
                    const dataA = new Date(
                        a.createdAt || a.criadoEm || 0
                    ).getTime();

                    const dataB = new Date(
                        b.createdAt || b.criadoEm || 0
                    ).getTime();

                    return dataB - dataA;
                });
                break;
        }

        return resultado;
    }, [
        produtos,
        busca,
        categoriaAtiva,
        materialAtivo,
        ordenacao,
    ]);

    function selecionarCategoria(categoria) {
        setCategoriaAtiva(categoria);

        const novosParametros = new URLSearchParams(searchParams);

        if (categoria === "Todas") {
            novosParametros.delete("categoria");
        } else {
            const categoriaEncontrada = categorias.find(
                (item) =>
                    normalizarNome(item.nome) ===
                    normalizarNome(categoria)
            );

            novosParametros.set(
                "categoria",
                categoriaEncontrada?.slug ||
                    gerarSlugCategoria(categoria)
            );
        }

        setSearchParams(novosParametros, { replace: true });
    }

    function limparFiltros() {
        setBusca("");
        setCategoriaAtiva("Todas");
        setMaterialAtivo("Todos");
        setOrdenacao("recentes");

        const novosParametros = new URLSearchParams(searchParams);

        novosParametros.delete("busca");
        novosParametros.delete("categoria");

        setSearchParams(novosParametros, { replace: true });
    }

    const possuiFiltros =
        busca.trim() !== "" ||
        categoriaAtiva !== "Todas" ||
        materialAtivo !== "Todos";

    return (
        <main className="min-h-screen bg-[#FCFAF6] text-[#211C14]">
            {/* Cabeçalho editorial */}

            <section className="border-b border-[#EAE0CE] bg-[#F7F2E8] px-5 py-2 sm:px-8 lg:px-12">
                <div className="mx-auto flex max-w-[1320px] items-center justify-between">
                    <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#A47B43]">
                        AURELIA · Nossa coleção
                    </p>

                    <div className="text-sm text-[#847A6C]">
                        {carregando
                            ? "Carregando coleção..."
                            : `${produtosFiltrados.length} ${
                                produtosFiltrados.length === 1
                                    ? "peça encontrada"
                                    : "peças encontradas"
                            }`}
                    </div>
                </div>
            </section>

            {/* Mensagem de feedback */}

            {mensagem && (
                <div
                    role="status"
                    aria-live="polite"
                    className="fixed right-5 top-5 z-50 max-w-[calc(100%-40px)] rounded-xl border border-[#EAE0CE] bg-white px-5 py-4 text-sm text-[#211C14] shadow-lg"
                >
                    <div className="flex items-center gap-3">
                        <span className="flex-1">{mensagem}</span>

                        <button
                            type="button"
                            onClick={() => setMensagem("")}
                            aria-label="Fechar mensagem"
                            className="text-[#847A6C] hover:text-[#211C14]"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Catálogo */}

            <section className="px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
                <div className="mx-auto max-w-[1320px]">
                    {/* Ordenação */}

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={() =>
                                    setMostrarFiltros((atual) => !atual)
                                }
                                aria-expanded={mostrarFiltros}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E8DDCA] px-5 py-3 text-sm transition-colors hover:border-[#B9975B] lg:hidden"
                            >
                                <SlidersHorizontal size={16} />
                                Filtros
                            </button>

                            <label className="flex items-center gap-3 rounded-full border border-[#E8DDCA] bg-white px-4 py-2.5">
                                <ArrowDownUp
                                    size={16}
                                    className="shrink-0 text-[#968052]"
                                />

                                <span className="whitespace-nowrap text-xs text-[#847A6C]">
                                    Ordenar:
                                </span>

                                <select
                                    value={ordenacao}
                                    onChange={(event) =>
                                        setOrdenacao(event.target.value)
                                    }
                                    aria-label="Ordenar produtos"
                                    className="min-w-0 bg-transparent text-xs outline-none"
                                >
                                    <option value="recentes">
                                        Mais recentes
                                    </option>
                                    <option value="menor-preco">
                                        Menor preço
                                    </option>
                                    <option value="maior-preco">
                                        Maior preço
                                    </option>
                                    <option value="nome">
                                        Nome A–Z
                                    </option>
                                </select>
                            </label>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
                        {/* Barra lateral de filtros */}

                        <aside
                            className={`${
                                mostrarFiltros ? "block" : "hidden"
                            } lg:block`}
                        >
                            <div className="rounded-2xl border border-[#EAE0CE] bg-white p-5">
                                <div className="mb-5 flex items-center justify-between">
                                    <h2 className="font-serif text-xl">
                                        Filtrar por
                                    </h2>

                                    {possuiFiltros && (
                                        <button
                                            type="button"
                                            onClick={limparFiltros}
                                            className="text-xs text-[#968052] underline underline-offset-4 hover:text-[#211C14]"
                                        >
                                            Limpar
                                        </button>
                                    )}
                                </div>

                                <div className="border-b border-[#EFE7DA] pb-6">
                                    <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9B805D]">
                                        Categorias
                                    </h3>

                                    <div className="space-y-3">
                                        <label className="flex cursor-pointer items-center gap-3 text-sm">
                                            <input
                                                type="radio"
                                                name="categoria"
                                                checked={categoriaAtiva === "Todas"}
                                                onChange={() =>
                                                    selecionarCategoria("Todas")
                                                }
                                                className="accent-[#968052]"
                                            />
                                            Todas as categorias
                                        </label>

                                        {categoriasDisponiveis.map(
                                            (categoria) => (
                                                <label
                                                    key={categoria}
                                                    className="flex cursor-pointer items-center gap-3 text-sm"
                                                >
                                                    <input
                                                        type="radio"
                                                        name="categoria"
                                                        checked={
                                                            categoriaAtiva === categoria
                                                        }
                                                        onChange={() =>
                                                            selecionarCategoria(categoria)
                                                        }
                                                        className="accent-[#968052]"
                                                    />
                                                    {categoria}
                                                </label>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9B805D]">
                                        Materiais
                                    </h3>

                                    <div className="space-y-3">
                                        <label className="flex cursor-pointer items-center gap-3 text-sm">
                                            <input
                                                type="radio"
                                                name="material"
                                                checked={materialAtivo === "Todos"}
                                                onChange={() =>
                                                    setMaterialAtivo("Todos")
                                                }
                                                className="accent-[#968052]"
                                            />
                                            Todos os materiais
                                        </label>

                                        {materiaisDisponiveis.map(
                                            (material) => (
                                                <label
                                                    key={material}
                                                    className="flex cursor-pointer items-center gap-3 text-sm"
                                                >
                                                    <input
                                                        type="radio"
                                                        name="material"
                                                        checked={
                                                            materialAtivo === material
                                                        }
                                                        onChange={() =>
                                                            setMaterialAtivo(material)
                                                        }
                                                        className="accent-[#968052]"
                                                    />
                                                    {material}
                                                </label>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Resultados */}

                        <div className="min-w-0">
                            {possuiFiltros && (
                                <div className="mb-5 flex flex-wrap items-center gap-2">
                                    <span className="mr-1 text-xs text-[#847A6C]">
                                        Filtros ativos:
                                    </span>

                                    {busca.trim() && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setBusca("");

                                                const novosParametros =
                                                    new URLSearchParams(searchParams);

                                                novosParametros.delete("busca");

                                                setSearchParams(
                                                    novosParametros,
                                                    { replace: true }
                                                );
                                            }}
                                            className="inline-flex items-center gap-2 rounded-full bg-[#F0E8D9] px-3 py-1.5 text-xs"
                                        >
                                            Busca: {busca}
                                            <X size={13} />
                                        </button>
                                    )}

                                    {categoriaAtiva !== "Todas" && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                selecionarCategoria("Todas")
                                            }
                                            className="inline-flex items-center gap-2 rounded-full bg-[#F0E8D9] px-3 py-1.5 text-xs"
                                        >
                                            {categoriaAtiva}
                                            <X size={13} />
                                        </button>
                                    )}

                                    {materialAtivo !== "Todos" && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setMaterialAtivo("Todos")
                                            }
                                            className="inline-flex items-center gap-2 rounded-full bg-[#F0E8D9] px-3 py-1.5 text-xs"
                                        >
                                            {materialAtivo}
                                            <X size={13} />
                                        </button>
                                    )}
                                </div>
                            )}

                            {carregando ? (
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                    {[1, 2, 3, 4, 5, 6].map((item) => (
                                        <div
                                            key={item}
                                            className="animate-pulse overflow-hidden rounded-2xl border border-[#EAE0CE] bg-white"
                                        >
                                            <div className="aspect-[4/4.5] bg-[#EAE0CE]" />

                                            <div className="space-y-3 p-5">
                                                <div className="h-3 w-1/3 rounded bg-[#EAE0CE]" />
                                                <div className="h-4 w-3/4 rounded bg-[#EAE0CE]" />
                                                <div className="h-4 w-1/2 rounded bg-[#EAE0CE]" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : erro ? (
                                <div className="rounded-2xl border border-[#EAE0CE] bg-white px-5 py-14 text-center">
                                    <h2 className="font-serif text-2xl">
                                        Não foi possível carregar a coleção
                                    </h2>

                                    <p className="mt-3 text-sm text-[#847A6C]">
                                        {erro}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={carregarDados}
                                        className="mt-6 rounded-full bg-[#211C14] px-6 py-3 text-sm text-white transition-colors hover:bg-[#4A3D2B]"
                                    >
                                        Tentar novamente
                                    </button>
                                </div>
                            ) : produtosFiltrados.length === 0 ? (
                                <div className="rounded-2xl border border-[#EAE0CE] bg-white px-5 py-16 text-center">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F2E8]">
                                        <Search
                                            size={22}
                                            className="text-[#968052]"
                                        />
                                    </div>

                                    <h2 className="mt-5 font-serif text-2xl">
                                        Nenhuma joia encontrada
                                    </h2>

                                    <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#847A6C]">
                                        Não encontramos produtos com esses
                                        critérios. Experimente mudar sua busca
                                        ou seus filtros.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={limparFiltros}
                                        className="mt-6 rounded-full bg-[#211C14] px-6 py-3 text-sm text-white transition-colors hover:bg-[#4A3D2B]"
                                    >
                                        Limpar filtros
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                    {produtosFiltrados.map((produto) => (
                                        <CardProduto
                                            key={produto.id}
                                            produto={produto}
                                            favorito={favoritos.includes(produto.id)}
                                            aoAlternarFavorito={alternarFavorito}
                                            aoAdicionarSacola={adicionarSacola}
                                            processandoFavorito={processandoFavoritos.includes(
                                                produto.id
                                            )}
                                            processandoSacola={processandoSacola.includes(
                                                produto.id
                                            )}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Indicador da sacola */}

            {sacola.length > 0 && (
                <div className="fixed bottom-5 right-5 z-40">
                    <Link to="/sacola">
                    <div className="flex items-center gap-3 rounded-full bg-[#211C14] px-5 py-3.5 text-sm text-white shadow-xl">
                        <ShoppingBag size={17} />
                        
                        <span>
                            {sacola.length}{" "}
                            {sacola.length === 1 ? "item" : "itens"} na sacola
                        </span>
                        
                    </div>
                    </Link>
                </div>
            )}
        </main>
    );
}
