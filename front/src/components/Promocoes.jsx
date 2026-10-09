import {
  ArrowRight,
  Clock3,
  ShieldCheck,
  Truck,
  RefreshCcw,
  Gem,
} from "lucide-react";

const beneficios = [
  {
    icon: ShieldCheck,
    titulo: "Garantia de 1 ano",
    descricao: "Cobrimos banho e cravação",
  },
  {
    icon: Truck,
    titulo: "Frete grátis + R$299",
    descricao: "Entrega em todo o Brasil",
  },
  {
    icon: RefreshCcw,
    titulo: "Troca fácil 30 dias",
    descricao: "Sem perguntas, sem custo",
  },
  {
    icon: Gem,
    titulo: "Certificado incluso",
    descricao: "Banho ouro 18k verificado",
  },
];

export default function Promocoes() {
  return (
    <section className="bg-[#FCFAF6] px-5 py-14 text-[#211C14] sm:px-8 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-[1320px]">
        {/* Banners promocionais */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Banner promocional */}
          <article className="relative flex min-h-[300px] overflow-hidden rounded-[20px] bg-[#241F16] text-white md:h-[312px]">
            <div className="relative z-10 w-full p-6 sm:p-8">
              <span className="text-[10px] font-semibold uppercase tracking-[2px] text-[#C9C0B1]">
                Clube Aurelia
              </span>

              <h2 className="mt-2 max-w-[330px] font-serif text-2xl leading-tight sm:text-[27px]">
                Segunda peça com 20% off em coleções douradas
              </h2>

              <p className="mt-3 max-w-[290px] text-xs leading-relaxed text-[#C8C2B8]">
                Combine colar + brinco e monte seu conjunto.
                Válido até domingo.
              </p>

              <a
                href="/colecoes"
                className="absolute bottom-7 left-6 inline-flex items-center gap-2 rounded-full bg-[#FCFAF6] px-6 py-3 text-xs font-medium text-[#241F16] transition hover:bg-white sm:left-8"
              >
                Montar meu conjunto
                <ArrowRight size={15} />
              </a>

              <div className="absolute bottom-0 right-0 h-[140px] w-[52%] overflow-hidden rounded-tl-[20px] sm:h-[145px]">
                <img
                  src="/assets/images/promocao-joia.png"
                  alt="Conjunto de joias douradas em uma caixa de presente"
                  className="h-full w-full object-cover object-center"
                />
              </div>

              <div className="absolute bottom-10 right-3 z-10 flex items-center gap-1 text-[10px] text-white/60 sm:right-4">
                <Clock3 size={12} />
                <span>Termina em breve</span>
              </div>
            </div>
          </article>

          {/* Banner editorial */}
          <article className="relative flex min-h-[300px] items-end overflow-hidden rounded-[20px] bg-[#302719] text-white md:h-[312px]">
            <img
              src="/assets/images/editorial-noivas.png"
              alt="Editorial de joias para noivas"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/10" />

            <div className="relative z-10 w-full p-6 sm:p-8">
              <span className="text-[10px] font-semibold uppercase tracking-[2px] text-white/90">
                Editorial / Noivas 2026
              </span>

              <h2 className="mt-2 font-serif text-2xl leading-tight sm:text-[27px]">
                O guia de joias para o grande dia
              </h2>

              <a
                href="/editoriais/noivas"
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#FCFAF6] px-6 py-3 text-xs font-medium text-[#241F16] transition hover:bg-white"
              >
                Ler guia
                <ArrowRight size={15} />
              </a>
            </div>
          </article>
        </div>

        {/* Benefícios */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {beneficios.map((beneficio) => {
            const Icone = beneficio.icon;

            return (
              <article
                key={beneficio.titulo}
                className="flex min-h-[94px] items-start gap-3 rounded-[20px] border border-[#EDE0C9] bg-[#F8F3E9] p-4 sm:items-center"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#EADCC4] bg-[#FFFCF7]">
                  <Icone size={16} strokeWidth={1.8} />
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

