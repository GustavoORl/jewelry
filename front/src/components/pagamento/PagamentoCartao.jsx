import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  CardPayment,
  initMercadoPago,
} from "@mercadopago/sdk-react";

import {
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import {
  apiFetch,
} from "../../services/api.js";


/**
 * =========================================
 * MERCADO PAGO
 * =========================================
 *
 * O frontend utiliza o MercadoPago.js
 * para gerar o token do cartão.
 *
 * O backend utiliza esse token para criar
 * uma Order através da Orders API.
 *
 * Fluxo:
 *
 * Card Payment Brick
 *        ↓
 * token do cartão
 *        ↓
 * POST /pagamentos/cartao
 *        ↓
 * backend
 *        ↓
 * POST /v1/orders
 */

const PUBLIC_KEY =
  import.meta.env
    .VITE_MERCADO_PAGO_PUBLIC_KEY;


/**
 * Inicializamos o SDK apenas uma vez.
 */

if (PUBLIC_KEY) {
  initMercadoPago(
    PUBLIC_KEY,
    {
      locale: "pt-BR",
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
    pronto,
    setPronto,
  ] = useState(false);

  const [
    processando,
    setProcessando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");


  /**
   * =========================================
   * INITIALIZATION
   * =========================================
   */

  const initialization =
    useMemo(
      () => ({
        amount:
          Number(valor),
      }),
      [valor]
    );


  /**
   * =========================================
   * CUSTOMIZAÇÃO
   * =========================================
   *
   * Nosso checkout aceita somente
   * cartão de crédito.
   *
   * Por isso removemos:
   *
   * - debit_card
   * - prepaid_card
   *
   * O Card Payment Brick continua
   * responsável por identificar:
   *
   * - bandeira;
   * - token;
   * - parcelas;
   * - dados do pagador.
   */

  const customization =
    useMemo(
      () => ({
        paymentMethods: {
          minInstallments: 1,

          types: {
            excluded: [
              "debit_card",
              "prepaid_card",
            ],
          },
        },

        visual: {
          style: {
            theme:
              "default",
          },
        },
      }),
      []
    );


  /**
   * =========================================
   * BRICK READY
   * =========================================
   */

  const handleReady =
    useCallback(() => {
      setPronto(true);

      setErro("");
    }, []);


  /**
   * =========================================
   * BRICK ERROR
   * =========================================
   */

  const handleError =
    useCallback(
      (error) => {
        console.error(
          "Erro no Card Payment Brick:",
          error
        );

        if (
          error?.cause ===
          "missing_payment_information"
        ) {
          setErro(
            "Este cartão não está disponível para pagamento com crédito."
          );

          return;
        }

        if (
          error?.cause ===
          "card_payment_brick_initialization_failed"
        ) {
          setErro(
            error?.message ||
              "Não foi possível carregar o pagamento com cartão."
          );

          return;
        }

        setErro(
          "Não foi possível carregar ou processar os dados do cartão."
        );
      },
      []
    );


  /**
   * =========================================
   * ENVIAR PAGAMENTO
   * =========================================
   *
   * O Card Payment Brick gera:
   *
   * - token
   * - payment_method_id
   * - paymentTypeId
   * - installments
   * - payer
   *
   * O frontend envia esses dados para
   * nosso backend.
   *
   * O backend então cria:
   *
   * POST /v1/orders
   *
   * Nunca enviamos o número completo
   * do cartão ou CVV ao nosso backend.
   */

  const enviarPagamento =
    useCallback(
      async (
        formData,
        additionalData
      ) => {
        setErro("");

        setProcessando(true);

        try {
          /**
           * =================================
           * LOG SEGURO
           * =================================
           *
           * Não logamos formData inteiro,
           * pois contém o token do cartão.
           */

          console.log(
            "CARD PAYMENT:",
            {
              paymentMethodId:
                formData
                  ?.payment_method_id,

              paymentTypeId:
                additionalData
                  ?.paymentTypeId,

              installments:
                formData
                  ?.installments,

              possuiToken:
                Boolean(
                  formData?.token
                ),
            }
          );


          /**
           * =================================
           * TOKEN
           * =================================
           */

          if (
            !formData?.token
          ) {
            throw new Error(
              "Não foi possível gerar o token do cartão."
            );
          }


          /**
           * =================================
           * PAYMENT METHOD
           * =================================
           *
           * Exemplos:
           *
           * visa
           * master
           * elo
           * amex
           */

          if (
            !formData
              ?.payment_method_id
          ) {
            throw new Error(
              "Não foi possível identificar o método do cartão."
            );
          }


          /**
           * =================================
           * PAYMENT TYPE
           * =================================
           *
           * Apesar de o Brick estar
           * configurado para excluir débito,
           * ainda validamos o tipo retornado
           * pelo próprio Mercado Pago.
           */

          const paymentTypeId =
            additionalData
              ?.paymentTypeId;


          if (
            !paymentTypeId
          ) {
            throw new Error(
              "Não foi possível identificar o tipo do cartão."
            );
          }


          /**
           * =================================
           * SOMENTE CRÉDITO
           * =================================
           */

          if (
            paymentTypeId !==
            "credit_card"
          ) {
            console.warn(
              "Pagamento bloqueado: cartão não identificado como crédito.",
              {
                paymentMethodId:
                  formData
                    .payment_method_id,

                paymentTypeId,
              }
            );

            throw new Error(
              "O cartão informado não foi identificado como cartão de crédito. Utilize um cartão compatível com crédito."
            );
          }


          /**
           * =================================
           * PARCELAS
           * =================================
           */

          const parcelas =
            Number(
              formData
                .installments
            );

          if (
            !Number.isInteger(
              parcelas
            ) ||
            parcelas < 1
          ) {
            throw new Error(
              "Quantidade de parcelas inválida."
            );
          }


          /**
           * =================================
           * PAYLOAD DO NOSSO BACKEND
           * =================================
           *
           * Esse NÃO é o payload enviado
           * diretamente ao Mercado Pago.
           *
           * O pagamentoService.js transforma
           * estes dados no payload da
           * Orders API.
           */

          const dadosPagamento = {
            pedidoId,

            token:
              formData.token,

            paymentMethodId:
              formData
                .payment_method_id,

            installments:
              parcelas,

            payer: {
              email:
                formData
                  .payer
                  ?.email,

              identification: {
                type:
                  formData
                    .payer
                    ?.identification
                    ?.type,

                number:
                  formData
                    .payer
                    ?.identification
                    ?.number,
              },
            },
          };


          /**
           * =================================
           * LOG DO PAYLOAD
           * =================================
           *
           * Não exibimos o token.
           */

          console.log(
            "PAGAMENTO ENVIADO:",
            {
              pedidoId,

              paymentMethodId:
                dadosPagamento
                  .paymentMethodId,

              paymentTypeId,

              installments:
                dadosPagamento
                  .installments,

              possuiToken:
                true,
            }
          );


          /**
           * =================================
           * BACKEND
           * =================================
           *
           * Nosso backend:
           *
           * POST /pagamentos/cartao
           *
           * Depois:
           *
           * POST /v1/orders
           */

          const resposta =
            await apiFetch(
              "/pagamentos/cartao",
              {
                method:
                  "POST",

                body:
                  JSON.stringify(
                    dadosPagamento
                  ),
              }
            );


          /**
           * =================================
           * VALIDAR RESPOSTA
           * =================================
           */

          if (
            !resposta
              ?.pagamento
              ?.pagamentoId
          ) {
            throw new Error(
              "A API não retornou os dados esperados do pagamento."
            );
          }


          /**
           * =================================
           * NOTIFICAR COMPONENTE PAI
           * =================================
           */

          onPagamentoCriado?.(
            resposta.pagamento
          );


          return resposta;
        } catch (error) {
          console.error(
            "Erro no pagamento com crédito:",
            error
          );

          setErro(
            error.message ||
              "Não foi possível processar o pagamento."
          );

          /**
           * O Brick precisa receber a rejeição
           * para saber que o submit falhou.
           */

          throw error;
        } finally {
          setProcessando(
            false
          );
        }
      },
      [
        pedidoId,
        onPagamentoCriado,
      ]
    );


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
   * COMPONENTE
   * =========================================
   */

  return (
    <div
      className="space-y-5"
    >
      {/**
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
        <p>
          Pagamento com cartão de crédito.
          Você poderá escolher a quantidade
          de parcelas disponibilizada pelo
          Mercado Pago.
        </p>
      </div>


      {/**
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

          Carregando pagamento com cartão...
        </div>
      )}


      {/**
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


      {/**
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

          Processando pagamento com crédito...
        </div>
      )}


      {/**
       * =====================================
       * CARD PAYMENT BRICK
       * =====================================
       *
       * O Brick agora trabalha exclusivamente
       * com cartão de crédito.
       *
       * Não precisamos mais recriá-lo para
       * alternar entre crédito e débito.
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
          initialization={
            initialization
          }

          customization={
            customization
          }

          onReady={
            handleReady
          }

          onSubmit={
            enviarPagamento
          }

          onError={
            handleError
          }
        />
      </div>


      {/**
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