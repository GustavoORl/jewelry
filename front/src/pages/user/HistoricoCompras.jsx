import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Clock3,
    CreditCard,
    LoaderCircle,
    Package,
    PackageCheck,
    ReceiptText,
    ShoppingBag,
    Truck,
    XCircle,
} from "lucide-react";

import { apiFetch } from "../../services/api.js";


/**
 * |--------------------------------------------------------------------------
 * | FORMATAÇÃO
 * |--------------------------------------------------------------------------
 */


function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}


function formatarData(data) {
    if (!data) {
        return "";
    }

    const dataConvertida = new Date(data);

    if (Number.isNaN(dataConvertida.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(dataConvertida);
}


function formatarDataHora(data) {
    if (!data) {
        return "";
    }

    const dataConvertida = new Date(data);

    if (Number.isNaN(dataConvertida.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(dataConvertida);
}


function reduzirId(id) {
    if (!id) {
        return "";
    }

    return id.slice(-8).toUpperCase();
}


/**
 * |--------------------------------------------------------------------------
 * | STATUS DO PEDIDO
 * |--------------------------------------------------------------------------
 */


const STATUS_PEDIDO = {
    PENDENTE: {
        texto: "Aguardando pagamento",

        descricao:
            "Seu pedido foi criado e está aguardando a conclusão do pagamento.",

        Icone: Clock3,

        classe:
            "border-amber-200 bg-amber-50 text-amber-700",
    },

    PAGO: {
        texto: "Pagamento aprovado",

        descricao:
            "Recebemos seu pagamento e o pedido será preparado em breve.",

        Icone: CheckCircle2,

        classe:
            "border-emerald-200 bg-emerald-50 text-emerald-700",
    },

    EM_PREPARACAO: {
        texto: "Em preparação",

        descricao:
            "Seu pedido está sendo preparado com todo cuidado.",

        Icone: Package,

        classe:
            "border-[#E9DCC4] bg-[#F8F3E8] text-[#75633D]",
    },

    ENVIADO: {
        texto: "Pedido enviado",

        descricao:
            "Seu pedido já saiu para entrega.",

        Icone: Truck,

        classe:
            "border-blue-200 bg-blue-50 text-blue-700",
    },

    ENTREGUE: {
        texto: "Pedido entregue",

        descricao:
            "Seu pedido foi entregue.",

        Icone: PackageCheck,

        classe:
            "border-emerald-200 bg-emerald-50 text-emerald-700",
    },

    CANCELADO: {
        texto: "Pedido cancelado",

        descricao:
            "Este pedido foi cancelado.",

        Icone: XCircle,

        classe:
            "border-red-200 bg-red-50 text-red-700",
    },
};


function obterStatusPedido(status) {
    return (
        STATUS_PEDIDO[status] || {
            texto:
                status
                    ?.replaceAll("_", " ")
                    ?.toLowerCase() || "Pedido",

            descricao:
                "Consulte os detalhes do pedido.",

            Icone: Package,

            classe:
                "border-gray-200 bg-gray-50 text-gray-700",
        }
    );
}


/**
 * |--------------------------------------------------------------------------
 * | PAGAMENTO
 * |--------------------------------------------------------------------------
 */


function formatarMetodoPagamento(metodo) {
    if (!metodo) {
        return null;
    }

    const metodos = {
        PIX: "Pix",

        CREDITO: "Cartão de crédito",
        CREDITO_CARTAO: "Cartão de crédito",
        CARTAO_CREDITO: "Cartão de crédito",

        DEBITO: "Cartão de débito",
        DEBITO_CARTAO: "Cartão de débito",
        CARTAO_DEBITO: "Cartão de débito",

        BOLETO: "Boleto",
    };

    return (
        metodos[metodo] ||
        metodo
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(
                /\b\w/g,
                (letra) =>
                    letra.toUpperCase()
            )
    );
}


function formatarStatusPagamento(status) {
    if (!status) {
        return null;
    }

    const statusPagamento = {
        PENDENTE: "Pendente",

        PROCESSANDO: "Processando",

        APROVADO: "Aprovado",

        RECUSADO: "Recusado",

        CANCELADO: "Cancelado",

        REEMBOLSADO: "Reembolsado",

        EXPIRADO: "Expirado",
    };

    return (
        statusPagamento[status] ||
        status
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(
                /\b\w/g,
                (letra) =>
                    letra.toUpperCase()
            )
    );
}


/**
 * |--------------------------------------------------------------------------
 * | COMPONENTE
 * |--------------------------------------------------------------------------
 */


export default function HistoricoCompras() {
    const navigate = useNavigate();


    const [pedidos, setPedidos] =
        useState([]);


    const [carregando, setCarregando] =
        useState(true);


    const [erro, setErro] =
        useState("");


    /**
     * |--------------------------------------------------------------------------
     * | BUSCAR PEDIDOS
     * |--------------------------------------------------------------------------
     */


    useEffect(() => {
        async function carregarPedidos() {
            try {
                setCarregando(true);

                setErro("");


                const resposta =
                    await apiFetch(
                        "/pedidos"
                    );


                if (
                    !resposta ||
                    !Array.isArray(
                        resposta.pedidos
                    )
                ) {
                    throw new Error(
                        "A API não retornou os pedidos corretamente."
                    );
                }


                setPedidos(
                    resposta.pedidos
                );
            } catch (error) {
                console.error(
                    "Erro ao carregar histórico de compras:",
                    error
                );


                setErro(
                    error.message ||
                    "Não foi possível carregar suas compras."
                );
            } finally {
                setCarregando(false);
            }
        }


        carregarPedidos();
    }, []);


    /**
     * |--------------------------------------------------------------------------
     * | INFORMAÇÕES RESUMIDAS
     * |--------------------------------------------------------------------------
     */


    const quantidadePedidos =
        pedidos.length;


    const quantidadeProdutos =
        useMemo(() => {
            return pedidos.reduce(
                (
                    total,
                    pedido
                ) => {
                    const quantidade =
                        pedido.itens?.reduce(
                            (
                                subtotal,
                                item
                            ) =>
                                subtotal +
                                Number(
                                    item.quantidade ||
                                    0
                                ),
                            0
                        ) || 0;


                    return (
                        total +
                        quantidade
                    );
                },
                0
            );
        }, [pedidos]);


    /**
     * |--------------------------------------------------------------------------
     * | VERIFICAR SE AINDA PODE PAGAR
     * |--------------------------------------------------------------------------
     */


    function podeContinuarPagamento(
        pedido
    ) {
        if (
            pedido.status !==
            "PENDENTE"
        ) {
            return false;
        }


        if (!pedido.expiraEm) {
            return true;
        }


        const expiraEm =
            new Date(
                pedido.expiraEm
            ).getTime();


        if (
            Number.isNaN(
                expiraEm
            )
        ) {
            return false;
        }


        return (
            expiraEm >
            Date.now()
        );
    }


    /**
     * |--------------------------------------------------------------------------
     * | LOADING
     * |--------------------------------------------------------------------------
     */


    if (carregando) {
        return (
            <main
                className="
                    min-h-screen
                    bg-[#FCFAF5]
                "
            >
                <div
                    className="
                        mx-auto
                        flex
                        min-h-[70vh]
                        max-w-[1240px]
                        items-center
                        justify-center
                        px-4
                        sm:px-6
                        lg:px-8
                    "
                >
                    <div
                        className="
                            flex
                            flex-col
                            items-center
                            gap-4
                            text-center
                        "
                    >
                        <LoaderCircle
                            size={36}
                            className="
                                animate-spin
                                text-[#968052]
                            "
                        />


                        <div>
                            <p
                                className="
                                    font-serif
                                    text-xl
                                    text-[#211C14]
                                "
                            >
                                Carregando suas compras
                            </p>


                            <p
                                className="
                                    mt-1
                                    text-sm
                                    text-[#756C5C]
                                "
                            >
                                Estamos buscando seu histórico de pedidos.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        );
    }


    return (
        <main
            className="
                min-h-screen
                bg-[#FCFAF5]
            "
        >
            <div
                className="
                    mx-auto
                    max-w-[1240px]
                    px-4
                    py-8
                    sm:px-6
                    lg:px-8
                    lg:py-12
                "
            >

                {/* VOLTAR */}

                <button
                    type="button"
                    onClick={() =>
                        navigate(-1)
                    }
                    className="
                        mb-8
                        inline-flex
                        items-center
                        gap-2
                        text-sm
                        font-medium
                        text-[#756C5C]
                        transition
                        hover:text-[#968052]
                    "
                >
                    <ArrowLeft
                        size={17}
                    />

                    Voltar
                </button>


                {/* CABEÇALHO */}

                <section
                    className="
                        mb-10
                    "
                >
                    <div
                        className="
                            flex
                            items-start
                            gap-4
                        "
                    >
                        <div
                            className="
                                flex
                                h-12
                                w-12
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                border
                                border-[#E9DCC4]
                                bg-[#F8F3E8]
                                text-[#968052]
                            "
                        >
                            <ShoppingBag
                                size={22}
                            />
                        </div>


                        <div>
                            <p
                                className="
                                    mb-1
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-[0.18em]
                                    text-[#968052]
                                "
                            >
                                Sua conta
                            </p>


                            <h1
                                className="
                                    font-serif
                                    text-3xl
                                    text-[#211C14]
                                    sm:text-4xl
                                "
                            >
                                Minhas compras
                            </h1>


                            <p
                                className="
                                    mt-2
                                    max-w-2xl
                                    text-sm
                                    leading-6
                                    text-[#756C5C]
                                    sm:text-base
                                "
                            >
                                Acompanhe seus pedidos,
                                pagamentos e o andamento
                                das suas compras.
                            </p>
                        </div>
                    </div>
                </section>


                {/* ERRO */}

                {erro && (
                    <div
                        className="
                            mb-8
                            flex
                            items-start
                            gap-3
                            rounded-xl
                            border
                            border-red-200
                            bg-red-50
                            p-4
                            text-red-700
                        "
                    >
                        <AlertCircle
                            size={20}
                            className="
                                mt-0.5
                                shrink-0
                            "
                        />


                        <div>
                            <p
                                className="
                                    font-medium
                                "
                            >
                                Não foi possível carregar suas compras
                            </p>


                            <p
                                className="
                                    mt-1
                                    text-sm
                                "
                            >
                                {erro}
                            </p>
                        </div>
                    </div>
                )}


                {/* SEM PEDIDOS */}

                {!erro &&
                    pedidos.length ===
                        0 && (
                        <section
                            className="
                                rounded-2xl
                                border
                                border-[#E9DCC4]
                                bg-white
                                px-6
                                py-16
                                text-center
                                shadow-sm
                            "
                        >
                            <div
                                className="
                                    mx-auto
                                    flex
                                    h-16
                                    w-16
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-[#F8F3E8]
                                    text-[#968052]
                                "
                            >
                                <ShoppingBag
                                    size={28}
                                />
                            </div>


                            <h2
                                className="
                                    mt-5
                                    font-serif
                                    text-2xl
                                    text-[#211C14]
                                "
                            >
                                Você ainda não fez nenhuma compra
                            </h2>


                            <p
                                className="
                                    mx-auto
                                    mt-2
                                    max-w-md
                                    text-sm
                                    leading-6
                                    text-[#756C5C]
                                "
                            >
                                Quando você realizar
                                seu primeiro pedido,
                                ele aparecerá aqui
                                para que possa
                                acompanhar todos os
                                detalhes.
                            </p>


                            <Link
                                to="/produtos"
                                className="
                                    mt-7
                                    inline-flex
                                    items-center
                                    gap-2
                                    rounded-lg
                                    bg-[#211C14]
                                    px-6
                                    py-3
                                    text-sm
                                    font-semibold
                                    text-white
                                    transition
                                    hover:bg-[#968052]
                                "
                            >
                                Explorar produtos

                                <ArrowRight
                                    size={17}
                                />
                            </Link>
                        </section>
                    )}


                {/* PEDIDOS */}

                {!erro &&
                    pedidos.length >
                        0 && (
                        <>
                            {/* RESUMO */}

                            <div
                                className="
                                    mb-6
                                    flex
                                    flex-wrap
                                    items-center
                                    gap-x-5
                                    gap-y-2
                                    text-sm
                                    text-[#756C5C]
                                "
                            >
                                <span>
                                    <strong
                                        className="
                                            font-semibold
                                            text-[#211C14]
                                        "
                                    >
                                        {
                                            quantidadePedidos
                                        }
                                    </strong>{" "}

                                    {quantidadePedidos ===
                                    1
                                        ? "pedido"
                                        : "pedidos"}
                                </span>


                                <span
                                    className="
                                        hidden
                                        h-1
                                        w-1
                                        rounded-full
                                        bg-[#C8B991]
                                        sm:block
                                    "
                                />


                                <span>
                                    <strong
                                        className="
                                            font-semibold
                                            text-[#211C14]
                                        "
                                    >
                                        {
                                            quantidadeProdutos
                                        }
                                    </strong>{" "}

                                    {quantidadeProdutos ===
                                    1
                                        ? "item comprado"
                                        : "itens comprados"}
                                </span>
                            </div>


                            {/* LISTA DE PEDIDOS */}

                            <div
                                className="
                                    space-y-5
                                "
                            >
                                {pedidos.map(
                                    (
                                        pedido
                                    ) => {

                                        /*
                                         * Status do pedido
                                         */

                                        const status =
                                            obterStatusPedido(
                                                pedido.status
                                            );


                                        const IconeStatus =
                                            status.Icone;


                                        /*
                                         * Pagamentos.
                                         *
                                         * O backend retorna os
                                         * pagamentos ordenados
                                         * por criadoEm desc.
                                         *
                                         * Primeiro damos preferência
                                         * para um pagamento aprovado.
                                         * Caso não exista, usamos
                                         * a tentativa mais recente.
                                         */

                                        const pagamentos =
                                            Array.isArray(
                                                pedido.pagamentos
                                            )
                                                ? pedido.pagamentos
                                                : [];


                                        const pagamentoAprovado =
                                            pagamentos.find(
                                                (
                                                    pagamento
                                                ) =>
                                                    pagamento.status ===
                                                    "APROVADO"
                                            );


                                        const pagamento =
                                            pagamentoAprovado ||
                                            pagamentos[0] ||
                                            null;


                                        /*
                                         * Verifica se o usuário
                                         * ainda pode continuar
                                         * o pagamento.
                                         */

                                        const continuarPagamento =
                                            podeContinuarPagamento(
                                                pedido
                                            );


                                        /*
                                         * Garante que itens
                                         * sempre seja um array.
                                         */

                                        const itens =
                                            Array.isArray(
                                                pedido.itens
                                            )
                                                ? pedido.itens
                                                : [];


                                        return (
                                            <article
                                                key={
                                                    pedido.id
                                                }
                                                className="
                                                    overflow-hidden
                                                    rounded-2xl
                                                    border
                                                    border-[#E9DCC4]
                                                    bg-white
                                                    shadow-sm
                                                    transition
                                                    hover:shadow-md
                                                "
                                            >

                                                {/* TOPO DO PEDIDO */}

                                                <div
                                                    className="
                                                        border-b
                                                        border-[#EEE5D4]
                                                        bg-[#FFFEFB]
                                                        px-5
                                                        py-5
                                                        sm:px-6
                                                    "
                                                >
                                                    <div
                                                        className="
                                                            flex
                                                            flex-col
                                                            gap-4
                                                            sm:flex-row
                                                            sm:items-center
                                                            sm:justify-between
                                                        "
                                                    >

                                                        <div
                                                            className="
                                                                flex
                                                                flex-wrap
                                                                items-center
                                                                gap-x-6
                                                                gap-y-3
                                                            "
                                                        >

                                                            {/* NÚMERO */}

                                                            <div>
                                                                <p
                                                                    className="
                                                                        text-xs
                                                                        uppercase
                                                                        tracking-[0.12em]
                                                                        text-[#968052]
                                                                    "
                                                                >
                                                                    Pedido
                                                                </p>


                                                                <p
                                                                    className="
                                                                        mt-1
                                                                        text-sm
                                                                        font-semibold
                                                                        text-[#211C14]
                                                                    "
                                                                    title={
                                                                        pedido.id
                                                                    }
                                                                >
                                                                    #
                                                                    {reduzirId(
                                                                        pedido.id
                                                                    )}
                                                                </p>
                                                            </div>


                                                            {/* DATA */}

                                                            <div>
                                                                <p
                                                                    className="
                                                                        text-xs
                                                                        uppercase
                                                                        tracking-[0.12em]
                                                                        text-[#968052]
                                                                    "
                                                                >
                                                                    Realizado em
                                                                </p>


                                                                <p
                                                                    className="
                                                                        mt-1
                                                                        text-sm
                                                                        font-medium
                                                                        text-[#211C14]
                                                                    "
                                                                >
                                                                    {formatarData(
                                                                        pedido.criadoEm
                                                                    )}
                                                                </p>
                                                            </div>


                                                            {/* TOTAL */}

                                                            <div>
                                                                <p
                                                                    className="
                                                                        text-xs
                                                                        uppercase
                                                                        tracking-[0.12em]
                                                                        text-[#968052]
                                                                    "
                                                                >
                                                                    Total
                                                                </p>


                                                                <p
                                                                    className="
                                                                        mt-1
                                                                        text-sm
                                                                        font-semibold
                                                                        text-[#211C14]
                                                                    "
                                                                >
                                                                    {formatarMoeda(
                                                                        pedido.valorTotal
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>


                                                        {/* BADGE STATUS */}

                                                        <div
                                                            className={`
                                                                inline-flex
                                                                w-fit
                                                                items-center
                                                                gap-2
                                                                rounded-full
                                                                border
                                                                px-3
                                                                py-1.5
                                                                text-xs
                                                                font-semibold
                                                                ${status.classe}
                                                            `}
                                                        >
                                                            <IconeStatus
                                                                size={
                                                                    15
                                                                }
                                                            />

                                                            {
                                                                status.texto
                                                            }
                                                        </div>
                                                    </div>
                                                </div>


                                                {/* CONTEÚDO */}

                                                <div
                                                    className="
                                                        p-5
                                                        sm:p-6
                                                    "
                                                >

                                                    {/* STATUS */}

                                                    <div
                                                        className="
                                                            mb-6
                                                            flex
                                                            items-start
                                                            gap-3
                                                        "
                                                    >
                                                        <div
                                                            className="
                                                                mt-0.5
                                                                flex
                                                                h-9
                                                                w-9
                                                                shrink-0
                                                                items-center
                                                                justify-center
                                                                rounded-full
                                                                bg-[#F8F3E8]
                                                                text-[#968052]
                                                            "
                                                        >
                                                            <IconeStatus
                                                                size={
                                                                    18
                                                                }
                                                            />
                                                        </div>


                                                        <div>
                                                            <p
                                                                className="
                                                                    font-medium
                                                                    text-[#211C14]
                                                                "
                                                            >
                                                                {
                                                                    status.texto
                                                                }
                                                            </p>


                                                            <p
                                                                className="
                                                                    mt-0.5
                                                                    text-sm
                                                                    leading-5
                                                                    text-[#756C5C]
                                                                "
                                                            >
                                                                {
                                                                    status.descricao
                                                                }
                                                            </p>


                                                            {pedido.status ===
                                                                "PENDENTE" &&
                                                                pedido.expiraEm &&
                                                                continuarPagamento && (
                                                                    <p
                                                                        className="
                                                                            mt-1
                                                                            text-xs
                                                                            text-[#968052]
                                                                        "
                                                                    >
                                                                        Pagamento disponível até{" "}

                                                                        {formatarDataHora(
                                                                            pedido.expiraEm
                                                                        )}
                                                                    </p>
                                                                )}
                                                        </div>
                                                    </div>


                                                    {/* PRODUTOS */}

                                                    <div
                                                        className="
                                                            overflow-hidden
                                                            rounded-xl
                                                            border
                                                            border-[#EEE5D4]
                                                        "
                                                    >
                                                        {itens.length ===
                                                        0 ? (
                                                            <div
                                                                className="
                                                                    p-5
                                                                    text-sm
                                                                    text-[#756C5C]
                                                                "
                                                            >
                                                                Nenhum produto encontrado neste pedido.
                                                            </div>
                                                        ) : (
                                                            itens.map(
                                                                (
                                                                    item,
                                                                    index
                                                                ) => {

                                                                    /*
                                                                     * A API retorna
                                                                     * apenas a primeira
                                                                     * imagem do produto.
                                                                     */

                                                                    const imagem =
                                                                        item.produto
                                                                            ?.imagens?.[0]
                                                                            ?.url;


                                                                    const textoAlternativo =
                                                                        item.produto
                                                                            ?.imagens?.[0]
                                                                            ?.textoAlternativo;


                                                                    const slug =
                                                                        item.produto
                                                                            ?.slug;


                                                                    /*
                                                                     * Subtotal deste item.
                                                                     */

                                                                    const subtotal =
                                                                        Number(
                                                                            item.precoUnitario ||
                                                                            0
                                                                        ) *
                                                                        Number(
                                                                            item.quantidade ||
                                                                            0
                                                                        );


                                                                    return (
                                                                        <div
                                                                            key={
                                                                                item.id
                                                                            }
                                                                            className={`
                                                                                flex
                                                                                flex-col
                                                                                gap-4
                                                                                px-4
                                                                                py-4
                                                                                sm:flex-row
                                                                                sm:items-center
                                                                                sm:justify-between

                                                                                ${
                                                                                    index !==
                                                                                    itens.length -
                                                                                        1
                                                                                        ? "border-b border-[#EEE5D4]"
                                                                                        : ""
                                                                                }
                                                                            `}
                                                                        >

                                                                            {/* PRODUTO */}

                                                                            <div
                                                                                className="
                                                                                    flex
                                                                                    min-w-0
                                                                                    items-center
                                                                                    gap-4
                                                                                "
                                                                            >

                                                                                {/* IMAGEM */}

                                                                                {imagem ? (
                                                                                    slug ? (
                                                                                        <Link
                                                                                            to={`/produtos/${slug}`}
                                                                                            className="
                                                                                                group
                                                                                                h-20
                                                                                                w-20
                                                                                                shrink-0
                                                                                                overflow-hidden
                                                                                                rounded-lg
                                                                                                bg-[#F8F3E8]
                                                                                            "
                                                                                        >
                                                                                            <img
                                                                                                src={
                                                                                                    imagem
                                                                                                }
                                                                                                alt={
                                                                                                    textoAlternativo ||
                                                                                                    item.nomeProduto
                                                                                                }
                                                                                                loading="lazy"
                                                                                                className="
                                                                                                    h-full
                                                                                                    w-full
                                                                                                    object-cover
                                                                                                    transition
                                                                                                    duration-300
                                                                                                    group-hover:scale-105
                                                                                                "
                                                                                            />
                                                                                        </Link>
                                                                                    ) : (
                                                                                        <div
                                                                                            className="
                                                                                                h-20
                                                                                                w-20
                                                                                                shrink-0
                                                                                                overflow-hidden
                                                                                                rounded-lg
                                                                                                bg-[#F8F3E8]
                                                                                            "
                                                                                        >
                                                                                            <img
                                                                                                src={
                                                                                                    imagem
                                                                                                }
                                                                                                alt={
                                                                                                    textoAlternativo ||
                                                                                                    item.nomeProduto
                                                                                                }
                                                                                                loading="lazy"
                                                                                                className="
                                                                                                    h-full
                                                                                                    w-full
                                                                                                    object-cover
                                                                                                "
                                                                                            />
                                                                                        </div>
                                                                                    )
                                                                                ) : (
                                                                                    <div
                                                                                        className="
                                                                                            flex
                                                                                            h-20
                                                                                            w-20
                                                                                            shrink-0
                                                                                            items-center
                                                                                            justify-center
                                                                                            rounded-lg
                                                                                            bg-[#F8F3E8]
                                                                                        "
                                                                                    >
                                                                                        <Package
                                                                                            size={
                                                                                                24
                                                                                            }
                                                                                            className="
                                                                                                text-[#B9A77F]
                                                                                            "
                                                                                        />
                                                                                    </div>
                                                                                )}


                                                                                {/* DADOS DO PRODUTO */}

                                                                                <div
                                                                                    className="
                                                                                        min-w-0
                                                                                    "
                                                                                >
                                                                                    {slug ? (
                                                                                        <Link
                                                                                            to={`/produtos/${slug}`}
                                                                                            className="
                                                                                                line-clamp-2
                                                                                                text-sm
                                                                                                font-medium
                                                                                                text-[#211C14]
                                                                                                transition
                                                                                                hover:text-[#968052]
                                                                                            "
                                                                                        >
                                                                                            {
                                                                                                item.nomeProduto
                                                                                            }
                                                                                        </Link>
                                                                                    ) : (
                                                                                        <p
                                                                                            className="
                                                                                                line-clamp-2
                                                                                                text-sm
                                                                                                font-medium
                                                                                                text-[#211C14]
                                                                                            "
                                                                                        >
                                                                                            {
                                                                                                item.nomeProduto
                                                                                            }
                                                                                        </p>
                                                                                    )}


                                                                                    <p
                                                                                        className="
                                                                                            mt-2
                                                                                            text-xs
                                                                                            text-[#756C5C]
                                                                                        "
                                                                                    >
                                                                                        Quantidade:{" "}
                                                                                        {
                                                                                            item.quantidade
                                                                                        }
                                                                                    </p>


                                                                                    <p
                                                                                        className="
                                                                                            mt-1
                                                                                            text-xs
                                                                                            text-[#8A8172]
                                                                                        "
                                                                                    >
                                                                                        Valor unitário:{" "}

                                                                                        {formatarMoeda(
                                                                                            item.precoUnitario
                                                                                        )}
                                                                                    </p>
                                                                                </div>
                                                                            </div>


                                                                            {/* SUBTOTAL */}

                                                                            <div
                                                                                className="
                                                                                    pl-24
                                                                                    sm:pl-0
                                                                                    sm:text-right
                                                                                "
                                                                            >
                                                                                <p
                                                                                    className="
                                                                                        text-xs
                                                                                        text-[#8A8172]
                                                                                    "
                                                                                >
                                                                                    Subtotal
                                                                                </p>


                                                                                <p
                                                                                    className="
                                                                                        mt-1
                                                                                        whitespace-nowrap
                                                                                        text-sm
                                                                                        font-semibold
                                                                                        text-[#211C14]
                                                                                    "
                                                                                >
                                                                                    {formatarMoeda(
                                                                                        subtotal
                                                                                    )}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }
                                                            )
                                                        )}
                                                    </div>


                                                    {/* INFORMAÇÕES */}

                                                    <div
                                                        className="
                                                            mt-5
                                                            grid
                                                            gap-3
                                                            md:grid-cols-2
                                                        "
                                                    >

                                                        {/* PAGAMENTO */}

                                                        <div
                                                            className="
                                                                rounded-xl
                                                                bg-[#F8F3E8]
                                                                p-4
                                                            "
                                                        >
                                                            <div
                                                                className="
                                                                    flex
                                                                    items-start
                                                                    gap-3
                                                                "
                                                            >
                                                                <CreditCard
                                                                    size={
                                                                        18
                                                                    }
                                                                    className="
                                                                        mt-0.5
                                                                        shrink-0
                                                                        text-[#968052]
                                                                    "
                                                                />


                                                                <div>
                                                                    <p
                                                                        className="
                                                                            text-xs
                                                                            font-semibold
                                                                            uppercase
                                                                            tracking-[0.12em]
                                                                            text-[#968052]
                                                                        "
                                                                    >
                                                                        Pagamento
                                                                    </p>


                                                                    {pagamento ? (
                                                                        <>
                                                                            <p
                                                                                className="
                                                                                    mt-1
                                                                                    font-medium
                                                                                    text-[#211C14]
                                                                                "
                                                                            >
                                                                                {formatarMetodoPagamento(
                                                                                    pagamento.metodo
                                                                                )}
                                                                            </p>


                                                                            <p
                                                                                className="
                                                                                    mt-1
                                                                                    text-sm
                                                                                    text-[#756C5C]
                                                                                "
                                                                            >
                                                                                Status:{" "}

                                                                                <span
                                                                                    className="
                                                                                        font-medium
                                                                                        text-[#211C14]
                                                                                    "
                                                                                >
                                                                                    {formatarStatusPagamento(
                                                                                        pagamento.status
                                                                                    )}
                                                                                </span>
                                                                            </p>
                                                                        </>
                                                                    ) : (
                                                                        <p
                                                                            className="
                                                                                mt-1
                                                                                text-sm
                                                                                text-[#756C5C]
                                                                            "
                                                                        >
                                                                            Nenhum pagamento iniciado.
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>


                                                        {/* DESTINATÁRIO */}

                                                        <div
                                                            className="
                                                                rounded-xl
                                                                bg-[#F8F3E8]
                                                                p-4
                                                            "
                                                        >
                                                            <div
                                                                className="
                                                                    flex
                                                                    items-start
                                                                    gap-3
                                                                "
                                                            >
                                                                <ReceiptText
                                                                    size={
                                                                        18
                                                                    }
                                                                    className="
                                                                        mt-0.5
                                                                        shrink-0
                                                                        text-[#968052]
                                                                    "
                                                                />


                                                                <div>
                                                                    <p
                                                                        className="
                                                                            text-xs
                                                                            font-semibold
                                                                            uppercase
                                                                            tracking-[0.12em]
                                                                            text-[#968052]
                                                                        "
                                                                    >
                                                                        Destinatário
                                                                    </p>


                                                                    <p
                                                                        className="
                                                                            mt-1
                                                                            font-medium
                                                                            text-[#211C14]
                                                                        "
                                                                    >
                                                                        {pedido.destinatario ||
                                                                            "Não informado"}
                                                                    </p>


                                                                    <p
                                                                        className="
                                                                            mt-1
                                                                            text-sm
                                                                            text-[#756C5C]
                                                                        "
                                                                    >
                                                                        Consulte os detalhes para ver as informações completas do pedido.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>


                                                    {/* AÇÕES */}

                                                    <div
                                                        className="
                                                            mt-6
                                                            flex
                                                            flex-col-reverse
                                                            gap-3
                                                            border-t
                                                            border-[#EEE5D4]
                                                            pt-5
                                                            sm:flex-row
                                                            sm:items-center
                                                            sm:justify-end
                                                        "
                                                    >
                                                        <Link
                                                            to={`/pedidos/${pedido.id}`}
                                                            className="
                                                                inline-flex
                                                                items-center
                                                                justify-center
                                                                gap-2
                                                                rounded-lg
                                                                border
                                                                border-[#DCCDAF]
                                                                px-5
                                                                py-2.5
                                                                text-sm
                                                                font-semibold
                                                                text-[#4E4639]
                                                                transition
                                                                hover:border-[#968052]
                                                                hover:text-[#968052]
                                                            "
                                                        >
                                                            Ver detalhes

                                                            <ArrowRight
                                                                size={
                                                                    16
                                                                }
                                                            />
                                                        </Link>


                                                        {continuarPagamento && (
                                                            <Link
                                                                to={`/pagamento/${pedido.id}`}
                                                                className="
                                                                    inline-flex
                                                                    items-center
                                                                    justify-center
                                                                    gap-2
                                                                    rounded-lg
                                                                    bg-[#211C14]
                                                                    px-5
                                                                    py-2.5
                                                                    text-sm
                                                                    font-semibold
                                                                    text-white
                                                                    transition
                                                                    hover:bg-[#968052]
                                                                "
                                                            >
                                                                <CreditCard
                                                                    size={
                                                                        16
                                                                    }
                                                                />

                                                                Continuar pagamento
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    }
                                )}
                            </div>
                        </>
                    )}
            </div>
        </main>
    );
}