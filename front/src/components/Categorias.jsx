
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

import { Link } from "react-router-dom";
import { apiFetch } from "../services/api";

// ============================================================
// CONSTANTES
// ============================================================

const imagemPadrao =
  "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=600&q=80";

const DURACAO_TRANSICAO = 350;
const DISTANCIA_MINIMA_SWIPE = 45;

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function gerarSlug(nome = "") {
  return String(nome)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizarCategoria(categoria) {
  const primeiraImagem = Array.isArray(categoria.imagens)
    ? categoria.imagens
        .map((imagem) =>
          typeof imagem === "string"
            ? imagem
            : imagem?.url
        )
        .find(Boolean)
    : null;

  return {
    ...categoria,

    nome: categoria.nome || "Categoria",

    slug:
      categoria.slug ||
      gerarSlug(categoria.nome || "categoria"),

    imagem:
      categoria.imagem ||
      categoria.imagemUrl ||
      primeiraImagem ||
      imagemPadrao,
  };
}

// ============================================================
// CARD DA CATEGORIA
// ============================================================

function CardCategoria({ categoria }) {
  return (
    <Link
      to={`/produtos?categoria=${encodeURIComponent(
        categoria.slug
      )}`}
      draggable={false}
      className="group relative block h-[240px] overflow-hidden rounded-[20px] bg-[#E9E0D1] sm:h-[300px] lg:h-[312px]"
    >
      {/* IMAGEM */}

      <img
        src={categoria.imagem}
        alt={`Joias da categoria ${categoria.nome}`}
        loading="lazy"
        draggable={false}
        onError={(evento) => {
          evento.currentTarget.onerror = null;
          evento.currentTarget.src = imagemPadrao;
        }}
        className="pointer-events-none h-full w-full select-none object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {/* GRADIENTE */}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-70" />

      {/* INFORMAÇÕES */}

      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 rounded-xl border border-white/60 bg-[#FCFAF6]/95 px-2.5 py-2 backdrop-blur-sm transition-all duration-300 group-hover:bg-white sm:bottom-3 sm:left-3 sm:right-3 sm:px-3 sm:py-2.5">
        <div className="min-w-0">
          <h3 className="truncate text-[11px] font-medium text-[#211C14] sm:text-sm">
            {categoria.nome}
          </h3>

          {categoria.quantidadeProdutos != null && (
            <p className="mt-0.5 text-[9px] text-[#8B8174] sm:text-[10px]">
              {categoria.quantidadeProdutos}{" "}
              {Number(categoria.quantidadeProdutos) === 1
                ? "peça"
                : "peças"}
            </p>
          )}
        </div>

        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#E9DCC4] text-[#211C14] transition-all duration-300 group-hover:border-[#211C14] group-hover:bg-[#211C14] group-hover:text-white sm:h-8 sm:w-8">
          <ArrowUpRight size={15} />
        </span>
      </div>
    </Link>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function Categorias() {
  // ============================================================
  // ESTADOS
  // ============================================================

  const [categorias, setCategorias] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // Mobile/tablet: 2 categorias
  // Desktop: 4 categorias

  const [itensVisiveis, setItensVisiveis] = useState(() =>
    typeof window !== "undefined" &&
    window.innerWidth >= 1024
      ? 4
      : 2
  );

  const [indiceAtual, setIndiceAtual] = useState(4);

  const [animando, setAnimando] = useState(false);
  const [arrastando, setArrastando] = useState(false);

  const [transicaoAtiva, setTransicaoAtiva] =
    useState(false);

  const [deslocamentoArraste, setDeslocamentoArraste] =
    useState(0);

  // ============================================================
  // REFERÊNCIAS
  // ============================================================

  const trilhoRef = useRef(null);
  const viewportRef = useRef(null);

  const toqueInicialRef = useRef(null);
  const bloqueioAnimacaoRef = useRef(false);
  const bloquearCliqueRef = useRef(false);

  const timeoutCliqueRef = useRef(null);

  // ============================================================
  // CARREGAR CATEGORIAS
  // ============================================================

  const carregarCategorias = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const resultado = await apiFetch("/categorias");

      const lista = Array.isArray(resultado)
        ? resultado
        : resultado?.categorias ||
          resultado?.dados?.categorias ||
          resultado?.dados;

      if (!Array.isArray(lista)) {
        throw new Error(
          "A API não retornou uma lista de categorias."
        );
      }

      const categoriasAtivas = lista
        .filter((categoria) => categoria.ativo !== false)
        .map(normalizarCategoria);

      setCategorias(categoriasAtivas);
    } catch (error) {
      setErro(
        error.message ||
          "Não foi possível carregar as categorias."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarCategorias();
  }, [carregarCategorias]);

  // ============================================================
  // RESPONSIVIDADE
  // ============================================================

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(min-width: 1024px)"
    );

    function atualizarItensVisiveis() {
      setItensVisiveis(
        mediaQuery.matches ? 4 : 2
      );
    }

    atualizarItensVisiveis();

    mediaQuery.addEventListener(
      "change",
      atualizarItensVisiveis
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        atualizarItensVisiveis
      );
    };
  }, []);

  // ============================================================
  // CONFIGURAÇÃO DO CARROSSEL INFINITO
  // ============================================================

  const quantidadeCategorias = categorias.length;

  const podeNavegar = quantidadeCategorias > 1;

  // Repetimos as categorias quando necessário para
  // preencher as posições visíveis.

  const quantidadeBase =
    quantidadeCategorias > 0
      ? Math.ceil(
          Math.max(
            quantidadeCategorias,
            itensVisiveis + 1
          ) / quantidadeCategorias
        ) * quantidadeCategorias
      : 0;

  const categoriasBase =
    quantidadeCategorias > 0
      ? Array.from(
          { length: quantidadeBase },
          (_, indice) =>
            categorias[indice % quantidadeCategorias]
        )
      : [];

  // Clones antes e depois dos itens originais.

  const clonesInicio = categoriasBase.slice(
    -itensVisiveis
  );

  const clonesFim = categoriasBase.slice(
    0,
    itensVisiveis
  );

  const categoriasCarrossel = [
    ...clonesInicio,
    ...categoriasBase,
    ...clonesFim,
  ];

  // ============================================================
  // REINICIAR POSIÇÃO
  // ============================================================

  useEffect(() => {
    bloqueioAnimacaoRef.current = false;

    setAnimando(false);
    setArrastando(false);
    setDeslocamentoArraste(0);
    setTransicaoAtiva(false);
    setIndiceAtual(itensVisiveis);
  }, [itensVisiveis, quantidadeCategorias]);

  // ============================================================
  // REATIVAR TRANSIÇÃO APÓS REPOSICIONAMENTO
  // ============================================================

  useEffect(() => {
    if (transicaoAtiva) return;

    let segundoFrame;

    const primeiroFrame = requestAnimationFrame(() => {
      segundoFrame = requestAnimationFrame(() => {
        setTransicaoAtiva(true);
      });
    });

    return () => {
      cancelAnimationFrame(primeiroFrame);

      if (segundoFrame) {
        cancelAnimationFrame(segundoFrame);
      }
    };
  }, [transicaoAtiva, indiceAtual]);

  // ============================================================
  // LIMPEZA
  // ============================================================

  useEffect(() => {
    return () => {
      if (timeoutCliqueRef.current) {
        clearTimeout(timeoutCliqueRef.current);
      }
    };
  }, []);

  // ============================================================
  // NAVEGAÇÃO
  // ============================================================

  function avancar() {
    if (
      !podeNavegar ||
      bloqueioAnimacaoRef.current
    ) {
      return;
    }

    bloqueioAnimacaoRef.current = true;

    setAnimando(true);
    setTransicaoAtiva(true);

    setIndiceAtual((atual) => atual + 1);
  }

  function voltar() {
    if (
      !podeNavegar ||
      bloqueioAnimacaoRef.current
    ) {
      return;
    }

    bloqueioAnimacaoRef.current = true;

    setAnimando(true);
    setTransicaoAtiva(true);

    setIndiceAtual((atual) => atual - 1);
  }

  // ============================================================
  // CORRIGIR POSIÇÃO APÓS ATRAVESSAR CLONES
  // ============================================================

  function finalizarTransicao(evento) {
    if (
      evento.target !== trilhoRef.current ||
      evento.propertyName !== "transform" ||
      !animando
    ) {
      return;
    }

    setAnimando(false);
    bloqueioAnimacaoRef.current = false;

    if (
      indiceAtual >=
      quantidadeBase + itensVisiveis
    ) {
      setTransicaoAtiva(false);

      setIndiceAtual(
        indiceAtual - quantidadeBase
      );
    } else if (indiceAtual < itensVisiveis) {
      setTransicaoAtiva(false);

      setIndiceAtual(
        indiceAtual + quantidadeBase
      );
    }
  }

  // ============================================================
  // SWIPE COM MOVIMENTO EM TEMPO REAL
  // ============================================================

  function iniciarArraste(evento) {
    if (
      !podeNavegar ||
      bloqueioAnimacaoRef.current
    ) {
      return;
    }

    if (
      evento.pointerType === "mouse" &&
      evento.button !== 0
    ) {
      return;
    }

    toqueInicialRef.current = {
      x: evento.clientX,
      y: evento.clientY,
      pointerId: evento.pointerId,
      deslocou: false,
      horizontal: false,
    };

    setArrastando(false);
    setDeslocamentoArraste(0);
  }

  function moverArraste(evento) {
    const toque = toqueInicialRef.current;

    if (
      !toque ||
      toque.pointerId !== evento.pointerId
    ) {
      return;
    }

    const diferencaX =
      evento.clientX - toque.x;

    const diferencaY =
      evento.clientY - toque.y;

    // Primeiro identifica se o gesto é horizontal
    // ou vertical. Assim, a página continua rolando
    // normalmente quando o usuário desliza para cima
    // ou para baixo.

    if (!toque.horizontal) {
      if (
        Math.abs(diferencaY) >
        Math.abs(diferencaX)
      ) {
        return;
      }

      if (Math.abs(diferencaX) < 6) {
        return;
      }

      toque.horizontal = true;
      toque.deslocou = true;

      setArrastando(true);
      setTransicaoAtiva(false);

      // Captura o ponteiro para continuar recebendo
      // os movimentos mesmo fora do carrossel.

      try {
        viewportRef.current?.setPointerCapture(
          evento.pointerId
        );
      } catch {
        // O ponteiro pode não estar mais disponível.
      }
    }

    // Acompanha exatamente o deslocamento do dedo.

    setDeslocamentoArraste(diferencaX);
  }

  function finalizarArraste(evento) {
    const toque = toqueInicialRef.current;

    if (
      !toque ||
      toque.pointerId !== evento.pointerId
    ) {
      return;
    }

    const diferencaX =
      evento.clientX - toque.x;

    const diferencaY =
      evento.clientY - toque.y;

    const foiArrasteHorizontal =
      toque.horizontal &&
      Math.abs(diferencaX) >
        Math.abs(diferencaY);

    toqueInicialRef.current = null;

    setArrastando(false);

    // Libera a captura do ponteiro.

    try {
      if (
        viewportRef.current?.hasPointerCapture(
          evento.pointerId
        )
      ) {
        viewportRef.current.releasePointerCapture(
          evento.pointerId
        );
      }
    } catch {
      // Captura já liberada.
    }

    if (!foiArrasteHorizontal) {
      setDeslocamentoArraste(0);
      setTransicaoAtiva(true);
      return;
    }

    // Impede abrir a categoria ao finalizar um swipe.

    bloquearCliqueRef.current = true;

    if (timeoutCliqueRef.current) {
      clearTimeout(timeoutCliqueRef.current);
    }

    timeoutCliqueRef.current = setTimeout(() => {
      bloquearCliqueRef.current = false;
    }, 300);

    // Calcula um limite proporcional à largura do card.

    const larguraViewport =
      viewportRef.current?.offsetWidth || 0;

    const gap = itensVisiveis === 2 ? 12 : 20;

    const larguraCard =
      (larguraViewport -
        (itensVisiveis - 1) * gap) /
      itensVisiveis;

    const limiteSwipe = Math.min(
      DISTANCIA_MINIMA_SWIPE,
      larguraCard * 0.25
    );

    // O deslocamento precisa ser zerado junto
    // com a alteração do índice para que o
    // carrossel anime até a posição final.

    setDeslocamentoArraste(0);
    setTransicaoAtiva(true);

    if (Math.abs(diferencaX) >= limiteSwipe) {
      if (diferencaX < 0) {
        avancar();
      } else {
        voltar();
      }
    }
    // Caso contrário, a transição retorna
    // suavemente ao card atual.
  }

  function cancelarArraste() {
    toqueInicialRef.current = null;

    setArrastando(false);
    setDeslocamentoArraste(0);
    setTransicaoAtiva(true);
  }

  function impedirCliqueDuranteSwipe(evento) {
    if (bloquearCliqueRef.current) {
      evento.preventDefault();
      evento.stopPropagation();

      bloquearCliqueRef.current = false;
    }
  }

  // ============================================================
  // CÁLCULO DO DESLOCAMENTO
  // ============================================================

  const gap = itensVisiveis === 2 ? 12 : 20;

  const larguraItem = `calc((100% - ${
    (itensVisiveis - 1) * gap
  }px) / ${itensVisiveis})`;

  // O deslocamento combina:
  //
  // 1. Posição do índice atual
  // 2. Movimento horizontal do dedo
  //
  // Durante o arraste, a transição fica desativada.

  const deslocamento = `calc(
    -${indiceAtual} * (${larguraItem} + ${gap}px)
    + ${deslocamentoArraste}px
  )`;

  // ============================================================
  // RENDERIZAÇÃO
  // ============================================================

  return (
    <section className="overflow-hidden bg-[#FCFAF6] px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-[1320px]">
        {/* ===================================== */}
        {/* CABEÇALHO */}
        {/* ===================================== */}

        <div className="mb-7">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-[#A47B43]">
            Compre por categoria
          </p>

          <h2 className="font-serif text-2xl leading-tight tracking-tight text-[#211C14] sm:text-3xl">
            Coleções que vestem todos os momentos
          </h2>
        </div>

        {/* ===================================== */}
        {/* CARREGAMENTO */}
        {/* ===================================== */}

        {carregando && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
            {Array.from(
              { length: itensVisiveis },
              (_, indice) => (
                <div
                  key={indice}
                  className="h-[240px] animate-pulse rounded-[20px] bg-[#E9E0D1] sm:h-[300px] lg:h-[312px]"
                />
              )
            )}
          </div>
        )}

        {/* ===================================== */}
        {/* ERRO */}
        {/* ===================================== */}

        {!carregando && erro && (
          <div className="rounded-2xl border border-[#E8DDCA] bg-white p-6 text-center">
            <p className="text-sm text-[#8A4B3C]">
              {erro}
            </p>

            <button
              type="button"
              onClick={carregarCategorias}
              className="mt-4 rounded-full bg-[#211C14] px-5 py-2.5 text-xs text-white transition hover:bg-[#4A3D2B]"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* ===================================== */}
        {/* CARROSSEL */}
        {/* ===================================== */}

        {!carregando && !erro && (
          <>
            {categorias.length === 0 ? (
              <div className="rounded-2xl border border-[#EAE0CE] bg-[#F7F2E8] px-5 py-12 text-center">
                <p className="font-serif text-xl text-[#211C14]">
                  Nenhuma categoria disponível
                </p>

                <p className="mt-2 text-sm text-[#958777]">
                  As categorias cadastradas aparecerão aqui.
                </p>
              </div>
            ) : (
              <>
                {/* ===================================== */}
                {/* ÁREA VISÍVEL DO CARROSSEL */}
                {/* ===================================== */}

                <div
                  ref={viewportRef}
                  className="overflow-hidden select-none"
                  style={{
                    touchAction: "pan-y",
                    cursor: arrastando
                      ? "grabbing"
                      : podeNavegar
                        ? "grab"
                        : "default",
                  }}
                  onPointerDown={iniciarArraste}
                  onPointerMove={moverArraste}
                  onPointerUp={finalizarArraste}
                  onPointerCancel={cancelarArraste}
                  onClickCapture={
                    impedirCliqueDuranteSwipe
                  }
                  onDragStart={(evento) =>
                    evento.preventDefault()
                  }
                >
                  {/* TRILHO DO CARROSSEL */}

                  <div
                    ref={trilhoRef}
                    onTransitionEnd={
                      finalizarTransicao
                    }
                    className="flex will-change-transform"
                    style={{
                      gap: `${gap}px`,

                      transform: `translate3d(${deslocamento}, 0, 0)`,

                      transition:
                        transicaoAtiva && !arrastando
                          ? `transform ${DURACAO_TRANSICAO}ms cubic-bezier(0.22, 1, 0.36, 1)`
                          : "none",
                    }}
                  >
                    {categoriasCarrossel.map(
                      (categoria, indice) => (
                        <div
                          key={`${categoria.id ?? categoria.slug}-${indice}`}
                          className="min-w-0 shrink-0"
                          style={{
                            width: larguraItem,
                          }}
                        >
                          <CardCategoria
                            categoria={categoria}
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* ===================================== */}
                {/* BOTÕES DE NAVEGAÇÃO */}
                {/* ===================================== */}

                {podeNavegar && (
                  <div className="mt-6 flex items-center justify-end gap-2">
                    {/* ANTERIOR */}

                    <button
                      type="button"
                      onClick={voltar}
                      aria-label="Categoria anterior"
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E8DDCA] bg-transparent text-[#211C14] transition-all duration-300 hover:border-[#211C14] hover:bg-[#211C14] hover:text-white active:scale-95"
                    >
                      <ArrowLeft
                        size={18}
                        strokeWidth={1.7}
                      />
                    </button>

                    {/* PRÓXIMO */}

                    <button
                      type="button"
                      onClick={avancar}
                      aria-label="Próxima categoria"
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E8DDCA] bg-transparent text-[#211C14] transition-all duration-300 hover:border-[#211C14] hover:bg-[#211C14] hover:text-white active:scale-95"
                    >
                      <ArrowRight
                        size={18}
                        strokeWidth={1.7}
                      />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
