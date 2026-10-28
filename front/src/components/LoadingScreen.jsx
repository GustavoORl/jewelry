
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export default function LoadingScreen() {
    const [visivel, setVisivel] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            setVisivel(true);
        });

        return () => cancelAnimationFrame(frame);
    }, []);

    return (
        <div
            role="status"
            aria-live="polite"
            aria-label="Carregando AURELIA"
            className={`fixed inset-0 z-[9999] flex min-h-screen flex-col items-center justify-center bg-[#FAF9F5] transition-opacity duration-500 ${
                visivel ? "opacity-100" : "opacity-0"
            }`}
        >
            {/* Detalhe decorativo */}
            <div className="absolute left-0 top-0 h-1 w-full bg-[#E9DCC4]" />

            {/* Identidade da marca */}
            <div className="flex flex-col items-center">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[#B9975B]/50">
                    <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#211C14]">
                        <span className="font-serif text-4xl text-[#E9DCC4]">
                            A
                        </span>
                    </div>

                    <Sparkles
                        size={18}
                        strokeWidth={1.3}
                        className="absolute -right-1 -top-1 animate-pulse text-[#B9975B]"
                    />
                </div>

                <h1 className="mt-7 font-serif text-3xl tracking-[0.18em] text-[#211C14]">
                    AURELIA
                </h1>

                <p className="mt-2 text-[9px] tracking-[0.4em] text-[#968052]">
                    MARKETPLACE DE JOIAS
                </p>
            </div>

            {/* Indicador de carregamento */}
            <div className="mt-12 flex flex-col items-center">
                <div className="h-[2px] w-36 overflow-hidden rounded-full bg-[#E9DCC4]">
                    <div className="h-full w-1/3 animate-[loading_1.4s_ease-in-out_infinite] rounded-full bg-[#B9975B]" />
                </div>

                <p className="mt-4 text-[10px] tracking-[0.2em] text-[#8A8172]">
                    PREPARANDO SUA EXPERIÊNCIA
                </p>
            </div>

            <style>{`
                @keyframes loading {
                    0% {
                        transform: translateX(-110%);
                    }
                    100% {
                        transform: translateX(410%);
                    }
                }
            `}</style>

            <p className="absolute bottom-8 text-[9px] tracking-[0.15em] text-[#B5A77F]">
                ELEGÂNCIA EM CADA DETALHE
            </p>
        </div>
    );
}
