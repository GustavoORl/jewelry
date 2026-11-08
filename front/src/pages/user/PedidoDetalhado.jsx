
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  LoaderCircle,
  MapPin,
  Package,
  PackageCheck,
  QrCode,
  RefreshCw,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";

import { apiFetch } from "../../services/api.js";
import FaixaNavegacao from "../../components/common/FaixaNavegacao.jsx";

// ============================================================
// CONFIGURAÇÕES
// ============================================================

const STATUS = {
  PENDENTE: {
    label: "Aguardando pagamento",
    descricao: "Seu pedido está aguardando a confirmação do pagamento.",
    Icone: Clock3,
    classe: "border-[#EEDDBD] bg-[#FBF3E6] text-[#9B6A2C]",
  },
  PAGO: {
    label: "Pagamento confirmado",
    descricao: "Recebemos seu pagamento e começaremos a preparar seu pedido.",
    Icone: CheckCircle2,
    classe: "border-[#D1E5DE] bg-[#EAF3F0] text-[#537B72]",
  },
  EM_PREPARACAO: {
    label: "Em preparação",
    descricao: "Suas peças estão sendo preparadas com todo cuidado.",
    Icone: Package,
    classe: "border-[#E5D9EC] bg-[#F3EDF7] text-[#876A9B]",
  },
  ENVIADO: {
    label: "Pedido enviado",
    descricao: "Seu pedido saiu para entrega.",
    Icone: Truck,
    classe: "border-[#D8E5F0] bg-[#EDF3F9] text-[#587A9B]",
  },
  ENTREGUE: {
    label: "Pedido entregue",
    descricao: "Seu pedido foi entregue.",
    Icone: PackageCheck,
    classe: "border-[#D7E7D5] bg-[#EDF5EC] text-[#547D5D]",
  },
  CANCELADO: {
    label: "Pedido cancelado",
    descricao: "Este pedido foi cancelado.",
    Icone: XCircle,
    classe: "border-[#F0D8D5] bg-[#FBEEEE] text-[#A45B52]",
  },
};

const ETAPAS = [
  {
    status: "PAGO",
    titulo: "Pagamento confirmado",
    descricao: "Recebemos a confirmação do pagamento.",
    Icone: CreditCard,
  },
  {
    status: "EM_PREPARACAO",
    titulo: "Em preparação",
    descricao: "Seu pedido está sendo preparado para envio.",
    Icone: Package,
  },
  {
    status: "ENVIADO",
    titulo: "Pedido enviado",
    descricao: "Seu pedido saiu para entrega.",
    Icone: Truck,
  },
  {
    status: "ENTREGUE",
    titulo: "Pedido entregue",
    descricao: "Seu pedido foi entregue.",
    Icone: PackageCheck,
  },
];

// ============================================================
// FORMATADORES
// ============================================================

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  if (!data) return "Data não disponível";

  const convertida = new Date(data);

  if (Number.isNaN(convertida.getTime())) {
    return "Data não disponível";
  }

  return convertida.toLocaleString("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function formatarId(id) {
  return id ? String(id).slice(-8).toUpperCase() : "—";
}

function formatarMetodo(metodo) {
  const nomes = {
    PIX: "Pix",
    CREDITO: "Cartão de crédito",
    CARTAO_CREDITO: "Cartão de crédito",
    CREDITO_CARTAO: "Cartão de crédito",
    DEBITO: "Cartão de débito",
    CARTAO_DEBITO: "Cartão de débito",
    DEBITO_CARTAO: "Cartão de débito",
    BOLETO: "Boleto",
  };

  return nomes[metodo] || "Pagamento";
}

function formatarStatusPagamento(status) {
  const nomes = {
    PENDENTE: "Pendente",
    PROCESSANDO: "Processando",
    APROVADO: "Aprovado",
    RECUSADO: "Recusado",
    CANCELADO: "Cancelado",
    REEMBOLSADO: "Reembolsado",
    EXPIRADO: "Expirado",
  };

  return nomes[status] || status || "Não informado";
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function Card({ titulo, Icone, children, className = "" }) {
  return (
    <section
      className={`overflow-hidden rounded-[22px] border border-[#EAE0D1] bg-white ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-[#F0EADF] px-5 py-5 sm:px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F2E8] text-[#968052]">
          <Icone size={17} strokeWidth={1.7} />
        </div>

        <h2 className="text-sm font-semibold text-[#211C14]">
          {titulo}
        </h2>
      </div>

      {children}
    </section>
  );
}

function ResumoItem({ Icone, titulo, valor }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[18px] border border-[#EAE0D1] bg-white p-4 sm:p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7F2E8] text-[#968052]">
        <Icone size={18} strokeWidth={1.7} />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] text-[#918679]">
          {titulo}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-[#211C14]">
          {valor}
        </p>
      </div>
    </div>
  );
}

function TimelinePedido({ statusAtual }) {
  const indiceAtual = ETAPAS.findIndex(
    (etapa) => etapa.status === statusAtual
  );

  return (
    <Card titulo="Acompanhe seu pedido" Icone={Truck}>
      <div className="px-5 py-6 sm:px-7 sm:py-7">
        <p className="mb-7 text-xs leading-relaxed text-[#81776A]">
          Acompanhe cada etapa da sua compra, desde a confirmação
          do pagamento até a entrega.
        </p>

        <div>
          {ETAPAS.map((etapa, indice) => {
            const Icone = etapa.Icone;
            const concluida = indice <= indiceAtual;
            const atual = indice === indiceAtual;
            const ultima = indice === ETAPAS.length - 1;

            return (
              <div
                key={etapa.status}
                className="flex gap-4"
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      concluida
                        ? "border-[#968052] bg-[#968052] text-white"
                        : "border-[#E9DCC4] bg-[#FAF7F1] text-[#B7AFA2]"
                    }`}
                  >
                    <Icone size={17} strokeWidth={1.8} />
                  </div>

                  {!ultima && (
                    <div
                      className={`my-1 min-h-12 w-px flex-1 ${
                        indice < indiceAtual
                          ? "bg-[#968052]"
                          : "bg-[#E9DCC4]"
                      }`}
                    />
                  )}
                </div>

                <div className={ultima ? "" : "pb-8"}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`text-sm font-medium ${
                        concluida
                          ? "text-[#211C14]"
                          : "text-[#A49A8C]"
                      }`}
                    >
                      {etapa.titulo}
                    </p>

                    {atual && (
                      <span className="rounded-full bg-[#F7F2E8] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-[#968052]">
                        Etapa atual
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 text-xs leading-relaxed text-[#918679]">
                    {etapa.descricao}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function ProdutoPedido({ item, ultimo }) {
  const imagem =
    item.produto?.imagens?.[0]?.url ||
    item.produto?.imagem ||
    item.produto?.imagemUrl ||
    null;

  const produtoId = item.produtoId;

  const subtotal =
    Number(item.precoUnitario || 0) *
    Number(item.quantidade || 0);

  const conteudoImagem = imagem ? (
    <img
      src={imagem}
      alt={
        item.produto?.imagens?.[0]?.textoAlternativo ||
        item.nomeProduto
      }
      loading="lazy"
      className="h-full w-full object-cover transition-transform duration-500 group-hover/produto:scale-105"
    />
  ) : (
    <Package
      size={25}
      strokeWidth={1.5}
      className="text-[#B9A77F]"
    />
  );

  return (
    <div
      className={`flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${
        ultimo ? "" : "border-b border-[#F0EADF]"
      }`}
    >
      <div className="flex min-w-0 items-center gap-4">
        {produtoId ? (
          <Link
            to={`/produtos/${produtoId}`}
            className="group/produto flex h-[86px] w-[86px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F7F2E8] sm:h-[94px] sm:w-[94px]"
          >
            {conteudoImagem}
          </Link>
        ) : (
          <div className="flex h-[86px] w-[86px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F7F2E8] sm:h-[94px] sm:w-[94px]">
            {conteudoImagem}
          </div>
        )}

        <div className="min-w-0">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#A47B43]">
            AURELIA
          </p>

          {produtoId ? (
            <Link
              to={`/produtos/${produtoId}`}
              className="line-clamp-2 text-sm font-medium leading-relaxed text-[#211C14] transition hover:text-[#968052]"
            >
              {item.nomeProduto}
            </Link>
          ) : (
            <h3 className="line-clamp-2 text-sm font-medium leading-relaxed text-[#211C14]">
              {item.nomeProduto}
            </h3>
          )}

          <p className="mt-2 text-xs text-[#81776A]">
            Quantidade: {item.quantidade}
          </p>

          <p className="mt-1 text-[11px] text-[#9B9183]">
            Unitário: {formatarMoeda(item.precoUnitario)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#F0EADF] pt-3 sm:block sm:border-0 sm:pt-0 sm:text-right">
        <p className="text-[11px] text-[#918679]">
          Subtotal
        </p>

        <p className="mt-1 text-sm font-semibold text-[#211C14]">
          {formatarMoeda(subtotal)}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function PedidoDetalhado() {
  const { pedidoId } = useParams();

  const [pedido, setPedido] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");

  const carregarPedido = useCallback(
    async (silencioso = false) => {
      try {
        if (silencioso) {
          setAtualizando(true);
        } else {
          setCarregando(true);
        }

        setErro("");

        const resposta = await apiFetch(
          `/pedidos/${pedidoId}`
        );

        if (!resposta?.pedido) {
          throw new Error(
            "A API não retornou os dados do pedido."
          );
        }

        setPedido(resposta.pedido);
      } catch (error) {
        console.error("Erro ao carregar pedido:", error);

        setErro(
          error.message ||
            "Não foi possível carregar o pedido."
        );
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [pedidoId]
  );

  useEffect(() => {
    carregarPedido();
  }, [carregarPedido]);

  // ==========================================
  // CARREGAMENTO
  // ==========================================

  if (carregando) {
    return (
      <main className="flex min-h-[75vh] items-center justify-center bg-[#FCFAF6]">
        <div className="flex flex-col items-center gap-4 text-center">
          <LoaderCircle
            size={34}
            className="animate-spin text-[#968052]"
          />

          <div>
            <p className="font-serif text-xl text-[#211C14]">
              Carregando seu pedido
            </p>

            <p className="mt-2 text-sm text-[#81776A]">
              Estamos buscando os detalhes da sua compra.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // ERRO
  // ==========================================

  if (erro || !pedido) {
    return (
      <main className="flex min-h-[75vh] items-center justify-center bg-[#FCFAF6] px-5">
        <div className="w-full max-w-md rounded-[22px] border border-[#EAE0D1] bg-white px-6 py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FBEEEE] text-[#A45B52]">
            <AlertCircle size={28} />
          </div>

          <h1 className="mt-5 font-serif text-2xl text-[#211C14]">
            Pedido não encontrado
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-[#81776A]">
            {erro ||
              "O pedido solicitado não está disponível."}
          </p>

          <Link
            to="/pedidos"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#211C14] px-6 py-3 text-xs font-medium text-white transition hover:bg-[#4A3D2B]"
          >
            <ArrowLeft size={15} />
            Voltar aos meus pedidos
          </Link>
        </div>
      </main>
    );
  }

  // ==========================================
  // DADOS
  // ==========================================

  const status =
    STATUS[pedido.status] || STATUS.PENDENTE;

  const IconeStatus = status.Icone;

  const itens = Array.isArray(pedido.itens)
    ? pedido.itens
    : [];

  const pagamentos = Array.isArray(pedido.pagamentos)
    ? pedido.pagamentos
    : [];

  const quantidadeItens = itens.reduce(
    (total, item) =>
      total + Number(item.quantidade || 0),
    0
  );

  const pagamentoAprovado = pagamentos.find(
    (pagamento) => pagamento.status === "APROVADO"
  );

  const ultimoPagamento =
    pagamentoAprovado ||
    pagamentos[pagamentos.length - 1] ||
    null;

  const pedidoPendente = pedido.status === "PENDENTE";
  const pedidoCancelado = pedido.status === "CANCELADO";

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  return (
    <main className="min-h-screen bg-[#FCFAF6] text-[#211C14]">
      {/* NAVEGAÇÃO */}

      <div className="max-md:hidden">
        <FaixaNavegacao
          mostrarVoltar={false}
          itens={[
            { label: "Início", to: "/" },
            { label: "Pedidos", to: "/pedidos" },
            { label: "Detalhes do pedido" },
          ]}
        />
      </div>

      <div className="mx-auto max-w-[1180px] px-5 pb-20 pt-10 sm:px-8 lg:px-10 lg:pt-14">
        {/* ===================================== */}
        {/* CABEÇALHO */}
        {/* ===================================== */}

        <div className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#A47B43]">
              Minha conta / Pedidos
            </p>

            <h1 className="font-serif text-3xl tracking-tight text-[#211C14] sm:text-4xl">
              Detalhes do pedido
            </h1>

            <p
              className="mt-3 text-sm text-[#81776A]"
              title={pedido.id}
            >
              Pedido{" "}
              <span className="font-medium text-[#514635]">
                #{formatarId(pedido.id)}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => carregarPedido(true)}
            disabled={atualizando}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E5D9C6] bg-white px-4 py-2.5 text-xs font-medium text-[#514635] transition hover:border-[#B9975B] hover:bg-[#F7F2E8] disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              className={
                atualizando ? "animate-spin" : ""
              }
            />
            Atualizar pedido
          </button>
        </div>

        {/* ===================================== */}
        {/* STATUS PRINCIPAL */}
        {/* ===================================== */}

        <div className="mb-6 rounded-[22px] border border-[#EAE0D1] bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F7F2E8] text-[#968052]">
                <IconeStatus
                  size={22}
                  strokeWidth={1.7}
                />
              </div>

              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#A47B43]">
                  Status da compra
                </p>

                <h2 className="text-base font-semibold text-[#211C14]">
                  {status.label}
                </h2>

                <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-[#81776A]">
                  {status.descricao}
                </p>
              </div>
            </div>

            <span
              className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-medium ${status.classe}`}
            >
              <IconeStatus size={14} />
              {status.label}
            </span>
          </div>
        </div>

        {/* ===================================== */}
        {/* PEDIDO PENDENTE */}
        {/* ===================================== */}

        {pedidoPendente && (
          <div className="mb-6 flex flex-col gap-5 rounded-[22px] border border-[#EEDDBD] bg-[#FBF5E9] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-3">
              <Clock3
                size={21}
                className="mt-0.5 shrink-0 text-[#9B6A2C]"
              />

              <div>
                <h2 className="text-sm font-semibold text-[#7B5427]">
                  Finalize seu pagamento
                </h2>

                <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-[#9B7548]">
                  Seu pedido está aguardando pagamento.
                  Conclua esta etapa para confirmarmos sua compra.
                </p>
              </div>
            </div>

            <Link
              to={`/pagamento/${pedido.id}`}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#211C14] px-5 py-3 text-xs font-medium text-white transition hover:bg-[#4A3D2B]"
            >
              <CreditCard size={15} />
              Pagar agora
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* ===================================== */}
        {/* PEDIDO CANCELADO */}
        {/* ===================================== */}

        {pedidoCancelado && (
          <div className="mb-6 flex items-start gap-3 rounded-[22px] border border-[#F0D8D5] bg-[#FBEEEE] p-5 sm:p-6">
            <XCircle
              size={21}
              className="mt-0.5 shrink-0 text-[#A45B52]"
            />

            <div>
              <h2 className="text-sm font-semibold text-[#A45B52]">
                Pedido cancelado
              </h2>

              <p className="mt-1.5 text-xs leading-relaxed text-[#A76C65]">
                Este pedido foi cancelado e não seguirá
                para preparação ou envio.
              </p>
            </div>
          </div>
        )}

        {/* ===================================== */}
        {/* RESUMO */}
        {/* ===================================== */}

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <ResumoItem
            Icone={CalendarDays}
            titulo="Data do pedido"
            valor={formatarData(pedido.criadoEm)}
          />

          <ResumoItem
            Icone={ShoppingBag}
            titulo="Peças adquiridas"
            valor={`${quantidadeItens} ${
              quantidadeItens === 1 ? "item" : "itens"
            }`}
          />
        </div>

        {/* ===================================== */}
        {/* CONTEÚDO PRINCIPAL */}
        {/* ===================================== */}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* COLUNA ESQUERDA */}

          <div className="min-w-0 space-y-6">
            {/* PRODUTOS */}

            <Card titulo="Peças do pedido" Icone={Package}>
              {itens.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-[#81776A]">
                  Nenhum produto encontrado neste pedido.
                </p>
              ) : (
                <div>
                  {itens.map((item, indice) => (
                    <ProdutoPedido
                      key={item.id ?? indice}
                      item={item}
                      ultimo={indice === itens.length - 1}
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-4 border-t border-[#EAE0D1] bg-[#FAF7F1] px-5 py-5 sm:px-6">
                <div>
                  <p className="text-xs font-medium text-[#514635]">
                    Total do pedido
                  </p>

                  <p className="mt-1 text-[11px] text-[#918679]">
                    {quantidadeItens}{" "}
                    {quantidadeItens === 1
                      ? "peça"
                      : "peças"}
                  </p>
                </div>

                <p className="text-xl font-semibold text-[#211C14]">
                  {formatarMoeda(pedido.valorTotal)}
                </p>
              </div>
            </Card>

            {/* ENDEREÇO */}

            <Card titulo="Endereço de entrega" Icone={MapPin}>
              <div className="p-5 sm:p-6">
                <div className="rounded-2xl bg-[#FAF7F1] p-5">
                  <p className="text-sm font-semibold text-[#211C14]">
                    {pedido.destinatario ||
                      "Destinatário não informado"}
                  </p>

                  <div className="mt-3 space-y-1.5 text-xs leading-relaxed text-[#81776A]">
                    {(pedido.ruaEntrega ||
                      pedido.numeroEntrega) && (
                      <p>
                        {[
                          pedido.ruaEntrega,
                          pedido.numeroEntrega,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}

                    {pedido.complementoEntrega && (
                      <p>{pedido.complementoEntrega}</p>
                    )}

                    {pedido.bairroEntrega && (
                      <p>{pedido.bairroEntrega}</p>
                    )}

                    {(pedido.cidadeEntrega ||
                      pedido.estadoEntrega) && (
                      <p>
                        {[
                          pedido.cidadeEntrega,
                          pedido.estadoEntrega,
                        ]
                          .filter(Boolean)
                          .join(" - ")}
                      </p>
                    )}

                    {pedido.cepEntrega && (
                      <p>CEP: {pedido.cepEntrega}</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* PAGAMENTO */}

            <Card titulo="Informações de pagamento" Icone={CreditCard}>
              <div className="p-5 sm:p-6">
                {ultimoPagamento ? (
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7F2E8] text-[#968052]">
                        {ultimoPagamento.metodo === "PIX" ? (
                          <QrCode size={19} />
                        ) : (
                          <CreditCard size={19} />
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-[#211C14]">
                          {formatarMetodo(
                            ultimoPagamento.metodo
                          )}
                        </p>

                        <p className="mt-1.5 text-xs text-[#81776A]">
                          Status:{" "}
                          <span className="font-medium text-[#514635]">
                            {formatarStatusPagamento(
                              ultimoPagamento.status
                            )}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-[#F0EADF] pt-4 sm:border-0 sm:pt-0 sm:text-right">
                      <p className="text-[11px] text-[#918679]">
                        Valor do pagamento
                      </p>

                      <p className="mt-1 text-base font-semibold text-[#211C14]">
                        {formatarMoeda(
                          ultimoPagamento.valor ??
                            pedido.valorTotal
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <Clock3
                      size={20}
                      className="shrink-0 text-[#968052]"
                    />

                    <div>
                      <p className="text-sm font-medium text-[#211C14]">
                        Nenhum pagamento iniciado
                      </p>

                      <p className="mt-1.5 text-xs leading-relaxed text-[#81776A]">
                        Ainda não identificamos uma tentativa
                        de pagamento para este pedido.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* COLUNA DIREITA */}

          <div className="min-w-0 space-y-6">
            {!pedidoPendente && !pedidoCancelado && (
              <TimelinePedido statusAtual={pedido.status} />
            )}

            {/* RESUMO LATERAL */}

            <div className="rounded-[22px] border border-[#EAE0D1] bg-white p-5 sm:p-6">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A47B43]">
                Resumo da compra
              </p>

              <h2 className="font-serif text-xl text-[#211C14]">
                Seu pedido
              </h2>

              <div className="mt-5 space-y-4 border-b border-[#F0EADF] pb-5">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-[#81776A]">
                    Número do pedido
                  </span>

                  <span className="font-medium text-[#211C14]">
                    #{formatarId(pedido.id)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-[#81776A]">
                    Quantidade de peças
                  </span>

                  <span className="font-medium text-[#211C14]">
                    {quantidadeItens}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-[#81776A]">
                    Situação
                  </span>

                  <span className="text-right font-medium text-[#211C14]">
                    {status.label}
                  </span>
                </div>
              </div>

              <div className="flex items-end justify-between gap-3 py-5">
                <span className="text-xs font-medium text-[#514635]">
                  Total
                </span>

                <span className="text-xl font-semibold text-[#211C14]">
                  {formatarMoeda(pedido.valorTotal)}
                </span>
              </div>

              {pedidoPendente && (
                <Link
                  to={`/pagamento/${pedido.id}`}
                  className="mb-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#211C14] px-5 py-3 text-xs font-medium text-white transition hover:bg-[#4A3D2B]"
                >
                  Finalizar pagamento
                  <ArrowRight size={15} />
                </Link>
              )}

              <Link
                to="/pedidos"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-[#E5D9C6] px-5 py-3 text-xs font-medium text-[#514635] transition hover:border-[#968052] hover:bg-[#F7F2E8]"
              >
                <ArrowLeft size={15} />
                Voltar aos meus pedidos
              </Link>
            </div>
          </div>
        </div>

        {/* ===================================== */}
        {/* CONTINUAR COMPRANDO */}
        {/* ===================================== */}

        <div className="mt-10 flex flex-col items-center justify-between gap-5 rounded-[22px] border border-[#EAE0D1] bg-[#F7F2E8] px-6 py-7 text-center sm:flex-row sm:text-left">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A47B43]">
              AURELIA
            </p>

            <h2 className="font-serif text-xl text-[#211C14]">
              Sua próxima peça favorita espera por você
            </h2>

            <p className="mt-1.5 text-xs text-[#81776A]">
              Descubra novas joias para complementar sua coleção.
            </p>
          </div>

          <Link
            to="/produtos"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#211C14] px-6 py-3 text-xs font-medium text-white transition hover:bg-[#4A3D2B]"
          >
            Continuar comprando
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}
