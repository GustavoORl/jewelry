
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  LoaderCircle,
  QrCode,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { apiFetch } from "../../services/api.js";

const formatarPreco = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);

export default function Pagamento() {
  const { pedidoId } = useParams();

  const [pagamento, setPagamento] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);

  async function gerarPix() {
    setCarregando(true);
    setErro("");

    try {
      const resposta = await apiFetch("/pagamentos/pix", {
        method: "POST",
        body: JSON.stringify({ pedidoId }),
      });

      if (!resposta?.pagamento?.pagamentoId) {
        throw new Error("A API não retornou os dados esperados do pagamento.");
      }

      setPagamento(resposta.pagamento);
    } catch (error) {
      setErro(error.message || "Não foi possível gerar o Pix.");
    } finally {
      setCarregando(false);
    }
  }

  async function consultarStatus() {
    if (!pagamento?.pagamentoId) return;

    setConsultando(true);

    try {
      const resposta = await apiFetch(
        `/pagamentos/${pagamento.pagamentoId}`
      );

      setPagamento((atual) => ({
        ...atual,
        ...resposta.pagamento,
      }));
    } catch (error) {
      console.error("Erro ao consultar pagamento:", error);
    } finally {
      setConsultando(false);
    }
  }

  useEffect(() => {
    if (!pagamento?.pagamentoId) return;

    const statusFinal = [
      "APROVADO",
      "RECUSADO",
      "CANCELADO",
      "REEMBOLSADO",
      "EXPIRADO",
    ];

    if (statusFinal.includes(pagamento.status)) return;

    const intervalo = setInterval(() => {
      consultarStatus();
    }, 5000);

    return () => clearInterval(intervalo);
  }, [pagamento?.pagamentoId, pagamento?.status]);

  async function copiarCodigo() {
    if (!pagamento?.pix?.codigo) return;

    try {
      await navigator.clipboard.writeText(pagamento.pix.codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setErro("Não foi possível copiar o código Pix.");
    }
  }

  const aprovado = pagamento?.status === "APROVADO";

  return (
    <main className="min-h-[70vh] bg-[#FCFAF5] px-4 py-12 text-[#211C14]">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/pedidos"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#756C5C] hover:text-[#968052]"
        >
          <ArrowLeft size={17} />
          Meus pedidos
        </Link>

        <section className="border border-[#E9DCC4] bg-white p-6 sm:p-10">
          <div className="mb-8 text-center">
            {aprovado ? (
              <CheckCircle2
                size={48}
                className="mx-auto mb-4 text-green-600"
              />
            ) : (
              <QrCode
                size={42}
                className="mx-auto mb-4 text-[#968052]"
              />
            )}

            <p className="text-xs uppercase tracking-[0.25em] text-[#968052]">
              AURELIA
            </p>

            <h1 className="mt-3 font-serif text-3xl">
              {aprovado ? "Pagamento aprovado!" : "Pagamento via Pix"}
            </h1>

            <p className="mt-3 text-sm text-[#756C5C]">
              {aprovado
                ? "Recebemos a confirmação do seu pagamento."
                : "Gere seu código Pix para concluir o pedido."}
            </p>
          </div>

          {erro && (
            <div
              role="alert"
              className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {erro}
            </div>
          )}

          {!pagamento && (
            <button
              type="button"
              onClick={gerarPix}
              disabled={carregando}
              className="flex w-full items-center justify-center gap-3 bg-[#211C14] px-5 py-4 text-sm text-white transition hover:bg-[#968052] disabled:cursor-not-allowed disabled:bg-[#B9B2A6]"
            >
              {carregando ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Gerando Pix...
                </>
              ) : (
                "Gerar pagamento Pix"
              )}
            </button>
          )}

          {pagamento && (
            <div className="space-y-6">
              <div className="border-y border-[#E9DCC4] py-5 text-center">
                <p className="text-xs text-[#756C5C]">
                  Status do pagamento
                </p>

                <p className="mt-2 text-lg font-medium">
                  {pagamento.status}
                </p>

                {consultando && (
                  <p className="mt-2 flex items-center justify-center gap-2 text-xs text-[#968052]">
                    <RefreshCw size={13} className="animate-spin" />
                    Atualizando status...
                  </p>
                )}
              </div>

              {pagamento.pix?.imagemBase64 && !aprovado && (
                <div className="text-center">
                  <img
                    src={`data:image/png;base64,${pagamento.pix.imagemBase64}`}
                    alt="QR Code Pix"
                    className="mx-auto h-56 w-56 object-contain"
                  />
                </div>
              )}

              {pagamento.pix?.codigo && !aprovado && (
                <div>
                  <label className="mb-2 block text-xs font-medium text-[#756C5C]">
                    Código Pix copia e cola
                  </label>

                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={pagamento.pix.codigo}
                      className="min-w-0 flex-1 border border-[#E9DCC4] bg-[#FCFAF5] px-3 py-3 text-xs"
                    />

                    <button
                      type="button"
                      onClick={copiarCodigo}
                      className="flex shrink-0 items-center gap-2 bg-[#211C14] px-4 text-xs text-white hover:bg-[#968052]"
                    >
                      <Copy size={15} />
                      {copiado ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>
              )}

              {aprovado && (
                <div className="bg-green-50 p-4 text-center text-sm text-green-800">
                  Seu pedido foi confirmado. Obrigado por comprar na AURELIA!
                </div>
              )}

              {!aprovado && (
                <div className="flex items-start gap-3 border-t border-[#E9DCC4] pt-5">
                  <ShieldCheck
                    size={19}
                    className="mt-0.5 shrink-0 text-[#968052]"
                  />
                  <p className="text-xs leading-5 text-[#756C5C]">
                    A confirmação do pagamento é realizada pelo Mercado Pago.
                    Não feche a página até concluir a operação.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
