
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    Check,
    Clock3,
    Edit3,
    Gift,
    LoaderCircle,
    Menu,
    Package,
    Percent,
    Plus,
    RefreshCw,
    Search,
    Tag,
    Tags,
    ToggleLeft,
    ToggleRight,
    Trash2,
    TriangleAlert,
    X,
} from "lucide-react";

import { apiFetch } from "../../services/api.js";
import Sidebar from "../../components/admin/Sidebar.jsx";

// ============================================================
// CONFIGURAÇÕES
// ============================================================

const API_PROMOCOES = "/admin/promocao";

const FORMULARIO_INICIAL = {
    nome: "",
    descricao: "",
    tipo: "PERCENTUAL",
    valor: "",
    ativo: true,
    inicioEm: "",
    fimEm: "",
    produtoIds: [],
    categoriaIds: [],
};

const INPUT_CLASS =
    "w-full border border-[#E9DCC4] bg-white px-4 py-3 text-sm text-[#211C14] outline-none transition focus:border-[#968052]";

const BOTAO_PRIMARIO =
    "inline-flex items-center justify-center gap-2 bg-[#211C14] px-5 py-3 text-sm text-white transition hover:bg-[#968052] disabled:cursor-not-allowed disabled:opacity-50";

const BOTAO_SECUNDARIO =
    "inline-flex items-center justify-center gap-2 border border-[#E9DCC4] bg-white px-5 py-3 text-sm text-[#211C14] transition hover:bg-[#F8F3E8] disabled:opacity-50";

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function formatarMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(valor) || 0);
}

function formatarData(valor) {
    if (!valor) return "—";

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) return "—";

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(data);
}

function paraDataLocal(valor) {
    if (!valor) return "";

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) return "";

    const doisDigitos = (numero) =>
        String(numero).padStart(2, "0");

    return [
        data.getFullYear(),
        "-",
        doisDigitos(data.getMonth() + 1),
        "-",
        doisDigitos(data.getDate()),
        "T",
        doisDigitos(data.getHours()),
        ":",
        doisDigitos(data.getMinutes()),
    ].join("");
}

function obterStatus(promocao) {
    if (!promocao.ativo) return "DESATIVADA";

    const agora = Date.now();
    const inicio = new Date(promocao.inicioEm).getTime();
    const fim = new Date(promocao.fimEm).getTime();

    if (agora < inicio) return "AGENDADA";
    if (agora >= fim) return "ENCERRADA";

    return "ATIVA";
}

function formatarDesconto(promocao) {
    const valor = Number(promocao.valor) || 0;

    if (promocao.tipo === "PERCENTUAL") {
        return `${valor.toLocaleString("pt-BR")}% OFF`;
    }

    return `${formatarMoeda(valor)} OFF`;
}

function obterIds(relacionamentos, campo) {
    if (!Array.isArray(relacionamentos)) return [];

    return relacionamentos
        .map((item) => item[campo])
        .filter(Boolean);
}

function obterLista(resposta, chave) {
    if (Array.isArray(resposta)) return resposta;

    if (Array.isArray(resposta?.[chave])) {
        return resposta[chave];
    }

    if (Array.isArray(resposta?.dados?.[chave])) {
        return resposta.dados[chave];
    }

    if (Array.isArray(resposta?.dados)) {
        return resposta.dados;
    }

    return null;
}

function mensagemErro(error) {
    return error?.message || "Ocorreu um erro inesperado.";
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function IndicadorStatus({ promocao }) {
    const status = obterStatus(promocao);

    const estilos = {
        ATIVA: "border-emerald-200 bg-emerald-50 text-emerald-700",
        AGENDADA: "border-blue-200 bg-blue-50 text-blue-700",
        ENCERRADA: "border-stone-200 bg-stone-100 text-stone-600",
        DESATIVADA: "border-red-200 bg-red-50 text-red-700",
    };

    return (
        <span
            className={`inline-flex items-center gap-2 border px-3 py-1.5 text-xs font-medium ${estilos[status]}`}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
    );
}

function CampoFormulario({
    label,
    obrigatorio = false,
    children,
}) {
    return (
        <div className="space-y-2">
            <label className="block text-xs font-medium text-[#756C5C]">
                {label}

                {obrigatorio && (
                    <span className="ml-1 text-red-600">*</span>
                )}
            </label>

            {children}
        </div>
    );
}

function SeletorMultiplo({
    titulo,
    descricao,
    itens,
    selecionados,
    onChange,
    carregando,
    campoSecundario,
    Icone,
}) {
    const [busca, setBusca] = useState("");

    const filtrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        if (!termo) return itens;

        return itens.filter((item) =>
            `${item.nome || ""} ${item[campoSecundario] || ""}`
                .toLowerCase()
                .includes(termo)
        );
    }, [itens, busca, campoSecundario]);

    function alternar(id) {
        if (selecionados.includes(id)) {
            onChange(
                selecionados.filter((itemId) => itemId !== id)
            );
            return;
        }

        onChange([...selecionados, id]);
    }

    return (
        <div className="border border-[#E9DCC4] bg-white">
            <div className="border-b border-[#E9DCC4] p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#F8F3E8] text-[#968052]">
                            <Icone size={19} />
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-[#211C14]">
                                {titulo}
                            </h4>

                            <p className="mt-1 text-xs leading-5 text-[#756C5C]">
                                {descricao}
                            </p>
                        </div>
                    </div>

                    <span className="bg-[#F8F3E8] px-2.5 py-1 text-xs text-[#806B43]">
                        {selecionados.length}
                    </span>
                </div>

                <div className="relative mt-4">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#968052]"
                    />

                    <input
                        type="text"
                        value={busca}
                        onChange={(evento) =>
                            setBusca(evento.target.value)
                        }
                        placeholder={`Buscar ${titulo.toLowerCase()}...`}
                        className="w-full border border-[#E9DCC4] bg-[#FCFAF5] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#968052]"
                    />
                </div>
            </div>

            <div className="max-h-60 overflow-y-auto p-2">
                {carregando ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-xs text-[#756C5C]">
                        <LoaderCircle
                            size={16}
                            className="animate-spin"
                        />
                        Carregando...
                    </div>
                ) : filtrados.length === 0 ? (
                    <p className="py-8 text-center text-xs text-[#756C5C]">
                        Nenhum resultado encontrado.
                    </p>
                ) : (
                    filtrados.map((item) => {
                        const marcado = selecionados.includes(item.id);

                        return (
                            <label
                                key={item.id}
                                className={`flex cursor-pointer items-center gap-3 px-3 py-3 transition ${
                                    marcado
                                        ? "bg-[#F8F3E8]"
                                        : "hover:bg-[#FCFAF5]"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={marcado}
                                    onChange={() => alternar(item.id)}
                                    className="h-4 w-4 accent-[#968052]"
                                />

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm text-[#211C14]">
                                        {item.nome}
                                    </p>

                                    {campoSecundario &&
                                        item[campoSecundario] != null && (
                                            <p className="mt-1 truncate text-xs text-[#968052]">
                                                {campoSecundario === "preco"
                                                    ? formatarMoeda(item.preco)
                                                    : String(item[campoSecundario])}
                                            </p>
                                        )}
                                </div>

                                {marcado && (
                                    <Check
                                        size={16}
                                        className="shrink-0 text-[#968052]"
                                    />
                                )}
                            </label>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function AdminPromocoes() {
    // ========================================================
    // SIDEBAR
    // ========================================================

    const [mobileOpen, setMobileOpen] = useState(false);

    // ========================================================
    // DADOS
    // ========================================================

    const [promocoes, setPromocoes] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [categorias, setCategorias] = useState([]);

    const [carregando, setCarregando] = useState(true);
    const [carregandoOpcoes, setCarregandoOpcoes] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [processandoId, setProcessandoId] = useState(null);

    const [erro, setErro] = useState("");
    const [erroFormulario, setErroFormulario] = useState("");
    const [mensagem, setMensagem] = useState("");

    const [busca, setBusca] = useState("");
    const [filtroStatus, setFiltroStatus] = useState("TODAS");

    const [modalAberto, setModalAberto] = useState(false);
    const [promocaoEditando, setPromocaoEditando] = useState(null);

    const [formulario, setFormulario] = useState({
        ...FORMULARIO_INICIAL,
    });

    const [exclusaoId, setExclusaoId] = useState(null);

    // ========================================================
    // CARREGAMENTO DAS PROMOÇÕES
    // ========================================================

    const carregarPromocoes = useCallback(async () => {
        try {
            const resposta = await apiFetch(API_PROMOCOES);

            const lista = obterLista(resposta, "promocoes");

            if (!Array.isArray(lista)) {
                throw new Error(
                    "A API não retornou uma lista válida de promoções."
                );
            }

            setPromocoes(lista);
        } catch (error) {
            throw new Error(
                `Não foi possível carregar as promoções: ${mensagemErro(error)}`
            );
        }
    }, []);

    // ========================================================
    // CARREGAMENTO DE PRODUTOS E CATEGORIAS
    // ========================================================

    const carregarOpcoes = useCallback(async () => {
        const [respostaProdutos, respostaCategorias] =
            await Promise.all([
                apiFetch("/produtos"),
                apiFetch("/categorias"),
            ]);

        const listaProdutos = obterLista(
            respostaProdutos,
            "produtos"
        );

        const listaCategorias = obterLista(
            respostaCategorias,
            "categorias"
        );

        if (
            !Array.isArray(listaProdutos) ||
            !Array.isArray(listaCategorias)
        ) {
            throw new Error(
                "Os endpoints de produtos e categorias não retornaram listas válidas."
            );
        }

        setProdutos(listaProdutos);
        setCategorias(listaCategorias);
    }, []);

    const carregarTudo = useCallback(async () => {
        setCarregando(true);
        setCarregandoOpcoes(true);
        setErro("");

        const resultados = await Promise.allSettled([
            carregarPromocoes(),
            carregarOpcoes(),
        ]);

        const falhas = resultados
            .filter((resultado) => resultado.status === "rejected")
            .map((resultado) => mensagemErro(resultado.reason));

        if (falhas.length) {
            setErro(falhas.join(" "));
        }

        setCarregando(false);
        setCarregandoOpcoes(false);
    }, [carregarPromocoes, carregarOpcoes]);

    useEffect(() => {
        carregarTudo();
    }, [carregarTudo]);

    // ========================================================
    // ESTATÍSTICAS
    // ========================================================

    const estatisticas = useMemo(() => {
        const resultado = {
            total: promocoes.length,
            ativas: 0,
            agendadas: 0,
            encerradas: 0,
            desativadas: 0,
        };

        for (const promocao of promocoes) {
            const status = obterStatus(promocao);

            if (status === "ATIVA") resultado.ativas++;
            if (status === "AGENDADA") resultado.agendadas++;
            if (status === "ENCERRADA") resultado.encerradas++;
            if (status === "DESATIVADA") resultado.desativadas++;
        }

        return resultado;
    }, [promocoes]);

    const promocoesFiltradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        return promocoes.filter((promocao) => {
            const correspondeBusca =
                !termo ||
                promocao.nome.toLowerCase().includes(termo) ||
                (promocao.descricao || "")
                    .toLowerCase()
                    .includes(termo);

            const correspondeStatus =
                filtroStatus === "TODAS" ||
                obterStatus(promocao) === filtroStatus;

            return correspondeBusca && correspondeStatus;
        });
    }, [promocoes, busca, filtroStatus]);

    // ========================================================
    // FORMULÁRIO
    // ========================================================

    function atualizarCampo(nome, valor) {
        setFormulario((atual) => ({
            ...atual,
            [nome]: valor,
        }));
    }

    function abrirCadastro() {
        setPromocaoEditando(null);

        setFormulario({
            ...FORMULARIO_INICIAL,
            produtoIds: [],
            categoriaIds: [],
            inicioEm: paraDataLocal(new Date()),
        });

        setErroFormulario("");
        setMensagem("");
        setModalAberto(true);
    }

    function abrirEdicao(promocao) {
        setPromocaoEditando(promocao);

        setFormulario({
            nome: promocao.nome || "",
            descricao: promocao.descricao || "",
            tipo: promocao.tipo || "PERCENTUAL",
            valor: String(promocao.valor ?? ""),
            ativo: Boolean(promocao.ativo),
            inicioEm: paraDataLocal(promocao.inicioEm),
            fimEm: paraDataLocal(promocao.fimEm),
            produtoIds: obterIds(
                promocao.produtos,
                "produtoId"
            ),
            categoriaIds: obterIds(
                promocao.categorias,
                "categoriaId"
            ),
        });

        setErroFormulario("");
        setMensagem("");
        setModalAberto(true);
    }

    function fecharModal() {
        if (salvando) return;

        setModalAberto(false);
        setPromocaoEditando(null);
        setErroFormulario("");

        setFormulario({
            ...FORMULARIO_INICIAL,
        });
    }

    function validarFormulario() {
        if (formulario.nome.trim().length < 3) {
            throw new Error(
                "Informe um nome com pelo menos 3 caracteres."
            );
        }

        const valor = Number(formulario.valor);

        if (!Number.isFinite(valor) || valor <= 0) {
            throw new Error(
                "Informe um valor de desconto maior que zero."
            );
        }

        if (
            formulario.tipo === "PERCENTUAL" &&
            valor > 100
        ) {
            throw new Error(
                "O desconto percentual não pode ultrapassar 100%."
            );
        }

        if (
            Math.round(valor * 100) !==
            Math.round(valor * 1000000) / 10000
        ) {
            throw new Error(
                "O desconto deve ter no máximo duas casas decimais."
            );
        }

        if (
            !formulario.inicioEm ||
            !formulario.fimEm
        ) {
            throw new Error(
                "Informe o início e o término da promoção."
            );
        }

        const inicio = new Date(formulario.inicioEm);
        const fim = new Date(formulario.fimEm);

        if (
            Number.isNaN(inicio.getTime()) ||
            Number.isNaN(fim.getTime()) ||
            fim <= inicio
        ) {
            throw new Error(
                "A data final deve ser posterior à data inicial."
            );
        }

        if (
            !formulario.produtoIds.length &&
            !formulario.categoriaIds.length
        ) {
            throw new Error(
                "Selecione pelo menos um produto ou categoria."
            );
        }

        return {
            nome: formulario.nome.trim(),
            descricao: formulario.descricao.trim() || null,
            tipo: formulario.tipo,
            valor,
            ativo: formulario.ativo,
            inicioEm: inicio.toISOString(),
            fimEm: fim.toISOString(),
            produtoIds: [...new Set(formulario.produtoIds)],
            categoriaIds: [...new Set(formulario.categoriaIds)],
        };
    }

    // ========================================================
    // CRIAR / ATUALIZAR
    // ========================================================

    async function salvarPromocao(evento) {
        evento.preventDefault();

        if (salvando) return;

        setErroFormulario("");
        setMensagem("");

        try {
            const dados = validarFormulario();

            setSalvando(true);

            const editando = Boolean(promocaoEditando);

            const caminho = editando
                ? `${API_PROMOCOES}/${promocaoEditando.id}`
                : API_PROMOCOES;

            const metodo = editando ? "PUT" : "POST";

            const resposta = await apiFetch(caminho, {
                method: metodo,
                body: JSON.stringify(dados),
            });

            if (resposta?.sucesso === false) {
                throw new Error(
                    resposta.mensagem ||
                    "Não foi possível salvar a promoção."
                );
            }

            await carregarPromocoes();

            fecharModalDepoisDeSalvar();

            setMensagem(
                editando
                    ? "Promoção atualizada com sucesso!"
                    : "Promoção criada com sucesso!"
            );
        } catch (error) {
            setErroFormulario(mensagemErro(error));
        } finally {
            setSalvando(false);
        }
    }

    function fecharModalDepoisDeSalvar() {
        setModalAberto(false);
        setPromocaoEditando(null);
        setErroFormulario("");

        setFormulario({
            ...FORMULARIO_INICIAL,
        });
    }

    // ========================================================
    // ATIVAR / DESATIVAR
    // ========================================================

    async function alternarStatus(promocao) {
        if (processandoId) return;

        setProcessandoId(promocao.id);
        setErro("");
        setMensagem("");

        try {
            const resposta = await apiFetch(
                `${API_PROMOCOES}/${promocao.id}/status`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        ativo: !promocao.ativo,
                    }),
                }
            );

            if (resposta?.sucesso === false) {
                throw new Error(
                    resposta.mensagem ||
                    "Não foi possível alterar o status."
                );
            }

            await carregarPromocoes();

            setMensagem(
                promocao.ativo
                    ? "Promoção desativada com sucesso."
                    : "Promoção ativada com sucesso."
            );
        } catch (error) {
            setErro(mensagemErro(error));
        } finally {
            setProcessandoId(null);
        }
    }

    // ========================================================
    // EXCLUIR
    // ========================================================

    async function excluirPromocao() {
        if (!exclusaoId || processandoId) return;

        const id = exclusaoId;

        setProcessandoId(id);
        setErro("");
        setMensagem("");

        try {
            const resposta = await apiFetch(
                `${API_PROMOCOES}/${id}`,
                {
                    method: "DELETE",
                }
            );

            if (resposta?.sucesso === false) {
                throw new Error(
                    resposta.mensagem ||
                    "Não foi possível excluir a promoção."
                );
            }

            await carregarPromocoes();

            setExclusaoId(null);
            setMensagem("Promoção excluída com sucesso.");
        } catch (error) {
            setErro(mensagemErro(error));
        } finally {
            setProcessandoId(null);
        }
    }

    // ========================================================
    // INTERFACE
    // ========================================================

    return (
        <div className="min-h-screen bg-[#FCFAF5] text-[#211C14]">

            {/* SIDEBAR - FORA DO CONTEÚDO PRINCIPAL */}

            <Sidebar
                mobileOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
            />

            {/* CONTEÚDO PRINCIPAL */}

            <div className="min-h-screen lg:ml-64">

                {/* BARRA MOBILE */}

                <div className="flex items-center justify-between border-b border-[#E9DCC4] bg-white px-4 py-4 lg:hidden">
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Abrir menu"
                        className="flex h-10 w-10 items-center justify-center border border-[#E9DCC4] text-[#211C14]"
                    >
                        <Menu size={21} />
                    </button>

                    <span className="font-serif text-xl tracking-wide">
                        AURELIA
                    </span>

                    <div className="w-10" />
                </div>

                <main className="px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-[1440px]">

                        {/* CABEÇALHO */}

                        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                            <div>
                                <p className="mb-2 text-xs font-medium uppercase tracking-[0.25em] text-[#968052]">
                                    Administração AURELIA
                                </p>

                                <h1 className="font-serif text-3xl sm:text-4xl">
                                    Promoções
                                </h1>

                                <p className="mt-2 text-sm text-[#756C5C]">
                                    Gerencie campanhas, descontos e ofertas especiais.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={carregarTudo}
                                    disabled={carregando}
                                    className={BOTAO_SECUNDARIO}
                                >
                                    <RefreshCw
                                        size={17}
                                        className={
                                            carregando
                                                ? "animate-spin"
                                                : ""
                                        }
                                    />
                                    Atualizar
                                </button>

                                <button
                                    type="button"
                                    onClick={abrirCadastro}
                                    className={BOTAO_PRIMARIO}
                                >
                                    <Plus size={18} />
                                    Nova promoção
                                </button>
                            </div>
                        </header>

                        {/* MENSAGENS */}

                        {erro && (
                            <div
                                role="alert"
                                className="mb-6 flex items-start gap-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                            >
                                <TriangleAlert
                                    size={18}
                                    className="mt-0.5 shrink-0"
                                />

                                <p className="flex-1">{erro}</p>

                                <button
                                    type="button"
                                    onClick={() => setErro("")}
                                    aria-label="Fechar erro"
                                >
                                    <X size={17} />
                                </button>
                            </div>
                        )}

                        {mensagem && (
                            <div className="mb-6 flex items-start gap-3 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                                <Check
                                    size={18}
                                    className="shrink-0"
                                />

                                <p className="flex-1">{mensagem}</p>

                                <button
                                    type="button"
                                    onClick={() => setMensagem("")}
                                    aria-label="Fechar mensagem"
                                >
                                    <X size={17} />
                                </button>
                            </div>
                        )}

                        {/* ESTATÍSTICAS */}

                        <section className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
                            {[
                                {
                                    titulo: "Total de promoções",
                                    valor: estatisticas.total,
                                    Icone: Tags,
                                },
                                {
                                    titulo: "Ativas agora",
                                    valor: estatisticas.ativas,
                                    Icone: Gift,
                                },
                                {
                                    titulo: "Agendadas",
                                    valor: estatisticas.agendadas,
                                    Icone: CalendarDays,
                                },
                                {
                                    titulo: "Encerradas",
                                    valor: estatisticas.encerradas,
                                    Icone: Clock3,
                                },
                            ].map(({ titulo, valor, Icone }) => (
                                <div
                                    key={titulo}
                                    className="border border-[#E9DCC4] bg-white p-5 sm:p-6"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs text-[#756C5C]">
                                            {titulo}
                                        </p>

                                        <Icone
                                            size={19}
                                            className="text-[#968052]"
                                        />
                                    </div>

                                    <p className="mt-4 font-serif text-3xl">
                                        {carregando ? "—" : valor}
                                    </p>
                                </div>
                            ))}
                        </section>

                        {/* FILTROS */}

                        <section className="mb-6 flex flex-col gap-4 border border-[#E9DCC4] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative w-full sm:max-w-md">
                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#968052]"
                                />

                                <input
                                    type="text"
                                    value={busca}
                                    onChange={(evento) =>
                                        setBusca(evento.target.value)
                                    }
                                    placeholder="Buscar promoções..."
                                    className="w-full border border-[#E9DCC4] bg-[#FCFAF5] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#968052]"
                                />
                            </div>

                            <select
                                value={filtroStatus}
                                onChange={(evento) =>
                                    setFiltroStatus(evento.target.value)
                                }
                                className="w-full border border-[#E9DCC4] bg-[#FCFAF5] px-4 py-3 text-sm outline-none focus:border-[#968052] sm:w-48"
                            >
                                <option value="TODAS">
                                    Todos os status
                                </option>
                                <option value="ATIVA">
                                    Ativas
                                </option>
                                <option value="AGENDADA">
                                    Agendadas
                                </option>
                                <option value="ENCERRADA">
                                    Encerradas
                                </option>
                                <option value="DESATIVADA">
                                    Desativadas
                                </option>
                            </select>
                        </section>

                        {/* LISTAGEM */}

                        <section className="overflow-hidden border border-[#E9DCC4] bg-white">
                            <div className="flex items-center justify-between border-b border-[#E9DCC4] px-5 py-5 sm:px-6">
                                <h2 className="font-serif text-xl">
                                    Campanhas cadastradas
                                </h2>

                                <span className="text-xs text-[#756C5C]">
                                    {promocoesFiltradas.length} resultado(s)
                                </span>
                            </div>

                            {carregando ? (
                                <div className="flex items-center justify-center gap-3 py-24 text-sm text-[#756C5C]">
                                    <LoaderCircle
                                        size={21}
                                        className="animate-spin text-[#968052]"
                                    />
                                    Carregando promoções...
                                </div>
                            ) : promocoesFiltradas.length === 0 ? (
                                <div className="flex flex-col items-center px-5 py-20 text-center">
                                    <div className="mb-5 flex h-16 w-16 items-center justify-center bg-[#F8F3E8] text-[#968052]">
                                        <Gift
                                            size={29}
                                            strokeWidth={1.3}
                                        />
                                    </div>

                                    <h3 className="font-serif text-xl">
                                        Nenhuma promoção encontrada
                                    </h3>

                                    <p className="mt-2 max-w-sm text-sm leading-6 text-[#756C5C]">
                                        Cadastre sua primeira campanha ou ajuste os filtros de busca.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={abrirCadastro}
                                        className={`mt-6 ${BOTAO_PRIMARIO}`}
                                    >
                                        <Plus size={17} />
                                        Criar promoção
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[880px] text-left">
                                        <thead className="bg-[#FCFAF5]">
                                            <tr className="text-xs text-[#756C5C]">
                                                <th className="px-5 py-4 font-medium">
                                                    Promoção
                                                </th>

                                                <th className="px-5 py-4 font-medium">
                                                    Desconto
                                                </th>

                                                <th className="px-5 py-4 font-medium">
                                                    Aplicação
                                                </th>

                                                <th className="px-5 py-4 font-medium">
                                                    Período
                                                </th>

                                                <th className="px-5 py-4 font-medium">
                                                    Status
                                                </th>

                                                <th className="px-5 py-4 text-right font-medium">
                                                    Ações
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-[#E9DCC4]">
                                            {promocoesFiltradas.map((promocao) => {
                                                const processando =
                                                    processandoId === promocao.id;

                                                return (
                                                    <tr
                                                        key={promocao.id}
                                                        className="transition hover:bg-[#FCFAF5]"
                                                    >
                                                        <td className="px-5 py-5">
                                                            <p className="text-sm font-medium">
                                                                {promocao.nome}
                                                            </p>

                                                            {promocao.descricao && (
                                                                <p className="mt-1 max-w-[220px] truncate text-xs text-[#756C5C]">
                                                                    {promocao.descricao}
                                                                </p>
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-5">
                                                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#968052]">
                                                                {promocao.tipo === "PERCENTUAL" ? (
                                                                    <Percent size={15} />
                                                                ) : (
                                                                    <Tag size={15} />
                                                                )}

                                                                {formatarDesconto(promocao)}
                                                            </span>
                                                        </td>

                                                        <td className="px-5 py-5">
                                                            <div className="space-y-1 text-xs text-[#756C5C]">
                                                                <p>
                                                                    {promocao.produtos?.length || 0} produto(s)
                                                                </p>

                                                                <p>
                                                                    {promocao.categorias?.length || 0} categoria(s)
                                                                </p>
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-5">
                                                            <div className="space-y-1 text-xs text-[#756C5C]">
                                                                <p>
                                                                    {formatarData(promocao.inicioEm)}
                                                                </p>

                                                                <p>
                                                                    até {formatarData(promocao.fimEm)}
                                                                </p>
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-5">
                                                            <IndicadorStatus
                                                                promocao={promocao}
                                                            />
                                                        </td>

                                                        <td className="px-5 py-5">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        abrirEdicao(promocao)
                                                                    }
                                                                    disabled={processando}
                                                                    title="Editar promoção"
                                                                    className="p-2 text-[#756C5C] transition hover:bg-[#F8F3E8] hover:text-[#968052] disabled:opacity-40"
                                                                >
                                                                    <Edit3 size={17} />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        alternarStatus(promocao)
                                                                    }
                                                                    disabled={processando}
                                                                    title={
                                                                        promocao.ativo
                                                                            ? "Desativar promoção"
                                                                            : "Ativar promoção"
                                                                    }
                                                                    className="p-2 text-[#756C5C] transition hover:bg-[#F8F3E8] hover:text-[#968052] disabled:opacity-40"
                                                                >
                                                                    {processando ? (
                                                                        <LoaderCircle
                                                                            size={18}
                                                                            className="animate-spin"
                                                                        />
                                                                    ) : promocao.ativo ? (
                                                                        <ToggleRight size={19} />
                                                                    ) : (
                                                                        <ToggleLeft size={19} />
                                                                    )}
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setExclusaoId(promocao.id)
                                                                    }
                                                                    disabled={processando}
                                                                    title="Excluir promoção"
                                                                    className="p-2 text-[#756C5C] transition hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                                                                >
                                                                    <Trash2 size={17} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </div>
                </main>
            </div>

            {/* ================================================= */}
            {/* MODAL DE CADASTRO / EDIÇÃO */}
            {/* ================================================= */}

            {modalAberto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 sm:p-6">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-modal-promocao"
                        className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden bg-[#FCFAF5] shadow-2xl"
                    >
                        {/* CABEÇALHO DO MODAL */}

                        <div className="flex items-center justify-between border-b border-[#E9DCC4] bg-white px-5 py-5 sm:px-7">
                            <div>
                                <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-[#968052]">
                                    Administração AURELIA
                                </p>

                                <h2
                                    id="titulo-modal-promocao"
                                    className="font-serif text-2xl"
                                >
                                    {promocaoEditando
                                        ? "Editar promoção"
                                        : "Nova promoção"}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={fecharModal}
                                disabled={salvando}
                                aria-label="Fechar formulário"
                                className="p-2 text-[#756C5C] hover:bg-[#F8F3E8]"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* FORMULÁRIO */}

                        <form
                            onSubmit={salvarPromocao}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="min-h-0 flex-1 space-y-7 overflow-y-auto p-5 sm:p-7">

                                {/* ERRO DO FORMULÁRIO */}

                                {erroFormulario && (
                                    <div
                                        role="alert"
                                        className="flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                                    >
                                        <TriangleAlert
                                            size={18}
                                            className="mt-0.5 shrink-0"
                                        />

                                        <p>{erroFormulario}</p>
                                    </div>
                                )}

                                {/* INFORMAÇÕES BÁSICAS */}

                                <div>
                                    <h3 className="mb-5 flex items-center gap-2 text-sm font-medium">
                                        <Tag
                                            size={18}
                                            className="text-[#968052]"
                                        />
                                        Informações da campanha
                                    </h3>

                                    <div className="space-y-5">
                                        <CampoFormulario
                                            label="Nome da promoção"
                                            obrigatorio
                                        >
                                            <input
                                                type="text"
                                                required
                                                minLength={3}
                                                maxLength={150}
                                                value={formulario.nome}
                                                onChange={(evento) =>
                                                    atualizarCampo(
                                                        "nome",
                                                        evento.target.value
                                                    )
                                                }
                                                placeholder="Ex.: Black Friday AURELIA"
                                                className={INPUT_CLASS}
                                            />
                                        </CampoFormulario>

                                        <CampoFormulario label="Descrição">
                                            <textarea
                                                rows={3}
                                                maxLength={1000}
                                                value={formulario.descricao}
                                                onChange={(evento) =>
                                                    atualizarCampo(
                                                        "descricao",
                                                        evento.target.value
                                                    )
                                                }
                                                placeholder="Descreva os detalhes da campanha..."
                                                className={`${INPUT_CLASS} resize-y`}
                                            />
                                        </CampoFormulario>
                                    </div>
                                </div>

                                {/* DESCONTO */}

                                <div className="border-t border-[#E9DCC4] pt-7">
                                    <h3 className="mb-5 flex items-center gap-2 text-sm font-medium">
                                        <Percent
                                            size={18}
                                            className="text-[#968052]"
                                        />
                                        Configuração do desconto
                                    </h3>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <CampoFormulario
                                            label="Tipo de desconto"
                                            obrigatorio
                                        >
                                            <select
                                                value={formulario.tipo}
                                                onChange={(evento) =>
                                                    atualizarCampo(
                                                        "tipo",
                                                        evento.target.value
                                                    )
                                                }
                                                className={INPUT_CLASS}
                                            >
                                                <option value="PERCENTUAL">
                                                    Percentual (%)
                                                </option>

                                                <option value="FIXO">
                                                    Valor fixo (R$)
                                                </option>
                                            </select>
                                        </CampoFormulario>

                                        <CampoFormulario
                                            label={
                                                formulario.tipo === "PERCENTUAL"
                                                    ? "Desconto (%)"
                                                    : "Desconto (R$)"
                                            }
                                            obrigatorio
                                        >
                                            <input
                                                type="number"
                                                required
                                                min="0.01"
                                                max={
                                                    formulario.tipo === "PERCENTUAL"
                                                        ? "100"
                                                        : undefined
                                                }
                                                step="0.01"
                                                value={formulario.valor}
                                                onChange={(evento) =>
                                                    atualizarCampo(
                                                        "valor",
                                                        evento.target.value
                                                    )
                                                }
                                                placeholder="0.00"
                                                className={INPUT_CLASS}
                                            />
                                        </CampoFormulario>
                                    </div>
                                </div>

                                {/* PERÍODO */}

                                <div className="border-t border-[#E9DCC4] pt-7">
                                    <h3 className="mb-5 flex items-center gap-2 text-sm font-medium">
                                        <CalendarDays
                                            size={18}
                                            className="text-[#968052]"
                                        />
                                        Período da promoção
                                    </h3>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <CampoFormulario
                                            label="Data de início"
                                            obrigatorio
                                        >
                                            <input
                                                type="datetime-local"
                                                required
                                                value={formulario.inicioEm}
                                                onChange={(evento) =>
                                                    atualizarCampo(
                                                        "inicioEm",
                                                        evento.target.value
                                                    )
                                                }
                                                className={INPUT_CLASS}
                                            />
                                        </CampoFormulario>

                                        <CampoFormulario
                                            label="Data de término"
                                            obrigatorio
                                        >
                                            <input
                                                type="datetime-local"
                                                required
                                                value={formulario.fimEm}
                                                onChange={(evento) =>
                                                    atualizarCampo(
                                                        "fimEm",
                                                        evento.target.value
                                                    )
                                                }
                                                className={INPUT_CLASS}
                                            />
                                        </CampoFormulario>
                                    </div>
                                </div>

                                {/* PRODUTOS E CATEGORIAS */}

                                <div className="border-t border-[#E9DCC4] pt-7">
                                    <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
                                        <Tags
                                            size={18}
                                            className="text-[#968052]"
                                        />
                                        Onde aplicar a promoção?
                                    </h3>

                                    <p className="mb-5 text-xs leading-5 text-[#756C5C]">
                                        Selecione produtos específicos,
                                        categorias inteiras ou combine as duas opções.
                                    </p>

                                    <div className="grid gap-5 md:grid-cols-2">
                                        <SeletorMultiplo
                                            titulo="Produtos"
                                            descricao="Escolha joias específicas."
                                            itens={produtos}
                                            selecionados={formulario.produtoIds}
                                            onChange={(ids) =>
                                                atualizarCampo(
                                                    "produtoIds",
                                                    ids
                                                )
                                            }
                                            carregando={carregandoOpcoes}
                                            campoSecundario="preco"
                                            Icone={Package}
                                        />

                                        <SeletorMultiplo
                                            titulo="Categorias"
                                            descricao="Inclua todos os produtos das categorias."
                                            itens={categorias}
                                            selecionados={formulario.categoriaIds}
                                            onChange={(ids) =>
                                                atualizarCampo(
                                                    "categoriaIds",
                                                    ids
                                                )
                                            }
                                            carregando={carregandoOpcoes}
                                            campoSecundario="slug"
                                            Icone={Tags}
                                        />
                                    </div>
                                </div>

                                {/* STATUS */}

                                <div className="border-t border-[#E9DCC4] pt-7">
                                    <label className="flex cursor-pointer items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-medium">
                                                Promoção habilitada
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-[#756C5C]">
                                                Habilita a campanha para aplicação
                                                durante o período configurado.
                                            </p>
                                        </div>

                                        <input
                                            type="checkbox"
                                            checked={formulario.ativo}
                                            onChange={(evento) =>
                                                atualizarCampo(
                                                    "ativo",
                                                    evento.target.checked
                                                )
                                            }
                                            className="h-5 w-5 shrink-0 accent-[#968052]"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* BOTÕES DO MODAL */}

                            <div className="flex flex-col-reverse gap-3 border-t border-[#E9DCC4] bg-white px-5 py-5 sm:flex-row sm:justify-end sm:px-7">
                                <button
                                    type="button"
                                    onClick={fecharModal}
                                    disabled={salvando}
                                    className={BOTAO_SECUNDARIO}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={salvando || carregandoOpcoes}
                                    className={BOTAO_PRIMARIO}
                                >
                                    {salvando ? (
                                        <>
                                            <LoaderCircle
                                                size={17}
                                                className="animate-spin"
                                            />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={17} />

                                            {promocaoEditando
                                                ? "Salvar alterações"
                                                : "Criar promoção"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================================================= */}
            {/* MODAL DE EXCLUSÃO */}
            {/* ================================================= */}

            {exclusaoId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4">
                    <div
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="titulo-exclusao-promocao"
                        className="w-full max-w-md bg-white p-7 shadow-2xl"
                    >
                        <div className="mb-5 flex h-12 w-12 items-center justify-center bg-red-50 text-red-700">
                            <Trash2 size={23} />
                        </div>

                        <h2
                            id="titulo-exclusao-promocao"
                            className="font-serif text-2xl"
                        >
                            Excluir promoção?
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-[#756C5C]">
                            Esta ação removerá a campanha e suas associações
                            com produtos e categorias. Não será possível
                            desfazer a exclusão.
                        </p>

                        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setExclusaoId(null)}
                                disabled={Boolean(processandoId)}
                                className={BOTAO_SECUNDARIO}
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={excluirPromocao}
                                disabled={Boolean(processandoId)}
                                className="inline-flex items-center justify-center gap-2 bg-red-700 px-5 py-3 text-sm text-white transition hover:bg-red-800 disabled:opacity-50"
                            >
                                {processandoId ? (
                                    <LoaderCircle
                                        size={17}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Trash2 size={17} />
                                )}

                                Excluir promoção
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
