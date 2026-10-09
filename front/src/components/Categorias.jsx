
import { ArrowRight, ArrowUpRight } from "lucide-react";

const categorias = [
  {
    nome: "Colares",
    quantidade: "1.240 peças",
    imagem: "/assets/images/categoria_colares.png",
    slug: "colares",
  },
  {
    nome: "Brincos",
    quantidade: "980 peças",
    imagem: "assets/images/categoria_brincos.png",
    slug: "brincos",
  },
  {
    nome: "Anéis",
    quantidade: "760 peças",
    imagem: "assets/images/categoria_aneis.png",
    slug: "aneis",
  },
  {
    nome: "Pulseiras",
    quantidade: "640 peças",
    imagem: "assets/images/categoria_pulseiras.png",
    slug: "pulseiras",
  },
];

export default function Categorias() {
  return (
    <section className="bg-[#FCFAF6] px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-[1320px] ">

        {/* Cabeçalho da seção */}
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-[#A47B43]">
              Compre por categoria
            </p>

            <h2 className="font-serif text-2xl leading-tight tracking-tight text-[#211C14] sm:text-3xl">
              Coleções que vestem todos os momentos
            </h2>
          </div>

          <a
            href="/colecoes"
            className="group hidden shrink-0 items-center gap-2 pb-1 text-xs font-medium sm:inline-flex"
          >
            <span>Ver todas as coleções</span>
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </a>
        </div>

        {/* Cards de categorias */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
          {categorias.map((categoria) => (
            <a
              key={categoria.slug}
              href={`/categoria/${categoria.slug}`}
              className="group relative block h-[240px] overflow-hidden rounded-[20px] bg-[#E9E0D1] sm:h-[300px] lg:h-[312px]"
            >
              {/* Imagem */}
              <img
                src={categoria.imagem}
                alt={`Joias da categoria ${categoria.nome}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Gradiente sutil */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-70" />

              {/* Etiqueta do card */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 rounded-xl border border-white/60 bg-[#FCFAF6]/95 px-3 py-2.5 backdrop-blur-sm transition-all duration-300 group-hover:bg-white">
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-medium text-[#211C14] sm:text-sm">
                    {categoria.nome}
                  </h3>

                  <p className="mt-0.5 text-[10px] text-[#8B8174]">
                    {categoria.quantidade}
                  </p>
                </div>

                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E9DCC4] text-[#211C14] transition-all duration-300 group-hover:border-[#211C14] group-hover:bg-[#211C14] group-hover:text-white">
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* Link para telas pequenas */}
        <div className="mt-6 sm:hidden">
          <a
            href="/colecoes"
            className="inline-flex items-center gap-2 text-sm font-medium"
          >
            Ver todas as coleções
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}