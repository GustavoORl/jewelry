
import { useState } from "react";
import {
  Heart,
  ShoppingBag,
  Star,
} from "lucide-react";

const filtros = ["Todos", "Ouro", "Pérolas", "Zircônias"];

const produtos = [
  {
    id: 1,
    marca: "ATELIER LUME",
    nome: "Colar Elo Orgânico banhado",
    categoria: "Ouro",
    preco: 229,
    precoAntigo: 319,
    desconto: "-28%",
    imagem: "/assets/images/colar-elo.png",
    avaliacoes: 842,
  },
  {
    id: 2,
    marca: "CASA SERENA",
    nome: "Brinco Gota Madrepérola",
    categoria: "Pérolas",
    preco: 149,
    precoAntigo: null,
    desconto: "Novo",
    imagem: "/assets/images/brinco-gota.png",
    avaliacoes: 842,
  },
  {
    id: 3,
    marca: "OURIVES LÚMEN",
    nome: "Anel Trançado Dourado",
    categoria: "Ouro",
    preco: 189,
    precoAntigo: 240,
    desconto: "-21%",
    imagem: "/assets/images/anel-trancado.png",
    avaliacoes: 842,
  },
  {
    id: 4,
    marca: "ATELIER LUME",
    nome: "Pulseira Riviera Zircônias",
    categoria: "Zircônias",
    preco: 269,
    precoAntigo: null,
    desconto: "Best-seller",
    imagem: "/assets/images/pulseira-riviera.png",
    avaliacoes: 842,
  },
];

function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export default function Produtos() {
  const [filtroAtivo, setFiltroAtivo] = useState("Todos");
  const [favoritos, setFavoritos] = useState([]);
  const [sacola, setSacola] = useState([]);

  const produtosFiltrados =
    filtroAtivo === "Todos"
      ? produtos
      : produtos.filter(
          (produto) => produto.categoria === filtroAtivo
        );

  function alternarFavorito(id) {
    setFavoritos((atuais) =>
      atuais.includes(id)
        ? atuais.filter((item) => item !== id)
        : [...atuais, id]
    );
  }

  function adicionarSacola(id) {
    setSacola((atuais) => [...atuais, id]);
  }

  return (
    <section className="bg-[#FCFAF6] px-5 py-14 text-[#211C14] sm:px-8 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-[1320px]">

        {/* Cabeçalho */}
        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-[#A47B43]">
              Seleção da semana
            </p>

            <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
              Os mais desejados
            </h2>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            {filtros.map((filtro) => {
              const ativo = filtroAtivo === filtro;

              return (
                <button
                  key={filtro}
                  type="button"
                  onClick={() => setFiltroAtivo(filtro)}
                  aria-pressed={ativo}
                  className={`rounded-full border px-4 py-2 text-xs transition-all duration-300 ${
                    ativo
                      ? "border-[#211C14] bg-[#211C14] text-white"
                      : "border-[#E8DDCA] bg-transparent hover:border-[#B9975B] hover:bg-[#F3EFE3]"
                  }`}
                >
                  {filtro}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grade de produtos */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {produtosFiltrados.map((produto) => {
            const favorito = favoritos.includes(produto.id);

            return (
              <article
                key={produto.id}
                className="group overflow-hidden rounded-[20px] border border-[#EAE0CE] bg-[#F7F2E8] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#211C14]/5"
              >
                {/* Imagem e etiquetas */}
                <div className="relative h-[300px] overflow-hidden bg-white sm:h-[270px] lg:h-[232px]">
                  <a
                    href={`/produtos/${produto.id}`}
                    aria-label={`Ver ${produto.nome}`}
                    className="block h-full w-full"
                  >
                    <img
                      src={produto.imagem}
                      alt={produto.nome}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </a>

                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-medium">
                    {produto.desconto}
                  </span>

                  <button
                    type="button"
                    onClick={() => alternarFavorito(produto.id)}
                    aria-label={
                      favorito
                        ? "Remover dos favoritos"
                        : "Adicionar aos favoritos"
                    }
                    aria-pressed={favorito}
                    className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border bg-white/95 transition-all duration-300 ${
                      favorito
                        ? "border-[#B9975B] text-[#A47B43]"
                        : "border-[#E8DDCA] hover:border-[#B9975B]"
                    }`}
                  >
                    <Heart
                      size={18}
                      fill={favorito ? "currentColor" : "none"}
                    />
                  </button>
                </div>

                {/* Informações */}
                <div className="p-4">
                  <p className="mb-1 text-[9px] tracking-[0.18em] text-[#9B805D]">
                    {produto.marca}
                  </p>

                  <a
                    href={`/produtos/${produto.id}`}
                    className="block truncate text-xs font-medium transition-colors hover:text-[#9B805D]"
                  >
                    {produto.nome}
                  </a>

                  {/* Avaliações */}
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className="flex items-center gap-0.5"
                      aria-label="Avaliação de 5 estrelas"
                    >
                      {[1, 2, 3, 4, 5].map((estrela) => (
                        <Star
                          key={estrela}
                          size={12}
                          strokeWidth={2.5}
                        />
                      ))}
                    </div>

                    <span className="text-[10px] text-[#958777]">
                      ({produto.avaliacoes})
                    </span>
                  </div>

                  {/* Preço e botão */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold">
                        {formatarPreco(produto.preco)}
                      </span>

                      {produto.precoAntigo && (
                        <span className="text-[10px] text-[#A69B8B] line-through">
                          {formatarPreco(produto.precoAntigo)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => adicionarSacola(produto.id)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#211C14] px-3 py-2 text-[10px] font-medium text-white transition-all duration-300 hover:bg-[#4A3D2B] active:scale-95"
                    >
                      <ShoppingBag size={13} />
                      Adicionar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Retorno de interação */}
        {sacola.length > 0 && (
          <p className="mt-5 text-right text-xs text-[#857C6F]">
            {sacola.length} {sacola.length === 1 ? "item adicionado" : "itens adicionados"} à sacola
          </p>
        )}
      </div>
    </section>
  );
}