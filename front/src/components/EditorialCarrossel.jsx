
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { apiFetch } from "../services/api.js";

// ============================================================
// CONSTANTES
// ============================================================

const INTERVALO_AUTOMATICO = 5000;
const DURACAO_TRANSICAO = 450;
const LIMITE_SWIPE = 45;

const imagemPadrao =
  "/assets/images/promocao-joia.png";

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function EditorialCarrossel() {
  // ============================================================
  // ESTADOS
  // ============================================================

  const [postagens, setPostagens] = useState([]);
  const [erro, setErro] = useState("");

  const [indice, setIndice] = useState(1);

  const [hover, setHover] = useState(false);
  const [foco, setFoco] = useState(false);

  const [arrastando, setArrastando] = useState(false);
  const [transicaoAtiva, setTransicaoAtiva] =
    useState(true);

  const [deslocamentoArraste, setDeslocamentoArraste] =
    useState(0);

  const [animando, setAnimando] = useState(false);

  // ============================================================
  // REFERÊNCIAS
  // ============================================================

  const viewportRef = useRef(null);
  const trilhoRef = useRef(null);

  const gestoRef = useRef(null);

  const bloqueioAnimacaoRef = useRef(false);
  const bloquearCliqueRef = useRef(false);

  const timeoutCliqueRef = useRef(null);

  // ============================================================
  // CARREGAR POSTAGENS
  // ============================================================

  useEffect(() => {
    let ativo = true;

    async function carregarPostagens() {
      try {
        const resultado = await apiFetch("/editorial");

        if (!ativo) return;

        const lista = Array.isArray(resultado)
          ? resultado
          : resultado?.postagens ||
            resultado?.dados?.postagens ||
            resultado?.dados ||
            [];

        setPostagens(
          Array.isArray(lista) ? lista : []
        );
      } catch (error) {
        if (!ativo) return;

        console.error(
          "Erro ao carregar editorial:",
          error
        );

        setErro(
          "O editorial está indisponível no momento."
        );
      }
    }

    carregarPostagens();

    return () => {
      ativo = false;
    };
  }, []);

  // ============================================================
  // CONFIGURAÇÃO DO LOOP INFINITO
  // ============================================================

  const quantidade = postagens.length;
  const podeNavegar = quantidade > 1;

  // Adicionamos um clone no início e outro no final.
  //
  // Exemplo:
  //
  // [Último, Primeiro, Segundo, Terceiro, Primeiro]
  //
  // Quando o carrossel chega ao clone, reposicionamos
  // instantaneamente para o slide equivalente.

  const slides = podeNavegar
    ? [
        postagens[quantidade - 1],
        ...postagens,
        postagens[0],
      ]
    : quantidade === 1
      ? [postagens[0]]
      : [null];

  // ============================================================
  // REINICIAR ÍNDICE AO CARREGAR POSTAGENS
  // ============================================================

  useEffect(() => {
    setIndice(quantidade > 1 ? 1 : 0);

    setDeslocamentoArraste(0);
    setTransicaoAtiva(false);
    setAnimando(false);

    bloqueioAnimacaoRef.current = false;
  }, [quantidade]);

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
  }, [transicaoAtiva, indice]);

  // ============================================================
  // NAVEGAÇÃO
  // ============================================================

  const navegar = useCallback(
    (direcao) => {
      if (
        !podeNavegar ||
        bloqueioAnimacaoRef.current
      ) {
        return;
      }

      bloqueioAnimacaoRef.current = true;

      setAnimando(true);
      setTransicaoAtiva(true);

      setIndice((atual) => atual + direcao);
    },
    [podeNavegar]
  );

  function proximo() {
    navegar(1);
  }

  function anterior() {
    navegar(-1);
  }

  // ============================================================
  // FINALIZAR TRANSIÇÃO E CORRIGIR CLONES
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

    // Passou pelo último slide e chegou ao clone
    // do primeiro.

    if (indice === quantidade + 1) {
      setTransicaoAtiva(false);
      setIndice(1);
    }

    // Voltou pelo primeiro slide e chegou ao clone
    // do último.

    if (indice === 0) {
      setTransicaoAtiva(false);
      setIndice(quantidade);
    }
  }

  // ============================================================
  // CARROSSEL AUTOMÁTICO
  // ============================================================

  useEffect(() => {
    if (
      !podeNavegar ||
      hover ||
      foco ||
      arrastando ||
      animando
    ) {
      return;
    }

    const timer = setInterval(() => {
      if (
        document.hidden ||
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
      ) {
        return;
      }

      navegar(1);
    }, INTERVALO_AUTOMATICO);

    return () => clearInterval(timer);
  }, [
    podeNavegar,
    hover,
    foco,
    arrastando,
    animando,
    navegar,
  ]);

  // ============================================================
  // SWIPE SUAVE ACOMPANHANDO O DEDO
  // ============================================================

  function iniciarArraste(evento) {
    if (
      !podeNavegar ||
      bloqueioAnimacaoRef.current
    ) {
      return;
    }

    // Ignora botões diferentes do esquerdo no mouse.

    if (
      evento.pointerType === "mouse" &&
      evento.button !== 0
    ) {
      return;
    }

    // Não inicia swipe quando o usuário interage
    // com os botões de navegação.

    if (
      evento.target.closest(
        "[data-controle-carrossel]"
      )
    ) {
      return;
    }

    gestoRef.current = {
      x: evento.clientX,
      y: evento.clientY,
      pointerId: evento.pointerId,
      horizontal: false,
    };

    setDeslocamentoArraste(0);
  }

  function moverArraste(evento) {
    const gesto = gestoRef.current;

    if (
      !gesto ||
      gesto.pointerId !== evento.pointerId
    ) {
      return;
    }

    const diferencaX =
      evento.clientX - gesto.x;

    const diferencaY =
      evento.clientY - gesto.y;

    // Identifica se o gesto é horizontal.
    // Movimentos verticais continuam rolando a página.

    if (!gesto.horizontal) {
      if (
        Math.abs(diferencaY) >
        Math.abs(diferencaX)
      ) {
        return;
      }

      if (Math.abs(diferencaX) < 6) {
        return;
      }

      gesto.horizontal = true;

      setArrastando(true);
      setTransicaoAtiva(false);

      // Mantém o ponteiro capturado durante o arraste.

      try {
        viewportRef.current?.setPointerCapture(
          evento.pointerId
        );
      } catch {
        // O ponteiro pode ter sido liberado.
      }
    }

    // O slide acompanha o dedo em tempo real.

    setDeslocamentoArraste(diferencaX);
  }

  function finalizarArraste(evento) {
    const gesto = gestoRef.current;

    if (
      !gesto ||
      gesto.pointerId !== evento.pointerId
    ) {
      return;
    }

    const diferencaX =
      evento.clientX - gesto.x;

    const diferencaY =
      evento.clientY - gesto.y;

    const foiArrasteHorizontal =
      gesto.horizontal &&
      Math.abs(diferencaX) >
        Math.abs(diferencaY);

    gestoRef.current = null;

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

    // Impede a abertura de links após arrastar.

    bloquearCliqueRef.current = true;

    if (timeoutCliqueRef.current) {
      clearTimeout(timeoutCliqueRef.current);
    }

    timeoutCliqueRef.current = setTimeout(() => {
      bloquearCliqueRef.current = false;
    }, 300);

    const largura =
      viewportRef.current?.offsetWidth || 0;

    const limite = Math.min(
      LIMITE_SWIPE,
      largura * 0.15
    );

    // Zera o deslocamento e anima até a posição final.

    setDeslocamentoArraste(0);
    setTransicaoAtiva(true);

    if (Math.abs(diferencaX) >= limite) {
      if (diferencaX < 0) {
        navegar(1);
      } else {
        navegar(-1);
      }
    }
    // Caso não atinja o limite, volta suavemente
    // para a posição original.
  }

  function cancelarArraste() {
    gestoRef.current = null;

    setArrastando(false);
    setDeslocamentoArraste(0);
    setTransicaoAtiva(true);
  }

  function impedirCliqueAposSwipe(evento) {
    if (!bloquearCliqueRef.current) return;

    evento.preventDefault();
    evento.stopPropagation();

    bloquearCliqueRef.current = false;
  }

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
  // POSIÇÃO DO CARROSSEL
  // ============================================================

  // Cada slide ocupa 100% da largura do banner.
  // O deslocamento do dedo é somado à posição atual.

  const deslocamento = `calc(
    -${indice * 100}%
    + ${deslocamentoArraste}px
  )`;

  // Índice real para leitores de tela.

  const indiceReal = podeNavegar
    ? ((indice - 1 + quantidade) % quantidade)
    : 0;

  // ============================================================
  // RENDERIZAÇÃO
  // ============================================================

  return (
    <article
      aria-label="Editorial Aurora"
      aria-roledescription="carrossel"
      className="relative flex min-h-[300px] overflow-hidden rounded-[20px] bg-[#302719] text-white md:h-[312px]"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setFoco(true)}
      onBlurCapture={(evento) => {
        if (
          !evento.currentTarget.contains(
            evento.relatedTarget
          )
        ) {
          setFoco(false);
        }
      }}
    >
      {/* ===================================== */}
      {/* ÁREA DO CARROSSEL */}
      {/* ===================================== */}

      <div
        ref={viewportRef}
        className="absolute inset-0 overflow-hidden select-none"
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
        onClickCapture={impedirCliqueAposSwipe}
        onDragStart={(evento) =>
          evento.preventDefault()
        }
      >
        {/* ===================================== */}
        {/* TRILHO DOS SLIDES */}
        {/* ===================================== */}

        <div
          ref={trilhoRef}
          onTransitionEnd={finalizarTransicao}
          className="flex h-full will-change-transform"
          style={{
            transform: `translate3d(${deslocamento}, 0, 0)`,

            transition:
              transicaoAtiva && !arrastando
                ? `transform ${DURACAO_TRANSICAO}ms cubic-bezier(0.22, 1, 0.36, 1)`
                : "none",
          }}
        >
          {slides.map((postagem, posicao) => (
            <div
              key={`${postagem?.id || "vazio"}-${posicao}`}
              className="relative flex h-full w-full shrink-0 items-end overflow-hidden"
            >
              {/* IMAGEM */}

              <img
                src={
                  postagem?.imagemUrl ||
                  imagemPadrao
                }
                alt=""
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                onError={(evento) => {
                  evento.currentTarget.onerror = null;
                  evento.currentTarget.src =
                    imagemPadrao;
                }}
              />

              {/* GRADIENTE */}

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

              {/* CONTEÚDO */}

              <div
                className="relative z-10 w-full p-6 pb-14 sm:p-8 sm:pb-14"
                aria-hidden={
                  podeNavegar &&
                  posicao !== indice
                }
              >
                <Link
                  to="/editorial"
                  tabIndex={
                    podeNavegar &&
                    posicao !== indice
                      ? -1
                      : 0
                  }
                  className="text-[10px] uppercase tracking-[2px] underline-offset-4 hover:underline"
                >
                  Editorial / Aurora
                </Link>

                <h2 className="mt-2 line-clamp-2 font-serif text-2xl leading-tight">
                  {postagem?.titulo ||
                    "Inspiração em cada detalhe"}
                </h2>

                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/90">
                  {postagem?.resumo ||
                    erro ||
                    "Em breve, histórias e cuidados para suas joias."}
                </p>

                <Link
                  to={
                    postagem
                      ? `/editorial/${postagem.id}`
                      : "/editorial"
                  }
                  tabIndex={
                    podeNavegar &&
                    posicao !== indice
                      ? -1
                      : 0
                  }
                  className="mt-3 inline-flex rounded-full bg-[#FCFAF6] px-5 py-3 text-xs font-medium text-[#241F16] transition hover:bg-white"
                >
                  {postagem
                    ? "Ler postagem"
                    : "Visitar editorial"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===================================== */}
      {/* BOTÕES DE NAVEGAÇÃO */}
      {/* ===================================== */}

      {podeNavegar && (
        <div
          data-controle-carrossel
          className="absolute bottom-3 right-4 z-20 flex items-center gap-1"
          aria-label="Navegação do editorial"
        >
          <span className="sr-only">
            Postagem {indiceReal + 1} de {quantidade}
          </span>

          {/* ANTERIOR */}

          <button
            type="button"
            aria-label="Postagem anterior"
            title="Postagem anterior"
            onClick={anterior}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/50 bg-white text-black backdrop-blur-sm transition-all duration-300 hover:border-white hover:bg-white active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ArrowLeft
              size={17}
              strokeWidth={1.8}
            />
          </button>

          {/* PRÓXIMO */}

          <button
            type="button"
            aria-label="Próxima postagem"
            title="Próxima postagem"
            onClick={proximo}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/50 bg-white text-black backdrop-blur-sm transition-all duration-300 hover:border-white hover:bg-white active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          
          >
            <ArrowRight
              size={17}
              strokeWidth={1.8}
            />
          </button>
        </div>
      )}
    </article>
  );
}
