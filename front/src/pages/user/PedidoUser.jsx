
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Clock3,
  CheckCircle2,
  Truck,
  XCircle,
  ChevronRight,
  ShoppingBag,
  RefreshCw,
  CreditCard,
} from "lucide-react";

import { apiFetch } from "../../services/api";
import FaixaNavegacao from "../../components/common/FaixaNavegacao";

// ==========================================
// CONFIGURAÇÃO DOS STATUS
// ==========================================

const statusConfig = {
  PENDENTE: {
    label: "Aguardando pagamento",
    icon: Clock3,
    color: "text-amber-700 bg-amber-50",
  },
  PAGO: {
    label: "Pagamento confirmado",
    icon: CheckCircle2,
    color: "text-blue-700 bg-blue-50",
  },
  EM_PREPARACAO: {
    label: "Em preparação",
    icon: Package,
    color: "text-purple-700 bg-purple-50",
  },
  ENVIADO: {
    label: "Enviado",
    icon: Truck,
    color: "text-indigo-700 bg-indigo-50",
  },
  ENTREGUE: {
    label: "Entregue",
    icon: CheckCircle2,
    color: "text-green-700 bg-green-50",
  },
  CANCELADO: {
    label: "Cancelado",
    icon: XCircle,
    color: "text-red-700 bg-red-50",
  },
};

// ==========================================
// ETAPAS DO PEDIDO
// ==========================================

const etapasPedido = [
  "PAGO",
  "EM_PREPARACAO",
  "ENVIADO",
  "ENTREGUE",
];

// ==========================================
// FORMATADORES
// ==========================================

function formatarData(data) {
  if (!data) return "Data indisponível";

  const dataConvertida = new Date(data);

  if (Number.isNaN(dataConvertida.getTime())) {
    return "Data indisponível";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(dataConvertida);
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Mostra apenas parte do ID na interface.
// O ID completo continua sendo utilizado nas rotas.

function formatarIdPedido(id) {
  if (!id) return "—";

  return id.slice(-8).toUpperCase();
}

// ==========================================
// PROGRESSO
// ==========================================

function obterEtapaAtual(status) {
  const indice = etapasPedido.indexOf(status);

  if (indice === -1) return 0;

  return indice + 1;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function PedidoUser() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // ==========================================
  // CARREGAR PEDIDOS
  // ==========================================

  async function carregarPedidos() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await apiFetch("/pedidos");

      setPedidos(resposta?.pedidos ?? []);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);

      setErro(
        error.message || "Não foi possível carregar seus pedidos."
      );
    } finally {
      setCarregando(false);
    }
  }

  // ==========================================
  // CARREGAMENTO INICIAL
  // ==========================================

  useEffect(() => {
    carregarPedidos();
  }, []);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <main className="min-h-screen bg-[#FCFAF5]">
      {/* BREADCRUMB */}

      <div className="max-md:hidden">
        <FaixaNavegacao
          mostrarVoltar={false}
          itens={[
            { label: "Início", to: "/" },
            { label: "Meus Pedidos", to: "/pedidos" },
          ]}
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* CABEÇALHO */}

        <div className="mb-10">
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-[#968052]">
            Minha conta
          </span>

          <h1 className="mt-3 font-serif text-3xl text-[#211C14] sm:text-4xl">
            Meus pedidos
          </h1>

          <p className="mt-3 text-sm text-[#746D62]">
            Acompanhe suas compras e consulte os detalhes de cada pedido.
          </p>
        </div>

        {/* CARREGANDO */}

        {carregando ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E9DCC4] border-t-[#968052]" />

            <p className="text-sm text-[#746D62]">
              Carregando seus pedidos...
            </p>
          </div>
        ) : erro ? (
          /* ERRO */

          <div className="border border-red-100 bg-white p-8 text-center">
            <XCircle size={32} className="mx-auto text-red-500" />

            <p className="mt-4 text-sm text-[#211C14]">
              {erro}
            </p>

            <button
              type="button"
              onClick={carregarPedidos}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#968052] hover:underline"
            >
              <RefreshCw size={15} />
              Tentar novamente
            </button>
          </div>
        ) : pedidos.length === 0 ? (
          /* SEM PEDIDOS */

          <div className="border border-[#E9DCC4] bg-white px-6 py-16 text-center">
            <ShoppingBag size={42} strokeWidth={1.2} className="mx-auto text-[#B9A77F]" />

            <h2 className="mt-5 font-serif text-2xl text-[#211C14]">
              Você ainda não tem pedidos
            </h2>

            <p className="mt-3 text-sm text-[#746D62]">
              Quando realizar uma compra, ela aparecerá aqui.
            </p>

            <Link
              to="/produtos"
              className="mt-7 inline-flex bg-[#211C14] px-7 py-3 text-xs font-medium uppercase tracking-widest text-white transition hover:bg-[#968052]"
            >
              Explorar produtos
            </Link>
          </div>
        ) : (
          /* LISTA DE PEDIDOS */

          <div className="space-y-5">
            {/* CABEÇALHO DA LISTA */}

            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-[#746D62]">
                {pedidos.length}{" "}
                {pedidos.length === 1
                  ? "pedido encontrado"
                  : "pedidos encontrados"}
              </p>

              <button
                type="button"
                onClick={carregarPedidos}
                className="inline-flex items-center gap-2 text-xs text-[#968052] hover:underline"
              >
                <RefreshCw size={14} />
                Atualizar
              </button>
            </div>

            {/* PEDIDOS */}

            {pedidos.map((pedido) => {
              const status =
                statusConfig[pedido.status] ?? statusConfig.PENDENTE;

              const StatusIcon = status.icon;

              const itens = Array.isArray(pedido.itens)
                ? pedido.itens
                : [];

              const quantidadeItens = itens.reduce(
                (total, item) => total + Number(item.quantidade || 0),
                0
              );

              const etapaAtual = obterEtapaAtual(pedido.status);

              const aguardandoPagamento = pedido.status === "PENDENTE";
              const cancelado = pedido.status === "CANCELADO";

              return (
                <article
                  key={pedido.id}
                  className="border border-[#E9DCC4] bg-white p-5 transition hover:border-[#B9A77F] sm:p-7"
                >
                  {/* CABEÇALHO DO PEDIDO */}

                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-[#968052]">
                        Pedido
                      </p>

                      <h2
                        className="mt-1 text-sm font-semibold text-[#211C14]"
                        title={pedido.id}
                      >
                        #{formatarIdPedido(pedido.id)}
                      </h2>

                      <p className="mt-2 text-xs text-[#746D62]">
                        {formatarData(pedido.criadoEm)}
                      </p>
                    </div>

                    <div className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-medium ${status.color}`}>
                      <StatusIcon size={15} />
                      {status.label}
                    </div>
                  </div>

                  {/* PROGRESSO */}

                  {!aguardandoPagamento && !cancelado && (
                    <div className="mt-6 border-t border-[#F0EADF] pt-6">
                      <div className="flex items-center">
                        {etapasPedido.map((etapa, indice) => {
                          const concluida = indice < etapaAtual;
                          const ultima = indice === etapasPedido.length - 1;

                          return (
                            <div
                              key={etapa}
                              className={`flex items-center ${ultima ? "" : "flex-1"}`}
                            >
                              <div className={`flex h-3 w-3 shrink-0 rounded-full ${concluida ? "bg-[#968052]" : "bg-[#E9DCC4]"}`} />

                              {!ultima && (
                                <div className={`h-px flex-1 ${indice < etapaAtual - 1 ? "bg-[#968052]" : "bg-[#E9DCC4]"}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-2 flex justify-between text-[10px] text-[#968F83]">
                        <span>Pago</span>
                        <span>Preparando</span>
                        <span>Enviado</span>
                        <span>Entregue</span>
                      </div>
                    </div>
                  )}

                  {/* DADOS */}

                  <div className="my-6 h-px bg-[#F0EADF]" />

                  <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-[#968F83]">
                        Itens
                      </p>

                      <p className="mt-1 text-sm font-medium text-[#211C14]">
                        {quantidadeItens}{" "}
                        {quantidadeItens === 1 ? "produto" : "produtos"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#968F83]">
                        Destinatário
                      </p>

                      <p className="mt-1 text-sm font-medium text-[#211C14]">
                        {pedido.destinatario || "Não informado"}
                      </p>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-xs text-[#968F83]">
                        Valor total
                      </p>

                      <p className="mt-1 text-sm font-semibold text-[#211C14]">
                        {formatarMoeda(pedido.valorTotal)}
                      </p>
                    </div>
                  </div>

                  {/* AGUARDANDO PAGAMENTO */}

                  {aguardandoPagamento && (
                    <div className="mt-6 flex flex-col gap-4 border border-amber-100 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <Clock3 size={18} className="mt-0.5 shrink-0 text-amber-700" />

                        <div>
                          <p className="text-sm font-medium text-amber-900">
                            Pagamento pendente
                          </p>

                          <p className="mt-1 text-xs text-amber-700">
                            Finalize o pagamento para confirmarmos seu pedido.
                          </p>
                        </div>
                      </div>

                      <Link
                        to={`/pagamento/${pedido.id}`}
                        className="inline-flex shrink-0 items-center justify-center gap-2 bg-[#211C14] px-4 py-3 text-xs font-medium uppercase tracking-wider text-white transition hover:bg-[#968052]"
                      >
                        <CreditCard size={15} />
                        Pagar agora
                      </Link>
                    </div>
                  )}

                  {/* RODAPÉ */}

                  <div className="mt-6 flex justify-end border-t border-[#F0EADF] pt-5">
                    <Link
                      to={`/pedidos/${pedido.id}`}
                      className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#968052] transition hover:text-[#211C14]"
                    >
                      Ver detalhes
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
