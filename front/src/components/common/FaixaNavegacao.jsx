
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";

export default function FaixaNavegacao({
    itens = [],
    mostrarVoltar = true,
    rotaVoltar = "/",
    textoVoltar = "Voltar",
    textoEditorial = "AURORA · Nossa coleção",
    informacaoDireita,
}) {
    const navigate = useNavigate();

    function voltar() {
        if (window.history.state?.idx > 0) {
            navigate(-1);
        } else {
            navigate(rotaVoltar);
        }
    }

    return (
        <section className="border-b border-[#EAE0CE] bg-[#F7F2E8] px-5 py-3 sm:px-8 lg:px-12">
            <div className="mx-auto flex max-w-[1320px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-3">

                    {mostrarVoltar && (
                        <button
                            type="button"
                            onClick={voltar}
                            className="inline-flex shrink-0 items-center gap-2 text-[10px] font-medium uppercase tracking-[0.15em] text-[#847A6C] transition-colors hover:text-[#A47B43]"
                        >
                            <ArrowLeft size={15} />
                            {textoVoltar}
                        </button>
                    )}

                    {itens.length > 0 && (
                        <nav
                            aria-label="Navegação estrutural"
                            className="flex min-w-0 flex-wrap items-center gap-2 text-xs"
                        >
                            {itens.map((item, indice) => {
                                const ultimo = indice === itens.length - 1;

                                return (
                                    <div
                                        key={`${item.label}-${indice}`}
                                        className="flex items-center gap-2"
                                    >
                                        {indice > 0 && (
                                            <ChevronRight
                                                size={13}
                                                className="shrink-0 text-[#B7A88E]"
                                            />
                                        )}

                                        {item.to && !ultimo ? (
                                            <button
                                                type="button"
                                                onClick={() => navigate(item.to)}
                                                className="transition-colors hover:text-[#A47B43]"
                                            >
                                                {item.label}
                                            </button>
                                        ) : (
                                            <span
                                                aria-current={ultimo ? "page" : undefined}
                                                className={
                                                    ultimo
                                                        ? "font-medium text-[#211C14]"
                                                        : "text-[#847A6C]"
                                                }
                                            >
                                                {item.label}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </nav>
                    )}
                </div>

                {(textoEditorial || informacaoDireita) && (
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                        {textoEditorial && (
                            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#A47B43]">
                                {textoEditorial}
                            </p>
                        )}

                        {informacaoDireita && (
                            <div className="shrink-0 text-xs text-[#847A6C]">
                                {informacaoDireita}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
