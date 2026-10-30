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
} from "lucide-react";

import { apiFetch } from "../../services/api";

const statusConfig = {
  PENDENTE: {
    label: "Aguardando pagamento",
    icon: Clock3,
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  PAGO: {
    label: "Pagamento aprovado",
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

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  if (!data) return "Data não disponível";

  return new Date(data).toLocaleString("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export default function PedidoDetalhado() {
  const { pedidoId } = useParams();

  const [pedido, setPedido] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarPedido() {
      try {
        setCarregando(true);
        setErro("");

        const resposta = await apiFetch(`/pedidos/${pedidoId}`);

        setPedido(resposta.pedido);
      } catch (error) {
        setErro(error.message || "Não foi possível carregar o pedido.");
      } finally {
        setCarregando(false);
      }
    }

    carregarPedido();
  }, [pedidoId]);

  if (carregando) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center bg-[#FCFAF5]">
        <div className="flex flex-col items-center gap-3 text-[#968052]">
          <LoaderCircle size={34} className="animate-spin" />
          <p className="text-sm text-[#211C14]/60">
            Carregando detalhes do pedido...
          </p>
        </div>
      </main>
    );
  }

  if (erro || !pedido) {
    return (
      <main className="min-h-[70vh] bg-[#FCFAF5] flex items-center justify-center px-5">
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
            className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-[#968052] hover:underline"
          >
            <ArrowLeft size={16} />
            Voltar aos meus pedidos
          </Link>
        </div>
      </main>
    );
  }

  const status = statusConfig[pedido.status] || statusConfig.PENDENTE;
  const StatusIcon = status.icon;

  const quantidadeItens = pedido.itens.reduce(
    (total, item) => total + item.quantidade,
    0
  );

  return (
    <main className="min-h-screen bg-[#FCFAF5] py-10 md:py-14">
      <div className="max-w-5xl mx-auto px-5">

        {/* Voltar */}
        <Link
          to="/pedidos"
          className="inline-flex items-center gap-2 mb-8 text-sm text-[#211C14]/60 hover:text-[#968052] transition"
        >
          <ArrowLeft size={17} />
          Voltar aos meus pedidos
        </Link>

        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-[#968052]">
              Minha conta
            </span>

            <h1 className="text-3xl md:text-4xl font-serif text-[#211C14] mt-2">
              Detalhes do pedido
            </h1>

            <p className="text-sm text-[#211C14]/50 mt-2">
              Pedido #{pedido.id}
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-2 w-fit px-4 py-2 rounded-full border text-xs font-medium ${status.color}`}
          >
            <StatusIcon size={15} />
            {status.label}
          </span>
        </div>

        {/* Informações gerais */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

          <div className="bg-white border border-[#E9DCC4] p-5 rounded-sm">
            <div className="flex items-center gap-3 mb-3">
              <CalendarDays size={19} className="text-[#968052]" />
              <span className="text-xs uppercase tracking-wider text-[#211C14]/50">
                Data do pedido
              </span>
            </div>

            <p className="text-sm font-medium text-[#211C14]">
              {formatarData(pedido.criadoEm)}
            </p>
          </div>

          <div className="bg-white border border-[#E9DCC4] p-5 rounded-sm">
            <div className="flex items-center gap-3 mb-3">
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

        {/* Produtos */}
        <section className="bg-white border border-[#E9DCC4] rounded-sm mb-6">
          <div className="p-5 md:p-6 border-b border-[#E9DCC4]">
            <h2 className="font-medium text-[#211C14] flex items-center gap-2">
              <Package size={19} className="text-[#968052]" />
              Produtos do pedido
            </h2>
          </div>

          <div className="divide-y divide-[#E9DCC4]">
            {pedido.itens.map((item) => (
              <div
                key={item.id}
                className="p-5 md:p-6 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-[#211C14]">
                    {item.nomeProduto}
                  </h3>

                  <p className="text-xs text-[#211C14]/50 mt-2">
                    Quantidade: {item.quantidade}
                  </p>

                  <p className="text-xs text-[#211C14]/50 mt-1">
                    Valor unitário: {formatarMoeda(item.precoUnitario)}
                  </p>
                </div>

                <span className="text-sm font-medium text-[#211C14] whitespace-nowrap">
                  {formatarMoeda(
                    Number(item.precoUnitario) * item.quantidade
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="p-5 md:p-6 bg-[#F8F3E8] flex justify-between items-center">
            <span className="text-sm font-medium text-[#211C14]">
              Total do pedido
            </span>

            <span className="text-xl font-semibold text-[#968052]">
              {formatarMoeda(pedido.valorTotal)}
            </span>
          </div>
        </section>

        {/* Endereço */}
        <section className="bg-white border border-[#E9DCC4] rounded-sm mb-6">
          <div className="p-5 md:p-6 border-b border-[#E9DCC4]">
            <h2 className="font-medium text-[#211C14] flex items-center gap-2">
              <MapPin size={19} className="text-[#968052]" />
              Endereço de entrega
            </h2>
          </div>

          <div className="p-5 md:p-6">
            <p className="text-sm font-medium text-[#211C14]">
              {pedido.destinatario}
            </p>

            <p className="text-sm text-[#211C14]/60 mt-2">
              {pedido.ruaEntrega}, {pedido.numeroEntrega}
            </p>

            {pedido.complementoEntrega && (
              <p className="text-sm text-[#211C14]/60 mt-1">
                {pedido.complementoEntrega}
              </p>
            )}

            <p className="text-sm text-[#211C14]/60 mt-1">
              {pedido.bairroEntrega}
            </p>

            <p className="text-sm text-[#211C14]/60 mt-1">
              {pedido.cidadeEntrega} - {pedido.estadoEntrega}
            </p>

            <p className="text-sm text-[#211C14]/60 mt-1">
              CEP: {pedido.cepEntrega}
            </p>
          </div>
        </section>

        {/* Pagamento */}
        <section className="bg-white border border-[#E9DCC4] rounded-sm mb-8">
          <div className="p-5 md:p-6 flex items-center gap-3">
            <CreditCard size={19} className="text-[#968052]" />

            <div>
              <h2 className="text-sm font-medium text-[#211C14]">
                Pagamento
              </h2>

              <p className="text-xs text-[#211C14]/50 mt-1">
                {pedido.status === "PENDENTE"
                  ? "Aguardando confirmação do pagamento."
                  : pedido.status === "CANCELADO"
                    ? "Este pedido foi cancelado."
                    : "Consulte o status do pedido para acompanhar a confirmação."}
              </p>
            </div>
          </div>
        </section>

        <div className="text-center">
          <Link
            to="/pedidos"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#968052] text-[#968052] text-sm hover:bg-[#968052] hover:text-white transition"
          >
            <ArrowLeft size={16} />
            Voltar aos meus pedidos
          </Link>
        </div>
      </div>
    </main>
  );
}
