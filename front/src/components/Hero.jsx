import {
  BadgeCheck,
  Star,
  Play,
  ArrowRight,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="overflow-hidden bg-[#F8F3E8] px-5 py-5 text-[#211C14] sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-[1320px] items-center gap-10 lg:min-h-[520px] lg:grid-cols-[0.9fr_1.1fr] lg:gap-3">

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
          <h1 className="max-w-[500px] font-serif text-4xl leading-[1.05] tracking-[-0.035em] sm:text-5xl lg:text-[45px] xl:text-[55px]">
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
              <p className="font-serif text-2xl leading-none">
                4.9
              </p>

              <p className="mt-1 flex items-center gap-1 text-[10px] text-[#958777]">
                <Star size={11} fill="currentColor" />
                32 mil avaliações
              </p>
            </div>

            <div className="border-r border-[#E7DCC9] px-4">
              <p className="font-serif text-2xl leading-none">
                +48 mil
              </p>

              <p className="mt-1 text-[10px] text-[#958777]">
                peças entregues
              </p>
            </div>

            <div className="pl-4">
              <p className="font-serif text-2xl leading-none">
                1 ano
              </p>

              <p className="mt-1 text-[10px] text-[#958777]">
                de garantia no banho
              </p>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="relative mx-auto w-full max-w-[520px] lg:max-w-none">

          <div className="grid grid-cols-[1.05fr_0.95fr] items-center gap-3 sm:gap-5">

            {/* Imagem principal: colar */}
            <div className="h-[250px] overflow-hidden rounded-[22px] bg-[#E6D9C4] sm:h-[365px] lg:h-[375px] xl:h-[420px]">
              <img
                src="/assets/images/colar.png"
                alt="Colar dourado com pérolas"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Coluna secundária */}
            <div className="flex min-w-0 flex-col gap-3 sm:gap-4">

              {/* Imagem dos brincos */}
              <div className="h-[175px] overflow-hidden rounded-[20px] bg-[#E6D9C4] sm:h-[275px] lg:h-[245px]">
                <img
                  src="/assets/images/brincos.png"
                  alt="Brincos dourados"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Card do produto em destaque */}
              <div className="flex min-h-[76px] items-center gap-2 rounded-[18px] border border-[#E9DCC4] bg-[#FCFAF5] p-2 sm:min-h-[88px] sm:gap-3 sm:p-3">

                <img
                  src="/assets/images/anel.png"
                  alt="Anel cravejado dourado"
                  className="h-10 w-10 shrink-0 rounded-xl object-cover sm:h-12 sm:w-12"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-[8px] uppercase tracking-[0.12em] text-[#9B7947] sm:text-[9px] sm:tracking-[0.18em]">
                    Mais vendido
                  </p>

                  <p className="truncate text-[10px] font-medium sm:text-xs">
                    Anel Aura cravejado
                  </p>

                  <p className="mt-1 whitespace-nowrap text-[10px] font-semibold sm:text-xs">
                    R$ 189

                    <span className="ml-1 font-normal text-[#A69B8B] line-through sm:ml-2">
                      R$ 259
                    </span>
                  </p>
                </div>

                <a
                  href="/produtos/anel-aura"
                  aria-label="Ver anel Aura"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#211C14] text-white transition-transform duration-300 hover:translate-x-1 sm:h-9 sm:w-9"
                >
                  <ArrowRight size={17} />
                </a>
              </div>
            </div>
          </div>

          {/* Selo de autenticidade */}
          <div className="absolute left-1/2 top-4 z-20 inline-flex max-w-[calc(100%-16px)] -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-[#E9DCC4] bg-[#FCFAF5] px-3 py-2 shadow-sm sm:left-[42%] sm:px-4">
            <BadgeCheck size={14} className="shrink-0" />

            <span className="text-[9px] font-medium sm:text-[10px]">
              Banho ouro 18k certificado
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
