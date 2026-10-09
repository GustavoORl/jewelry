
import {
  BadgeCheck,
  Star,
  Play,
  ArrowRight,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="overflow-hidden bg-[#F8F3E8] text-[#211C14]">
      <div className="mx-auto grid max-w-[1320px] items-center gap-12 py-12 md:px-10 lg:min-h-[520px] lg:grid-cols-[0.9fr_1.1fr] lg:py-16">

        {/* COLUNA ESQUERDA */}
        <div className="flex flex-col items-start">

          {/* Selo da coleção */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#E9DCC4] bg-[#FCFAF5] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B9975B]" />
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8A6531]">
              Nova coleção · Dourada Essência
            </span>
          </div>

          {/* Título */}
          <h1 className="max-w-[460px] font-serif text-4xl leading-[1.05] tracking-[-0.035em] sm:text-5xl lg:text-[44px]">
            Brilho de alta joalheria, preço de semijoia
          </h1>

          {/* Descrição */}
          <p className="mt-5 max-w-[390px] text-sm leading-[1.65] text-[#857C6F]">
            Peças banhadas a ouro 18k, hipoalergênicas e
            garantidas por 1 ano. Curadoria de 120 ourives
            independentes em um só lugar.
          </p>

          {/* Botões */}
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/colecoes"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#211C14] px-6 text-xs font-medium text-white transition-all duration-300 hover:bg-[#4A3D2B] hover:shadow-md"
            >
              Explorar coleções
            </a>

            <a
              href="/editorial"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#B7A78C] px-6 text-xs font-medium transition-all duration-300 hover:bg-[#EDE3D1]"
            >
              <Play size={14} />
              Ver editorial
            </a>
          </div>

          {/* Indicadores */}
          <div className="mt-8 grid w-full max-w-[440px] grid-cols-3">
            <div className="border-r border-[#E7DCC9] pr-3">
              <p className="font-serif text-2xl leading-none">4.9</p>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-[#958777]">
                <Star size={11} fill="currentColor" />
                32 mil avaliações
              </p>
            </div>

            <div className="border-r border-[#E7DCC9] px-4">
              <p className="font-serif text-2xl leading-none">+48 mil</p>
              <p className="mt-1 text-[10px] text-[#958777]">
                peças entregues
              </p>
            </div>

            <div className="pl-4">
              <p className="font-serif text-2xl leading-none">1 ano</p>
              <p className="mt-1 text-[10px] text-[#958777]">
                de garantia no banho
              </p>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="relative mx-auto w-full max-w-[570px] pb-28 sm:pb-32 lg:pb-24">

          {/* Imagem principal */}
          <div className="h-[300px] w-[57%] overflow-hidden rounded-[22px] bg-[#E6D9C4] sm:h-[365px] lg:h-[365px]">
            <img
              src="/assets/images/colar.png"
              alt="Colar dourado com pérolas"
              className="h-full w-full object-cover"
            />
          </div>

          {/* Selo de autenticidade */}
          <div className="absolute left-[34%] top-5 z-20 inline-flex items-center gap-2 rounded-full border border-[#E9DCC4] bg-[#FCFAF5] px-4 py-2 shadow-sm">
            <BadgeCheck size={14} />
            <span className="whitespace-nowrap text-[10px] font-medium">
              Banho ouro 18k certificado
            </span>
          </div>

          {/* Imagem secundária */}
          <div className="absolute right-0 top-8 h-[220px] w-[49%] overflow-hidden rounded-[20px] bg-[#E6D9C4] sm:top-8 sm:h-[275px] lg:h-[275px]">
            <img
              src="/assets/images/brincos.png"
              alt="Brincos dourados"
              className="h-full w-full object-cover"
            />
          </div>

          {/* Card do produto em destaque */}
          <div className="absolute bottom-0 right-0 flex min-h-[88px] w-[49%] items-center gap-3 rounded-[20px] border border-[#E9DCC4] bg-[#FCFAF5] p-3 sm:bottom-0">
            <img
              src="/assets/images/anel.png"
              alt="Anel cravejado dourado"
              className="h-12 w-12 shrink-0 rounded-xl object-cover"
            />

            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase tracking-[0.18em] text-[#9B7947]">
                Mais vendido
              </p>
              <p className="truncate text-xs font-medium">
                Anel Aura cravejado
              </p>
              <p className="mt-1 whitespace-nowrap text-xs font-semibold">
                R$ 189
                <span className="ml-2 font-normal text-[#A69B8B] line-through">
                  R$ 259
                </span>
              </p>
            </div>

            <a
              href="/produtos/anel-aura"
              aria-label="Ver anel Aura"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#211C14] text-white transition-transform duration-300 hover:translate-x-1"
            >
              <ArrowRight size={19} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}