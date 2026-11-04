
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Check,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  MapPin,
  Package,
  QrCode,
  ShoppingBag,
} from "lucide-react";

import { apiFetch } from "../../services/api.js";
import FaixaNavegacao from "../../components/common/FaixaNavegacao.jsx";

// ==========================================
// FORMATADORES
// ==========================================

function formatarPreco(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
}

function formatarData(data) {
  if (!data) return "";

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long",
    }).format(new Date(data));
  } catch {
    return "";
  }
}

function obterNomeMetodoPagamento(metodo) {
  switch (metodo) {
    case "PIX":
      return "Pix";

    case "CREDITO":
      return "Cartão de crédito";

    default:
      return "Pagamento";
  }
}

// ==========================================
// COMPONENTE
// ==========================================

export default function PedidoConfirmado() {
  const { pedidoId } = useParams();
  const navigate = useNavigate();

  const [pedido, setPedido] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // ==========================================
  // CARREGAR PEDIDO
  // ==========================================

  useEffect(() => {
    let ativo = true;

    async function carregarPedido() {
      try {
        setCarregando(true);
        setErro("");

        const resposta = await apiFetch(`/pedidos/${pedidoId}`);

        if (!ativo) return;

        const pedidoRecebido = resposta?.pedido || resposta;

        if (!pedidoRecebido?.id) {
          throw new Error("Pedido não encontrado.");
        }

        // A confirmação não deve ser exibida antes do pagamento.
        if (pedidoRecebido.status === "PENDENTE") {
          navigate(`/pagamento/${pedidoRecebido.id}`, {
            replace: true,
          });

          return;
        }

        setPedido(pedidoRecebido);
      } catch (error) {
        console.error("Erro ao carregar pedido confirmado:", error);

        if (ativo) {
          setErro(
            error?.message ||
              "Não foi possível carregar os dados do pedido."
          );
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    if (pedidoId) {
      carregarPedido();
    }

    return () => {
      ativo = false;
    };
  }, [pedidoId, navigate]);

  // ==========================================
  // CARREGANDO
  // ==========================================

  if (carregando) {
    return (
      <main className="min-h-[70vh] bg-[#FCFAF5] px-4 py-16">
        <div className="mx-auto flex max-w-3xl items-center justify-center py-24">
          <div className="flex items-center gap-3 text-sm text-[#756C5C]">
            <LoaderCircle size={20} className="animate-spin" />
            Carregando seu pedido...
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
      <main className="min-h-[70vh] bg-[#FCFAF5] px-4 py-16">
        <div className="mx-auto max-w-lg border border-[#E9DCC4] bg-white p-8 text-center">
          <h1 className="font-serif text-2xl text-[#211C14]">
            Não foi possível carregar o pedido
          </h1>

          <p className="mt-4 text-sm leading-6 text-[#756C5C]">
            {erro || "O pedido solicitado não foi encontrado."}
          </p>

          <div className="mt-7 flex flex-col gap-3">
            <Link
              to="/pedidos"
              className="bg-[#211C14] px-5 py-3 text-sm text-white transition hover:bg-[#968052]"
            >
              Ver meus pedidos
            </Link>

            <Link
              to="/"
              className="border border-[#211C14] px-5 py-3 text-sm text-[#211C14] transition hover:bg-[#FCFAF5]"
            >
              Voltar para a loja
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // DADOS DERIVADOS
  // ==========================================

  const pagamentoAprovado =
    pedido.pagamentos?.find(
      (pagamento) => pagamento.status === "APROVADO"
    ) ||
    pedido.pagamentos?.[0] ||
    null;

  const enderecoPrincipal = [
    pedido.ruaEntrega,
    pedido.numeroEntrega,
  ]
    .filter(Boolean)
    .join(", ");

  const cidadeEstado = [
    pedido.cidadeEntrega,
    pedido.estadoEntrega,
  ]
    .filter(Boolean)
    .join(" - ");

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <main className="min-h-screen bg-[#FCFAF5] text-[#211C14]">
      {/* NAVEGAÇÃO */}

      <div className="max-md:hidden">
        <FaixaNavegacao
          mostrarVoltar={false}
          itens={[
            { label: "Início", to: "/" },
            { label: "Pedido Confirmado" },
          ]}
        />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        {/* CONFIRMAÇÃO */}

        <section className="border border-[#E9DCC4] bg-white px-6 py-10 text-center sm:px-10 sm:py-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 size={36} className="text-green-600" />
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.28em] text-[#968052]">
            Compra realizada
          </p>

          <h1 className="mt-3 font-serif text-3xl sm:text-4xl">
            Pedido confirmado!
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#756C5C]">
            Obrigado pela sua compra. Seu pagamento foi confirmado e agora
            começaremos a preparar seu pedido.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
            <Check size={16} />
            Pagamento confirmado
          </div>
        </section>

        {/* PEDIDO */}

        <section className="mt-5 border border-[#E9DCC4] bg-white p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 border-b border-[#E9DCC4] pb-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#968052]">
                Número do pedido
              </p>

              <p className="mt-2 break-all text-sm font-medium">
                #{pedido.id}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-xs text-[#756C5C]">
                Realizado em
              </p>

              <p className="mt-1 text-sm font-medium">
                {formatarData(pedido.criadoEm)}
              </p>
            </div>
          </div>

          {/* PRODUTOS */}

          <div className="py-6">
            <div className="mb-5 flex items-center gap-2">
              <ShoppingBag size={18} className="text-[#968052]" />

              <h2 className="font-medium">
                Produtos
              </h2>
            </div>

            {pedido.itens?.length > 0 ? (
              <div className="divide-y divide-[#E9DCC4]">
                {pedido.itens.map((item) => {
                  const subtotal =
                    Number(item.precoUnitario) *
                    Number(item.quantidade);

                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-5 py-4 first:pt-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {item.nomeProduto}
                        </p>

                        <p className="mt-1 text-xs text-[#756C5C]">
                          Quantidade: {item.quantidade}
                        </p>

                        <p className="mt-1 text-xs text-[#756C5C]">
                          {formatarPreco(item.precoUnitario)} cada
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-medium">
                        {formatarPreco(subtotal)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[#756C5C]">
                Os itens deste pedido não estão disponíveis para exibição.
              </p>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-[#E9DCC4] pt-5">
              <span className="text-sm text-[#756C5C]">
                Total
              </span>

              <span className="text-xl font-medium">
                {formatarPreco(pedido.valorTotal)}
              </span>
            </div>
          </div>
        </section>

        {/* ENDEREÇO */}

        <section className="mt-5 border border-[#E9DCC4] bg-white p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-[#968052]" />

            <h2 className="font-medium">
              Endereço de entrega
            </h2>
          </div>

          <div className="mt-5 text-sm leading-6 text-[#756C5C]">
            <p className="font-medium text-[#211C14]">
              {pedido.destinatario}
            </p>

            {enderecoPrincipal && (
              <p>{enderecoPrincipal}</p>
            )}

            {pedido.complementoEntrega && (
              <p>{pedido.complementoEntrega}</p>
            )}

            {pedido.bairroEntrega && (
              <p>{pedido.bairroEntrega}</p>
            )}

            {cidadeEstado && (
              <p>{cidadeEstado}</p>
            )}

            {pedido.cepEntrega && (
              <p>CEP: {pedido.cepEntrega}</p>
            )}
          </div>
        </section>

        {/* PAGAMENTO */}

        <section className="mt-5 border border-[#E9DCC4] bg-white p-6 sm:p-8">
          <div className="flex items-center gap-2">
            {pagamentoAprovado?.metodo === "PIX" ? (
              <QrCode size={18} className="text-[#968052]" />
            ) : (
              <CreditCard size={18} className="text-[#968052]" />
            )}

            <h2 className="font-medium">
              Pagamento
            </h2>
          </div>

          <div className="mt-5 flex items-center justify-between gap-5">
            <div>
              <p className="text-sm font-medium">
                {obterNomeMetodoPagamento(pagamentoAprovado?.metodo)}
              </p>

              <p className="mt-1 text-xs text-[#756C5C]">
                Pagamento aprovado
              </p>
            </div>

            <CheckCircle2 size={20} className="shrink-0 text-green-600" />
          </div>
        </section>

        {/* PRÓXIMOS PASSOS */}

        <section className="mt-5 border border-[#E9DCC4] bg-white p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <Package size={21} className="mt-0.5 shrink-0 text-[#968052]" />

            <div>
              <h2 className="font-medium">
                E agora?
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#756C5C]">
                Agora vamos preparar sua joia para envio. Você poderá
                acompanhar as próximas etapas na área de pedidos.
              </p>
            </div>
          </div>
        </section>

        {/* BOTÕES */}

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            to={`/pedidos/${pedido.id}`}
            className="flex min-h-12 items-center justify-center bg-[#211C14] px-5 py-3 text-center text-sm text-white transition duration-200 hover:bg-[#968052]"
          >
            Acompanhar pedido
          </Link>

          <Link
            to="/produtos"
            className="flex min-h-12 items-center justify-center border border-[#211C14] px-5 py-3 text-center text-sm text-[#211C14] transition duration-200 hover:bg-[#F4EFE5]"
          >
            Continuar comprando
          </Link>
        </div>
      </div>
    </main>
  );
}
