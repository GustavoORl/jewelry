
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  MapPin,
  CalendarDays,
  CreditCard,
  ShoppingBag,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Truck,
  XCircle,
  QrCode,
  ChevronRight,
} from "lucide-react";

import { apiFetch } from "../../services/api.js";
import FaixaNavegacao from "../../components/common/FaixaNavegacao.jsx";

// ==========================================
// CONFIGURAÇÃO DOS STATUS
// ==========================================

const statusConfig = {
  PENDENTE: {
    label: "Aguardando pagamento",
    icon: Clock3,
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  PAGO: {
    label: "Pagamento confirmado",
    icon: CheckCircle2,
    color: "bg-green-50 text-green-700 border-green-200",
  },
  EM_PREPARACAO: {
    label: "Em preparação",
    icon: Package,
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  ENVIADO: {
    label: "Pedido enviado",
    icon: Truck,
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  ENTREGUE: {
    label: "Pedido entregue",
    icon: CheckCircle2,
    color: "bg-green-50 text-green-700 border-green-200",
  },
  CANCELADO: {
    label: "Pedido cancelado",
    icon: XCircle,
    color: "bg-red-50 text-red-700 border-red-200",
  },
};

// ==========================================
// TIMELINE
// ==========================================

const etapasPedido = [
  {
    status: "PAGO",
    titulo: "Pagamento confirmado",
    descricao: "Recebemos a confirmação do pagamento.",
    icon: CreditCard,
  },
  {
    status: "EM_PREPARACAO",
    titulo: "Em preparação",
    descricao: "Seu pedido está sendo preparado para envio.",
    icon: Package,
  },
  {
    status: "ENVIADO",
    titulo: "Pedido enviado",
    descricao: "Seu pedido saiu para entrega.",
    icon: Truck,
  },
  {
    status: "ENTREGUE",
    titulo: "Pedido entregue",
    descricao: "Seu pedido foi entregue.",
    icon: CheckCircle2,
  },
];

// ==========================================
// FORMATADORES
// ==========================================

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  if (!data) return "Data não disponível";

  const dataConvertida = new Date(data);

  if (Number.isNaN(dataConvertida.getTime())) {
    return "Data não disponível";
  }

  return dataConvertida.toLocaleString("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function formatarIdPedido(id) {
  if (!id) return "—";

  return id.slice(-8).toUpperCase();
}

// ==========================================
// MÉTODO DE PAGAMENTO
// ==========================================

function obterNomeMetodoPagamento(metodo) {
  switch (metodo) {
    case "PIX":
      return "Pix";
    case "CREDITO":
      return "Cartão de crédito";
    case "BOLETO":
      return "Boleto";
    default:
      return "Pagamento";
  }
}

// ==========================================
// STATUS DO PAGAMENTO
// ==========================================

function obterNomeStatusPagamento(status) {
  switch (status) {
    case "PENDENTE":
      return "Pendente";
    case "PROCESSANDO":
      return "Processando";
    case "APROVADO":
      return "Aprovado";
    case "RECUSADO":
      return "Recusado";
    case "CANCELADO":
      return "Cancelado";
    case "REEMBOLSADO":
      return "Reembolsado";
    case "EXPIRADO":
      return "Expirado";
    default:
      return status || "Não informado";
  }
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function PedidoDetalhado() {
  const { pedidoId } = useParams();

  const [pedido, setPedido] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // ==========================================
  // CARREGAR PEDIDO
  // ==========================================

  useEffect(() => {
    async function carregarPedido() {
      try {
        setCarregando(true);
        setErro("");

        const resposta = await apiFetch(`/pedidos/${pedidoId}`);

        if (!resposta?.pedido) {
          throw new Error("A API não retornou os dados do pedido.");
        }

        setPedido(resposta.pedido);
      } catch (error) {
        console.error("Erro ao carregar pedido:", error);

        setErro(error.message || "Não foi possível carregar o pedido.");
      } finally {
        setCarregando(false);
      }
    }

    carregarPedido();
  }, [pedidoId]);

  // ==========================================
  // CARREGAMENTO
  // ==========================================

  if (carregando) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#FCFAF5]">
        <div className="flex flex-col items-center gap-3 text-[#968052]">
          <LoaderCircle size={34} className="animate-spin" />

          <p className="text-sm text-[#211C14]/60">
            Carregando detalhes do pedido...
          </p>
        </div>
      </main>
    );
  }

  // ==========================================
  // ERRO
  // ==========================================

  if (erro || !pedido) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#FCFAF5] px-5">
        <div className="max-w-md text-center">
          <AlertCircle size={42} className="mx-auto mb-4 text-red-500" />

          <h1 className="text-xl font-semibold text-[#211C14]">
            Não foi possível encontrar seu pedido
          </h1>

          <p className="mt-2 text-sm text-[#211C14]/60">
            {erro || "O pedido solicitado não está disponível."}
          </p>

          <Link
            to="/pedidos"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#968052] hover:underline"
          >
            <ArrowLeft size={16} />
            Voltar aos meus pedidos
          </Link>
        </div>
      </main>
    );
  }

  // ==========================================
  // DADOS DERIVADOS
  // ==========================================

  const status = statusConfig[pedido.status] || statusConfig.PENDENTE;
  const StatusIcon = status.icon;

  const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
  const pagamentos = Array.isArray(pedido.pagamentos) ? pedido.pagamentos : [];

  const quantidadeItens = itens.reduce(
    (total, item) => total + Number(item.quantidade || 0),
    0
  );

  // Preferir pagamento aprovado ou a última tentativa
  const pagamentoAprovado = pagamentos.find(
    (pagamento) => pagamento.status === "APROVADO"
  );

  const ultimoPagamento =
    pagamentoAprovado || pagamentos[pagamentos.length - 1] || null;

  const pedidoPendente = pedido.status === "PENDENTE";
  const pedidoCancelado = pedido.status === "CANCELADO";

  const indiceStatusAtual = etapasPedido.findIndex(
    (etapa) => etapa.status === pedido.status
  );

  return (
    <main className="min-h-screen bg-[#FCFAF5]">
      {/* NAVEGAÇÃO */}

      <div className="max-md:hidden">
        <FaixaNavegacao
          mostrarVoltar={false}
          itens={[
            { label: "Início", to: "/" },
            { label: "Pedidos", to: "/pedidos" },
            { label: "Pedido Detalhado" },
          ]}
        />
      </div>

      <div className="mx-auto max-w-5xl px-5 py-10 md:py-14">
        {/* CABEÇALHO */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mt-2 font-serif text-3xl text-[#211C14] md:text-4xl">
              Detalhes do pedido
            </h1>

            <p className="mt-2 text-sm text-[#211C14]/50" title={pedido.id}>
              Pedido #{formatarIdPedido(pedido.id)}
            </p>
          </div>

          <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium ${status.color}`}>
            <StatusIcon size={15} />
            {status.label}
          </span>
        </div>

        {/* TIMELINE */}

        {!pedidoPendente && !pedidoCancelado && (
          <section className="mb-6 border border-[#E9DCC4] bg-white p-5 md:p-7">
            <div className="mb-7 flex items-center gap-3">
              <Truck size={20} className="text-[#968052]" />

              <div>
                <h2 className="font-medium text-[#211C14]">
                  Acompanhe seu pedido
                </h2>

                <p className="mt-1 text-xs text-[#211C14]/50">
                  Veja em qual etapa sua compra está.
                </p>
              </div>
            </div>

            <div>
              {etapasPedido.map((etapa, indice) => {
                const EtapaIcon = etapa.icon;
                const concluida = indice <= indiceStatusAtual;
                const atual = indice === indiceStatusAtual;
                const ultima = indice === etapasPedido.length - 1;

                return (
                  <div key={etapa.status} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                          concluida
                            ? "border-[#968052] bg-[#968052] text-white"
                            : "border-[#E9DCC4] bg-white text-[#B7AFA2]"
                        }`}
                      >
                        <EtapaIcon size={18} />
                      </div>

                      {!ultima && (
                        <div
                          className={`min-h-12 w-px flex-1 ${
                            indice < indiceStatusAtual
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
                              : "text-[#968F83]"
                          }`}
                        >
                          {etapa.titulo}
                        </p>

                        {atual && (
                          <span className="rounded-full bg-[#F8F3E8] px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-[#968052]">
                            Etapa atual
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs leading-5 text-[#211C14]/50">
                        {etapa.descricao}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* PEDIDO PENDENTE */}

        {pedidoPendente && (
          <section className="mb-6 border border-amber-200 bg-amber-50 p-5 md:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Clock3 size={22} className="mt-0.5 shrink-0 text-amber-700" />

                <div>
                  <h2 className="font-medium text-amber-900">
                    Aguardando pagamento
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-amber-700">
                    Finalize o pagamento para confirmarmos e começarmos a
                    preparar seu pedido.
                  </p>
                </div>
              </div>

              <Link
                to={`/pagamento/${pedido.id}`}
                className="inline-flex shrink-0 items-center justify-center gap-2 bg-[#211C14] px-5 py-3 text-xs font-medium uppercase tracking-wider text-white transition hover:bg-[#968052]"
              >
                <CreditCard size={16} />
                Pagar agora
              </Link>
            </div>
          </section>
        )}

        {/* PEDIDO CANCELADO */}

        {pedidoCancelado && (
          <section className="mb-6 border border-red-200 bg-red-50 p-5 md:p-6">
            <div className="flex items-start gap-3">
              <XCircle size={22} className="mt-0.5 shrink-0 text-red-600" />

              <div>
                <h2 className="font-medium text-red-800">
                  Pedido cancelado
                </h2>

                <p className="mt-1 text-sm leading-6 text-red-700">
                  Este pedido foi cancelado e não seguirá para preparação ou envio.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* INFORMAÇÕES GERAIS */}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="border border-[#E9DCC4] bg-white p-5">
            <div className="mb-3 flex items-center gap-3">
              <CalendarDays size={19} className="text-[#968052]" />

              <span className="text-xs uppercase tracking-wider text-[#211C14]/50">
                Data do pedido
              </span>
            </div>

            <p className="text-sm font-medium text-[#211C14]">
              {formatarData(pedido.criadoEm)}
            </p>
          </div>

          <div className="border border-[#E9DCC4] bg-white p-5">
            <div className="mb-3 flex items-center gap-3">
              <ShoppingBag size={19} className="text-[#968052]" />

              <span className="text-xs uppercase tracking-wider text-[#211C14]/50">
                Itens do pedido
              </span>
            </div>

            <p className="text-sm font-medium text-[#211C14]">
              {quantidadeItens} {quantidadeItens === 1 ? "item" : "itens"}
            </p>
          </div>
        </section>

        {/* PRODUTOS */}

        <section className="mb-6 border border-[#E9DCC4] bg-white">
          <div className="border-b border-[#E9DCC4] p-5 md:p-6">
            <h2 className="flex items-center gap-2 font-medium text-[#211C14]">
              <Package size={19} className="text-[#968052]" />
              Produtos do pedido
            </h2>
          </div>

          {itens.length === 0 ? (
            <div className="p-6 text-sm text-[#211C14]/50">
              Nenhum produto encontrado neste pedido.
            </div>
          ) : (
            <div className="divide-y divide-[#E9DCC4]">
              {itens.map((item) => {
                const subtotal =
                  Number(item.precoUnitario || 0) *
                  Number(item.quantidade || 0);

                const imagem = item.produto?.imagens?.[0]?.url;
                const produtoId = item.produtoId;

                return (
                  <div key={item.id} className="flex items-center gap-4 p-5 md:p-6">
                    {imagem ? (
                      <img
                        src={imagem}
                        alt={item.nomeProduto}
                        className="h-20 w-20 shrink-0 object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-[#F8F3E8]">
                        <Package size={24} className="text-[#B9A77F]" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      {produtoId ? (
                        <Link
                          to={`/produto/${produtoId}`}
                          className="text-sm font-medium text-[#211C14] transition hover:text-[#968052]"
                        >
                          {item.nomeProduto}
                        </Link>
                      ) : (
                        <h3 className="text-sm font-medium text-[#211C14]">
                          {item.nomeProduto}
                        </h3>
                      )}

                      <p className="mt-2 text-xs text-[#211C14]/50">
                        Quantidade: {item.quantidade}
                      </p>

                      <p className="mt-1 text-xs text-[#211C14]/50">
                        Valor unitário: {formatarMoeda(item.precoUnitario)}
                      </p>
                    </div>

                    <span className="whitespace-nowrap text-sm font-medium text-[#211C14]">
                      {formatarMoeda(subtotal)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between bg-[#F8F3E8] p-5 md:p-6">
            <span className="text-sm font-medium text-[#211C14]">
              Total do pedido
            </span>

            <span className="text-xl font-semibold text-[#968052]">
              {formatarMoeda(pedido.valorTotal)}
            </span>
          </div>
        </section>

        {/* ENDEREÇO */}

        <section className="mb-6 border border-[#E9DCC4] bg-white">
          <div className="border-b border-[#E9DCC4] p-5 md:p-6">
            <h2 className="flex items-center gap-2 font-medium text-[#211C14]">
              <MapPin size={19} className="text-[#968052]" />
              Endereço de entrega
            </h2>
          </div>

          <div className="p-5 md:p-6">
            <p className="text-sm font-medium text-[#211C14]">
              {pedido.destinatario || "Destinatário não informado"}
            </p>

            <p className="mt-2 text-sm text-[#211C14]/60">
              {pedido.ruaEntrega}, {pedido.numeroEntrega}
            </p>

            {pedido.complementoEntrega && (
              <p className="mt-1 text-sm text-[#211C14]/60">
                {pedido.complementoEntrega}
              </p>
            )}

            <p className="mt-1 text-sm text-[#211C14]/60">
              {pedido.bairroEntrega}
            </p>

            <p className="mt-1 text-sm text-[#211C14]/60">
              {pedido.cidadeEntrega} - {pedido.estadoEntrega}
            </p>

            <p className="mt-1 text-sm text-[#211C14]/60">
              CEP: {pedido.cepEntrega}
            </p>
          </div>
        </section>

        {/* PAGAMENTO */}

        <section className="mb-8 border border-[#E9DCC4] bg-white">
          <div className="border-b border-[#E9DCC4] p-5 md:p-6">
            <h2 className="flex items-center gap-2 font-medium text-[#211C14]">
              <CreditCard size={19} className="text-[#968052]" />
              Pagamento
            </h2>
          </div>

          <div className="p-5 md:p-6">
            {ultimoPagamento ? (
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  {ultimoPagamento.metodo === "PIX" ? (
                    <QrCode size={21} className="mt-0.5 text-[#968052]" />
                  ) : (
                    <CreditCard size={21} className="mt-0.5 text-[#968052]" />
                  )}

                  <div>
                    <p className="text-sm font-medium text-[#211C14]">
                      {obterNomeMetodoPagamento(ultimoPagamento.metodo)}
                    </p>

                    <p className="mt-1 text-xs text-[#211C14]/50">
                      Status: {obterNomeStatusPagamento(ultimoPagamento.status)}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs text-[#211C14]/50">
                    Valor pago
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#211C14]">
                    {formatarMoeda(
                      ultimoPagamento.valor || pedido.valorTotal
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <Clock3 size={20} className="mt-0.5 text-[#968052]" />

                <div>
                  <p className="text-sm font-medium text-[#211C14]">
                    Nenhum pagamento confirmado
                  </p>

                  <p className="mt-1 text-xs text-[#211C14]/50">
                    O pagamento ainda não foi identificado para este pedido.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* AÇÕES */}

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/pedidos"
            className="inline-flex items-center justify-center gap-2 border border-[#968052] px-6 py-3 text-sm text-[#968052] transition hover:bg-[#968052] hover:text-white"
          >
            <ArrowLeft size={16} />
            Voltar aos meus pedidos
          </Link>

          <Link
            to="/produtos"
            className="inline-flex items-center justify-center gap-2 bg-[#211C14] px-6 py-3 text-sm text-white transition hover:bg-[#968052]"
          >
            Continuar comprando
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}
