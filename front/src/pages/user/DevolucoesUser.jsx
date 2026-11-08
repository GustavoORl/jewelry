
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Package,
  PackageCheck,
  LoaderCircle,
  CalendarDays,
  ClipboardList,
  ShieldCheck,
  Clock3,
  ChevronRight,
  AlertCircle,
  RefreshCcw,
  CheckCircle2,
  FileText,
  ShoppingBag,
  X,
} from "lucide-react";

import {
  separarPedidosDevolucao,
  PRAZO_DEVOLUCAO_MS,
} from "../../utils/elegibilidadeDevolucao.js";

import { apiFetch } from "../../services/api.js";
import FaixaNavegacao from "../../components/common/FaixaNavegacao.jsx";
import DevolucaoPedido from "../../components/user/DevolucaoPedido.jsx";

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function formatarData(data) {
  if (!data) return "Não informada";

  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) {
    return "Não informada";
  }

  return valor.toLocaleDateString("pt-BR");
}

function formatarDataHora(data) {
  if (!data) return "Não informada";

  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) {
    return "Não informada";
  }

  return valor.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatarNumeroPedido(id) {
  return String(id || "").slice(-8).toUpperCase();
}

function obterPrazoDevolucao(entregueEm) {
  if (!entregueEm) return null;

  const entrega = new Date(entregueEm).getTime();

  if (!Number.isFinite(entrega)) return null;

  return new Date(entrega + PRAZO_DEVOLUCAO_MS);
}

function formatarTempoRestante(prazo, agora) {
  if (!prazo) return "Prazo indisponível";

  const diferenca = prazo.getTime() - agora;

  if (diferenca <= 0) {
    return "Prazo encerrado";
  }

  const dias = Math.floor(diferenca / 86400000);
  const horas = Math.floor(
    (diferenca % 86400000) / 3600000
  );
  const minutos = Math.floor(
    (diferenca % 3600000) / 60000
  );

  if (dias > 0) {
    return `${dias}d ${horas}h restantes`;
  }

  if (horas > 0) {
    return `${horas}h ${minutos}min restantes`;
  }

  return `${Math.max(1, minutos)}min restantes`;
}

// ============================================================
// CARD INFORMATIVO
// ============================================================

function CardInformacao({ icone: Icone, titulo, descricao }) {
  return (
    <div className="flex items-start gap-4 rounded-[20px] border border-[#EAE5DC] bg-white p-5 transition-all duration-300 hover:border-[#CDBB9A] hover:shadow-md hover:shadow-black/[0.035]">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F5F1E9] text-[#968052]">
        <Icone size={20} strokeWidth={1.7} />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[#211C14]">
          {titulo}
        </h3>

        <p className="mt-1.5 text-xs leading-6 text-[#756C5C]">
          {descricao}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// CABEÇALHO DO PEDIDO
// ============================================================

function CabecalhoPedido({ pedido, solicitado = false }) {
  return (
    <header className="border-b border-[#EEE9E1] bg-[#FAF9F6] px-5 py-5 sm:px-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F5F1E9] text-[#968052]">
            {solicitado ? (
              <ClipboardList size={21} strokeWidth={1.7} />
            ) : (
              <PackageCheck size={21} strokeWidth={1.7} />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.17em] text-[#968052]">
              {solicitado
                ? "Solicitação registrada"
                : "Pedido disponível"}
            </p>

            <h3 className="mt-1 text-base font-semibold tracking-wide text-[#211C14]">
              Pedido #{formatarNumeroPedido(pedido.id)}
            </h3>
          </div>
        </div>

        <Link
          to={`/pedidos/${pedido.id}`}
          className="group inline-flex items-center gap-1.5 self-start text-xs font-medium text-[#968052] transition hover:text-[#211C14] sm:self-center"
        >
          Ver detalhes

          <ChevronRight
            size={16}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#EAE5DC] pt-4">
        <div className="flex items-center gap-2 text-xs text-[#756C5C]">
          <CalendarDays
            size={15}
            className="text-[#968052]"
          />

          <span>
            Compra em{" "}
            <strong className="font-medium text-[#211C14]">
              {formatarData(pedido.criadoEm)}
            </strong>
          </span>
        </div>

        {pedido.entregueEm && (
          <div className="flex items-center gap-2 text-xs text-[#756C5C]">
            <PackageCheck
              size={15}
              className="text-[#968052]"
            />

            <span>
              Entregue em{" "}
              <strong className="font-medium text-[#211C14]">
                {formatarData(pedido.entregueEm)}
              </strong>
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

// ============================================================
// LISTA DE PRODUTOS
// ============================================================

function ListaProdutosPedido({ itens = [] }) {
  if (!itens.length) return null;

  return (
    <div className="mb-5">
      <div className="mb-3 flex items-center gap-2">
        <ShoppingBag
          size={16}
          className="text-[#968052]"
        />

        <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#756C5C]">
          Produtos do pedido
        </h4>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#EAE5DC] bg-white">
        {itens.map((item, indice) => (
          <div
            key={item.id || indice}
            className={`flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5 ${
              indice !== itens.length - 1
                ? "border-b border-[#EEE9E1]"
                : ""
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5F1E9] text-[#968052]">
                <Package size={17} strokeWidth={1.7} />
              </div>

              <p className="min-w-0 text-sm font-medium leading-5 text-[#211C14]">
                {item.nomeProduto || "Produto"}
              </p>
            </div>

            <span className="shrink-0 rounded-full border border-[#EAE5DC] bg-[#F8F7F4] px-3 py-1.5 text-[11px] font-medium text-[#756C5C]">
              {item.quantidade}{" "}
              {Number(item.quantidade) === 1
                ? "unidade"
                : "unidades"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function DevolucoesUser() {
  const [todosPedidos, setPedidos] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);

  const [selecionado, setSelecionado] = useState(null);
  const [agora, setAgora] = useState(() => Date.now());

  // ============================================================
  // ATUALIZAÇÃO DO PRAZO
  // ============================================================

  useEffect(() => {
    const timer = setInterval(() => {
      setAgora(Date.now());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  // ============================================================
  // AGRUPAMENTO DE PEDIDOS
  // ============================================================

  const grupos = useMemo(
    () =>
      separarPedidosDevolucao(
        todosPedidos,
        solicitacoes,
        agora
      ),
    [todosPedidos, solicitacoes, agora]
  );

  const pedidos = grupos.elegiveis;

  const resumo = {
    total: pedidos.length,
    solicitacoes: grupos.solicitados.length,
  };

  // ============================================================
  // CARREGAR PEDIDOS E DEVOLUÇÕES
  // ============================================================

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      try {
        setCarregando(true);
        setErro("");

        const [compras, resultadoDevolucoes] =
          await Promise.all([
            apiFetch("/pedidos"),
            apiFetch("/devolucoes"),
          ]);

        if (!ativo) return;

        const listaPedidos = Array.isArray(compras)
          ? compras
          : compras?.pedidos || [];

        const listaDevolucoes = Array.isArray(
          resultadoDevolucoes
        )
          ? resultadoDevolucoes
          : resultadoDevolucoes?.devolucoes || [];

        const idsComDevolucao = new Set(
          listaDevolucoes.map((devolucao) =>
            String(devolucao.pedidoId)
          )
        );

        const pedidosDisponiveis = listaPedidos
          .filter(
            (pedido) =>
              pedido.status === "ENTREGUE" ||
              idsComDevolucao.has(String(pedido.id))
          )
          .sort(
            (a, b) =>
              new Date(b.criadoEm) -
              new Date(a.criadoEm)
          );

        setPedidos(pedidosDisponiveis);
        setSolicitacoes(listaDevolucoes);
        setAgora(Date.now());
      } catch (error) {
        if (!ativo) return;

        setErro(
          error.message ||
            "Não foi possível carregar suas devoluções."
        );
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarDados();

    return () => {
      ativo = false;
    };
  }, [tentativa]);

  // ============================================================
  // SOLICITAÇÃO REALIZADA
  // ============================================================

  function registrarSolicitacao(devolucao, pedidoId) {
    setSolicitacoes((atuais) => {
      const outras = atuais.filter(
        (item) =>
          String(item.pedidoId) !== String(pedidoId)
      );

      return [
        ...outras,
        {
          ...devolucao,
          pedidoId,
        },
      ];
    });

    setSelecionado(null);
    setAgora(Date.now());
  }

  // ============================================================
  // RENDERIZAÇÃO
  // ============================================================

  return (
    <main className="min-h-screen bg-[#FCFAF6] text-[#211C14]">
      <FaixaNavegacao
        mostrarVoltar={false}
        itens={[
          { label: "Início", to: "/" },
          { label: "Perfil", to: "/perfil" },
          { label: "Devoluções e reembolso" },
        ]}
      />

      <div className="mx-auto max-w-[1120px] px-5 pb-20 pt-8 sm:px-8 sm:pt-10 lg:pb-24 lg:pt-12">

        {/* CABEÇALHO */}

        <header className="mb-10">

          <h1 className="mt-3 max-w-[650px] font-serif text-[32px] leading-[1.15] tracking-tight sm:text-[40px] lg:text-[44px]">
            Devoluções e reembolsos
          </h1>

          <p className="mt-4 max-w-[650px] text-sm leading-7 text-[#756C5C]">
            Solicite devoluções e acompanhe o andamento
            dos seus protocolos em um só lugar.
          </p>
        </header>


        {/* PRAZO - BLOCO ESCURO PRINCIPAL */}

        <section className="mb-10 overflow-hidden rounded-[22px] bg-[#211C14] text-white">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#D8C29A]">
                <Clock3 size={21} strokeWidth={1.7} />
              </div>

              <div>
                <h2 className="font-serif text-lg text-white sm:text-xl">
                  Prazo para devolução
                </h2>

                <p className="mt-1.5 max-w-[620px] text-xs leading-6 text-[#D5CFC4] sm:text-sm">
                  Você pode solicitar a devolução em até{" "}
                  <strong className="font-semibold text-white">
                    7 dias corridos após a entrega
                  </strong>
                  . Acompanhe o prazo individual de cada
                  pedido abaixo.
                </p>
              </div>
            </div>

            <Link
              to="/pedidos"
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-medium text-white transition hover:bg-white hover:text-[#211C14] sm:self-center"
            >
              Meus pedidos
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        {/* TÍTULO DOS PEDIDOS */}

        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#968052]">
              Solicitar devolução
            </span>

            <h2 className="mt-2 font-serif text-2xl sm:text-[28px]">
              Pedidos elegíveis
            </h2>

            <p className="mt-2 text-xs leading-6 text-[#898174] sm:text-sm">
              Selecione um pedido para iniciar sua solicitação.
            </p>
          </div>

          {!carregando && !erro && (
            <span className="rounded-full border border-[#EAE5DC] bg-white px-4 py-2 text-[11px] font-medium text-[#756C5C]">
              {pedidos.length}{" "}
              {pedidos.length === 1
                ? "pedido disponível"
                : "pedidos disponíveis"}
            </span>
          )}
        </div>

        {/* CARREGAMENTO */}

        {carregando && (
          <div
            role="status"
            className="rounded-[22px] border border-[#EAE5DC] bg-white px-6 py-16 text-center"
          >
            <LoaderCircle
              size={28}
              className="mx-auto animate-spin text-[#968052]"
            />

            <p className="mt-4 text-sm font-medium">
              Carregando suas devoluções
            </p>

            <p className="mt-2 text-xs text-[#898174]">
              Buscando pedidos e solicitações.
            </p>
          </div>
        )}

        {/* ERRO */}

        {!carregando && erro && (
          <div
            role="alert"
            className="rounded-[22px] border border-[#EAE5DC] bg-white px-6 py-12 text-center"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF3EE] text-[#B76D55]">
              <AlertCircle size={26} />
            </div>

            <h3 className="mt-5 font-serif text-2xl">
              Não foi possível carregar
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#756C5C]">
              {erro}
            </p>

            <button
              type="button"
              onClick={() =>
                setTentativa((atual) => atual + 1)
              }
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#211C14] px-6 py-3 text-xs font-medium text-white transition hover:bg-[#4A3D2B]"
            >
              <RefreshCcw size={15} />
              Tentar novamente
            </button>
          </div>
        )}

        {/* ESTADO VAZIO */}

        {!carregando &&
          !erro &&
          pedidos.length === 0 && (
            <section className="rounded-[22px] border border-[#EAE5DC] bg-white px-6 py-12 text-center sm:px-10 sm:py-14">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F1E9] text-[#968052]">
                <Package size={28} strokeWidth={1.5} />
              </div>

              <h3 className="mx-auto mt-5 max-w-md font-serif text-2xl leading-tight">
                Nenhum pedido disponível para devolução
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#756C5C]">
                Aqui aparecem os pedidos entregues dentro
                do prazo de devolução e que ainda não
                possuem uma solicitação.
              </p>

              {grupos.semData.length > 0 && (
                <p className="mx-auto mt-3 max-w-md text-xs leading-6 text-[#A47B43]">
                  Alguns pedidos não possuem data de entrega
                  registrada. Entre em contato com nossa
                  equipe para verificar.
                </p>
              )}

              <Link
                to="/pedidos"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#211C14] px-6 py-3 text-xs font-medium text-white transition hover:bg-[#4A3D2B]"
              >
                Consultar meus pedidos
                <ArrowRight size={15} />
              </Link>
            </section>
          )}

        {/* PEDIDOS ELEGÍVEIS */}

        {!carregando &&
          !erro &&
          pedidos.length > 0 && (
            <section
              aria-label="Pedidos elegíveis para devolução"
              className="space-y-5"
            >
              {pedidos.map((pedido) => {
                const aberto = selecionado === pedido.id;

                const prazo = obterPrazoDevolucao(
                  pedido.entregueEm
                );

                return (
                  <article
                    key={pedido.id}
                    className="overflow-hidden rounded-[22px] border border-[#EAE5DC] bg-white transition-all duration-300 hover:border-[#D7C5A5] hover:shadow-lg hover:shadow-[#211C14]/[0.035]"
                  >
                    <CabecalhoPedido pedido={pedido} />

                    <div className="p-5 sm:p-7">
                      <ListaProdutosPedido
                        itens={pedido.itens || []}
                      />

                      {/* PRAZO INDIVIDUAL */}

                      {prazo && (
                        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#EAE5DC] bg-[#F7F5F0] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                          <div className="flex items-start gap-3">
                            <Clock3
                              size={19}
                              className="mt-0.5 shrink-0 text-[#968052]"
                            />

                            <div>
                              <p className="text-xs font-semibold text-[#211C14]">
                                Prazo para solicitar devolução
                              </p>

                              <p className="mt-1 text-xs text-[#756C5C]">
                                Até {formatarDataHora(prazo)}
                              </p>
                            </div>
                          </div>

                          <span className="self-start rounded-full bg-[#211C14] px-3 py-1.5 text-[11px] font-medium text-white sm:self-center">
                            {formatarTempoRestante(
                              prazo,
                              agora
                            )}
                          </span>
                        </div>
                      )}

                      {/* FORMULÁRIO */}

                      {aberto ? (
                        <div
                          id={`solicitar-${pedido.id}`}
                          className="overflow-hidden rounded-2xl border border-[#EAE5DC] bg-white"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEE9E1] bg-[#F7F5F0] px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#211C14] text-[#D8C29A]">
                                <RotateCcw size={17} />
                              </div>

                              <div>
                                <h4 className="text-sm font-semibold text-[#211C14]">
                                  Solicitar devolução
                                </h4>

                                <p className="mt-0.5 text-[11px] text-[#898174]">
                                  Preencha as informações abaixo
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setSelecionado(null)
                              }
                              className="inline-flex items-center gap-1.5 rounded-full border border-[#EAE5DC] bg-white px-3 py-2 text-xs font-medium text-[#756C5C] transition hover:border-[#211C14] hover:text-[#211C14]"
                            >
                              <X size={14} />
                              Fechar
                            </button>
                          </div>

                          <div className="p-4 sm:p-6">
                            <DevolucaoPedido
                              pedido={pedido}
                              onSolicitada={(devolucao) =>
                                registrarSolicitacao(
                                  devolucao,
                                  pedido.id
                                )
                              }
                            />
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          aria-expanded={false}
                          aria-controls={`solicitar-${pedido.id}`}
                          onClick={() =>
                            setSelecionado(pedido.id)
                          }
                          className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#211C14] px-6 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:bg-[#4A3D2B] sm:w-auto"
                        >
                          Iniciar devolução/reembolso

                          <ArrowRight
                            size={17}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          )}

        {/* MINHAS SOLICITAÇÕES */}

        <section
          aria-label="Minhas solicitações"
          className="mt-14"
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#968052]">
                Histórico e acompanhamento
              </span>

              <h2 className="mt-2 font-serif text-2xl sm:text-[28px]">
                Minhas solicitações
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#756C5C]">
                Acompanhe protocolos, respostas e reembolsos
                já solicitados, mesmo após o prazo para
                novas devoluções.
              </p>
            </div>

            {!carregando && !erro && (
              <span className="rounded-full border border-[#EAE5DC] bg-white px-4 py-2 text-[11px] font-medium text-[#756C5C]">
                {grupos.solicitados.length}{" "}
                {grupos.solicitados.length === 1
                  ? "solicitação"
                  : "solicitações"}
              </span>
            )}
          </div>

          {!carregando &&
            !erro &&
            (grupos.solicitados.length > 0 ? (
              <div className="space-y-5">
                {grupos.solicitados.map((pedido) => (
                  <article
                    key={pedido.id}
                    className="overflow-hidden rounded-[22px] border border-[#EAE5DC] bg-white transition-all duration-300 hover:border-[#D7C5A5] hover:shadow-lg hover:shadow-[#211C14]/[0.035]"
                  >
                    <CabecalhoPedido
                      pedido={pedido}
                      solicitado
                    />

                    <div className="p-5 sm:p-7">
                      <ListaProdutosPedido
                        itens={pedido.itens || []}
                      />

                      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#EAE5DC] bg-[#F7F5F0] px-4 py-4">
                        <CheckCircle2
                          size={19}
                          className="mt-0.5 shrink-0 text-[#968052]"
                        />

                        <div>
                          <p className="text-xs font-semibold text-[#211C14]">
                            Solicitação registrada
                          </p>

                          <p className="mt-1 text-xs leading-5 text-[#756C5C]">
                            Consulte abaixo o protocolo,
                            o status e as respostas da equipe.
                          </p>
                        </div>
                      </div>

                      <DevolucaoPedido pedido={pedido} />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-[22px] border border-[#EAE5DC] bg-white px-6 py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F1E9] text-[#968052]">
                  <FileText
                    size={27}
                    strokeWidth={1.6}
                  />
                </div>

                <h3 className="mt-5 font-serif text-xl">
                  Nenhuma solicitação enviada
                </h3>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#756C5C]">
                  Quando você solicitar uma devolução,
                  poderá acompanhar o andamento e as
                  respostas da equipe nesta seção.
                </p>
              </div>
            ))}
        </section>

        {/* COMO FUNCIONA */}

        <section className="mt-14">
          <div className="mb-5">
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#968052]">
              Informações úteis
            </span>

            <h2 className="mt-2 font-serif text-2xl">
              Como funciona?
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <CardInformacao
              icone={ClipboardList}
              titulo="Solicite a devolução"
              descricao="Escolha um pedido elegível e envie sua solicitação."
            />

            <CardInformacao
              icone={ShieldCheck}
              titulo="Acompanhe a análise"
              descricao="Consulte as atualizações e respostas da equipe."
            />

            <CardInformacao
              icone={RotateCcw}
              titulo="Acompanhe o reembolso"
              descricao="Consulte o andamento da devolução e do reembolso."
            />
          </div>
        </section>
      </div>
    </main>
  );
}
