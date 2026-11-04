
import { useCallback, useMemo, useState } from "react";
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import { LoaderCircle, ShieldCheck, AlertCircle } from "lucide-react";
import { apiFetch } from "../../services/api.js";

// ======================================================
// MERCADO PAGO
// ======================================================

const PUBLIC_KEY = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;

// Inicializa o SDK fora do componente React.
// Evita executar initMercadoPago em cada renderização.
if (PUBLIC_KEY) {
    initMercadoPago(PUBLIC_KEY, {
        locale: "pt-BR",
    });
}

// Configuração estável para pagamento exclusivamente
// com cartão de crédito.
const CUSTOMIZATION = {
    paymentMethods: {
        minInstallments: 1,
        types: {
            excluded: ["debit_card", "prepaid_card"],
        },
    },
    visual: {
        style: {
            theme: "default",
        },
    },
};

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export default function PagamentoCartao({
    pedidoId,
    valor,
    onPagamentoCriado,
}) {
    // ==================================================
    // ESTADOS
    // ==================================================

    const [pronto, setPronto] = useState(false);
    const [processando, setProcessando] = useState(false);
    const [erro, setErro] = useState("");

    // ==================================================
    // VALIDAÇÃO DO VALOR
    // ==================================================

    const valorNumerico = Number(valor);

    const valorValido =
        Number.isFinite(valorNumerico) &&
        valorNumerico >= 0.5;

    const pedidoValido =
        typeof pedidoId === "string" &&
        pedidoId.trim().length > 0;

    const podeInicializar =
        Boolean(PUBLIC_KEY) &&
        pedidoValido &&
        valorValido;

    // ==================================================
    // INITIALIZATION
    // ==================================================

    const initialization = useMemo(
        () => ({
            amount: valorNumerico,
        }),
        [valorNumerico]
    );

    // ==================================================
    // IDENTIDADE DA INSTÂNCIA
    // ==================================================

    // A chave identifica a combinação de pedido e valor.
    // Se algum deles mudar, React desmonta o Brick anterior
    // e monta uma nova instância.
    const brickKey = useMemo(
        () => `${pedidoId}-${valorNumerico}`,
        [pedidoId, valorNumerico]
    );

    // ==================================================
    // BRICK READY
    // ==================================================

    const handleReady = useCallback(() => {
        console.info("Card Payment Brick pronto.");

        setPronto(true);
        setErro("");
    }, []);

    // ==================================================
    // BRICK ERROR
    // ==================================================

    const handleError = useCallback((error) => {
        console.error("Erro no Card Payment Brick:", {
            type: error?.type,
            cause: error?.cause,
            message: error?.message,
            detalhes: error,
        });

        if (
            error?.cause ===
            "card_payment_brick_initialization_failed"
        ) {
            setPronto(false);

            setErro(
                error?.message ||
                "Não foi possível inicializar o pagamento com cartão."
            );

            return;
        }

        if (
            error?.cause ===
            "missing_payment_information"
        ) {
            setErro(
                "Este cartão não está disponível para pagamento com crédito."
            );

            return;
        }

        setErro(
            error?.message ||
            "Não foi possível carregar ou processar os dados do cartão."
        );
    }, []);

    // ==================================================
    // ENVIAR PAGAMENTO
    // ==================================================

    const enviarPagamento = useCallback(
        async (formData, additionalData) => {
            setErro("");
            setProcessando(true);

            try {
                // ======================================
                // VALIDAR PEDIDO
                // ======================================

                if (!pedidoId) {
                    throw new Error(
                        "Pedido não identificado."
                    );
                }

                // ======================================
                // LOG SEGURO
                // ======================================

                // Nunca registrar o token completo,
                // número do cartão ou CVV.
                console.log("CARD PAYMENT:", {
                    pedidoId,
                    valor: valorNumerico,
                    paymentMethodId:
                        formData?.payment_method_id,
                    paymentTypeId:
                        additionalData?.paymentTypeId,
                    installments:
                        formData?.installments,
                    possuiToken:
                        Boolean(formData?.token),
                });

                // ======================================
                // TOKEN
                // ======================================

                if (!formData?.token) {
                    throw new Error(
                        "Não foi possível gerar o token do cartão."
                    );
                }

                // ======================================
                // PAYMENT METHOD
                // ======================================

                const paymentMethodId =
                    formData?.payment_method_id;

                if (!paymentMethodId) {
                    throw new Error(
                        "Não foi possível identificar o método do cartão."
                    );
                }

                // ======================================
                // PAYMENT TYPE
                // ======================================

                const paymentTypeId =
                    additionalData?.paymentTypeId;

                if (!paymentTypeId) {
                    throw new Error(
                        "Não foi possível identificar o tipo do cartão."
                    );
                }

                // ======================================
                // SOMENTE CRÉDITO
                // ======================================

                if (paymentTypeId !== "credit_card") {
                    console.warn(
                        "Cartão não identificado como crédito.",
                        {
                            paymentMethodId,
                            paymentTypeId,
                        }
                    );

                    throw new Error(
                        "O cartão informado não foi identificado como cartão de crédito. Utilize um cartão compatível."
                    );
                }

                // ======================================
                // PARCELAS
                // ======================================

                const parcelas =
                    Number(formData?.installments);

                if (
                    !Number.isInteger(parcelas) ||
                    parcelas < 1
                ) {
                    throw new Error(
                        "Quantidade de parcelas inválida."
                    );
                }

                // ======================================
                // DADOS DO PAGADOR
                // ======================================

                const payer = {
                    email:
                        formData?.payer?.email,
                    identification: {
                        type:
                            formData?.payer
                                ?.identification?.type,
                        number:
                            formData?.payer
                                ?.identification?.number,
                    },
                };

                // ======================================
                // PAYLOAD PARA O BACKEND
                // ======================================

                const dadosPagamento = {
                    pedidoId,
                    token: formData.token,
                    paymentMethodId,
                    installments: parcelas,
                    payer,
                };

                console.log("PAGAMENTO ENVIADO:", {
                    pedidoId,
                    paymentMethodId,
                    paymentTypeId,
                    installments: parcelas,
                    possuiToken: true,
                });

                // ======================================
                // BACKEND / ORDERS API
                // ======================================

                const resposta = await apiFetch(
                    "/pagamentos/cartao",
                    {
                        method: "POST",
                        body: JSON.stringify(
                            dadosPagamento
                        ),
                    }
                );

                // ======================================
                // VALIDAR RESPOSTA
                // ======================================

                if (
                    !resposta?.pagamento?.pagamentoId
                ) {
                    throw new Error(
                        "A API não retornou os dados esperados do pagamento."
                    );
                }

                // ======================================
                // NOTIFICAR COMPONENTE PAI
                // ======================================

                onPagamentoCriado?.(
                    resposta.pagamento
                );

                return resposta;
            } catch (error) {
                console.error(
                    "Erro no pagamento com crédito:",
                    error
                );

                setErro(
                    error?.message ||
                    "Não foi possível processar o pagamento."
                );

                // O Brick precisa receber a rejeição
                // para reconhecer a falha do submit.
                throw error;
            } finally {
                setProcessando(false);
            }
        },
        [
            pedidoId,
            valorNumerico,
            onPagamentoCriado,
        ]
    );

    // ==================================================
    // CHAVE PÚBLICA
    // ==================================================

    if (!PUBLIC_KEY) {
        return (
            <div role="alert" className="flex items-start gap-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>
                    A chave pública do Mercado Pago
                    não foi configurada.
                </p>
            </div>
        );
    }

    // ==================================================
    // COMPONENTE
    // ==================================================

    return (
        <div className="space-y-5">

            {/* DESCRIÇÃO */}

            <div className="border border-[#E9DCC4] bg-[#FCFAF5] px-4 py-3 text-xs leading-5 text-[#756C5C]">
                <p>
                    Pagamento com cartão de crédito.
                    Você poderá escolher a quantidade
                    de parcelas disponibilizada pelo
                    Mercado Pago.
                </p>
            </div>

            {/* VALIDAÇÃO DO PEDIDO */}

            {!pedidoValido && (
                <div role="alert" className="flex items-start gap-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p>
                        Não foi possível identificar o
                        pedido para pagamento.
                    </p>
                </div>
            )}

            {/* VALIDAÇÃO DO VALOR */}

            {!valorValido && (
                <div role="alert" className="flex items-start gap-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p>
                        O valor do pedido é inválido
                        para pagamento com cartão de crédito.
                    </p>
                </div>
            )}

            {/* CARREGANDO */}

            {podeInicializar && !pronto && !erro && (
                <div className="flex items-center justify-center gap-3 py-5 text-sm text-[#756C5C]">
                    <LoaderCircle
                        size={18}
                        className="animate-spin"
                    />

                    <span>
                        Carregando pagamento com cartão...
                    </span>
                </div>
            )}

            {/* ERRO */}

            {erro && (
                <div role="alert" className="flex items-start gap-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p>{erro}</p>
                </div>
            )}

            {/* PROCESSANDO */}

            {processando && (
                <div className="flex items-center justify-center gap-3 border border-[#E9DCC4] bg-[#FCFAF5] px-4 py-4 text-sm text-[#756C5C]">
                    <LoaderCircle
                        size={18}
                        className="animate-spin"
                    />

                    <span>
                        Processando pagamento com crédito...
                    </span>
                </div>
            )}

            {/* CARD PAYMENT BRICK */}

            {podeInicializar && (
                <div className={!pronto || processando ? "pointer-events-none opacity-60" : ""}>
                    <CardPayment
                        key={brickKey}
                        initialization={initialization}
                        customization={CUSTOMIZATION}
                        onReady={handleReady}
                        onSubmit={enviarPagamento}
                        onError={handleError}
                    />
                </div>
            )}

            {/* SEGURANÇA */}

            {pronto && (
                <div className="flex items-start gap-3 border-t border-[#E9DCC4] pt-5">
                    <ShieldCheck
                        size={19}
                        className="mt-0.5 shrink-0 text-[#968052]"
                    />

                    <p className="text-xs leading-5 text-[#756C5C]">
                        Os dados do seu cartão são
                        processados com segurança
                        pelo Mercado Pago.
                    </p>
                </div>
            )}
        </div>
    );
}
