import ChatDevolucao from "../../components/user/ChatDevolucao.jsx";
import { useLocation } from "react-router-dom";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  FileText,
  ImageIcon,
  LoaderCircle,
  MapPin,
  Package,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Truck,
  UserRound,
  XCircle,
} from "lucide-react";

import Sidebar from "../../components/admin/Sidebar.jsx";
import AdminHeader from "../../components/admin/AdminHeader.jsx";

import {
  nomesStatusDevolucao,
  motivosDevolucao,
} from "../../utils/devolucoes.js";

import FotoDevolucao from "../../components/user/FotoDevolucao.jsx";
import { apiFetch } from "../../services/api.js";

// ============================================================
// CONFIGURAÇÕES
// ============================================================

const PROXIMOS_STATUS = {
  SOLICITADA: ["APROVADA", "RECUSADA"],
  APROVADA: ["RECEBIDA"],
  RECEBIDA: ["CONCLUIDA"],
};

const STATUS_VISUAL = {
  SOLICITADA: {
    label: "Solicitada",
    classe: "border-[#E8D7B5] bg-[#FAF3E5] text-[#94723A]",
    Icone: Clock3,
  },
  APROVADA: {
    label: "Aprovada",
    classe: "border-[#D5E4DC] bg-[#EDF5EF] text-[#548069]",
    Icone: CheckCircle2,
  },
  RECUSADA: {
    label: "Recusada",
    classe: "border-[#F0D8D5] bg-[#FBEEEE] text-[#A45B52]",
    Icone: XCircle,
  },
  RECEBIDA: {
    label: "Recebida",
    classe: "border-[#D9E2EF] bg-[#EFF4FA] text-[#607D9E]",
    Icone: PackageCheck,
  },
  CONCLUIDA: {
    label: "Concluída",
    classe: "border-[#D5E4DC] bg-[#EDF5EF] text-[#548069]",
    Icone: ShieldCheck,
  },
};

const inputClass =
  "mt-2 w-full rounded-xl border border-[#E5D9C6] bg-white px-4 py-3 text-sm text-[#211C14] outline-none transition placeholder:text-[#A49A8C] focus:border-[#968052] focus:ring-2 focus:ring-[#968052]/10 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass =
  "block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71675B]";

// ============================================================
// FORMATADORES
// ============================================================

function formatarData(valor) {
  if (!valor) return "Data não informada";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "Data inválida";
  }

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarId(id) {
  return String(id || "")
    .slice(-8)
    .toUpperCase();
}

function nomeStatus(status) {
  return (
    nomesStatusDevolucao[status] ||
    STATUS_VISUAL[status]?.label ||
    status
  );
}

// ============================================================
// BADGE DE STATUS
// ============================================================

function BadgeStatus({ status }) {
  const config = STATUS_VISUAL[status] || {
    classe: "border-[#EAE0D1] bg-[#F7F2E8] text-[#81776A]",
    Icone: ClipboardList,
  };

  const Icone = config.Icone;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold ${config.classe}`}
    >
      <Icone size={13} strokeWidth={1.8} />
      {nomeStatus(status)}
    </span>
  );
}

// ============================================================
// CARD DE ESTATÍSTICA
// ============================================================

function CardEstatistica({ titulo, valor, Icone }) {
  return (
    <div className="flex items-center gap-3 rounded-[20px] border border-[#EAE0D1] bg-white p-4 sm:p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F7F2E8] text-[#968052]">
        <Icone size={19} strokeWidth={1.7} />
      </div>

      <div>
        <p className="text-[11px] text-[#918679]">
          {titulo}
        </p>

        <p className="mt-1 text-xl font-semibold text-[#211C14]">
          {valor}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// CARD DA SOLICITAÇÃO
// ============================================================

function Solicitacao({ devolucao: d, atualizar }) {
  const [resposta, setResposta] = useState(
    d.resposta || ""
  );

  const [status, setStatus] = useState(
    PROXIMOS_STATUS[d.status]?.[0] || ""
  );

  const [confirmouReembolso, setConfirmouReembolso] =
    useState(false);

  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const proximos = PROXIMOS_STATUS[d.status] || [];

  const pedido = d.pedido || {};
  const usuario = pedido.usuario || {};
  const itensPedido = pedido.itens || [];

  const itensDevolucao = d.itens || [];
  const fotos = d.fotos || [];

  // ============================================================
  // SALVAR ALTERAÇÃO
  // ============================================================

  async function salvar(event) {
    event.preventDefault();

    if (!status || ocupado) return;

    if (
      status === "CONCLUIDA" &&
      !confirmouReembolso
    ) {
      setErro(
        "Confirme que a devolução foi tratada e que o reembolso devido foi realizado."
      );

      return;
    }

    setOcupado(true);
    setErro("");

    try {
      await apiFetch(
        `/admin/devolucoes/${d.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
            resposta: resposta.trim(),
          }),
        }
      );

      await atualizar();
    } catch (error) {
      console.error(
        "Erro ao atualizar devolução:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível atualizar a devolução."
      );
    } finally {
      setOcupado(false);
    }
  }

  // ============================================================
  // RENDERIZAÇÃO
  // ============================================================

  return (
    <article className="min-w-0 overflow-hidden rounded-[24px] border border-[#EAE0D1] bg-white transition-colors hover:border-[#D6C29C]">
      {/* ===================================== */}
      {/* CABEÇALHO */}
      {/* ===================================== */}

      <div className="border-b border-[#F0EADF] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F7F2E8] text-[#968052]">
              <RotateCcw
                size={20}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#A47B43]">
                Solicitação de devolução
              </p>

              <h2 className="font-serif text-xl text-[#211C14]">
                Pedido #{formatarId(d.pedidoId)}
              </h2>
            </div>
          </div>

          <BadgeStatus status={d.status} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[#81776A]">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays
              size={14}
              className="text-[#A47B43]"
            />
            {formatarData(d.criadoEm)}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Package
              size={14}
              className="text-[#A47B43]"
            />
            {itensDevolucao.length}{" "}
            {itensDevolucao.length === 1
              ? "item"
              : "itens"}
          </span>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        {/* ===================================== */}
        {/* CLIENTE */}
        {/* ===================================== */}

        <section>
          <div className="mb-3 flex items-center gap-2">
            <UserRound
              size={16}
              className="text-[#968052]"
            />

            <h3 className="text-xs font-semibold text-[#211C14]">
              Informações do cliente
            </h3>
          </div>

          <div className="rounded-[16px] bg-[#FAF7F1] p-4">
            <p className="break-words text-sm font-medium text-[#514635]">
              {usuario.nome || "Cliente"}
            </p>

            <p className="mt-1.5 break-all text-xs text-[#81776A]">
              {usuario.email || "E-mail não informado"}
            </p>
          </div>
        </section>

        {/* ===================================== */}
        {/* MOTIVO */}
        {/* ===================================== */}

        <section>
          <div className="mb-3 flex items-center gap-2">
            <FileText
              size={16}
              className="text-[#968052]"
            />

            <h3 className="text-xs font-semibold text-[#211C14]">
              Motivo da devolução
            </h3>
          </div>

          <div className="rounded-[16px] border border-[#EAE0D1] p-4">
            <p className="text-xs font-semibold text-[#A47B43]">
              {motivosDevolucao[d.tipoMotivo] ||
                "Outro motivo"}
            </p>

            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#71675B]">
              {d.motivo || "Nenhuma descrição informada."}
            </p>
          </div>
        </section>

        {/* ===================================== */}
        {/* FOTOS */}
        {/* ===================================== */}

        {fotos.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ImageIcon
                  size={16}
                  className="text-[#968052]"
                />

                <h3 className="text-xs font-semibold text-[#211C14]">
                  Fotos enviadas
                </h3>
              </div>

              <span className="text-[11px] text-[#918679]">
                {fotos.length}{" "}
                {fotos.length === 1
                  ? "imagem"
                  : "imagens"}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              {fotos.map((foto, indice) => (
                <div
                  key={foto.id}
                  className="overflow-hidden rounded-[14px] border border-[#EAE0D1]"
                >
                  <FotoDevolucao
                    id={foto.id}
                    indice={indice}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===================================== */}
        {/* ITENS */}
        {/* ===================================== */}

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Package
              size={16}
              className="text-[#968052]"
            />

            <h3 className="text-xs font-semibold text-[#211C14]">
              Produtos solicitados
            </h3>
          </div>

          <div className="overflow-hidden rounded-[16px] border border-[#EAE0D1]">
            {itensDevolucao.length === 0 ? (
              <p className="p-4 text-xs text-[#81776A]">
                Nenhum item informado.
              </p>
            ) : (
              <ul className="divide-y divide-[#F0EADF]">
                {itensDevolucao.map((item) => {
                  const produto = itensPedido.find(
                    (pedidoItem) =>
                      pedidoItem.id === item.itemPedidoId
                  );

                  return (
                    <li
                      key={item.itemPedidoId}
                      className="flex items-start justify-between gap-3 p-4"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#F7F2E8] text-[#968052]">
                          <Package
                            size={17}
                            strokeWidth={1.6}
                          />
                        </div>

                        <p className="break-words pt-1 text-xs font-medium leading-relaxed text-[#514635]">
                          {produto?.nomeProduto || "Produto"}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-[#F7F2E8] px-2.5 py-1.5 text-[10px] font-medium text-[#81776A]">
                        {item.quantidade} un.
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* ===================================== */}
        {/* ÚLTIMA RESPOSTA */}
        {/* ===================================== */}

        <ChatDevolucao pedidoId={d.pedidoId} admin />

        {/* ===================================== */}
        {/* ATUALIZAÇÃO DE STATUS */}
        {/* ===================================== */}

        {proximos.length > 0 ? (
          <form
            onSubmit={salvar}
            className="border-t border-[#F0EADF] pt-6"
          >
            <div className="mb-5">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#A47B43]">
                Gerenciar solicitação
              </p>

              <h3 className="font-serif text-xl text-[#211C14]">
                Atualizar devolução
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-[#81776A]">
                Selecione o próximo status e informe
                as orientações que serão enviadas ao cliente.
              </p>
            </div>

            {/* STATUS */}

            <div>
              <label
                htmlFor={`status-${d.id}`}
                className={labelClass}
              >
                Próximo status
              </label>

              <select
                id={`status-${d.id}`}
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setConfirmouReembolso(false);
                }}
                disabled={ocupado}
                className={inputClass}
              >
                {proximos.map((opcao) => (
                  <option key={opcao} value={opcao}>
                    {nomeStatus(opcao)}
                  </option>
                ))}
              </select>
            </div>

            {/* RESPOSTA */}

            <div className="mt-5">
              <label
                htmlFor={`resposta-${d.id}`}
                className={labelClass}
              >
                Resposta e instruções para o cliente
              </label>

              <textarea
                id={`resposta-${d.id}`}
                required
                minLength={10}
                maxLength={2000}
                rows={5}
                value={resposta}
                onChange={(event) =>
                  setResposta(event.target.value)
                }
                disabled={ocupado}
                placeholder="Descreva as orientações e os próximos passos da devolução..."
                className={`${inputClass} resize-y leading-relaxed`}
              />

              <p className="mt-1.5 text-right text-[10px] text-[#A49A8C]">
                {resposta.length}/2000
              </p>
            </div>

            {/* CONFIRMAÇÃO DE REEMBOLSO */}

            {status === "CONCLUIDA" && (
              <div className="mt-5 rounded-[16px] border border-[#E8D7B5] bg-[#FAF3E5] p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    required
                    checked={confirmouReembolso}
                    onChange={(event) =>
                      setConfirmouReembolso(
                        event.target.checked
                      )
                    }
                    disabled={ocupado}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#968052]"
                  />

                  <div>
                    <p className="text-xs font-semibold text-[#795F37]">
                      Confirmação obrigatória
                    </p>

                    <p className="mt-2 text-xs leading-relaxed text-[#795F37]">
                      Confirmo que a devolução foi tratada
                      e o reembolso devido foi realizado
                      no provedor de pagamento.
                    </p>

                    <p className="mt-2 text-[11px] leading-relaxed text-[#94723A]">
                      Esta ação não executa estorno nem
                      altera o estoque automaticamente.
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* ERRO */}

            {erro && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2 rounded-[14px] border border-[#F0D8D5] bg-[#FBEEEE] p-3 text-xs text-[#A45B52]"
              >
                <AlertCircle
                  size={16}
                  className="shrink-0"
                />

                <span>{erro}</span>
              </div>
            )}

            {/* SALVAR */}

            <button
              type="submit"
              disabled={ocupado}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#211C14] px-5 py-3.5 text-xs font-medium text-white transition hover:bg-[#4A3D2B] disabled:cursor-wait disabled:opacity-50"
            >
              {ocupado ? (
                <>
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Atualizar devolução
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-3 rounded-[16px] bg-[#F7F2E8] p-4">
            <CheckCircle2
              size={19}
              className="shrink-0 text-[#968052]"
            />

            <p className="text-xs leading-relaxed text-[#71675B]">
              Esta solicitação não possui novas
              transições de status disponíveis.
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

// ============================================================
// REGISTRAR ENTREGA DE PEDIDOS ANTIGOS
// ============================================================

function RegistrarEntrega() {
  const [pedidos, setPedidos] = useState([]);
  const [pedidoId, setPedidoId] = useState("");
  const [data, setData] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const [ocupado, setOcupado] = useState(false);
  const [carregando, setCarregando] = useState(true);

  // ============================================================
  // CARREGAR PEDIDOS
  // ============================================================

  useEffect(() => {
    let ativo = true;

    async function carregarPedidos() {
      try {
        const resposta = await apiFetch(
          "/admin/devolucoes/entregas-sem-data"
        );

        if (!ativo) return;

        setPedidos(
          Array.isArray(resposta?.pedidos)
            ? resposta.pedidos
            : []
        );
      } catch (error) {
        if (!ativo) return;

        setErro(
          error.message ||
            "Não foi possível consultar entregas sem data."
        );
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarPedidos();

    return () => {
      ativo = false;
    };
  }, []);

  // ============================================================
  // REGISTRAR ENTREGA
  // ============================================================

  async function registrar(event) {
    event.preventDefault();

    if (!pedidoId || !data || ocupado) return;

    const dataEntrega = new Date(data);

    if (Number.isNaN(dataEntrega.getTime())) {
      setErro("Informe uma data de entrega válida.");
      return;
    }

    if (dataEntrega.getTime() > Date.now()) {
      setErro(
        "A data de entrega não pode estar no futuro."
      );
      return;
    }

    setOcupado(true);
    setErro("");
    setMensagem("");

    try {
      await apiFetch(
        `/admin/devolucoes/entrega/${pedidoId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            entregueEm: dataEntrega.toISOString(),
          }),
        }
      );

      setPedidos((anteriores) =>
        anteriores.filter(
          (pedido) => pedido.id !== pedidoId
        )
      );

      setPedidoId("");
      setData("");

      setMensagem(
        "Data de entrega registrada com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao registrar entrega:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível registrar a entrega."
      );
    } finally {
      setOcupado(false);
    }
  }

  // ============================================================
  // RENDERIZAÇÃO
  // ============================================================

  return (
    <details className="group mb-8 overflow-hidden rounded-[22px] border border-[#EAE0D1] bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 marker:hidden sm:p-6 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F7F2E8] text-[#968052]">
            <Truck size={19} strokeWidth={1.7} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-[#211C14]">
              Registrar entrega de pedidos antigos
            </h2>

            <p className="mt-1 text-xs leading-relaxed text-[#81776A]">
              Atualize datas de entrega que ainda
              não foram registradas.
            </p>
          </div>
        </div>

        <ChevronDown
          size={19}
          className="shrink-0 text-[#968052] transition-transform duration-200 group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-[#F0EADF] px-5 py-6 sm:px-6">
        <div className="mb-5 rounded-[16px] bg-[#FAF7F1] p-4">
          <p className="text-xs leading-relaxed text-[#71675B]">
            Informe a data real de entrega para que o prazo
            de 7 dias seja calculado corretamente.
            Datas já registradas não serão alteradas.
          </p>
        </div>

        {carregando ? (
          <div className="flex items-center gap-3 py-4 text-xs text-[#81776A]">
            <LoaderCircle
              size={18}
              className="animate-spin text-[#968052]"
            />
            Consultando pedidos...
          </div>
        ) : pedidos.length > 0 ? (
          <form
            onSubmit={registrar}
            className="grid gap-4 md:grid-cols-2"
          >
            {/* PEDIDO */}

            <div>
              <label
                htmlFor="pedido-entrega"
                className={labelClass}
              >
                Pedido
              </label>

              <select
                id="pedido-entrega"
                required
                value={pedidoId}
                onChange={(event) =>
                  setPedidoId(event.target.value)
                }
                disabled={ocupado}
                className={inputClass}
              >
                <option value="">
                  Selecione um pedido
                </option>

                {pedidos.map((pedido) => (
                  <option
                    key={pedido.id}
                    value={pedido.id}
                  >
                    #{formatarId(pedido.id)} ·{" "}
                    {pedido.usuario?.nome || "Cliente"}
                  </option>
                ))}
              </select>
            </div>

            {/* DATA */}

            <div>
              <label
                htmlFor="data-entrega"
                className={labelClass}
              >
                Entrega realizada em
              </label>

              <input
                id="data-entrega"
                required
                type="datetime-local"
                value={data}
                onChange={(event) =>
                  setData(event.target.value)
                }
                disabled={ocupado}
                className={inputClass}
              />
            </div>

            {/* BOTÃO */}

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={ocupado}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#211C14] px-6 py-3.5 text-xs font-medium text-white transition hover:bg-[#4A3D2B] disabled:opacity-50 sm:w-auto"
              >
                {ocupado ? (
                  <>
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                    Registrando...
                  </>
                ) : (
                  <>
                    <CalendarDays size={16} />
                    Registrar entrega
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-3 rounded-[16px] border border-[#EAE0D1] p-4">
            <CheckCircle2
              size={19}
              className="shrink-0 text-[#968052]"
            />

            <p className="text-xs text-[#81776A]">
              Nenhum pedido sem data disponível.
            </p>
          </div>
        )}

        {/* MENSAGENS */}

        {mensagem && (
          <div
            role="status"
            className="mt-4 flex items-start gap-2 rounded-[14px] border border-[#D5E4DC] bg-[#EDF5EF] p-3 text-xs text-[#548069]"
          >
            <CheckCircle2 size={16} />
            {mensagem}
          </div>
        )}

        {erro && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-[14px] border border-[#F0D8D5] bg-[#FBEEEE] p-3 text-xs text-[#A45B52]"
          >
            <AlertCircle size={16} />
            {erro}
          </div>
        )}
      </div>
    </details>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function AdminDevolucoes() {
  const [dados, setDados] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  const [filtro, setFiltro] = useState("TODAS");
  const { hash, key: chaveNavegacao } = useLocation();
  useEffect(() => { if (hash.startsWith("#conversa-")) { const frame = requestAnimationFrame(() => setFiltro("TODAS")); return () => cancelAnimationFrame(frame); } }, [hash, chaveNavegacao]);

  const [mobileOpen, setMobileOpen] = useState(false);

  // ============================================================
  // CARREGAR DEVOLUÇÕES
  // ============================================================

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await apiFetch(
        "/admin/devolucoes"
      );

      setDados(
        Array.isArray(resposta?.devolucoes)
          ? resposta.devolucoes
          : []
      );
    } catch (error) {
      console.error(
        "Erro ao carregar devoluções:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível carregar as devoluções."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // ============================================================
  // ESTATÍSTICAS
  // ============================================================

  const estatisticas = useMemo(() => {
    const total = dados.length;

    const solicitadas = dados.filter(
      (item) => item.status === "SOLICITADA"
    ).length;

    const emAndamento = dados.filter(
      (item) =>
        item.status === "APROVADA" ||
        item.status === "RECEBIDA"
    ).length;

    const finalizadas = dados.filter(
      (item) =>
        item.status === "CONCLUIDA" ||
        item.status === "RECUSADA"
    ).length;

    return {
      total,
      solicitadas,
      emAndamento,
      finalizadas,
    };
  }, [dados]);

  // ============================================================
  // FILTRAGEM
  // ============================================================

  const devolucoesFiltradas = useMemo(() => {
    if (filtro === "TODAS") return dados;

    if (filtro === "EM_ANDAMENTO") {
      return dados.filter(
        (item) =>
          item.status === "APROVADA" ||
          item.status === "RECEBIDA"
      );
    }

    if (filtro === "FINALIZADAS") {
      return dados.filter(
        (item) =>
          item.status === "CONCLUIDA" ||
          item.status === "RECUSADA"
      );
    }

    return dados.filter(
      (item) => item.status === filtro
    );
  }, [dados, filtro]);

  const filtros = [
    {
      valor: "TODAS",
      label: "Todas",
      quantidade: estatisticas.total,
    },
    {
      valor: "SOLICITADA",
      label: "Solicitadas",
      quantidade: estatisticas.solicitadas,
    },
    {
      valor: "EM_ANDAMENTO",
      label: "Em andamento",
      quantidade: estatisticas.emAndamento,
    },
    {
      valor: "FINALIZADAS",
      label: "Finalizadas",
      quantidade: estatisticas.finalizadas,
    },
  ];

  // ============================================================
  // RENDERIZAÇÃO
  // ============================================================

  return (
    <div className="min-h-screen bg-[#FCFAF6] text-[#211C14]">
      {/* SIDEBAR */}

      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="lg:pl-64">
        {/* HEADER */}

        <AdminHeader
          title="Devoluções"
          subtitle="Analise solicitações e acompanhe os processos de devolução."
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="mx-auto max-w-[1400px] px-5 pb-16 pt-8 sm:px-8">
          {/* ===================================== */}
          {/* CABEÇALHO */}
          {/* ===================================== */}

          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A47B43]">
                <RotateCcw size={14} />
                Pós-venda
              </p>

              <h1 className="font-serif text-3xl tracking-tight text-[#211C14] sm:text-4xl">
                Devoluções
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#81776A]">
                Acompanhe as solicitações, analise os
                motivos e oriente seus clientes em
                cada etapa do processo.
              </p>
            </div>

            <button
              type="button"
              onClick={carregar}
              disabled={carregando}
              className="inline-flex w-fit items-center justify-center gap-2 rounded-full border border-[#E5D9C6] bg-white px-5 py-3 text-xs font-medium text-[#514635] transition hover:border-[#968052] hover:bg-[#F7F2E8] disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  carregando ? "animate-spin" : ""
                }
              />
              Atualizar
            </button>
          </div>

          {/* ===================================== */}
          {/* ESTATÍSTICAS */}
          {/* ===================================== */}

          <div className="mb-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <CardEstatistica
              titulo="Total de solicitações"
              valor={estatisticas.total}
              Icone={ClipboardList}
            />

            <CardEstatistica
              titulo="Aguardando análise"
              valor={estatisticas.solicitadas}
              Icone={Clock3}
            />

            <CardEstatistica
              titulo="Em andamento"
              valor={estatisticas.emAndamento}
              Icone={RotateCcw}
            />

            <CardEstatistica
              titulo="Finalizadas"
              valor={estatisticas.finalizadas}
              Icone={CheckCircle2}
            />
          </div>

          {/* ===================================== */}
          {/* REGISTRAR ENTREGA */}
          {/* ===================================== */}

          <RegistrarEntrega />

          {/* ===================================== */}
          {/* ERRO */}
          {/* ===================================== */}

          {erro && (
            <div
              role="alert"
              className="mb-7 flex flex-col gap-3 rounded-[18px] border border-[#F0D8D5] bg-[#FBEEEE] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0 text-[#A45B52]"
                />

                <p className="text-xs leading-relaxed text-[#A45B52]">
                  {erro}
                </p>
              </div>

              <button
                type="button"
                onClick={carregar}
                className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-[#A45B52] hover:opacity-70"
              >
                <RefreshCw size={14} />
                Tentar novamente
              </button>
            </div>
          )}

          {/* ===================================== */}
          {/* LISTAGEM */}
          {/* ===================================== */}

          <section>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#A47B43]">
                  Central de solicitações
                </p>

                <h2 className="font-serif text-2xl text-[#211C14]">
                  Solicitações recebidas
                </h2>
              </div>

              <p className="text-xs text-[#81776A]">
                <span className="font-semibold text-[#211C14]">
                  {devolucoesFiltradas.length}
                </span>{" "}
                {devolucoesFiltradas.length === 1
                  ? "solicitação encontrada"
                  : "solicitações encontradas"}
              </p>
            </div>

            {/* FILTROS */}

            <div className="mb-6 flex flex-wrap gap-2">
              {filtros.map((opcao) => {
                const selecionado =
                  filtro === opcao.valor;

                return (
                  <button
                    key={opcao.valor}
                    type="button"
                    onClick={() =>
                      setFiltro(opcao.valor)
                    }
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[11px] font-medium transition ${
                      selecionado
                        ? "border-[#211C14] bg-[#211C14] text-white"
                        : "border-[#E5D9C6] bg-white text-[#71675B] hover:border-[#968052]"
                    }`}
                  >
                    {opcao.label}

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        selecionado
                          ? "bg-white/20 text-white"
                          : "bg-[#F7F2E8] text-[#968052]"
                      }`}
                    >
                      {opcao.quantidade}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* CARREGAMENTO */}

            {carregando ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-[#EAE0D1] bg-white">
                <LoaderCircle
                  size={31}
                  className="animate-spin text-[#968052]"
                />

                <p className="mt-4 text-sm text-[#81776A]">
                  Carregando devoluções...
                </p>
              </div>
            ) : devolucoesFiltradas.length === 0 ? (
              /* ESTADO VAZIO */

              <div className="flex min-h-[350px] flex-col items-center justify-center rounded-[24px] border border-[#EAE0D1] bg-white px-6 py-14 text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#F7F2E8] text-[#968052]">
                  <RotateCcw
                    size={31}
                    strokeWidth={1.5}
                  />
                </div>

                <h3 className="font-serif text-2xl text-[#211C14]">
                  Nenhuma solicitação encontrada
                </h3>

                <p className="mt-3 max-w-md text-sm leading-relaxed text-[#81776A]">
                  {filtro === "TODAS"
                    ? "Ainda não existem solicitações de devolução cadastradas."
                    : "Não existem solicitações correspondentes ao filtro selecionado."}
                </p>

                {filtro !== "TODAS" && (
                  <button
                    type="button"
                    onClick={() => setFiltro("TODAS")}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#211C14] px-5 py-3 text-xs font-medium text-white transition hover:bg-[#4A3D2B]"
                  >
                    Ver todas as solicitações
                    <ArrowRight size={15} />
                  </button>
                )}
              </div>
            ) : (
              /* CARDS */

              <div className="grid items-start gap-5 lg:grid-cols-2">
                {devolucoesFiltradas.map((devolucao) => (
                  <Solicitacao
                    key={`${devolucao.id}-${devolucao.status}`}
                    devolucao={devolucao}
                    atualizar={carregar}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
