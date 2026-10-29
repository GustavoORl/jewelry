
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    Minus,
    Plus,
    ShoppingBag,
    Trash2,
    RefreshCw,
    ShieldCheck,
    Truck,
} from "lucide-react";

import { apiFetch } from "../../services/api.js";

const formatarPreco = (valor) =>
    new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(valor) || 0);

export default function SacolaUser() {
    const navigate = useNavigate();

    const [sacola, setSacola] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [itemEmAtualizacao, setItemEmAtualizacao] = useState(null);
    const [erro, setErro] = useState("");


    const carregarSacola = useCallback(async () => {
        setCarregando(true);
        setErro("");

        try {
            const dados = await apiFetch("/sacola");

            // A API pode retornar a sacola diretamente
            // ou dentro de uma propriedade "sacola".
            const sacolaRecebida = dados?.sacola ?? dados;

            if (!sacolaRecebida || !Array.isArray(sacolaRecebida.itens)) {
                throw new Error(
                    "A resposta da API não contém os itens da sacola no formato esperado."
                );
            }

            setSacola(sacolaRecebida);
        } catch (error) {
            setErro(
                error.message || "Ocorreu um erro ao carregar a sacola."
            );
        } finally {
            setCarregando(false);
        }
    }, []);


    useEffect(() => {
        carregarSacola();
    }, [carregarSacola]);



    const atualizarQuantidade = async (item, novaQuantidade) => {
        if (novaQuantidade < 1 || itemEmAtualizacao) return;

        setItemEmAtualizacao(item.id);
        setErro("");

        try {
            const dados = await apiFetch(`/sacola/itens/${item.id}`, {
                method: "PATCH",
                body: JSON.stringify({
                    quantidade: novaQuantidade,
                }),
            });

            const sacolaAtualizada = dados?.sacola ?? dados;

            if (!Array.isArray(sacolaAtualizada?.itens)) {
                throw new Error("Não foi possível atualizar os dados da sacola.");
            }

            setSacola(sacolaAtualizada);
        } catch (error) {
            setErro(error.message || "Erro ao atualizar a quantidade.");
        } finally {
            setItemEmAtualizacao(null);
        }
    };




    const removerItem = async (itemId) => {
        if (itemEmAtualizacao) return;

        setItemEmAtualizacao(itemId);
        setErro("");

        try {
            const dados = await apiFetch(`/sacola/itens/${itemId}`, {
                method: "DELETE",
            });

            const sacolaAtualizada = dados?.sacola ?? dados;

            if (!Array.isArray(sacolaAtualizada?.itens)) {
                throw new Error("Não foi possível atualizar os dados da sacola.");
            }

            setSacola(sacolaAtualizada);
        } catch (error) {
            setErro(error.message || "Erro ao remover o produto.");
        } finally {
            setItemEmAtualizacao(null);
        }
    };


    const itens = sacola?.itens ?? [];
    const valorTotal = Number(sacola?.valorTotal ?? 0);
    const quantidadeItens = Number(sacola?.quantidadeItens ?? 0);
    const temItens = itens.length > 0;
    const temItemIndisponivel = itens.some((item) => !item.disponivel);

    const irParaCheckout = () => {
        navigate("/checkout");
    };

    return (
        <main className="min-h-screen bg-[#FCFAF5] text-[#211C14]">
            <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                <Link
                    to="/"
                    className="mb-8 inline-flex items-center gap-2 text-sm text-[#756C5C] transition hover:text-[#968052]"
                >
                    <ArrowLeft size={17} />
                    Continuar comprando
                </Link>

                <header className="mb-8 border-b border-[#E9DCC4] pb-6 sm:mb-10">
                    <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#968052]">
                        Suas escolhas especiais
                    </p>

                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl">
                                Minha sacola
                            </h1>

                            <p className="mt-3 text-sm text-[#756C5C]">
                                Revise suas joias antes de continuar.
                            </p>
                        </div>

                        {!carregando && (
                            <span className="text-sm text-[#756C5C]">
                                {quantidadeItens} {quantidadeItens === 1 ? "item" : "itens"}
                            </span>
                        )}
                    </div>
                </header>

                {erro && (
                    <div
                        role="alert"
                        className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                    >
                        <span>{erro}</span>

                        <button
                            type="button"
                            onClick={carregarSacola}
                            className="font-medium underline underline-offset-4"
                        >
                            Tentar novamente
                        </button>
                    </div>
                )}

                {carregando ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
                        <RefreshCw className="animate-spin text-[#968052]" size={28} />
                        <p className="text-sm text-[#756C5C]">
                            Preparando sua sacola...
                        </p>
                    </div>
                ) : !temItens ? (
                    <section className="flex min-h-[360px] flex-col items-center justify-center border border-[#E9DCC4] bg-white px-6 py-12 text-center">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#F8F3E8] text-[#968052]">
                            <ShoppingBag size={32} strokeWidth={1.3} />
                        </div>

                        <h2 className="font-serif text-2xl sm:text-3xl">
                            Sua sacola está vazia
                        </h2>

                        <p className="mt-3 max-w-md text-sm leading-6 text-[#756C5C]">
                            Que tal descobrir uma joia especial para completar sua coleção?
                        </p>

                        <Link
                            to="/"
                            className="mt-7 inline-flex items-center gap-3 bg-[#211C14] px-6 py-3 text-sm text-white transition hover:bg-[#968052]"
                        >
                            Explorar joias
                            <ArrowRight size={17} />
                        </Link>
                    </section>
                ) : (
                    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_360px] lg:gap-12">
                        <section className="min-w-0">
                            <div className="hidden grid-cols-[minmax(0,1fr)_120px_110px] gap-4 border-b border-[#E9DCC4] pb-4 text-xs uppercase tracking-wider text-[#756C5C] sm:grid">
                                <span>Produto</span>
                                <span className="text-center">Quantidade</span>
                                <span className="text-right">Subtotal</span>
                            </div>

                            <div className="divide-y divide-[#E9DCC4]">
                                {itens.map((item) => {
                                    const atualizando = itemEmAtualizacao === item.id;

                                    return (
                                        <article
                                            key={item.id}
                                            className={`grid grid-cols-1 gap-4 py-6 sm:grid-cols-[minmax(0,1fr)_120px_110px] sm:items-center sm:gap-4 ${atualizando ? "opacity-60" : ""
                                                }`}
                                        >
                                            <div className="flex min-w-0 gap-4">
                                                <div className="h-28 w-24 shrink-0 overflow-hidden bg-[#F8F3E8] sm:h-32 sm:w-28">
                                                    {item.imagem ? (
                                                        <img
                                                            src={item.imagem}
                                                            alt={item.nome}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-[#968052]">
                                                            <ShoppingBag size={28} strokeWidth={1.2} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex min-w-0 flex-col items-start py-1">
                                                    <span className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#968052]">
                                                        {item.categoria}
                                                    </span>

                                                    <h3>{item.nome}</h3>

                                                    <p>{formatarPreco(item.preco)}</p>

                                                    <p className="mt-1 text-xs text-stone-500">
                                                        Estoque disponível: {item.estoque}{" "}
                                                        {item.estoque === 1 ? "unidade" : "unidades"}
                                                    </p>

                                                    {!item.disponivel && (
                                                        <p className="mt-2 text-xs leading-5 text-red-700">
                                                            Produto indisponível ou quantidade acima do estoque.
                                                        </p>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => removerItem(item.id)}
                                                        disabled={Boolean(itemEmAtualizacao)}
                                                        className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-[#756C5C] transition hover:text-red-700 disabled:cursor-not-allowed"
                                                    >
                                                        <Trash2 size={14} />
                                                        Remover
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-center">
                                                <span className="text-xs text-[#756C5C] sm:hidden">
                                                    Quantidade
                                                </span>

                                                <div className="flex h-10 items-center border border-[#E9DCC4] bg-white">
                                                    <button
                                                        type="button"
                                                        aria-label={`Diminuir quantidade de ${item.nome}`}
                                                        disabled={item.quantidade <= 1 || Boolean(itemEmAtualizacao)}
                                                        onClick={() =>
                                                            atualizarQuantidade(item, item.quantidade - 1)
                                                        }
                                                        className="flex h-full w-9 items-center justify-center transition hover:bg-[#F8F3E8] disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        <Minus size={14} />
                                                    </button>

                                                    <span className="min-w-8 text-center text-sm tabular-nums">
                                                        {item.quantidade}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        aria-label={`Aumentar quantidade de ${item.nome}`}
                                                        disabled={
                                                            item.quantidade >= item.estoque ||
                                                            Boolean(itemEmAtualizacao) ||
                                                            !item.disponivel
                                                        }
                                                        onClick={() =>
                                                            atualizarQuantidade(item, item.quantidade + 1)
                                                        }
                                                        className="flex h-full w-9 items-center justify-center transition hover:bg-[#F8F3E8] disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end">
                                                <span className="text-xs text-[#756C5C] sm:hidden">
                                                    Subtotal
                                                </span>

                                                <span className="font-medium tabular-nums">
                                                    {formatarPreco(item.subtotal)}
                                                </span>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>

                        <aside className="border border-[#E9DCC4] bg-white p-5 sm:p-6 lg:sticky lg:top-6">
                            <h2 className="font-serif text-2xl">Resumo do pedido</h2>

                            <div className="mt-6 space-y-4 border-b border-[#E9DCC4] pb-5 text-sm">
                                <div className="flex justify-between gap-4 text-[#756C5C]">
                                    <span>Produtos ({quantidadeItens})</span>
                                    <span className="text-right tabular-nums">
                                        {formatarPreco(valorTotal)}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4 text-[#756C5C]">
                                    <span>Frete</span>
                                    <span className="text-right text-xs">
                                        Calculado na próxima etapa
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 py-5">
                                <span className="font-medium">Subtotal</span>
                                <span className="text-xl font-medium tabular-nums">
                                    {formatarPreco(valorTotal)}
                                </span>
                            </div>

                            <p className="mb-5 text-xs leading-5 text-[#756C5C]">
                                O valor final poderá mudar após o cálculo do frete e a validação
                                dos produtos na finalização da compra.
                            </p>

                            <button
                                type="button"
                                onClick={irParaCheckout}
                                disabled={temItemIndisponivel || Boolean(itemEmAtualizacao)}
                                className="flex w-full items-center justify-center gap-3 bg-[#211C14] px-5 py-4 text-sm text-white transition hover:bg-[#968052] disabled:cursor-not-allowed disabled:bg-[#B9B2A6]"
                            >
                                Continuar para entrega
                                <ArrowRight size={17} />
                            </button>

                            {temItemIndisponivel && (
                                <p className="mt-3 text-xs leading-5 text-red-700">
                                    Ajuste ou remova os produtos indisponíveis antes de continuar.
                                </p>
                            )}

                            <div className="mt-6 space-y-4 border-t border-[#E9DCC4] pt-5">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck
                                        size={19}
                                        className="mt-0.5 shrink-0 text-[#968052]"
                                    />
                                    <p className="text-xs leading-5 text-[#756C5C]">
                                        Compra protegida e pagamento processado com segurança.
                                    </p>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Truck
                                        size={19}
                                        className="mt-0.5 shrink-0 text-[#968052]"
                                    />
                                    <p className="text-xs leading-5 text-[#756C5C]">
                                        As opções de entrega serão apresentadas na próxima etapa.
                                    </p>
                                </div>
                            </div>

                            <Link
                                to="/"
                                className="mt-6 flex items-center justify-center gap-2 text-xs text-[#756C5C] transition hover:text-[#968052]"
                            >
                                <ArrowLeft size={14} />
                                Continuar explorando
                            </Link>
                        </aside>
                    </div>
                )}
            </div>
        </main>
    );
}
