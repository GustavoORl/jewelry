import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  CreditCard,
  LoaderCircle,
  QrCode,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  apiFetch,
} from "../../services/api.js";

import PagamentoCartao from "../../components/pagamento/PagamentoCartao.jsx";


const formatarPreco = (valor) =>
  new Intl.NumberFormat(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL",
    }
  ).format(
    Number(valor) || 0
  );


const STATUS_FINAIS = [
  "APROVADO",
  "RECUSADO",
  "CANCELADO",
  "REEMBOLSADO",
  "EXPIRADO",
];


const STATUS_NOVA_TENTATIVA = [
  "RECUSADO",
  "CANCELADO",
  "EXPIRADO",
];


const STATUS_EM_ANDAMENTO = [
  "PENDENTE",
  "PROCESSANDO",
];


export default function Pagamento() {
  const {
    pedidoId,
  } = useParams();


  const [
    pedido,
    setPedido,
  ] = useState(
    null
  );


  const [
    pagamento,
    setPagamento,
  ] = useState(
    null
  );


  /**
   * Agora a tela possui somente
   * dois métodos visuais:
   *
   * PIX
   * CARTAO
   *
   * Crédito e débito são escolhidos
   * dentro de PagamentoCartao.jsx.
   */

  const [
    metodoSelecionado,
    setMetodoSelecionado,
  ] = useState(
    "PIX"
  );


  const [
    carregandoPedido,
    setCarregandoPedido,
  ] = useState(
    true
  );


  const [
    carregando,
    setCarregando,
  ] = useState(
    false
  );


  const [
    consultando,
    setConsultando,
  ] = useState(
    false
  );


  const [
    recuperando,
    setRecuperando,
  ] = useState(
    true
  );


  const [
    erro,
    setErro,
  ] = useState(
    ""
  );


  const [
    copiado,
    setCopiado,
  ] = useState(
    false
  );


  /**
   * =========================================
   * CARREGAR PEDIDO
   * =========================================
   */

  async function carregarPedido() {
    setCarregandoPedido(
      true
    );

    setErro(
      ""
    );


    try {
      const resposta =
        await apiFetch(
          `/pedidos/${pedidoId}`
        );


      if (
        !resposta?.pedido
      ) {
        throw new Error(
          "A API não retornou os dados do pedido."
        );
      }


      setPedido(
        resposta.pedido
      );
    } catch (
      error
    ) {
      setErro(
        error.message ||
        "Não foi possível carregar o pedido."
      );
    } finally {
      setCarregandoPedido(
        false
      );
    }
  }


  /**
   * =========================================
   * GERAR PIX
   * =========================================
   */

  async function gerarPix() {
    setCarregando(
      true
    );

    setErro(
      ""
    );

    setCopiado(
      false
    );


    try {
      const resposta =
        await apiFetch(
          "/pagamentos/pix",
          {
            method:
              "POST",

            body:
              JSON.stringify({
                pedidoId,
              }),
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


      setPagamento(
        resposta.pagamento
      );

      setMetodoSelecionado(
        "PIX"
      );
    } catch (
      error
    ) {
      setErro(
        error.message ||
        "Não foi possível gerar o Pix."
      );
    } finally {
      setCarregando(
        false
      );
    }
  }


  /**
   * =========================================
   * RECUPERAR PAGAMENTO EXISTENTE
   * =========================================
   */

  async function recuperarPagamento() {
    setRecuperando(
      true
    );

    setErro(
      ""
    );


    try {
      const resposta =
        await apiFetch(
          `/pagamentos/pedido/${pedidoId}`
        );


      const pagamentoRecuperado =
        resposta.pagamento ||
        null;


      setPagamento(
        pagamentoRecuperado
      );


      /**
       * Se encontramos um pagamento,
       * selecionamos automaticamente
       * a área correspondente.
       */

      if (
        pagamentoRecuperado
      ) {
        if (
          pagamentoRecuperado
            .metodo ===
          "PIX"
        ) {
          setMetodoSelecionado(
            "PIX"
          );
        }


        /**
         * Crédito e débito agora são
         * exibidos no mesmo componente.
         */

        if (
          [
            "CREDITO",
            "CARTAO",
            "DEBITO",
          ].includes(
            pagamentoRecuperado
              .metodo
          )
        ) {
          setMetodoSelecionado(
            "CARTAO"
          );
        }
      }
    } catch (
      error
    ) {
      setErro(
        error.message ||
        "Não foi possível recuperar o pagamento."
      );
    } finally {
      setRecuperando(
        false
      );
    }
  }


  /**
   * =========================================
   * CONSULTAR STATUS
   * =========================================
   */

  async function consultarStatus() {
    if (
      !pagamento?.pagamentoId
    ) {
      return;
    }


    setConsultando(
      true
    );


    try {
      const resposta =
        await apiFetch(
          `/pagamentos/${pagamento.pagamentoId}`
        );


      setPagamento(
        (atual) => ({
          ...atual,

          ...resposta.pagamento,
        })
      );
    } catch (
      error
    ) {
      console.error(
        "Erro ao consultar pagamento:",
        error
      );
    } finally {
      setConsultando(
        false
      );
    }
  }


  /**
   * =========================================
   * CARREGAMENTO INICIAL
   * =========================================
   */

  useEffect(() => {
    carregarPedido();

    recuperarPagamento();
  }, [
    pedidoId,
  ]);


  /**
   * =========================================
   * POLLING
   * =========================================
   */

  useEffect(() => {
    if (
      !pagamento?.pagamentoId
    ) {
      return;
    }


    if (
      STATUS_FINAIS.includes(
        pagamento.status
      )
    ) {
      return;
    }


    const intervalo =
      setInterval(
        () => {
          consultarStatus();
        },

        5000
      );


    return () =>
      clearInterval(
        intervalo
      );
  }, [
    pagamento?.pagamentoId,
    pagamento?.status,
  ]);


  /**
   * =========================================
   * COPIAR PIX
   * =========================================
   */

  async function copiarCodigo() {
    if (
      !pagamento?.pix?.codigo
    ) {
      return;
    }


    try {
      await navigator
        .clipboard
        .writeText(
          pagamento.pix.codigo
        );


      setCopiado(
        true
      );


      setTimeout(
        () => {
          setCopiado(
            false
          );
        },

        2000
      );
    } catch {
      setErro(
        "Não foi possível copiar o código Pix."
      );
    }
  }


  /**
   * =========================================
   * ESTADOS DERIVADOS
   * =========================================
   */

  const aprovado =
    pagamento?.status ===
    "APROVADO";


  const permiteNovaTentativa =
    pagamento &&
    STATUS_NOVA_TENTATIVA.includes(
      pagamento.status
    );


  const pagamentoEmAndamento =
    pagamento &&
    STATUS_EM_ANDAMENTO.includes(
      pagamento.status
    );


  /**
   * Crédito e débito compartilham
   * os mesmos estados visuais.
   */

  const pagamentoCartao =
    pagamento &&
    [
      "CREDITO",
      "CARTAO",
      "DEBITO",
    ].includes(
      pagamento.metodo
    );


  const cartaoRecusado =
    pagamentoCartao &&
    pagamento.status ===
      "RECUSADO";


  const cartaoEmAndamento =
    pagamentoCartao &&
    STATUS_EM_ANDAMENTO.includes(
      pagamento.status
    );


  const mostrarDadosPix =
    pagamento &&
    pagamento.metodo ===
      "PIX" &&
    !STATUS_FINAIS.includes(
      pagamento.status
    );


  const podeEscolherMetodo =
    !pagamentoEmAndamento &&
    !aprovado;


  const carregandoPagina =
    carregandoPedido ||
    recuperando;


  const metodoEhCartao =
    metodoSelecionado ===
    "CARTAO";


  /**
   * =========================================
   * NOVA TENTATIVA
   * =========================================
   *
   * Quando uma tentativa de cartão
   * termina recusada/cancelada/expirada,
   * precisamos liberar o componente
   * para que uma nova tentativa seja
   * criada.
   */

  function prepararNovaTentativaCartao() {
    setPagamento(
      null
    );

    setErro(
      ""
    );

    setMetodoSelecionado(
      "CARTAO"
    );
  }


  /**
   * =========================================
   * RENDER
   * =========================================
   */

  return (
    <main
      className="
        min-h-[70vh]
        bg-[#FCFAF5]
        px-4
        py-12
        text-[#211C14]
      "
    >
      <div
        className="
          mx-auto
          max-w-2xl
        "
      >
        <Link
          to="/pedidos"
          className="
            mb-8
            inline-flex
            items-center
            gap-2
            text-sm
            text-[#756C5C]
            hover:text-[#968052]
          "
        >
          <ArrowLeft
            size={17}
          />

          Meus pedidos
        </Link>


        <section
          className="
            border
            border-[#E9DCC4]
            bg-white
            p-6
            sm:p-10
          "
        >
          {/*
           * =====================================
           * CABEÇALHO
           * =====================================
           */}

          <div
            className="
              mb-8
              text-center
            "
          >
            {aprovado ? (
              <CheckCircle2
                size={48}
                className="
                  mx-auto
                  mb-4
                  text-green-600
                "
              />
            ) : metodoEhCartao ? (
              <CreditCard
                size={42}
                className="
                  mx-auto
                  mb-4
                  text-[#968052]
                "
              />
            ) : (
              <QrCode
                size={42}
                className="
                  mx-auto
                  mb-4
                  text-[#968052]
                "
              />
            )}


            <p
              className="
                text-xs
                uppercase
                tracking-[0.25em]
                text-[#968052]
              "
            >
              AURELIA
            </p>


            <h1
              className="
                mt-3
                font-serif
                text-3xl
              "
            >
              {aprovado
                ? "Pagamento aprovado!"
                : "Finalizar pagamento"}
            </h1>


            {pedido?.valorTotal && (
              <p
                className="
                  mt-3
                  text-xl
                  font-medium
                "
              >
                {formatarPreco(
                  pedido.valorTotal
                )}
              </p>
            )}


            <p
              className="
                mt-3
                text-sm
                text-[#756C5C]
              "
            >
              {aprovado
                ? "Recebemos a confirmação do seu pagamento."
                : "Escolha como deseja concluir o seu pedido."}
            </p>
          </div>


          {/*
           * =====================================
           * ERRO GERAL
           * =====================================
           */}

          {erro && (
            <div
              role="alert"
              className="
                mb-6
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
           * CARREGAMENTO DA PÁGINA
           * =====================================
           */}

          {carregandoPagina && (
            <div
              className="
                flex
                items-center
                justify-center
                gap-3
                py-8
                text-sm
                text-[#756C5C]
              "
            >
              <LoaderCircle
                size={18}
                className="
                  animate-spin
                "
              />

              Carregando pagamento...
            </div>
          )}


          {/*
           * =====================================
           * SELETOR DE MÉTODO
           * =====================================
           *
           * Agora são apenas:
           *
           * PIX
           * CARTÃO
           *
           * Crédito/débito ficam dentro do
           * componente PagamentoCartao.
           */}

          {!carregandoPagina &&
            pedido &&
            !aprovado &&
            podeEscolherMetodo && (
              <div
                className="
                  mb-8
                  grid
                  grid-cols-1
                  gap-3
                  sm:grid-cols-2
                "
              >
                {/*
                 * PIX
                 */}

                <button
                  type="button"
                  onClick={() =>
                    setMetodoSelecionado(
                      "PIX"
                    )
                  }
                  className={`
                    border
                    p-5
                    text-left
                    transition

                    ${
                      metodoSelecionado ===
                      "PIX"
                        ? `
                          border-[#968052]
                          bg-[#FCFAF5]
                        `
                        : `
                          border-[#E9DCC4]
                          bg-white
                          hover:border-[#968052]
                        `
                    }
                  `}
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >
                    <QrCode
                      size={21}
                      className="
                        text-[#968052]
                      "
                    />

                    <span
                      className="
                        font-medium
                      "
                    >
                      Pix
                    </span>
                  </div>


                  <p
                    className="
                      mt-2
                      text-xs
                      leading-5
                      text-[#756C5C]
                    "
                  >
                    Pagamento rápido e
                    instantâneo.
                  </p>
                </button>


                {/*
                 * CARTÃO
                 */}

                <button
                  type="button"
                  onClick={() =>
                    setMetodoSelecionado(
                      "CARTAO"
                    )
                  }
                  className={`
                    border
                    p-5
                    text-left
                    transition

                    ${
                      metodoSelecionado ===
                      "CARTAO"
                        ? `
                          border-[#968052]
                          bg-[#FCFAF5]
                        `
                        : `
                          border-[#E9DCC4]
                          bg-white
                          hover:border-[#968052]
                        `
                    }
                  `}
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >
                    <CreditCard
                      size={21}
                      className="
                        text-[#968052]
                      "
                    />

                    <span
                      className="
                        font-medium
                      "
                    >
                      Cartão
                    </span>
                  </div>


                  <p
                    className="
                      mt-2
                      text-xs
                      leading-5
                      text-[#756C5C]
                    "
                  >
                    Crédito ou débito com
                    processamento seguro
                    pelo Mercado Pago.
                  </p>
                </button>
              </div>
            )}


          {/*
           * =====================================
           * PAGAMENTO EM ANDAMENTO
           * =====================================
           */}

          {!carregandoPagina &&
            pedido &&
            !aprovado &&
            pagamentoEmAndamento &&
            !pagamentoCartao && (
              <div
                className="
                  mb-6
                  border
                  border-[#E9DCC4]
                  bg-[#FCFAF5]
                  p-4
                  text-center
                "
              >
                <p
                  className="
                    text-sm
                    font-medium
                  "
                >
                  Existe um pagamento em
                  andamento.
                </p>


                <p
                  className="
                    mt-2
                    text-xs
                    leading-5
                    text-[#756C5C]
                  "
                >
                  Conclua esta tentativa
                  antes de iniciar outra
                  forma de pagamento.
                </p>
              </div>
            )}


          {/*
           * =====================================
           * PIX
           * =====================================
           */}

          {!carregandoPagina &&
            pedido &&
            !aprovado &&
            metodoSelecionado ===
              "PIX" && (
              <div
                className="
                  space-y-6
                "
              >
                {!pagamento && (
                  <button
                    type="button"
                    onClick={
                      gerarPix
                    }
                    disabled={
                      carregando
                    }
                    className="
                      flex
                      w-full
                      items-center
                      justify-center
                      gap-3
                      bg-[#211C14]
                      px-5
                      py-4
                      text-sm
                      text-white
                      transition
                      hover:bg-[#968052]
                      disabled:cursor-not-allowed
                      disabled:bg-[#B9B2A6]
                    "
                  >
                    {carregando ? (
                      <>
                        <LoaderCircle
                          size={18}
                          className="
                            animate-spin
                          "
                        />

                        Gerando Pix...
                      </>
                    ) : (
                      "Gerar pagamento Pix"
                    )}
                  </button>
                )}


                {pagamento &&
                  pagamento.metodo ===
                    "PIX" && (
                    <>
                      <div
                        className="
                          border-y
                          border-[#E9DCC4]
                          py-5
                          text-center
                        "
                      >
                        <p
                          className="
                            text-xs
                            text-[#756C5C]
                          "
                        >
                          Status do pagamento
                        </p>


                        <p
                          className="
                            mt-2
                            text-lg
                            font-medium
                          "
                        >
                          {pagamento.status}
                        </p>


                        {pagamento.valor && (
                          <p
                            className="
                              mt-1
                              text-sm
                              text-[#756C5C]
                            "
                          >
                            {formatarPreco(
                              pagamento.valor
                            )}
                          </p>
                        )}


                        {consultando && (
                          <p
                            className="
                              mt-2
                              flex
                              items-center
                              justify-center
                              gap-2
                              text-xs
                              text-[#968052]
                            "
                          >
                            <RefreshCw
                              size={13}
                              className="
                                animate-spin
                              "
                            />

                            Atualizando
                            status...
                          </p>
                        )}
                      </div>


                      {pagamento
                        .pix
                        ?.imagemBase64 &&
                        mostrarDadosPix && (
                          <div
                            className="
                              text-center
                            "
                          >
                            <img
                              src={`data:image/png;base64,${pagamento.pix.imagemBase64}`}
                              alt="QR Code Pix"
                              className="
                                mx-auto
                                h-56
                                w-56
                                object-contain
                              "
                            />
                          </div>
                        )}


                      {pagamento
                        .pix
                        ?.codigo &&
                        mostrarDadosPix && (
                          <div>
                            <label
                              className="
                                mb-2
                                block
                                text-xs
                                font-medium
                                text-[#756C5C]
                              "
                            >
                              Código Pix copia
                              e cola
                            </label>


                            <div
                              className="
                                flex
                                gap-2
                              "
                            >
                              <input
                                readOnly
                                value={
                                  pagamento
                                    .pix
                                    .codigo
                                }
                                className="
                                  min-w-0
                                  flex-1
                                  border
                                  border-[#E9DCC4]
                                  bg-[#FCFAF5]
                                  px-3
                                  py-3
                                  text-xs
                                "
                              />


                              <button
                                type="button"
                                onClick={
                                  copiarCodigo
                                }
                                className="
                                  flex
                                  shrink-0
                                  items-center
                                  gap-2
                                  bg-[#211C14]
                                  px-4
                                  text-xs
                                  text-white
                                  hover:bg-[#968052]
                                "
                              >
                                <Copy
                                  size={15}
                                />

                                {copiado
                                  ? "Copiado!"
                                  : "Copiar"}
                              </button>
                            </div>
                          </div>
                        )}


                      {permiteNovaTentativa && (
                        <div
                          className="
                            space-y-4
                          "
                        >
                          <div
                            className="
                              border
                              border-[#E9DCC4]
                              bg-[#FCFAF5]
                              p-4
                              text-center
                            "
                          >
                            <p
                              className="
                                text-sm
                                font-medium
                                text-[#211C14]
                              "
                            >
                              {pagamento.status ===
                                "EXPIRADO" &&
                                "Este pagamento expirou."}

                              {pagamento.status ===
                                "CANCELADO" &&
                                "Este pagamento foi cancelado."}

                              {pagamento.status ===
                                "RECUSADO" &&
                                "Este pagamento foi recusado."}
                            </p>


                            <p
                              className="
                                mt-2
                                text-xs
                                leading-5
                                text-[#756C5C]
                              "
                            >
                              Você pode gerar
                              uma nova tentativa
                              para este pedido.
                            </p>
                          </div>


                          <button
                            type="button"
                            onClick={
                              gerarPix
                            }
                            disabled={
                              carregando
                            }
                            className="
                              flex
                              w-full
                              items-center
                              justify-center
                              gap-3
                              bg-[#211C14]
                              px-5
                              py-4
                              text-sm
                              text-white
                              transition
                              hover:bg-[#968052]
                              disabled:cursor-not-allowed
                              disabled:bg-[#B9B2A6]
                            "
                          >
                            {carregando ? (
                              <>
                                <LoaderCircle
                                  size={18}
                                  className="
                                    animate-spin
                                  "
                                />

                                Gerando novo
                                Pix...
                              </>
                            ) : (
                              "Gerar novo Pix"
                            )}
                          </button>
                        </div>
                      )}


                      {!permiteNovaTentativa &&
                        mostrarDadosPix && (
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
                              A confirmação do
                              pagamento é
                              realizada pelo
                              Mercado Pago.
                            </p>
                          </div>
                        )}
                    </>
                  )}
              </div>
            )}


          {/*
           * =====================================
           * CARTÃO EM PROCESSAMENTO
           * =====================================
           */}

          {!carregandoPagina &&
            pedido &&
            !aprovado &&
            metodoEhCartao &&
            cartaoEmAndamento && (
              <div
                className="
                  space-y-5
                "
              >
                <div
                  className="
                    border
                    border-[#E9DCC4]
                    bg-[#FCFAF5]
                    px-5
                    py-5
                  "
                >
                  <div
                    className="
                      flex
                      items-start
                      gap-3
                    "
                  >
                    <LoaderCircle
                      size={20}
                      className="
                        mt-0.5
                        shrink-0
                        animate-spin
                        text-[#968052]
                      "
                    />


                    <div>
                      <p
                        className="
                          font-medium
                          text-[#211C14]
                        "
                      >
                        Processando pagamento
                      </p>


                      <p
                        className="
                          mt-2
                          text-sm
                          leading-6
                          text-[#756C5C]
                        "
                      >
                        Estamos aguardando a
                        confirmação do Mercado
                        Pago. Não realize uma
                        nova tentativa enquanto
                        este pagamento estiver
                        sendo processado.
                      </p>
                    </div>
                  </div>
                </div>


                <div
                  className="
                    border-y
                    border-[#E9DCC4]
                    py-5
                    text-center
                  "
                >
                  <p
                    className="
                      text-xs
                      text-[#756C5C]
                    "
                  >
                    Status do pagamento
                  </p>


                  <p
                    className="
                      mt-2
                      text-lg
                      font-medium
                    "
                  >
                    {pagamento.status}
                  </p>


                  {pagamento.valor && (
                    <p
                      className="
                        mt-1
                        text-sm
                        text-[#756C5C]
                      "
                    >
                      {formatarPreco(
                        pagamento.valor
                      )}
                    </p>
                  )}


                  {consultando && (
                    <p
                      className="
                        mt-2
                        flex
                        items-center
                        justify-center
                        gap-2
                        text-xs
                        text-[#968052]
                      "
                    >
                      <RefreshCw
                        size={13}
                        className="
                          animate-spin
                        "
                      />

                      Atualizando status...
                    </p>
                  )}
                </div>


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
                    A confirmação do
                    pagamento é realizada
                    pelo Mercado Pago.
                  </p>
                </div>
              </div>
            )}


          {/*
           * =====================================
           * CARTÃO RECUSADO
           * =====================================
           */}

          {!carregandoPagina &&
            pedido &&
            !aprovado &&
            metodoEhCartao &&
            cartaoRecusado && (
              <div
                className="
                  space-y-4
                "
              >
                <div
                  className="
                    border
                    border-red-200
                    bg-red-50
                    px-5
                    py-4
                  "
                >
                  <div
                    className="
                      flex
                      items-start
                      gap-3
                    "
                  >
                    <CreditCard
                      size={20}
                      className="
                        mt-0.5
                        shrink-0
                        text-red-700
                      "
                    />


                    <div>
                      <p
                        className="
                          font-medium
                          text-red-800
                        "
                      >
                        Pagamento recusado
                      </p>


                      <p
                        className="
                          mt-2
                          text-sm
                          leading-6
                          text-red-700
                        "
                      >
                        Não foi possível
                        aprovar o pagamento
                        com este cartão.
                        Verifique os dados,
                        tente novamente ou
                        escolha outra forma
                        de pagamento.
                      </p>
                    </div>
                  </div>
                </div>


                <button
                  type="button"
                  onClick={
                    prepararNovaTentativaCartao
                  }
                  className="
                    w-full
                    bg-[#211C14]
                    px-5
                    py-4
                    text-sm
                    text-white
                    transition
                    hover:bg-[#968052]
                  "
                >
                  Tentar novamente com cartão
                </button>
              </div>
            )}


          {/*
           * =====================================
           * FORMULÁRIO DE CARTÃO
           * =====================================
           *
           * Um único componente agora trata:
           *
           * crédito
           * débito
           */}

          {!carregandoPagina &&
            pedido &&
            !aprovado &&
            metodoSelecionado ===
              "CARTAO" &&
            !cartaoEmAndamento &&
            !cartaoRecusado &&
            !pagamento && (
              <PagamentoCartao
                pedidoId={
                  pedidoId
                }

                valor={
                  pedido.valorTotal
                }

                onPagamentoCriado={(
                  novoPagamento
                ) => {
                  setErro(
                    ""
                  );


                  setPagamento(
                    novoPagamento
                  );


                  setMetodoSelecionado(
                    "CARTAO"
                  );
                }}
              />
            )}


          {/*
           * =====================================
           * PAGAMENTO APROVADO
           * =====================================
           */}

          {!carregandoPagina &&
            aprovado && (
              <div
                className="
                  space-y-6
                "
              >
                <div
                  className="
                    border-y
                    border-[#E9DCC4]
                    py-5
                    text-center
                  "
                >
                  <p
                    className="
                      text-xs
                      text-[#756C5C]
                    "
                  >
                    Status do pagamento
                  </p>


                  <p
                    className="
                      mt-2
                      text-lg
                      font-medium
                      text-green-700
                    "
                  >
                    APROVADO
                  </p>


                  {pagamento?.valor && (
                    <p
                      className="
                        mt-1
                        text-sm
                        text-[#756C5C]
                      "
                    >
                      {formatarPreco(
                        pagamento.valor
                      )}
                    </p>
                  )}
                </div>


                <div
                  className="
                    bg-green-50
                    p-4
                    text-center
                    text-sm
                    text-green-800
                  "
                >
                  Seu pedido foi confirmado.
                  Obrigado por comprar na
                  AURELIA!
                </div>
              </div>
            )}
        </section>
      </div>
    </main>
  );
}