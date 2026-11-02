import { useState } from "react";

import {
  CardPayment,
  initMercadoPago,
} from "@mercadopago/sdk-react";

import {
  CreditCard,
  Landmark,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import {
  apiFetch,
} from "../../services/api.js";


const PUBLIC_KEY =
  import.meta.env
    .VITE_MERCADO_PAGO_PUBLIC_KEY;


if (PUBLIC_KEY) {
  initMercadoPago(
    PUBLIC_KEY,
    {
      locale:
        "pt-BR",
    }
  );
}


export default function PagamentoCartao({
  pedidoId,
  valor,
  onPagamentoCriado,
}) {
  /**
   * =========================================
   * ESTADOS
   * =========================================
   */

  const [
    tipoPagamento,
    setTipoPagamento,
  ] = useState(
    "credito"
  );

  const [
    pronto,
    setPronto,
  ] = useState(
    false
  );

  const [
    processando,
    setProcessando,
  ] = useState(
    false
  );

  const [
    erro,
    setErro,
  ] = useState(
    ""
  );


  /**
   * =========================================
   * ALTERAR CRÉDITO / DÉBITO
   * =========================================
   *
   * Quando o usuário troca o tipo,
   * o Brick será recriado através
   * da propriedade "key".
   */

  function alterarTipoPagamento(
    tipo
  ) {
    if (
      processando ||
      tipo === tipoPagamento
    ) {
      return;
    }


    setTipoPagamento(
      tipo
    );

    setErro(
      ""
    );

    setPronto(
      false
    );
  }


  /**
   * =========================================
   * ENVIAR PAGAMENTO
   * =========================================
   */

  async function enviarPagamento(
    formData,
    additionalData
  ) {
    setErro("");
    setProcessando(true);

    try {
      console.log(
        "CARD PAYMENT - FORM DATA:",
        formData
      );

      console.log(
        "CARD PAYMENT - ADDITIONAL DATA:",
        additionalData
      );

      if (!formData?.token) {
        throw new Error(
          "Não foi possível gerar o token do cartão."
        );
      }

      if (!formData?.payment_method_id) {
        throw new Error(
          "Não foi possível identificar o método do cartão."
        );
      }

      const dadosPagamento = {
        pedidoId,

        token:
          formData.token,

        paymentMethodId:
          formData.payment_method_id,

        payer: {
          email:
            formData.payer?.email,

          identification:
            formData.payer?.identification,
        },
      };

      if (
        tipoPagamento ===
        "credito"
      ) {
        dadosPagamento.installments =
          Number(
            formData.installments
          );
      }

      const endpoint =
        tipoPagamento === "debito"
          ? "/pagamentos/debito"
          : "/pagamentos/cartao";

      console.log(
        "PAGAMENTO ENVIADO:",
        {
          tipoSelecionado:
            tipoPagamento,

          paymentMethodId:
            formData.payment_method_id,

          paymentTypeIdBrick:
            additionalData?.paymentTypeId,

          endpoint,
        }
      );

      const resposta =
        await apiFetch(
          endpoint,
          {
            method: "POST",

            body:
              JSON.stringify(
                dadosPagamento
              ),
          }
        );

      if (
        !resposta
          ?.pagamento
          ?.pagamentoId
      ) {
        throw new Error(
          "A API não retornou os dados esperados do pagamento."
        );
      }

      onPagamentoCriado?.(
        resposta.pagamento
      );

      return resposta;
    } catch (error) {
      console.error(
        `Erro no pagamento com ${tipoPagamento === "debito"
          ? "débito"
          : "crédito"
        }:`,
        error
      );

      setErro(
        error.message ||
        "Não foi possível processar o pagamento."
      );

      throw error;
    } finally {
      setProcessando(false);
    }
  }


  /**
   * =========================================
   * CHAVE PÚBLICA
   * =========================================
   */

  if (!PUBLIC_KEY) {
    return (
      <div
        role="alert"
        className="
          border
          border-red-200
          bg-red-50
          px-4
          py-3
          text-sm
          text-red-800
        "
      >
        A chave pública do Mercado Pago
        não foi configurada.
      </div>
    );
  }


  /**
   * =========================================
   * CUSTOMIZAÇÃO DO BRICK
   * =========================================
   *
   * O MESMO Brick é utilizado para
   * crédito e débito.
   *
   * Crédito:
   * exclui debit_card.
   *
   * Débito:
   * exclui credit_card e prepaid_card.
   */

  /**
 * =========================================
 * CUSTOMIZAÇÃO DO BRICK
 * =========================================
 */

  const customization = {
    paymentMethods: {
      minInstallments:
        tipoPagamento === "credito"
          ? 1
          : 1,

      ...(tipoPagamento === "debito"
        ? {
          maxInstallments: 1,
        }
        : {}),
    },

    visual: {
      style: {
        theme: "default",
      },
    },
  };


  /**
   * =========================================
   * COMPONENTE
   * =========================================
   */

  return (
    <div
      className="space-y-5"
    >
      {/*
       * =====================================
       * SELETOR CRÉDITO / DÉBITO
       * =====================================
       */}

      <div
        className="
          grid
          grid-cols-2
          gap-3
        "
      >
        {/*
         * CRÉDITO
         */}

        <button
          type="button"
          disabled={
            processando
          }
          onClick={() =>
            alterarTipoPagamento(
              "credito"
            )
          }
          className={`
            flex
            items-center
            justify-center
            gap-2
            border
            px-4
            py-3
            text-sm
            font-medium
            transition

            ${tipoPagamento ===
              "credito"
              ? `
                  border-[#968052]
                  bg-[#FCFAF5]
                  text-[#6D5C37]
                `
              : `
                  border-[#E9DCC4]
                  bg-white
                  text-[#756C5C]
                  hover:border-[#CDBD9F]
                `
            }

            ${processando
              ? `
                  cursor-not-allowed
                  opacity-60
                `
              : ""
            }
          `}
        >
          <CreditCard
            size={18}
          />

          Crédito
        </button>


        {/*
         * DÉBITO
         */}

        <button
          type="button"
          disabled={
            processando
          }
          onClick={() =>
            alterarTipoPagamento(
              "debito"
            )
          }
          className={`
            flex
            items-center
            justify-center
            gap-2
            border
            px-4
            py-3
            text-sm
            font-medium
            transition

            ${tipoPagamento ===
              "debito"
              ? `
                  border-[#968052]
                  bg-[#FCFAF5]
                  text-[#6D5C37]
                `
              : `
                  border-[#E9DCC4]
                  bg-white
                  text-[#756C5C]
                  hover:border-[#CDBD9F]
                `
            }

            ${processando
              ? `
                  cursor-not-allowed
                  opacity-60
                `
              : ""
            }
          `}
        >
          <Landmark
            size={18}
          />

          Débito
        </button>
      </div>


      {/*
       * =====================================
       * DESCRIÇÃO
       * =====================================
       */}

      <div
        className="
          border
          border-[#E9DCC4]
          bg-[#FCFAF5]
          px-4
          py-3
          text-xs
          leading-5
          text-[#756C5C]
        "
      >
        {tipoPagamento ===
          "credito" ? (
          <p>
            Pagamento com cartão de
            crédito. Você poderá escolher
            a quantidade de parcelas
            disponibilizada pelo Mercado
            Pago.
          </p>
        ) : (
          <p>
            Pagamento à vista com cartão
            de débito. Utilize um cartão
            compatível com débito online.
          </p>
        )}
      </div>


      {/*
       * =====================================
       * CARREGANDO
       * =====================================
       */}

      {!pronto && (
        <div
          className="
            flex
            items-center
            justify-center
            gap-3
            py-5
            text-sm
            text-[#756C5C]
          "
        >
          <LoaderCircle
            size={18}
            className="animate-spin"
          />

          {tipoPagamento ===
            "debito"
            ? "Carregando pagamento com cartão de débito..."
            : "Carregando pagamento com cartão de crédito..."}
        </div>
      )}


      {/*
       * =====================================
       * ERRO
       * =====================================
       */}

      {erro && (
        <div
          role="alert"
          className="
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-800
          "
        >
          {erro}
        </div>
      )}


      {/*
       * =====================================
       * PROCESSANDO
       * =====================================
       */}

      {processando && (
        <div
          className="
            flex
            items-center
            justify-center
            gap-3
            border
            border-[#E9DCC4]
            bg-[#FCFAF5]
            px-4
            py-4
            text-sm
            text-[#756C5C]
          "
        >
          <LoaderCircle
            size={18}
            className="animate-spin"
          />

          {tipoPagamento ===
            "debito"
            ? "Processando pagamento com débito..."
            : "Processando pagamento com crédito..."}
        </div>
      )}


      {/*
       * =====================================
       * CARD PAYMENT BRICK
       * =====================================
       *
       * A key é importante.
       *
       * Ao trocar:
       *
       * credito -> debito
       *
       * React recria o Brick com a nova
       * configuração.
       */}

      <div
        className={
          !pronto ||
            processando
            ? `
              pointer-events-none
              opacity-60
            `
            : ""
        }
      >
        <CardPayment
          initialization={{
            amount: Number(valor),
          }}

          customization={
            customization
          }

          onReady={() => {
            setPronto(true);
            setErro("");
          }}

          onSubmit={
            enviarPagamento
          }

          onError={(error) => {
            console.error(
              "Erro no Card Payment Brick:",
              error
            );

            setErro(
              "Não foi possível carregar ou processar os dados do cartão."
            );
          }}
        />
      </div>


      {/*
       * =====================================
       * SEGURANÇA
       * =====================================
       */}

      {pronto && (
        <div
          className="
            flex
            items-start
            gap-3
            border-t
            border-[#E9DCC4]
            pt-5
          "
        >
          <ShieldCheck
            size={19}
            className="
              mt-0.5
              shrink-0
              text-[#968052]
            "
          />

          <p
            className="
              text-xs
              leading-5
              text-[#756C5C]
            "
          >
            Os dados do seu cartão são
            processados com segurança pelo
            Mercado Pago.
          </p>
        </div>
      )}
    </div>
  );
}