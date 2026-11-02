import { useEffect, useMemo, useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    LoaderCircle,
    MapPin,
    PackageCheck,
    Plus,
    ShieldCheck,
    ShoppingBag,
} from "lucide-react";

import { apiFetch } from "../../services/api.js";


const formatarPreco = (valor) =>
    new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(valor) || 0);


const camposEndereco = [
    {
        nome: "destinatario",
        label: "Nome do destinatário",
        placeholder: "Nome completo",
        tipo: "text",
        largo: true,
    },
    {
        nome: "cep",
        label: "CEP",
        placeholder: "00000-000",
        tipo: "text",
    },
    {
        nome: "rua",
        label: "Rua",
        placeholder: "Nome da rua",
        tipo: "text",
    },
    {
        nome: "numero",
        label: "Número",
        placeholder: "123",
        tipo: "text",
    },
    {
        nome: "complemento",
        label: "Complemento (opcional)",
        placeholder: "Apartamento, bloco...",
        tipo: "text",
        largo: true,
    },
    {
        nome: "bairro",
        label: "Bairro",
        placeholder: "Seu bairro",
        tipo: "text",
    },
    {
        nome: "cidade",
        label: "Cidade",
        placeholder: "Sua cidade",
        tipo: "text",
    },
    {
        nome: "estado",
        label: "Estado",
        placeholder: "SP",
        tipo: "text",
    },
];


const enderecoInicial = {
    destinatario: "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
};


export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();

    // IDs dos itens da sacola selecionados pelo usuário.
    const idsSelecionados = location.state?.itensSelecionados ?? [];

    const [sacola, setSacola] = useState(null);

    // Endereços cadastrados do usuário.
    const [enderecos, setEnderecos] = useState([]);

    // ID do endereço cadastrado escolhido.
    const [enderecoSelecionadoId, setEnderecoSelecionadoId] = useState("");

    // Controla se o usuário quer utilizar um endereço novo.
    const [usarNovoEndereco, setUsarNovoEndereco] = useState(false);

    // Dados digitados no formulário de novo endereço.
    const [endereco, setEndereco] = useState(enderecoInicial);

    // Se o novo endereço deve ser salvo na conta.
    const [salvarNovoEndereco, setSalvarNovoEndereco] = useState(true);

    const [carregando, setCarregando] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState("");


    /*
     * Carrega:
     * - sacola
     * - endereços cadastrados
     */
    useEffect(() => {
        let ativo = true;

        async function carregarCheckout() {
            try {
                setCarregando(true);
                setErro("");

                const [dadosSacola, dadosEnderecos] = await Promise.all([
                    apiFetch("/sacola"),
                    apiFetch("/enderecos"),
                ]);

                const recebida = dadosSacola?.sacola ?? dadosSacola;

                if (!Array.isArray(recebida?.itens)) {
                    throw new Error(
                        "Não foi possível carregar os itens da sacola."
                    );
                }

                const listaEnderecos = Array.isArray(
                    dadosEnderecos?.enderecos
                )
                    ? dadosEnderecos.enderecos
                    : Array.isArray(dadosEnderecos)
                      ? dadosEnderecos
                      : [];

                if (!ativo) return;

                setSacola(recebida);
                setEnderecos(listaEnderecos);

                /*
                 * Se já houver endereços:
                 * - tenta selecionar o principal;
                 * - se não houver principal, seleciona o primeiro.
                 */
                if (listaEnderecos.length > 0) {
                    const principal =
                        listaEnderecos.find(
                            (item) => item.principal
                        ) ?? listaEnderecos[0];

                    setEnderecoSelecionadoId(principal.id);
                    setUsarNovoEndereco(false);
                } else {
                    /*
                     * Se ainda não existir nenhum endereço,
                     * abre diretamente o formulário.
                     */
                    setEnderecoSelecionadoId("");
                    setUsarNovoEndereco(true);
                    setSalvarNovoEndereco(true);
                }
            } catch (error) {
                if (ativo) {
                    setErro(
                        error.message ||
                            "Erro ao carregar o checkout."
                    );
                }
            } finally {
                if (ativo) {
                    setCarregando(false);
                }
            }
        }

        carregarCheckout();

        return () => {
            ativo = false;
        };
    }, []);


    // Mantém somente os itens selecionados na sacola.
    const itensSelecionados = useMemo(() => {
        if (!sacola?.itens || !idsSelecionados.length) {
            return [];
        }

        const ids = new Set(idsSelecionados);

        return sacola.itens.filter((item) =>
            ids.has(item.id)
        );
    }, [sacola, idsSelecionados]);


    // Calcula os valores exclusivamente dos itens selecionados.
    const total = useMemo(
        () =>
            itensSelecionados.reduce(
                (soma, item) =>
                    soma + Number(item.subtotal || 0),
                0
            ),
        [itensSelecionados]
    );


    const temItens = itensSelecionados.length > 0;


    const indisponivel = itensSelecionados.some(
        (item) => !item.disponivel
    );


    /*
     * Endereço cadastrado atualmente selecionado.
     */
    const enderecoSelecionado = useMemo(() => {
        if (usarNovoEndereco) {
            return null;
        }

        return (
            enderecos.find(
                (item) => item.id === enderecoSelecionadoId
            ) ?? null
        );
    }, [
        enderecos,
        enderecoSelecionadoId,
        usarNovoEndereco,
    ]);


    function alterarEndereco(evento) {
        const { name, value } = evento.target;

        let novoValor = value;

        if (name === "estado") {
            novoValor = value.toUpperCase().slice(0, 2);
        }

        /*
         * Formatação simples do CEP:
         * 11665000 -> 11665-000
         */
        if (name === "cep") {
            const apenasNumeros = value
                .replace(/\D/g, "")
                .slice(0, 8);

            novoValor =
                apenasNumeros.length > 5
                    ? `${apenasNumeros.slice(
                          0,
                          5
                      )}-${apenasNumeros.slice(5)}`
                    : apenasNumeros;
        }

        setEndereco((atual) => ({
            ...atual,
            [name]: novoValor,
        }));
    }


    function selecionarEndereco(id) {
        setEnderecoSelecionadoId(id);
        setUsarNovoEndereco(false);
        setErro("");
    }


    function selecionarNovoEndereco() {
        setEnderecoSelecionadoId("");
        setUsarNovoEndereco(true);
        setErro("");
    }


    /*
     * Remove propriedades que pertencem ao cadastro do endereço,
     * mas que não precisam ser enviadas como snapshot para o pedido.
     */
    function montarEnderecoPedido(enderecoOrigem) {
        return {
            destinatario: enderecoOrigem.destinatario,
            cep: enderecoOrigem.cep,
            rua: enderecoOrigem.rua,
            numero: enderecoOrigem.numero,
            complemento:
                enderecoOrigem.complemento || "",
            bairro: enderecoOrigem.bairro,
            cidade: enderecoOrigem.cidade,
            estado: enderecoOrigem.estado,
        };
    }


    async function confirmarPedido(evento) {
        evento.preventDefault();

        setErro("");

        if (!temItens) {
            setErro(
                "Nenhum produto foi selecionado para o pedido."
            );
            return;
        }

        if (indisponivel) {
            setErro(
                "Existem produtos selecionados indisponíveis. Volte à sacola e ajuste os itens."
            );
            return;
        }

        if (
            !usarNovoEndereco &&
            !enderecoSelecionadoId
        ) {
            setErro(
                "Selecione um endereço de entrega."
            );
            return;
        }

        setEnviando(true);

        try {
            let enderecoEntrega;


            /*
             * NOVO ENDEREÇO
             */
            if (usarNovoEndereco) {
                enderecoEntrega =
                    montarEnderecoPedido(endereco);

                /*
                 * Caso o usuário queira salvar o endereço,
                 * cadastra primeiro na conta.
                 */
                if (salvarNovoEndereco) {
                    const respostaEndereco =
                        await apiFetch("/enderecos", {
                            method: "POST",
                            body: JSON.stringify(endereco),
                        });

                    /*
                     * Se a API retornar o endereço criado,
                     * usamos os dados retornados.
                     */
                    if (respostaEndereco?.endereco) {
                        enderecoEntrega =
                            montarEnderecoPedido(
                                respostaEndereco.endereco
                            );
                    }
                }
            }

            /*
             * ENDEREÇO JÁ CADASTRADO
             */
            else {
                const encontrado = enderecos.find(
                    (item) =>
                        item.id === enderecoSelecionadoId
                );

                if (!encontrado) {
                    throw new Error(
                        "O endereço selecionado não foi encontrado."
                    );
                }

                enderecoEntrega =
                    montarEnderecoPedido(encontrado);
            }


            /*
             * Cria o pedido.
             */
            const resposta = await apiFetch("/pedidos", {
                method: "POST",

                body: JSON.stringify({
                    endereco: enderecoEntrega,

                    itensSelecionados:
                        itensSelecionados.map(
                            (item) => item.id
                        ),
                }),
            });


            if (!resposta?.pedido?.id) {
                throw new Error(
                    "A API não retornou os dados esperados do pedido."
                );
            }


            navigate(
                `/pagamento/${resposta.pedido.id}`
            );
        } catch (error) {
            setErro(
                error.message ||
                    "Não foi possível criar o pedido."
            );
        } finally {
            setEnviando(false);
        }
    }


    /*
     * LOADING
     */
    if (carregando) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center bg-[#FCFAF5]">
                <div className="flex items-center gap-3 text-sm text-[#756C5C]">
                    <LoaderCircle
                        className="animate-spin"
                        size={22}
                    />

                    Carregando seu checkout...
                </div>
            </main>
        );
    }


    /*
     * NENHUM ITEM SELECIONADO
     */
    if (!temItens) {
        return (
            <main className="min-h-[60vh] bg-[#FCFAF5] px-4 py-16 text-center text-[#211C14]">
                <ShoppingBag
                    className="mx-auto mb-5 text-[#968052]"
                    size={42}
                />

                <h1 className="font-serif text-3xl">
                    Nenhum produto selecionado
                </h1>

                <p className="mt-3 text-sm text-[#756C5C]">
                    Volte à sacola e selecione os
                    produtos que deseja comprar.
                </p>

                <Link
                    to="/sacola"
                    className="mt-7 inline-flex items-center gap-2 bg-[#211C14] px-6 py-3 text-sm text-white hover:bg-[#968052]"
                >
                    <ArrowLeft size={16} />
                    Voltar à sacola
                </Link>
            </main>
        );
    }


    return (
        <main className="min-h-screen bg-[#FCFAF5] text-[#211C14]">
            <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">

                {/* VOLTAR */}

                <Link
                    to="/sacola"
                    className="mb-8 inline-flex items-center gap-2 text-sm text-[#756C5C] transition hover:text-[#968052]"
                >
                    <ArrowLeft size={17} />
                    Voltar à sacola
                </Link>


                {/* CABEÇALHO */}

                <header className="mb-8 border-b border-[#E9DCC4] pb-6 sm:mb-10">
                    <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#968052]">
                        Sua experiência AURELIA
                    </p>

                    <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl">
                        Finalizar pedido
                    </h1>

                    <p className="mt-3 text-sm text-[#756C5C]">
                        Escolha onde deseja receber
                        suas joias.
                    </p>
                </header>


                {/* ERRO */}

                {erro && (
                    <div
                        role="alert"
                        className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                    >
                        {erro}
                    </div>
                )}


                {/* PRODUTO INDISPONÍVEL */}

                {indisponivel && (
                    <div className="mb-6 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        Há produtos selecionados
                        indisponíveis ou com quantidade
                        acima do estoque.

                        <Link
                            to="/sacola"
                            className="ml-1 underline underline-offset-4"
                        >
                            Revisar sacola
                        </Link>
                    </div>
                )}


                <form
                    onSubmit={confirmarPedido}
                    className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12"
                >

                    {/* ENDEREÇO */}

                    <section className="border border-[#E9DCC4] bg-white p-5 sm:p-8">

                        <div className="mb-7 flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center bg-[#F8F3E8] text-[#968052]">
                                <MapPin
                                    size={21}
                                    strokeWidth={1.4}
                                />
                            </div>

                            <div>
                                <h2 className="font-serif text-2xl">
                                    Endereço de entrega
                                </h2>

                                <p className="mt-1 text-xs text-[#756C5C]">
                                    Escolha um endereço
                                    cadastrado ou informe
                                    um novo.
                                </p>
                            </div>

                        </div>


                        {/* ENDEREÇOS CADASTRADOS */}

                        {enderecos.length > 0 && (
                            <>
                                <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-[#968052]">
                                    Seus endereços
                                </p>

                                <div className="space-y-3">

                                    {enderecos.map(
                                        (item) => {
                                            const selecionado =
                                                !usarNovoEndereco &&
                                                enderecoSelecionadoId ===
                                                    item.id;

                                            return (
                                                <label
                                                    key={
                                                        item.id
                                                    }
                                                    className={`block cursor-pointer border p-4 transition ${
                                                        selecionado
                                                            ? "border-[#968052] bg-[#FCFAF5]"
                                                            : "border-[#E9DCC4] bg-white hover:border-[#CDBB98]"
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-4">

                                                        <input
                                                            type="radio"
                                                            name="enderecoEntrega"
                                                            checked={
                                                                selecionado
                                                            }
                                                            onChange={() =>
                                                                selecionarEndereco(
                                                                    item.id
                                                                )
                                                            }
                                                            className="mt-1 h-4 w-4 accent-[#968052]"
                                                        />

                                                        <div className="min-w-0 flex-1">

                                                            <div className="flex flex-wrap items-center gap-2">

                                                                <p className="text-sm font-medium">
                                                                    {
                                                                        item.destinatario
                                                                    }
                                                                </p>

                                                                {item.principal && (
                                                                    <span className="bg-[#F8F3E8] px-2 py-1 text-[10px] uppercase tracking-wider text-[#968052]">
                                                                        Principal
                                                                    </span>
                                                                )}

                                                                {selecionado && (
                                                                    <CheckCircle2
                                                                        size={
                                                                            16
                                                                        }
                                                                        className="ml-auto text-[#968052]"
                                                                    />
                                                                )}

                                                            </div>


                                                            <p className="mt-2 text-sm leading-6 text-[#756C5C]">
                                                                {
                                                                    item.rua
                                                                }
                                                                ,{" "}
                                                                {
                                                                    item.numero
                                                                }

                                                                {item.complemento
                                                                    ? ` - ${item.complemento}`
                                                                    : ""}
                                                            </p>


                                                            <p className="text-sm leading-6 text-[#756C5C]">
                                                                {
                                                                    item.bairro
                                                                }{" "}
                                                                —{" "}
                                                                {
                                                                    item.cidade
                                                                }
                                                                /
                                                                {
                                                                    item.estado
                                                                }
                                                            </p>


                                                            <p className="mt-1 text-xs text-[#968052]">
                                                                CEP{" "}
                                                                {
                                                                    item.cep
                                                                }
                                                            </p>

                                                        </div>
                                                    </div>
                                                </label>
                                            );
                                        }
                                    )}


                                    {/* OUTRO ENDEREÇO */}

                                    <label
                                        className={`block cursor-pointer border p-4 transition ${
                                            usarNovoEndereco
                                                ? "border-[#968052] bg-[#FCFAF5]"
                                                : "border-[#E9DCC4] bg-white hover:border-[#CDBB98]"
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">

                                            <input
                                                type="radio"
                                                name="enderecoEntrega"
                                                checked={
                                                    usarNovoEndereco
                                                }
                                                onChange={
                                                    selecionarNovoEndereco
                                                }
                                                className="h-4 w-4 accent-[#968052]"
                                            />

                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#F8F3E8] text-[#968052]">
                                                <Plus
                                                    size={
                                                        18
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium">
                                                    Usar outro
                                                    endereço
                                                </p>

                                                <p className="mt-1 text-xs text-[#756C5C]">
                                                    Informe um
                                                    endereço
                                                    diferente
                                                    para esta
                                                    entrega.
                                                </p>
                                            </div>

                                        </div>
                                    </label>

                                </div>
                            </>
                        )}


                        {/* FORMULÁRIO NOVO ENDEREÇO */}

                        {usarNovoEndereco && (
                            <div
                                className={
                                    enderecos.length >
                                    0
                                        ? "mt-8 border-t border-[#E9DCC4] pt-7"
                                        : ""
                                }
                            >

                                <div className="mb-6">

                                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#968052]">
                                        {enderecos.length >
                                        0
                                            ? "Novo endereço"
                                            : "Cadastre seu endereço"}
                                    </p>

                                    <h3 className="mt-2 font-serif text-xl">
                                        {enderecos.length >
                                        0
                                            ? "Informe o novo endereço de entrega"
                                            : "Onde você deseja receber seu pedido?"}
                                    </h3>

                                    {enderecos.length ===
                                        0 && (
                                        <p className="mt-2 text-xs leading-5 text-[#756C5C]">
                                            Este será seu
                                            primeiro
                                            endereço e
                                            poderá ser
                                            utilizado nas
                                            próximas
                                            compras.
                                        </p>
                                    )}

                                </div>


                                <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">

                                    {camposEndereco.map(
                                        (campo) => (
                                            <div
                                                key={
                                                    campo.nome
                                                }
                                                className={
                                                    campo.largo
                                                        ? "sm:col-span-2"
                                                        : ""
                                                }
                                            >
                                                <label
                                                    htmlFor={
                                                        campo.nome
                                                    }
                                                    className="mb-2 block text-xs font-medium text-[#756C5C]"
                                                >
                                                    {
                                                        campo.label
                                                    }

                                                    {campo.nome !==
                                                        "complemento" && (
                                                        <span className="text-red-700">
                                                            {" "}
                                                            *
                                                        </span>
                                                    )}
                                                </label>


                                                <input
                                                    id={
                                                        campo.nome
                                                    }
                                                    name={
                                                        campo.nome
                                                    }
                                                    type={
                                                        campo.tipo
                                                    }
                                                    value={
                                                        endereco[
                                                            campo
                                                                .nome
                                                        ]
                                                    }
                                                    onChange={
                                                        alterarEndereco
                                                    }
                                                    placeholder={
                                                        campo.placeholder
                                                    }
                                                    required={
                                                        usarNovoEndereco &&
                                                        campo.nome !==
                                                            "complemento"
                                                    }
                                                    autoComplete={
                                                        {
                                                            destinatario:
                                                                "name",
                                                            cep: "postal-code",
                                                            rua: "street-address",
                                                            numero:
                                                                "address-line2",
                                                            bairro:
                                                                "address-level3",
                                                            cidade:
                                                                "address-level2",
                                                            estado:
                                                                "address-level1",
                                                        }[
                                                            campo
                                                                .nome
                                                        ] ||
                                                        "off"
                                                    }
                                                    maxLength={
                                                        campo.nome ===
                                                        "cep"
                                                            ? 9
                                                            : undefined
                                                    }
                                                    className="w-full border border-[#E9DCC4] bg-[#FCFAF5] px-4 py-3 text-sm outline-none transition placeholder:text-[#B1A99B] focus:border-[#968052] focus:ring-1 focus:ring-[#968052]"
                                                />
                                            </div>
                                        )
                                    )}

                                </div>


                                {/* SALVAR ENDEREÇO */}

                                <label className="mt-6 flex cursor-pointer items-start gap-3 border-t border-[#E9DCC4] pt-6">

                                    <input
                                        type="checkbox"
                                        checked={
                                            salvarNovoEndereco
                                        }
                                        onChange={(
                                            evento
                                        ) =>
                                            setSalvarNovoEndereco(
                                                evento
                                                    .target
                                                    .checked
                                            )
                                        }
                                        className="mt-0.5 h-4 w-4 accent-[#968052]"
                                    />

                                    <div>
                                        <p className="text-sm font-medium">
                                            Salvar este
                                            endereço na
                                            minha conta
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-[#756C5C]">
                                            Assim você
                                            poderá
                                            utilizá-lo
                                            novamente em
                                            compras
                                            futuras.
                                        </p>
                                    </div>

                                </label>

                            </div>
                        )}


                        {/* ENDEREÇO SELECIONADO */}

                        {!usarNovoEndereco &&
                            enderecoSelecionado && (
                                <div className="mt-7 flex items-start gap-3 border-t border-[#E9DCC4] pt-6">

                                    <CheckCircle2
                                        size={20}
                                        className="mt-0.5 shrink-0 text-[#968052]"
                                    />

                                    <div>
                                        <p className="text-xs font-medium text-[#211C14]">
                                            Endereço
                                            selecionado
                                            para entrega
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-[#756C5C]">
                                            {
                                                enderecoSelecionado.rua
                                            }
                                            ,{" "}
                                            {
                                                enderecoSelecionado.numero
                                            }{" "}
                                            —{" "}
                                            {
                                                enderecoSelecionado.cidade
                                            }
                                            /
                                            {
                                                enderecoSelecionado.estado
                                            }
                                        </p>
                                    </div>

                                </div>
                            )}


                        {/* AVISO */}

                        <div className="mt-7 flex items-start gap-3 border-t border-[#E9DCC4] pt-6">

                            <ShieldCheck
                                size={20}
                                className="mt-0.5 shrink-0 text-[#968052]"
                            />

                            <p className="text-xs leading-5 text-[#756C5C]">
                                Confira o endereço antes
                                de confirmar. Os dados
                                serão registrados no
                                pedido para preservar as
                                informações da entrega.
                            </p>

                        </div>

                    </section>


                    {/* RESUMO DO PEDIDO */}

                    <aside className="border border-[#E9DCC4] bg-white p-5 sm:p-6 lg:top-6">

                        <div className="flex items-center gap-3">

                            <PackageCheck
                                className="text-[#968052]"
                                size={22}
                            />

                            <h2 className="font-serif text-2xl">
                                Resumo do pedido
                            </h2>

                        </div>


                        <p className="mt-2 text-xs text-[#756C5C]">
                            {itensSelecionados.length}{" "}
                            produto(s) selecionado(s)
                        </p>


                        {/* PRODUTOS */}

                        <div className="mt-6 divide-y divide-[#E9DCC4]">

                            {itensSelecionados.map(
                                (item) => (
                                    <div
                                        key={item.id}
                                        className="flex gap-3 py-4"
                                    >

                                        <div className="h-16 w-14 shrink-0 overflow-hidden bg-[#F8F3E8]">

                                            {item.imagem ? (
                                                <img
                                                    src={
                                                        item.imagem
                                                    }
                                                    alt={
                                                        item.nome
                                                    }
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-[#968052]">
                                                    <ShoppingBag
                                                        size={
                                                            20
                                                        }
                                                    />
                                                </div>
                                            )}

                                        </div>


                                        <div className="min-w-0 flex-1">

                                            <p className="text-sm">
                                                {
                                                    item.nome
                                                }
                                            </p>

                                            <p className="mt-1 text-xs text-[#756C5C]">
                                                Quantidade:{" "}
                                                {
                                                    item.quantidade
                                                }
                                            </p>

                                            <p className="mt-2 text-sm font-medium">
                                                {formatarPreco(
                                                    item.subtotal
                                                )}
                                            </p>

                                        </div>

                                    </div>
                                )
                            )}

                        </div>


                        {/* VALORES */}

                        <div className="mt-2 space-y-4 border-t border-[#E9DCC4] pt-5 text-sm">

                            <div className="flex justify-between gap-4 text-[#756C5C]">

                                <span>
                                    Subtotal dos produtos
                                </span>

                                <span className="tabular-nums">
                                    {formatarPreco(
                                        total
                                    )}
                                </span>

                            </div>


                            <div className="flex justify-between gap-4 text-[#756C5C]">

                                <span>Frete</span>

                                <span>
                                    A calcular
                                </span>

                            </div>


                            <div className="flex items-center justify-between gap-4 border-t border-[#E9DCC4] pt-5">

                                <span className="font-medium">
                                    Total atual
                                </span>

                                <span className="text-xl font-medium tabular-nums">
                                    {formatarPreco(
                                        total
                                    )}
                                </span>

                            </div>


                            <p className="text-xs leading-5 text-[#756C5C]">
                                O total ainda não inclui
                                o frete.
                            </p>

                        </div>


                        {/* CONFIRMAR */}

                        <button
                            type="submit"
                            disabled={
                                enviando ||
                                indisponivel
                            }
                            className="mt-6 flex w-full items-center justify-center gap-3 bg-[#211C14] px-5 py-4 text-sm text-white transition hover:bg-[#968052] disabled:cursor-not-allowed disabled:bg-[#B9B2A6]"
                        >

                            {enviando ? (
                                <>
                                    <LoaderCircle
                                        className="animate-spin"
                                        size={17}
                                    />

                                    Criando pedido...
                                </>
                            ) : (
                                <>
                                    Confirmar pedido

                                    <ArrowRight
                                        size={17}
                                    />
                                </>
                            )}

                        </button>


                        <p className="mt-4 text-center text-xs leading-5 text-[#756C5C]">
                            Após confirmar o pedido,
                            você será direcionado para
                            escolher a forma de
                            pagamento.
                        </p>

                    </aside>

                </form>

            </div>
        </main>
    );
}