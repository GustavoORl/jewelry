
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
    ArrowLeft,
    Clock3,
    Copy,
    CreditCard,
    LoaderCircle,
    QrCode,
    RefreshCw,
    ShieldCheck,
    TriangleAlert,
} from "lucide-react";

import { apiFetch } from "../../services/api.js";
import FaixaNavegacao from "../../components/common/FaixaNavegacao.jsx";
import PagamentoCartao from "../../components/pagamento/PagamentoCartao.jsx";

// ============================================================
// CONSTANTES
// ============================================================

const STATUS_FINAIS = [
    "APROVADO",
    "RECUSADO",
    "CANCELADO",
    "REEMBOLSADO",
    "EXPIRADO",
];

const STATUS_NOVA_TENTATIVA = [
    "RECUSADO",
    "CANCELADO",
    "EXPIRADO",
];

const STATUS_EM_ANDAMENTO = [
    "PENDENTE",
    "PROCESSANDO",
];

const STATUS_PEDIDO_PAGO = [
    "PAGO",
    "EM_PREPARACAO",
    "ENVIADO",
    "ENTREGUE",
];

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

const formatarPreco = (valor) =>
    new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(valor) || 0);

function formatarTempoRestante(totalSegundos) {
    const segundosSeguros = Math.max(0, totalSegundos);
    const minutos = Math.floor(segundosSeguros / 60);
    const segundos = segundosSeguros % 60;

    return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

function calcularTempoRestante(expiraEm) {
    if (!expiraEm) return null;

    const expiracao = new Date(expiraEm).getTime();

    if (Number.isNaN(expiracao)) return null;

    return Math.max(
        0,
        Math.ceil((expiracao - Date.now()) / 1000)
    );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function Pagamento() {
    const { pedidoId } = useParams();
    const navigate = useNavigate();

    // ========================================================
    // ESTADOS
    // ========================================================

    const [pedido, setPedido] = useState(null);
    const [pagamento, setPagamento] = useState(null);

    const [metodoSelecionado, setMetodoSelecionado] =
        useState("PIX");

    const [carregandoPedido, setCarregandoPedido] =
        useState(true);

    const [carregando, setCarregando] = useState(false);
    const [consultando, setConsultando] = useState(false);
    const [recuperando, setRecuperando] = useState(true);

    const [erro, setErro] = useState("");
    const [copiado, setCopiado] = useState(false);

    const [tempoRestante, setTempoRestante] = useState(null);

    const [confirmandoExpiracao, setConfirmandoExpiracao] =
        useState(false);

    // ========================================================
    // REFERÊNCIAS
    // ========================================================

    const consultaEmAndamentoRef = useRef(false);
    const confirmacaoExpiracaoRef = useRef(false);
    const timeoutCopiaRef = useRef(null);

    // ========================================================
    // CARREGAR PEDIDO
    // ========================================================

    const carregarPedido = useCallback(
        async ({
            exibirCarregamento = true,
            limparErro = true,
        } = {}) => {
            if (exibirCarregamento) {
                setCarregandoPedido(true);
            }

            if (limparErro) {
                setErro("");
            }

            try {
                const resposta = await apiFetch(
                    `/pedidos/${pedidoId}`
                );

                if (!resposta?.pedido) {
                    throw new Error(
                        "A API não retornou os dados do pedido."
                    );
                }

                setPedido(resposta.pedido);

                return resposta.pedido;
            } catch (error) {
                if (exibirCarregamento) {
                    setErro(
                        error.message ||
                        "Não foi possível carregar o pedido."
                    );
                }

                throw error;
            } finally {
                if (exibirCarregamento) {
                    setCarregandoPedido(false);
                }
            }
        },
        [pedidoId]
    );

    // ========================================================
    // RECUPERAR PAGAMENTO EXISTENTE
    // ========================================================

    const recuperarPagamento = useCallback(async () => {
        setRecuperando(true);

        try {
            const resposta = await apiFetch(
                `/pagamentos/pedido/${pedidoId}`
            );

            const pagamentoRecuperado =
                resposta?.pagamento || null;

            setPagamento(pagamentoRecuperado);

            if (pagamentoRecuperado?.metodo === "PIX") {
                setMetodoSelecionado("PIX");
            } else if (
                ["CREDITO", "CARTAO"].includes(
                    pagamentoRecuperado?.metodo
                )
            ) {
                setMetodoSelecionado("CARTAO");
            }
        } catch (error) {
            setErro(
                error.message ||
                "Não foi possível recuperar o pagamento."
            );
        } finally {
            setRecuperando(false);
        }
    }, [pedidoId]);

    // ========================================================
    // CONSULTAR STATUS DO PAGAMENTO
    // ========================================================

    const consultarStatus = useCallback(async (pagamentoId) => {
        if (
            !pagamentoId ||
            consultaEmAndamentoRef.current
        ) {
            return;
        }

        consultaEmAndamentoRef.current = true;
        setConsultando(true);

        try {
            const resposta = await apiFetch(
                `/pagamentos/${pagamentoId}`
            );

            if (!resposta?.pagamento) return;

            setPagamento((atual) => ({
                ...atual,
                ...resposta.pagamento,
                pix:
                    resposta.pagamento.pix ||
                    atual?.pix,
            }));
        } catch (error) {
            console.error(
                "Erro ao consultar pagamento:",
                error
            );
        } finally {
            consultaEmAndamentoRef.current = false;
            setConsultando(false);
        }
    }, []);

    // ========================================================
    // CARREGAMENTO INICIAL
    // ========================================================

    useEffect(() => {
        carregarPedido().catch(() => {});
        recuperarPagamento();
    }, [carregarPedido, recuperarPagamento]);

    // ========================================================
    // CONTADOR DE EXPIRAÇÃO
    // ========================================================

    useEffect(() => {
        if (!pedido?.expiraEm) {
            setTempoRestante(null);
            return;
        }

        const atualizarContador = () => {
            setTempoRestante(
                calcularTempoRestante(pedido.expiraEm)
            );
        };

        atualizarContador();

        if (pedido.status !== "PENDENTE") {
            return;
        }

        const intervalo = setInterval(
            atualizarContador,
            1000
        );

        return () => clearInterval(intervalo);
    }, [pedido?.expiraEm, pedido?.status]);

    // ========================================================
    // CONFIRMAR EXPIRAÇÃO NO BACKEND
    // ========================================================

    useEffect(() => {
        if (
            tempoRestante !== 0 ||
            !pedido ||
            pedido.status !== "PENDENTE"
        ) {
            return;
        }

        let cancelado = false;

        const verificarPedido = async () => {
            if (
                cancelado ||
                confirmacaoExpiracaoRef.current
            ) {
                return;
            }

            confirmacaoExpiracaoRef.current = true;
            setConfirmandoExpiracao(true);

            try {
                await carregarPedido({
                    exibirCarregamento: false,
                    limparErro: false,
                });
            } catch (error) {
                console.error(
                    "Erro ao confirmar expiração:",
                    error
                );
            } finally {
                confirmacaoExpiracaoRef.current = false;

                if (!cancelado) {
                    setConfirmandoExpiracao(false);
                }
            }
        };

        verificarPedido();

        const intervalo = setInterval(
            verificarPedido,
            3000
        );

        return () => {
            cancelado = true;
            clearInterval(intervalo);
        };
    }, [
        tempoRestante,
        pedido?.status,
        carregarPedido,
    ]);

    // ========================================================
    // ESTADO ESTÁVEL DA EXPIRAÇÃO
    // ========================================================

    const prazoEncerrado =
        tempoRestante === 0 &&
        pedido?.status === "PENDENTE";

    // ========================================================
    // POLLING DO PAGAMENTO
    // ========================================================

    // O intervalo não depende diretamente do contador.
    // Assim, não é reiniciado a cada segundo.

    useEffect(() => {
        const pagamentoId = pagamento?.pagamentoId;
        const status = pagamento?.status;

        if (!pagamentoId || !status) return;

        if (STATUS_FINAIS.includes(status)) return;

        if (!STATUS_EM_ANDAMENTO.includes(status)) {
            return;
        }

        if (pedido?.status === "CANCELADO") return;

        if (prazoEncerrado) return;

        consultarStatus(pagamentoId);

        const intervalo = setInterval(() => {
            consultarStatus(pagamentoId);
        }, 5000);

        return () => clearInterval(intervalo);
    }, [
        pagamento?.pagamentoId,
        pagamento?.status,
        pedido?.status,
        prazoEncerrado,
        consultarStatus,
    ]);

    // ========================================================
    // REDIRECIONAR APÓS APROVAÇÃO
    // ========================================================

    useEffect(() => {
        if (pagamento?.status === "APROVADO") {
            navigate(
                `/pedidos/${pedidoId}/confirmado`,
                { replace: true }
            );
        }
    }, [
        pagamento?.status,
        pedidoId,
        navigate,
    ]);

    // ========================================================
    // LIMPAR TIMEOUT
    // ========================================================

    useEffect(() => {
        return () => {
            if (timeoutCopiaRef.current) {
                clearTimeout(timeoutCopiaRef.current);
            }
        };
    }, []);

    // ========================================================
    // ESTADOS DERIVADOS
    // ========================================================

    const aprovado =
        pagamento?.status === "APROVADO";

    const pedidoCancelado =
        pedido?.status === "CANCELADO";

    const pedidoPago =
        STATUS_PEDIDO_PAGO.includes(pedido?.status);

    const pedidoExpirado =
        pedidoCancelado || prazoEncerrado;

    const pagamentoEmAndamento =
        Boolean(pagamento) &&
        STATUS_EM_ANDAMENTO.includes(
            pagamento.status
        );

    const pagamentoCartao =
        Boolean(pagamento) &&
        ["CREDITO", "CARTAO"].includes(
            pagamento.metodo
        );

    const cartaoEmAndamento =
        pagamentoCartao &&
        pagamentoEmAndamento;

    const cartaoFinalizadoSemSucesso =
        pagamentoCartao &&
        STATUS_NOVA_TENTATIVA.includes(
            pagamento.status
        );

    const permiteNovaTentativa =
        Boolean(pagamento) &&
        STATUS_NOVA_TENTATIVA.includes(
            pagamento.status
        ) &&
        !pedidoExpirado;

    const mostrarDadosPix =
        Boolean(pagamento) &&
        pagamento.metodo === "PIX" &&
        !STATUS_FINAIS.includes(
            pagamento.status
        ) &&
        !pedidoExpirado;

    const podeEscolherMetodo =
        !pagamentoEmAndamento &&
        !aprovado &&
        !pedidoExpirado &&
        !pedidoPago;

    const carregandoPagina =
        carregandoPedido || recuperando;

    const metodoEhCartao =
        metodoSelecionado === "CARTAO";

    // ========================================================
    // CORRIGIR INFORMAÇÕES DO PEDIDO
    // ========================================================

    const podeEditarPedido =
        !carregandoPagina &&
        pedido?.status === "PENDENTE" &&
        !pedidoExpirado &&
        !aprovado &&
        !pedidoPago &&
        !pagamentoEmAndamento;

    function voltarParaCheckout() {
        if (!podeEditarPedido || !pedidoId) {
            return;
        }

        navigate(
            `/checkout?pedidoId=${encodeURIComponent(pedidoId)}`
        );
    }

    // ========================================================
    // GERAR PIX
    // ========================================================

    async function gerarPix() {
        if (carregando) return;

        if (
            pedido?.status !== "PENDENTE" ||
            pedidoExpirado
        ) {
            setErro(
                "Este pedido não está disponível para pagamento."
            );
            return;
        }

        setCarregando(true);
        setErro("");
        setCopiado(false);

        try {
            const resposta = await apiFetch(
                "/pagamentos/pix",
                {
                    method: "POST",
                    body: JSON.stringify({
                        pedidoId,
                    }),
                }
            );

            if (!resposta?.pagamento?.pagamentoId) {
                throw new Error(
                    "A API não retornou os dados esperados do pagamento."
                );
            }

            setPagamento(resposta.pagamento);
            setMetodoSelecionado("PIX");
        } catch (error) {
            setErro(
                error.message ||
                "Não foi possível gerar o Pix."
            );
        } finally {
            setCarregando(false);
        }
    }

    // ========================================================
    // COPIAR CÓDIGO PIX
    // ========================================================

    async function copiarCodigo() {
        if (!pagamento?.pix?.codigo) return;

        if (pedidoExpirado) {
            setErro(
                "Este pedido expirou. O código Pix não deve mais ser utilizado."
            );
            return;
        }

        try {
            await navigator.clipboard.writeText(
                pagamento.pix.codigo
            );

            setCopiado(true);

            if (timeoutCopiaRef.current) {
                clearTimeout(timeoutCopiaRef.current);
            }

            timeoutCopiaRef.current = setTimeout(() => {
                setCopiado(false);
            }, 2000);
        } catch {
            setErro(
                "Não foi possível copiar o código Pix."
            );
        }
    }

    // ========================================================
    // NOVA TENTATIVA DE CARTÃO
    // ========================================================

    function prepararNovaTentativaCartao() {
        if (pedidoExpirado) {
            setErro(
                "O prazo para pagamento deste pedido terminou."
            );
            return;
        }

        setPagamento(null);
        setErro("");
        setMetodoSelecionado("CARTAO");
    }

    // ========================================================
    // CALLBACK ESTÁVEL DO CARTÃO
    // ========================================================

    const handlePagamentoCriado = useCallback(
        (novoPagamento) => {
            setErro("");
            setPagamento(novoPagamento);
            setMetodoSelecionado("CARTAO");
        },
        []
    );

    // ========================================================
    // RENDERIZAÇÃO
    // ========================================================

    return (
        <main className="min-h-[70vh] bg-[#FCFAF5] text-[#211C14]">

            {/* FAIXA DE NAVEGAÇÃO */}

            <div className="w-full max-md:hidden">
                <FaixaNavegacao
                    mostrarVoltar={false}
                    itens={[
                        {
                            label: "Início",
                            to: "/",
                        },
                        {
                            label: "Checkout",
                            to: podeEditarPedido
                                ? `/checkout?pedidoId=${encodeURIComponent(pedidoId)}`
                                : undefined,
                        },
                        {
                            label: "Pagamento",
                        },
                    ]}
                />
            </div>

            <div className="mx-auto max-w-2xl px-4 py-12">
                <section className="border border-[#E9DCC4] bg-white p-6 sm:p-10">

                    {/* ================================== */}
                    {/* CABEÇALHO */}
                    {/* ================================== */}

                    <div className="mb-8 text-center">
                        {metodoEhCartao ? (
                            <CreditCard
                                size={42}
                                className="mx-auto mb-4 text-[#968052]"
                            />
                        ) : (
                            <QrCode
                                size={42}
                                className="mx-auto mb-4 text-[#968052]"
                            />
                        )}

                        <p className="text-xs uppercase tracking-[0.25em] text-[#968052]">
                            AURORA
                        </p>

                        <h1 className="mt-3 font-serif text-3xl">
                            Finalizar pagamento
                        </h1>

                        {pedido?.valorTotal != null && (
                            <p className="mt-3 text-xl font-medium">
                                {formatarPreco(pedido.valorTotal)}
                            </p>
                        )}

                        {!pedidoExpirado && (
                            <p className="mt-3 text-sm text-[#756C5C]">
                                Escolha como deseja concluir o seu pedido.
                            </p>
                        )}
                    </div>

                    {/* ================================== */}
                    {/* CORRIGIR INFORMAÇÕES */}
                    {/* ================================== */}

                    {podeEditarPedido && (
                        <div className="mb-7 border border-[#E9DCC4] bg-[#FCFAF5] p-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-medium">
                                        Precisa corrigir alguma informação?
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-[#756C5C]">
                                        Revise seus dados de entrega antes de concluir o pagamento.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={voltarParaCheckout}
                                    className="inline-flex shrink-0 items-center justify-center gap-2 border border-[#968052] px-4 py-3 text-xs font-medium text-[#806B43] transition hover:bg-[#F1E8D8]"
                                >
                                    <ArrowLeft size={15} />
                                    Corrigir informações
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ================================== */}
                    {/* CONTADOR DE EXPIRAÇÃO */}
                    {/* ================================== */}

                    {!carregandoPagina &&
                        pedido?.status === "PENDENTE" &&
                        tempoRestante !== null &&
                        !pedidoCancelado && (
                            <div
                                className={`mb-7 border px-5 py-4 ${
                                    prazoEncerrado
                                        ? "border-red-200 bg-red-50"
                                        : tempoRestante <= 180
                                            ? "border-amber-200 bg-amber-50"
                                            : "border-[#E9DCC4] bg-[#FCFAF5]"
                                }`}
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <Clock3
                                        size={20}
                                        className={
                                            prazoEncerrado
                                                ? "text-red-700"
                                                : tempoRestante <= 180
                                                    ? "text-amber-700"
                                                    : "text-[#968052]"
                                        }
                                    />

                                    <div className="text-center">
                                        <p className="text-xs uppercase tracking-[0.15em] text-[#756C5C]">
                                            Tempo restante para pagamento
                                        </p>

                                        <p
                                            className={`mt-1 font-mono text-2xl font-semibold ${
                                                prazoEncerrado
                                                    ? "text-red-700"
                                                    : tempoRestante <= 180
                                                        ? "text-amber-700"
                                                        : "text-[#211C14]"
                                            }`}
                                        >
                                            {formatarTempoRestante(tempoRestante)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                    {/* ================================== */}
                    {/* PEDIDO EXPIRADO */}
                    {/* ================================== */}

                    {!carregandoPagina &&
                        pedido &&
                        pedidoExpirado && (
                            <div className="mb-7 border border-red-200 bg-red-50 px-5 py-5">
                                <div className="flex items-start gap-3">
                                    <TriangleAlert
                                        size={22}
                                        className="mt-0.5 shrink-0 text-red-700"
                                    />

                                    <div>
                                        <p className="font-medium text-red-800">
                                            Prazo de pagamento encerrado
                                        </p>

                                        <p className="mt-2 text-sm leading-6 text-red-700">
                                            O tempo reservado para concluir o pagamento deste pedido terminou.
                                            Por segurança, não é mais possível gerar Pix ou realizar
                                            o pagamento com cartão.
                                        </p>

                                        {confirmandoExpiracao &&
                                            !pedidoCancelado && (
                                                <p className="mt-3 flex items-center gap-2 text-xs text-red-700">
                                                    <LoaderCircle
                                                        size={14}
                                                        className="animate-spin"
                                                    />
                                                    Confirmando expiração do pedido...
                                                </p>
                                            )}

                                        {pedidoCancelado && (
                                            <p className="mt-3 text-xs text-red-700">
                                                O pedido foi cancelado e os produtos reservados
                                                foram devolvidos ao estoque.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                    <Link
                                        to="/produtos"
                                        className="flex flex-1 items-center justify-center bg-[#211C14] px-5 py-3 text-sm text-white transition hover:bg-[#968052]"
                                    >
                                        Voltar aos produtos
                                    </Link>

                                    <Link
                                        to="/pedidos"
                                        className="flex flex-1 items-center justify-center border border-[#E9DCC4] px-5 py-3 text-sm transition hover:border-[#968052]"
                                    >
                                        Ver meus pedidos
                                    </Link>
                                </div>
                            </div>
                        )}

                    {/* ================================== */}
                    {/* ERRO */}
                    {/* ================================== */}

                    {erro && !pedidoExpirado && (
                        <div
                            role="alert"
                            className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                        >
                            {erro}
                        </div>
                    )}

                    {/* ================================== */}
                    {/* CARREGAMENTO */}
                    {/* ================================== */}

                    {carregandoPagina && (
                        <div className="flex items-center justify-center gap-3 py-8 text-sm text-[#756C5C]">
                            <LoaderCircle
                                size={18}
                                className="animate-spin"
                            />
                            Carregando pagamento...
                        </div>
                    )}

                    {/* ================================== */}
                    {/* SELEÇÃO DO MÉTODO */}
                    {/* ================================== */}

                    {!carregandoPagina &&
                        pedido &&
                        podeEscolherMetodo && (
                            <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">

                                <button
                                    type="button"
                                    onClick={() => setMetodoSelecionado("PIX")}
                                    className={`border p-5 text-left transition ${
                                        metodoSelecionado === "PIX"
                                            ? "border-[#968052] bg-[#FCFAF5]"
                                            : "border-[#E9DCC4] bg-white hover:border-[#968052]"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <QrCode
                                            size={21}
                                            className="text-[#968052]"
                                        />
                                        <span className="font-medium">
                                            Pix
                                        </span>
                                    </div>

                                    <p className="mt-2 text-xs leading-5 text-[#756C5C]">
                                        Pagamento rápido e instantâneo.
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setMetodoSelecionado("CARTAO")}
                                    className={`border p-5 text-left transition ${
                                        metodoSelecionado === "CARTAO"
                                            ? "border-[#968052] bg-[#FCFAF5]"
                                            : "border-[#E9DCC4] bg-white hover:border-[#968052]"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <CreditCard
                                            size={21}
                                            className="text-[#968052]"
                                        />
                                        <span className="font-medium">
                                            Cartão de crédito
                                        </span>
                                    </div>

                                    <p className="mt-2 text-xs leading-5 text-[#756C5C]">
                                        Pagamento com cartão e possibilidade de parcelamento.
                                    </p>
                                </button>

                            </div>
                        )}

                    {/* ================================== */}
                    {/* PAGAMENTO EM ANDAMENTO */}
                    {/* ================================== */}

                    {!carregandoPagina &&
                        pedido &&
                        !aprovado &&
                        !pedidoExpirado &&
                        pagamentoEmAndamento &&
                        !pagamentoCartao && (
                            <div className="mb-6 border border-[#E9DCC4] bg-[#FCFAF5] p-4 text-center">
                                <p className="text-sm font-medium">
                                    Existe um pagamento em andamento.
                                </p>

                                <p className="mt-2 text-xs leading-5 text-[#756C5C]">
                                    Conclua esta tentativa antes de iniciar outra forma de pagamento.
                                </p>
                            </div>
                        )}

                    {/* ================================== */}
                    {/* PAGAMENTO PIX */}
                    {/* ================================== */}

                    {!carregandoPagina &&
                        pedido &&
                        !aprovado &&
                        !pedidoExpirado &&
                        metodoSelecionado === "PIX" && (
                            <div className="space-y-6">

                                {!pagamento && !pedidoPago && (
                                    <button
                                        type="button"
                                        onClick={gerarPix}
                                        disabled={carregando || pedidoExpirado}
                                        className="flex w-full items-center justify-center gap-3 bg-[#211C14] px-5 py-4 text-sm text-white transition hover:bg-[#968052] disabled:cursor-not-allowed disabled:bg-[#B9B2A6]"
                                    >
                                        {carregando ? (
                                            <>
                                                <LoaderCircle
                                                    size={18}
                                                    className="animate-spin"
                                                />
                                                Gerando Pix...
                                            </>
                                        ) : (
                                            "Gerar pagamento Pix"
                                        )}
                                    </button>
                                )}

                                {pagamento?.metodo === "PIX" && (
                                    <>

                                        {/* STATUS PIX */}

                                        <div className="border-y border-[#E9DCC4] py-5 text-center">
                                            <p className="text-xs text-[#756C5C]">
                                                Status do pagamento
                                            </p>

                                            <p className="mt-2 text-lg font-medium">
                                                {pagamento.status}
                                            </p>

                                            {pagamento.valor != null && (
                                                <p className="mt-1 text-sm text-[#756C5C]">
                                                    {formatarPreco(pagamento.valor)}
                                                </p>
                                            )}

                                            {consultando && (
                                                <p className="mt-2 flex items-center justify-center gap-2 text-xs text-[#968052]">
                                                    <RefreshCw
                                                        size={13}
                                                        className="animate-spin"
                                                    />
                                                    Atualizando status...
                                                </p>
                                            )}
                                        </div>

                                        {/* QR CODE PIX */}

                                        {pagamento.pix?.imagemBase64 &&
                                            mostrarDadosPix && (
                                                <div className="text-center">
                                                    <img
                                                        src={`data:image/png;base64,${pagamento.pix.imagemBase64}`}
                                                        alt="QR Code Pix"
                                                        className="mx-auto h-56 w-56 object-contain"
                                                    />
                                                </div>
                                            )}

                                        {/* CÓDIGO COPIA E COLA */}

                                        {pagamento.pix?.codigo &&
                                            mostrarDadosPix && (
                                                <div>
                                                    <label className="mb-2 block text-xs font-medium text-[#756C5C]">
                                                        Código Pix copia e cola
                                                    </label>

                                                    <div className="flex gap-2">
                                                        <input
                                                            readOnly
                                                            value={pagamento.pix.codigo}
                                                            className="min-w-0 flex-1 border border-[#E9DCC4] bg-[#FCFAF5] px-3 py-3 text-xs"
                                                        />

                                                        <button
                                                            type="button"
                                                            onClick={copiarCodigo}
                                                            disabled={pedidoExpirado}
                                                            className="flex shrink-0 items-center gap-2 bg-[#211C14] px-4 text-xs text-white hover:bg-[#968052] disabled:bg-[#B9B2A6]"
                                                        >
                                                            <Copy size={15} />
                                                            {copiado ? "Copiado!" : "Copiar"}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                        {/* NOVA TENTATIVA PIX */}

                                        {permiteNovaTentativa && (
                                            <div className="space-y-4">
                                                <div className="border border-[#E9DCC4] bg-[#FCFAF5] p-4 text-center">
                                                    <p className="text-sm font-medium">
                                                        {pagamento.status === "EXPIRADO" &&
                                                            "Este pagamento expirou."}

                                                        {pagamento.status === "CANCELADO" &&
                                                            "Este pagamento foi cancelado."}

                                                        {pagamento.status === "RECUSADO" &&
                                                            "Este pagamento foi recusado."}
                                                    </p>

                                                    <p className="mt-2 text-xs leading-5 text-[#756C5C]">
                                                        Você pode gerar uma nova tentativa
                                                        enquanto o prazo do pedido estiver ativo.
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={gerarPix}
                                                    disabled={carregando || pedidoExpirado}
                                                    className="flex w-full items-center justify-center gap-3 bg-[#211C14] px-5 py-4 text-sm text-white transition hover:bg-[#968052] disabled:bg-[#B9B2A6]"
                                                >
                                                    {carregando ? (
                                                        <>
                                                            <LoaderCircle
                                                                size={18}
                                                                className="animate-spin"
                                                            />
                                                            Gerando novo Pix...
                                                        </>
                                                    ) : (
                                                        "Gerar novo Pix"
                                                    )}
                                                </button>
                                            </div>
                                        )}

                                        {/* SEGURANÇA PIX */}

                                        {!permiteNovaTentativa &&
                                            mostrarDadosPix && (
                                                <div className="flex items-start gap-3 border-t border-[#E9DCC4] pt-5">
                                                    <ShieldCheck
                                                        size={19}
                                                        className="mt-0.5 shrink-0 text-[#968052]"
                                                    />

                                                    <p className="text-xs leading-5 text-[#756C5C]">
                                                        A confirmação do pagamento é realizada
                                                        pelo Mercado Pago.
                                                    </p>
                                                </div>
                                            )}

                                    </>
                                )}
                            </div>
                        )}

                    {/* ================================== */}
                    {/* CARTÃO EM PROCESSAMENTO */}
                    {/* ================================== */}

                    {!carregandoPagina &&
                        pedido &&
                        !aprovado &&
                        !pedidoExpirado &&
                        metodoEhCartao &&
                        cartaoEmAndamento && (
                            <div className="space-y-5">
                                <div className="border border-[#E9DCC4] bg-[#FCFAF5] px-5 py-5">
                                    <div className="flex items-start gap-3">
                                        <LoaderCircle
                                            size={20}
                                            className="mt-0.5 shrink-0 animate-spin text-[#968052]"
                                        />

                                        <div>
                                            <p className="font-medium">
                                                Processando pagamento
                                            </p>

                                            <p className="mt-2 text-sm leading-6 text-[#756C5C]">
                                                Estamos aguardando a confirmação do Mercado Pago.
                                                Não realize uma nova tentativa enquanto este pagamento
                                                estiver sendo processado.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-y border-[#E9DCC4] py-5 text-center">
                                    <p className="text-xs text-[#756C5C]">
                                        Status do pagamento
                                    </p>

                                    <p className="mt-2 text-lg font-medium">
                                        {pagamento.status}
                                    </p>

                                    {pagamento.valor != null && (
                                        <p className="mt-1 text-sm text-[#756C5C]">
                                            {formatarPreco(pagamento.valor)}
                                        </p>
                                    )}

                                    {consultando && (
                                        <p className="mt-2 flex items-center justify-center gap-2 text-xs text-[#968052]">
                                            <RefreshCw
                                                size={13}
                                                className="animate-spin"
                                            />
                                            Atualizando status...
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-start gap-3 border-t border-[#E9DCC4] pt-5">
                                    <ShieldCheck
                                        size={19}
                                        className="mt-0.5 shrink-0 text-[#968052]"
                                    />

                                    <p className="text-xs leading-5 text-[#756C5C]">
                                        A confirmação do pagamento é realizada pelo Mercado Pago.
                                    </p>
                                </div>
                            </div>
                        )}

                    {/* ================================== */}
                    {/* CARTÃO RECUSADO OU EXPIRADO */}
                    {/* ================================== */}

                    {!carregandoPagina &&
                        pedido &&
                        !aprovado &&
                        !pedidoExpirado &&
                        metodoEhCartao &&
                        cartaoFinalizadoSemSucesso && (
                            <div className="space-y-4">
                                <div className="border border-red-200 bg-red-50 px-5 py-4">
                                    <div className="flex items-start gap-3">
                                        <CreditCard
                                            size={20}
                                            className="mt-0.5 shrink-0 text-red-700"
                                        />

                                        <div>
                                            <p className="font-medium text-red-800">
                                                {pagamento.status === "RECUSADO" &&
                                                    "Pagamento recusado"}

                                                {pagamento.status === "CANCELADO" &&
                                                    "Pagamento cancelado"}

                                                {pagamento.status === "EXPIRADO" &&
                                                    "Pagamento expirado"}
                                            </p>

                                            <p className="mt-2 text-sm leading-6 text-red-700">
                                                Não foi possível concluir o pagamento com este cartão.
                                                Verifique os dados, tente novamente ou escolha
                                                outra forma de pagamento.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={prepararNovaTentativaCartao}
                                    disabled={pedidoExpirado}
                                    className="w-full bg-[#211C14] px-5 py-4 text-sm text-white transition hover:bg-[#968052] disabled:bg-[#B9B2A6]"
                                >
                                    Tentar novamente com cartão
                                </button>
                            </div>
                        )}

                    {/* ================================== */}
                    {/* FORMULÁRIO DE CARTÃO */}
                    {/* ================================== */}

                    {!carregandoPagina &&
                        pedido &&
                        !aprovado &&
                        !pedidoExpirado &&
                        !pedidoPago &&
                        metodoSelecionado === "CARTAO" &&
                        !cartaoEmAndamento &&
                        !cartaoFinalizadoSemSucesso &&
                        !pagamento && (
                            <PagamentoCartao
                                pedidoId={pedidoId}
                                valor={pedido.valorTotal}
                                onPagamentoCriado={handlePagamentoCriado}
                            />
                        )}

                    {/* ================================== */}
                    {/* PEDIDO JÁ PAGO */}
                    {/* ================================== */}

                    {!carregandoPagina &&
                        pedido &&
                        pedidoPago &&
                        !aprovado && (
                            <div className="border border-[#E9DCC4] bg-[#FCFAF5] p-5 text-center">
                                <ShieldCheck
                                    size={30}
                                    className="mx-auto text-[#968052]"
                                />

                                <p className="mt-3 font-medium">
                                    Este pedido já foi pago.
                                </p>

                                <p className="mt-2 text-sm text-[#756C5C]">
                                    Você pode acompanhar o andamento em Meus Pedidos.
                                </p>

                                <Link
                                    to={`/pedidos/${pedidoId}`}
                                    className="mt-5 inline-flex bg-[#211C14] px-5 py-3 text-sm text-white transition hover:bg-[#968052]"
                                >
                                    Ver pedido
                                </Link>
                            </div>
                        )}

                </section>
            </div>
        </main>
    );
}
