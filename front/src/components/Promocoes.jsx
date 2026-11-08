import EditorialCarrossel from "./EditorialCarrossel.jsx";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    Clock3,
    ShieldCheck,
    Truck,
    RefreshCcw,
    Gem,
} from "lucide-react";

import { apiFetch } from "../services/api.js";

const beneficios = [
    {
        icon: ShieldCheck,
        titulo: "Compra segura",
        descricao: "Proteção em cada etapa",
    },
    {
        icon: Truck,
        titulo: "Entrega nacional",
        descricao: "Enviamos para todo o Brasil",
    },
    {
        icon: RefreshCcw,
        titulo: "Atendimento",
        descricao: "Suporte para sua compra",
    },
    {
        icon: Gem,
        titulo: "Seleção especial",
        descricao: "Joias escolhidas com cuidado",
    },
];

const imagemPromocao = "/assets/images/promocao-joia.png";

function extrairProdutos(resultado) {
    if (Array.isArray(resultado)) return resultado;

    if (Array.isArray(resultado?.produtos)) {
        return resultado.produtos;
    }

    if (Array.isArray(resultado?.dados?.produtos)) {
        return resultado.dados.produtos;
    }

    if (Array.isArray(resultado?.dados)) {
        return resultado.dados;
    }

    return [];
}

function calcularDesconto(produto) {
    const original = Number(produto.preco);
    const promocional = Number(produto.precoPromocional);

    if (
        produto.ativo === false ||
        produto.emPromocao !== true ||
        !Number.isFinite(original) ||
        !Number.isFinite(promocional) ||
        original <= 0 ||
        promocional < 0 ||
        promocional >= original
    ) {
        return 0;
    }

    return ((original - promocional) / original) * 100;
}

export default function Promocoes() {
    const [produtos, setProdutos] = useState([]);

    useEffect(() => {
        let ativo = true;

        async function carregarProdutos() {
            try {
                const resultado = await apiFetch("/produtos");

                if (ativo) {
                    setProdutos(extrairProdutos(resultado));
                }
            } catch (error) {
                console.error(
                    "Erro ao carregar promoções:",
                    error
                );
            }
        }

        carregarProdutos();

        return () => {
            ativo = false;
        };
    }, []);

    const dadosPromocionais = useMemo(() => {
        const promocoes = produtos
            .map((produto) => ({
                ...produto,
                descontoCalculado: calcularDesconto(produto),
            }))
            .filter((produto) => produto.descontoCalculado > 0);

        const maiorDesconto = promocoes.reduce(
            (maior, produto) =>
                Math.max(maior, produto.descontoCalculado),
            0
        );

        return {
            quantidade: promocoes.length,
            maiorDesconto: Math.floor(
                maiorDesconto + 0.000001
            ),
            possuiPromocoes: promocoes.length > 0,
        };
    }, [produtos]);

    const temPromocao = dadosPromocionais.possuiPromocoes;

    return (
        <section className="bg-[#FCFAF6] px-5 py-14 text-[#211C14] sm:px-8 lg:px-12 lg:py-16">
            <div className="mx-auto max-w-[1320px]">

                {/* ===================================== */}
                {/* BANNERS PROMOCIONAIS */}
                {/* ===================================== */}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    {/* ================================= */}
                    {/* PRIMEIRO BANNER */}
                    {/* ================================= */}

                    <article className="relative flex min-h-[300px] overflow-hidden rounded-[20px] bg-[#241F16] text-white md:h-[312px]">
                        <div className="relative z-10 w-full p-6 sm:p-8">

                            <span className="text-[10px] font-semibold uppercase tracking-[2px] text-[#C9C0B1]">
                                {temPromocao
                                    ? "Ofertas Aurora"
                                    : "Seleção Aurora"}
                            </span>

                            <h2 className="mt-2 max-w-[330px] font-serif text-2xl leading-tight sm:text-[27px]">
                                {temPromocao
                                    ? "Suas joias favoritas com preços especiais"
                                    : "Joias que tornam cada momento especial"}
                            </h2>

                            <p className="mt-3 max-w-[290px] text-xs leading-relaxed text-[#C8C2B8]">
                                {temPromocao
                                    ? "Descubra peças selecionadas com descontos especiais."
                                    : "Descubra peças delicadas para expressar seu estilo."}
                            </p>

                            {/* Maior desconto disponível */}

                            {temPromocao &&
                                dadosPromocionais.maiorDesconto > 0 && (
                                    <span className="mt-3 inline-flex rounded-full border border-[#B9975B]/50 bg-[#B9975B]/15 px-3 py-1 text-[11px] font-semibold text-[#E9DCC4]">
                                        Até{" "}
                                        {dadosPromocionais.maiorDesconto}%
                                        OFF
                                    </span>
                                )}

                            {/* Botão original */}

                            <Link
                                to={
                                    temPromocao
                                        ? "/produtos?promocao=sim"
                                        : "/produtos"
                                }
                                className="absolute bottom-7 left-6 inline-flex items-center gap-2 rounded-full bg-[#FCFAF6] px-6 py-3 text-xs font-medium text-[#241F16] transition hover:bg-white sm:left-8"
                            >
                                {temPromocao
                                    ? "Explorar ofertas"
                                    : "Ver coleção"}

                                <ArrowRight size={15} />
                            </Link>

                            {/* Imagem original */}

                            <div className="absolute bottom-0 right-0 h-[140px] w-[52%] overflow-hidden rounded-tl-[20px] sm:h-[145px]">
                                <img
                                    src={imagemPromocao}
                                    alt="Conjunto de joias douradas em uma caixa de presente"
                                    className="h-full w-full object-cover object-center"
                                />
                            </div>

                            {/* Indicador */}

                            {temPromocao && (
                                <div className="absolute bottom-10 right-3 z-10 flex items-center gap-1 text-[10px] text-white/60 sm:right-4">
                                    <Clock3 size={12} />

                                    <span>
                                        Ofertas especiais
                                    </span>
                                </div>
                            )}
                        </div>
                    </article>

                    {/* ================================= */}
                    {/* SEGUNDO BANNER - EDITORIAL */}
                    {/* ================================= */}

                    <EditorialCarrossel />
                </div>

                {/* ===================================== */}
                {/* BENEFÍCIOS - FORMATO ORIGINAL */}
                {/* ===================================== */}

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {beneficios.map((beneficio) => {
                        const Icone = beneficio.icon;

                        return (
                            <article
                                key={beneficio.titulo}
                                className="flex min-h-[94px] items-start gap-3 rounded-[20px] border border-[#EDE0C9] bg-[#F8F3E9] p-4 sm:items-center"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#EADCC4] bg-[#FFFCF7]">
                                    <Icone
                                        size={16}
                                        strokeWidth={1.8}
                                    />
                                </div>

                                <div>
                                    <h3 className="text-xs font-medium text-[#29251E]">
                                        {beneficio.titulo}
                                    </h3>

                                    <p className="mt-1 text-xs leading-relaxed text-[#898174]">
                                        {beneficio.descricao}
                                    </p>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
