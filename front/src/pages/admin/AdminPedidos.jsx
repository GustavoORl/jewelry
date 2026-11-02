import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  SlidersHorizontal,
  Eye,
  X,
  Package,
  Clock3,
  CheckCircle2,
  Truck,
  XCircle,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
  MapPin,
  ArrowRight,
  CreditCard,
  ShoppingBag,
} from "lucide-react";

import Sidebar from "../../components/admin/Sidebar.jsx";
import AdminHeader from "../../components/admin/AdminHeader.jsx";

import {
  apiFetch,
} from "../../services/api.js";


/**
 * =========================================
 * CONFIGURAÇÃO DOS STATUS
 * =========================================
 */

const statusConfig = {
  PENDENTE: {
    label: "Pendente",
    className:
      "bg-[#f7efdc] text-[#8b6c2f]",
    icon: Clock3,
  },

  PAGO: {
    label: "Pago",
    className:
      "bg-[#e9f2e7] text-[#54764c]",
    icon: CheckCircle2,
  },

  EM_PREPARACAO: {
    label: "Em preparação",
    className:
      "bg-[#f2e9dc] text-[#987344]",
    icon: Package,
  },

  ENVIADO: {
    label: "Enviado",
    className:
      "bg-[#e7eef5] text-[#4f6e8b]",
    icon: Truck,
  },

  ENTREGUE: {
    label: "Entregue",
    className:
      "bg-[#e5f0e8] text-[#47775a]",
    icon: CheckCircle2,
  },

  CANCELADO: {
    label: "Cancelado",
    className:
      "bg-[#f7e8e4] text-[#a25549]",
    icon: XCircle,
  },
};


/**
 * =========================================
 * FILTROS
 * =========================================
 */

const filtros = [
  "TODOS",
  "PENDENTE",
  "PAGO",
  "EM_PREPARACAO",
  "ENVIADO",
  "ENTREGUE",
  "CANCELADO",
];


/**
 * =========================================
 * FLUXO DOS PEDIDOS
 * =========================================
 *
 * IMPORTANTE:
 *
 * PENDENTE -> PAGO
 *
 * NÃO é realizado manualmente pelo admin.
 *
 * Essa mudança deve acontecer somente
 * depois da confirmação do pagamento.
 *
 *
 * Fluxo administrativo:
 *
 * PAGO
 *      ↓
 * EM_PREPARACAO
 *      ↓
 * ENVIADO
 *      ↓
 * ENTREGUE
 */

const proximoStatus = {
  PENDENTE: null,

  PAGO:
    "EM_PREPARACAO",

  EM_PREPARACAO:
    "ENVIADO",

  ENVIADO:
    "ENTREGUE",

  ENTREGUE:
    null,

  CANCELADO:
    null,
};


/**
 * =========================================
 * CONFIGURAÇÃO DAS AÇÕES
 * =========================================
 */

const acaoStatusConfig = {
  EM_PREPARACAO: {
    label:
      "Iniciar preparação",

    descricao:
      "O pedido será marcado como em preparação.",

    icon:
      Package,
  },

  ENVIADO: {
    label:
      "Marcar como enviado",

    descricao:
      "O cliente verá que o pedido foi enviado.",

    icon:
      Truck,
  },

  ENTREGUE: {
    label:
      "Marcar como entregue",

    descricao:
      "O pedido será finalizado como entregue.",

    icon:
      CheckCircle2,
  },
};


/**
 * =========================================
 * FORMATADORES
 * =========================================
 */

const moeda = (
  valor
) =>
  Number(
    valor || 0
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );


function formatarData(
  data
) {
  if (!data) {
    return "—";
  }


  const dataConvertida =
    new Date(data);


  if (
    Number.isNaN(
      dataConvertida.getTime()
    )
  ) {
    return "—";
  }


  return dataConvertida
    .toLocaleDateString(
      "pt-BR"
    );
}


function formatarHorario(
  data
) {
  if (!data) {
    return "—";
  }


  const dataConvertida =
    new Date(data);


  if (
    Number.isNaN(
      dataConvertida.getTime()
    )
  ) {
    return "—";
  }


  return dataConvertida
    .toLocaleTimeString(
      "pt-BR",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
}


function formatarIdPedido(
  id
) {
  if (!id) {
    return "—";
  }


  return id
    .slice(-8)
    .toUpperCase();
}


/**
 * =========================================
 * PAGAMENTO
 * =========================================
 */

function nomeMetodoPagamento(
  metodo
) {
  switch (metodo) {
    case "PIX":
      return "Pix";

    case "CREDITO":
      return "Cartão de crédito";

    case "BOLETO":
      return "Boleto";

    default:
      return "Não informado";
  }
}


function nomeStatusPagamento(
  status
) {
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


/**
 * =========================================
 * STATUS BADGE
 * =========================================
 */

function StatusBadge({
  status,
}) {
  const config =
    statusConfig[
      status
    ] ??
    statusConfig.PENDENTE;


  const Icon =
    config.icon;


  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        whitespace-nowrap
        rounded-full
        px-2.5
        py-1
        text-[10px]
        font-medium
        ${config.className}
      `}
    >
      <Icon
        size={12}
      />

      {config.label}
    </span>
  );
}


/**
 * =========================================
 * ADMIN PEDIDOS
 * =========================================
 */

export default function AdminPedidos() {
  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);


  const [
    pedidos,
    setPedidos,
  ] = useState([]);


  const [
    busca,
    setBusca,
  ] = useState("");


  const [
    filtroStatus,
    setFiltroStatus,
  ] = useState(
    "TODOS"
  );


  const [
    pedidoSelecionado,
    setPedidoSelecionado,
  ] = useState(null);


  const [
    carregando,
    setCarregando,
  ] = useState(true);


  const [
    atualizando,
    setAtualizando,
  ] = useState(false);


  const [
    filtroAberto,
    setFiltroAberto,
  ] = useState(false);


  const [
    erro,
    setErro,
  ] = useState("");


  const [
    erroAtualizacao,
    setErroAtualizacao,
  ] = useState("");


  const [
    sucesso,
    setSucesso,
  ] = useState("");


  /**
   * =========================================
   * CARREGAR PEDIDOS
   * =========================================
   */

  const carregarPedidos =
    useCallback(
      async () => {
        try {
          setCarregando(
            true
          );

          setErro("");


          const resposta =
            await apiFetch(
              "/admin/pedidos"
            );


          setPedidos(
            resposta?.pedidos ??
              []
          );
        } catch (error) {
          console.error(
            "Erro ao carregar pedidos:",
            error
          );


          setErro(
            error.message ||
              "Não foi possível carregar os pedidos."
          );
        } finally {
          setCarregando(
            false
          );
        }
      },
      []
    );


  useEffect(
    () => {
      carregarPedidos();
    },
    [
      carregarPedidos,
    ]
  );


  /**
   * =========================================
   * FILTRO
   * =========================================
   */

  const pedidosFiltrados =
    useMemo(
      () => {
        const termo =
          busca
            .trim()
            .toLocaleLowerCase(
              "pt-BR"
            );


        return pedidos.filter(
          (
            pedido
          ) => {
            const nome =
              pedido.usuario
                ?.nome ??
              "";


            const email =
              pedido.usuario
                ?.email ??
              "";


            const correspondeBusca =
              !termo ||
              pedido.id
                .toLocaleLowerCase(
                  "pt-BR"
                )
                .includes(
                  termo
                ) ||
              nome
                .toLocaleLowerCase(
                  "pt-BR"
                )
                .includes(
                  termo
                ) ||
              email
                .toLocaleLowerCase(
                  "pt-BR"
                )
                .includes(
                  termo
                );


            const correspondeStatus =
              filtroStatus ===
                "TODOS" ||
              pedido.status ===
                filtroStatus;


            return (
              correspondeBusca &&
              correspondeStatus
            );
          }
        );
      },
      [
        pedidos,
        busca,
        filtroStatus,
      ]
    );


  /**
   * =========================================
   * CONTAGEM
   * =========================================
   */

  const contagem = (
    status
  ) =>
    pedidos.filter(
      (
        pedido
      ) =>
        status ===
          "TODOS" ||
        pedido.status ===
          status
    ).length;


  /**
   * =========================================
   * ATUALIZAR STATUS
   * =========================================
   */

  async function atualizarStatus(
    pedidoId,
    novoStatus
  ) {
    if (
      atualizando
    ) {
      return;
    }


    const pedidoAtual =
      pedidos.find(
        (
          pedido
        ) =>
          pedido.id ===
          pedidoId
      );


    if (!pedidoAtual) {
      setErroAtualizacao(
        "Pedido não encontrado."
      );

      return;
    }


    /**
     * Validação também no frontend.
     *
     * IMPORTANTE:
     * essa mesma regra deverá existir
     * no backend.
     */

    const statusPermitido =
      proximoStatus[
        pedidoAtual.status
      ];


    if (
      statusPermitido !==
      novoStatus
    ) {
      setErroAtualizacao(
        "Esta alteração de status não é permitida."
      );

      return;
    }


    try {
      setAtualizando(
        true
      );

      setErroAtualizacao(
        ""
      );

      setSucesso("");


      const resposta =
        await apiFetch(
          `/admin/pedidos/${pedidoId}/status`,
          {
            method:
              "PATCH",

            body:
              JSON.stringify({
                status:
                  novoStatus,
              }),
          }
        );


      /**
       * Preferimos o pedido retornado
       * pelo backend.
       *
       * Caso o endpoint ainda não devolva
       * pedido, usamos o status solicitado
       * como fallback.
       */

      const pedidoAtualizado =
        resposta?.pedido ??
        {
          id:
            pedidoId,

          status:
            novoStatus,
        };


      setPedidos(
        (
          atuais
        ) =>
          atuais.map(
            (
              pedido
            ) =>
              pedido.id ===
              pedidoId
                ? {
                    ...pedido,
                    ...pedidoAtualizado,
                  }
                : pedido
          )
      );


      setPedidoSelecionado(
        (
          atual
        ) =>
          atual?.id ===
          pedidoId
            ? {
                ...atual,
                ...pedidoAtualizado,
              }
            : atual
      );


      setSucesso(
        "Status do pedido atualizado com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao atualizar status:",
        error
      );


      setErroAtualizacao(
        error.message ||
          "Não foi possível atualizar o pedido."
      );
    } finally {
      setAtualizando(
        false
      );
    }
  }


  /**
   * =========================================
   * RENDER
   * =========================================
   */

  return (
    <div
      className="
        min-h-screen
        bg-[#f8f3e8]
        text-[#211c14]
      "
    >
      <Sidebar
        mobileOpen={
          mobileOpen
        }
        onClose={() =>
          setMobileOpen(
            false
          )
        }
      />


      <main
        className="
          min-w-0
          lg:ml-[258px]
        "
      >
        <AdminHeader
          title="Pedidos"
          subtitle="Acompanhe e gerencie os pedidos da AURELIA."
          onMenuClick={() =>
            setMobileOpen(
              true
            )
          }
        />


        <div
          className="
            mx-auto
            max-w-[1500px]
            space-y-6
            p-4
            sm:p-6
            lg:p-8
          "
        >

          {/**
           * ===================================
           * INTRODUÇÃO
           * ===================================
           */}

          <section
            className="
              flex
              flex-col
              justify-between
              gap-4
              sm:flex-row
              sm:items-end
            "
          >
            <div>
              <p
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.22em]
                  text-[#968052]
                "
              >
                Operação da loja
              </p>


              <h2
                className="
                  mt-2
                  font-serif
                  text-2xl
                  text-[#211c14]
                  sm:text-3xl
                "
              >
                Gestão de pedidos
              </h2>


              <p
                className="
                  mt-2
                  max-w-xl
                  text-sm
                  leading-6
                  text-[#817664]
                "
              >
                Consulte compras, acompanhe
                pagamentos e atualize o
                andamento de cada pedido.
              </p>
            </div>


            <button
              type="button"
              onClick={
                carregarPedidos
              }
              disabled={
                carregando
              }
              className="
                inline-flex
                items-center
                gap-2
                self-start
                rounded-xl
                border
                border-[#e9dcc4]
                bg-[#fcfaf5]
                px-3.5
                py-2.5
                text-xs
                text-[#756b5a]
                transition
                hover:bg-[#f1e8d8]
                disabled:opacity-50
                sm:self-auto
              "
            >
              <RefreshCw
                size={14}
                className={
                  carregando
                    ? "animate-spin"
                    : ""
                }
              />

              Atualizar pedidos
            </button>
          </section>


          {/**
           * ===================================
           * INDICADORES
           * ===================================
           */}

          <section
            className="
              grid
              grid-cols-2
              gap-3
              xl:grid-cols-4
            "
          >
            <SummaryCard
              label="Total de pedidos"
              value={
                pedidos.length
              }
              helper="Pedidos registrados"
              icon={
                ShoppingBag
              }
            />


            <SummaryCard
              label="Aguardando"
              value={
                contagem(
                  "PENDENTE"
                )
              }
              helper="Aguardando pagamento"
              icon={
                Clock3
              }
            />


            <SummaryCard
              label="Em preparação"
              value={
                contagem(
                  "EM_PREPARACAO"
                )
              }
              helper="Pedidos em separação"
              icon={
                Package
              }
            />


            <SummaryCard
              label="Enviados"
              value={
                contagem(
                  "ENVIADO"
                )
              }
              helper="A caminho dos clientes"
              icon={
                Truck
              }
            />
          </section>


          {/**
           * ===================================
           * ERRO
           * ===================================
           */}

          {erro && (
            <div
              className="
                flex
                flex-col
                gap-3
                rounded-xl
                border
                border-red-200
                bg-red-50
                p-4
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  text-red-700
                "
              >
                <AlertCircle
                  size={18}
                />

                {erro}
              </div>


              <button
                type="button"
                onClick={
                  carregarPedidos
                }
                className="
                  text-xs
                  font-semibold
                  text-red-700
                  underline
                "
              >
                Tentar novamente
              </button>
            </div>
          )}


          {/**
           * ===================================
           * SUCESSO
           * ===================================
           */}

          {sucesso && (
            <div
              className="
                flex
                items-center
                justify-between
                rounded-xl
                border
                border-green-200
                bg-green-50
                p-4
                text-sm
                text-green-700
              "
            >
              <span>
                {sucesso}
              </span>


              <button
                type="button"
                onClick={() =>
                  setSucesso("")
                }
                aria-label="Fechar mensagem"
              >
                <X
                  size={16}
                />
              </button>
            </div>
          )}


          {/**
           * ===================================
           * TABELA
           * ===================================
           */}

          <section
            className="
              overflow-hidden
              rounded-2xl
              border
              border-[#e9dcc4]
              bg-[#fcfaf5]
              shadow-[0_4px_20px_rgba(33,28,20,0.025)]
            "
          >

            {/**
             * Cabeçalho
             */}

            <div
              className="
                flex
                flex-col
                gap-4
                border-b
                border-[#eee5d5]
                p-4
                sm:p-5
                lg:flex-row
                lg:items-center
                lg:justify-between
              "
            >
              <div>
                <h3
                  className="
                    font-serif
                    text-lg
                    text-[#292319]
                  "
                >
                  Todos os pedidos
                </h3>


                <p
                  className="
                    mt-1
                    text-xs
                    text-[#968b78]
                  "
                >
                  {
                    pedidosFiltrados.length
                  }{" "}
                  resultado(s) encontrado(s)
                </p>
              </div>


              <div
                className="
                  flex
                  flex-col
                  gap-2
                  sm:flex-row
                "
              >

                {/**
                 * BUSCA
                 */}

                <label
                  className="
                    flex
                    min-w-0
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-[#e9dcc4]
                    bg-white/70
                    px-3
                    py-2.5
                    sm:w-64
                  "
                >
                  <Search
                    size={16}
                    className="
                      shrink-0
                      text-[#968052]
                    "
                  />


                  <input
                    value={
                      busca
                    }
                    onChange={(
                      event
                    ) =>
                      setBusca(
                        event.target.value
                      )
                    }
                    placeholder="Buscar pedido ou cliente..."
                    aria-label="Buscar pedido ou cliente"
                    className="
                      min-w-0
                      flex-1
                      bg-transparent
                      text-xs
                      outline-none
                      placeholder:text-[#a59a87]
                    "
                  />


                  {busca && (
                    <button
                      type="button"
                      onClick={() =>
                        setBusca(
                          ""
                        )
                      }
                      aria-label="Limpar busca"
                      className="
                        text-[#968b78]
                        hover:text-[#211c14]
                      "
                    >
                      <X
                        size={14}
                      />
                    </button>
                  )}
                </label>


                {/**
                 * FILTRO
                 */}

                <button
                  type="button"
                  onClick={() =>
                    setFiltroAberto(
                      (
                        aberto
                      ) =>
                        !aberto
                    )
                  }
                  className={`
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    px-3.5
                    py-2.5
                    text-xs
                    transition

                    ${
                      filtroAberto
                        ? `
                            border-[#b9975b]
                            bg-[#f7f1e6]
                            text-[#75613b]
                          `
                        : `
                            border-[#e9dcc4]
                            text-[#6e6659]
                            hover:bg-[#f7f1e6]
                          `
                    }
                  `}
                >
                  <SlidersHorizontal
                    size={15}
                  />

                  Filtrar status
                </button>
              </div>


              {filtroAberto && (
                <div
                  className="
                    flex
                    flex-wrap
                    gap-2
                    lg:ml-auto
                  "
                >
                  {filtros.map(
                    (
                      filtro
                    ) => (
                      <button
                        key={
                          filtro
                        }
                        type="button"
                        onClick={() =>
                          setFiltroStatus(
                            filtro
                          )
                        }
                        className={`
                          rounded-full
                          border
                          px-3
                          py-1.5
                          text-[11px]
                          transition

                          ${
                            filtroStatus ===
                            filtro
                              ? `
                                  border-[#211c14]
                                  bg-[#211c14]
                                  text-[#fcfaf5]
                                `
                              : `
                                  border-[#e9dcc4]
                                  text-[#756b5a]
                                  hover:bg-[#f7f1e6]
                                `
                          }
                        `}
                      >
                        {filtro ===
                        "TODOS"
                          ? "Todos"
                          : statusConfig[
                              filtro
                            ]
                              .label}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>


            {/**
             * =================================
             * FILTROS RÁPIDOS
             * =================================
             */}

            <div
              className="
                flex
                gap-2
                overflow-x-auto
                border-b
                border-[#eee5d5]
                px-4
                py-3
                sm:px-5
              "
            >
              {[
                "TODOS",
                "PENDENTE",
                "PAGO",
                "EM_PREPARACAO",
                "ENVIADO",
                "ENTREGUE",
              ].map(
                (
                  filtro
                ) => (
                  <button
                    key={
                      filtro
                    }
                    type="button"
                    onClick={() =>
                      setFiltroStatus(
                        filtro
                      )
                    }
                    className={`
                      whitespace-nowrap
                      rounded-lg
                      px-3
                      py-2
                      text-[11px]
                      transition

                      ${
                        filtroStatus ===
                        filtro
                          ? `
                              bg-[#eee5d5]
                              font-semibold
                              text-[#5e4c2d]
                            `
                          : `
                              text-[#8c816f]
                              hover:bg-[#f7f1e6]
                              hover:text-[#211c14]
                            `
                      }
                    `}
                  >
                    {filtro ===
                    "TODOS"
                      ? "Todos"
                      : statusConfig[
                          filtro
                        ]
                          .label}


                    <span
                      className="
                        ml-2
                        text-[10px]
                        opacity-70
                      "
                    >
                      {contagem(
                        filtro
                      )}
                    </span>
                  </button>
                )
              )}
            </div>


            {/**
             * =================================
             * TABELA
             * =================================
             */}

            <div
              className="
                overflow-x-auto
              "
            >
              <table
                className="
                  w-full
                  min-w-[850px]
                  border-collapse
                  text-left
                "
              >
                <thead>
                  <tr
                    className="
                      bg-[#f8f3e8]/70
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-[0.12em]
                      text-[#a09582]
                    "
                  >
                    <th
                      className="
                        px-5
                        py-4
                      "
                    >
                      Pedido
                    </th>

                    <th
                      className="
                        px-5
                        py-4
                      "
                    >
                      Cliente
                    </th>

                    <th
                      className="
                        px-5
                        py-4
                      "
                    >
                      Data
                    </th>

                    <th
                      className="
                        px-5
                        py-4
                      "
                    >
                      Itens
                    </th>

                    <th
                      className="
                        px-5
                        py-4
                      "
                    >
                      Total
                    </th>

                    <th
                      className="
                        px-5
                        py-4
                      "
                    >
                      Status
                    </th>

                    <th
                      className="
                        px-5
                        py-4
                        text-right
                      "
                    >
                      Ação
                    </th>
                  </tr>
                </thead>


                <tbody
                  className="
                    divide-y
                    divide-[#f0e8da]
                  "
                >
                  {carregando ? (
                    <tr>
                      <td
                        colSpan={
                          7
                        }
                        className="
                          px-5
                          py-16
                          text-center
                        "
                      >
                        <LoaderCircle
                          size={28}
                          className="
                            mx-auto
                            animate-spin
                            text-[#968052]
                          "
                        />

                        <p
                          className="
                            mt-3
                            text-xs
                            text-[#968b78]
                          "
                        >
                          Carregando pedidos...
                        </p>
                      </td>
                    </tr>
                  ) : (
                    pedidosFiltrados.map(
                      (
                        pedido
                      ) => {
                        const itens =
                          Array.isArray(
                            pedido.itens
                          )
                            ? pedido.itens
                            : [];


                        const quantidadeItens =
                          itens.reduce(
                            (
                              total,
                              item
                            ) =>
                              total +
                              Number(
                                item.quantidade ||
                                  0
                              ),
                            0
                          );


                        return (
                          <tr
                            key={
                              pedido.id
                            }
                            className="
                              transition
                              hover:bg-[#faf6ee]
                            "
                          >
                            <td
                              className="
                                px-5
                                py-4
                              "
                            >
                              <p
                                className="
                                  text-xs
                                  font-semibold
                                  text-[#393024]
                                "
                                title={
                                  pedido.id
                                }
                              >
                                #
                                {formatarIdPedido(
                                  pedido.id
                                )}
                              </p>

                              <p
                                className="
                                  mt-1
                                  text-[10px]
                                  text-[#a09582]
                                "
                              >
                                {formatarHorario(
                                  pedido.criadoEm
                                )}
                              </p>
                            </td>


                            <td
                              className="
                                px-5
                                py-4
                              "
                            >
                              <p
                                className="
                                  text-xs
                                  font-medium
                                  text-[#393024]
                                "
                              >
                                {pedido
                                  .usuario
                                  ?.nome ??
                                  "Cliente não identificado"}
                              </p>

                              <p
                                className="
                                  mt-1
                                  text-[10px]
                                  text-[#a09582]
                                "
                              >
                                {pedido
                                  .usuario
                                  ?.email ??
                                  "—"}
                              </p>
                            </td>


                            <td
                              className="
                                px-5
                                py-4
                                text-xs
                                text-[#756b5a]
                              "
                            >
                              {formatarData(
                                pedido.criadoEm
                              )}
                            </td>


                            <td
                              className="
                                px-5
                                py-4
                                text-xs
                                text-[#756b5a]
                              "
                            >
                              {quantidadeItens}{" "}
                              {quantidadeItens ===
                              1
                                ? "item"
                                : "itens"}
                            </td>


                            <td
                              className="
                                px-5
                                py-4
                                text-xs
                                font-semibold
                                text-[#393024]
                              "
                            >
                              {moeda(
                                pedido.valorTotal
                              )}
                            </td>


                            <td
                              className="
                                px-5
                                py-4
                              "
                            >
                              <StatusBadge
                                status={
                                  pedido.status
                                }
                              />
                            </td>


                            <td
                              className="
                                px-5
                                py-4
                                text-right
                              "
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setErroAtualizacao(
                                    ""
                                  );

                                  setSucesso(
                                    ""
                                  );

                                  setPedidoSelecionado(
                                    pedido
                                  );
                                }}
                                aria-label="Ver detalhes do pedido"
                                className="
                                  inline-flex
                                  items-center
                                  gap-1.5
                                  rounded-lg
                                  border
                                  border-[#e9dcc4]
                                  px-3
                                  py-2
                                  text-[11px]
                                  text-[#75613b]
                                  transition
                                  hover:border-[#b9975b]
                                  hover:bg-[#f7f1e6]
                                "
                              >
                                <Eye
                                  size={14}
                                />

                                Detalhes
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    )
                  )}


                  {!carregando &&
                    pedidosFiltrados.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan={
                            7
                          }
                          className="
                            px-5
                            py-14
                            text-center
                          "
                        >
                          <Package
                            size={28}
                            className="
                              mx-auto
                              text-[#c2b49b]
                            "
                          />


                          <p
                            className="
                              mt-3
                              text-sm
                              font-medium
                              text-[#756b5a]
                            "
                          >
                            Nenhum pedido encontrado
                          </p>


                          <p
                            className="
                              mt-1
                              text-xs
                              text-[#a09582]
                            "
                          >
                            Tente alterar a busca
                            ou o filtro selecionado.
                          </p>


                          <button
                            type="button"
                            onClick={() => {
                              setBusca(
                                ""
                              );

                              setFiltroStatus(
                                "TODOS"
                              );
                            }}
                            className="
                              mt-3
                              text-xs
                              font-medium
                              text-[#8b754d]
                              underline
                              underline-offset-4
                            "
                          >
                            Limpar filtros
                          </button>
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>


            <div
              className="
                border-t
                border-[#eee5d5]
                px-4
                py-4
                sm:px-5
              "
            >
              <p
                className="
                  text-[11px]
                  text-[#968b78]
                "
              >
                Exibindo{" "}
                {
                  pedidosFiltrados.length
                }{" "}
                de{" "}
                {pedidos.length}{" "}
                pedidos
              </p>
            </div>
          </section>
        </div>
      </main>


      {/**
       * =====================================
       * MODAL
       * =====================================
       */}

      {pedidoSelecionado &&
        (() => {
          const itens =
            Array.isArray(
              pedidoSelecionado.itens
            )
              ? pedidoSelecionado.itens
              : [];


          const pagamentos =
            Array.isArray(
              pedidoSelecionado.pagamentos
            )
              ? pedidoSelecionado.pagamentos
              : [];


          const pagamentoAprovado =
            pagamentos.find(
              (
                pagamento
              ) =>
                pagamento.status ===
                "APROVADO"
            );


          const ultimoPagamento =
            pagamentoAprovado ||
            pagamentos[
              pagamentos.length -
                1
            ] ||
            null;


          const proximo =
            proximoStatus[
              pedidoSelecionado.status
            ];


          const acao =
            proximo
              ? acaoStatusConfig[
                  proximo
                ]
              : null;


          const AcaoIcon =
            acao?.icon;


          return (
            <div
              className="
                fixed
                inset-0
                z-[60]
                flex
                items-center
                justify-center
                bg-[#211c14]/40
                p-3
                backdrop-blur-[2px]
                sm:p-6
              "
              onMouseDown={(
                event
              ) => {
                if (
                  event.target ===
                    event.currentTarget &&
                  !atualizando
                ) {
                  setPedidoSelecionado(
                    null
                  );
                }
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="pedido-modal-title"
                className="
                  max-h-[90vh]
                  w-full
                  max-w-2xl
                  overflow-y-auto
                  rounded-2xl
                  border
                  border-[#e9dcc4]
                  bg-[#fcfaf5]
                  shadow-2xl
                "
              >

                {/**
                 * =============================
                 * CABEÇALHO
                 * =============================
                 */}

                <div
                  className="
                    flex
                    items-start
                    justify-between
                    border-b
                    border-[#eee5d5]
                    p-5
                    sm:p-6
                  "
                >
                  <div>
                    <p
                      className="
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-[0.2em]
                        text-[#968052]
                      "
                    >
                      Detalhes do pedido
                    </p>


                    <h2
                      id="pedido-modal-title"
                      className="
                        mt-2
                        font-serif
                        text-2xl
                        text-[#211c14]
                      "
                      title={
                        pedidoSelecionado.id
                      }
                    >
                      #
                      {formatarIdPedido(
                        pedidoSelecionado.id
                      )}
                    </h2>


                    <p
                      className="
                        mt-1
                        text-xs
                        text-[#968b78]
                      "
                    >
                      Criado em{" "}
                      {formatarData(
                        pedidoSelecionado.criadoEm
                      )}
                      , às{" "}
                      {formatarHorario(
                        pedidoSelecionado.criadoEm
                      )}
                    </p>
                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      setPedidoSelecionado(
                        null
                      )
                    }
                    disabled={
                      atualizando
                    }
                    aria-label="Fechar detalhes"
                    className="
                      rounded-lg
                      p-2
                      text-[#756b5a]
                      transition
                      hover:bg-[#f2ecdf]
                      disabled:opacity-50
                    "
                  >
                    <X
                      size={19}
                    />
                  </button>
                </div>


                <div
                  className="
                    space-y-6
                    p-5
                    sm:p-6
                  "
                >

                  {/**
                   * STATUS E VALOR
                   */}

                  <div
                    className="
                      flex
                      flex-wrap
                      items-center
                      justify-between
                      gap-3
                    "
                  >
                    <StatusBadge
                      status={
                        pedidoSelecionado.status
                      }
                    />


                    <p
                      className="
                        text-lg
                        font-semibold
                        text-[#211c14]
                      "
                    >
                      {moeda(
                        pedidoSelecionado.valorTotal
                      )}
                    </p>
                  </div>


                  {/**
                   * =============================
                   * CLIENTE
                   * =============================
                   */}

                  <div>
                    <h3
                      className="
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-[0.15em]
                        text-[#a09582]
                      "
                    >
                      Dados do cliente
                    </h3>


                    <p
                      className="
                        mt-2
                        text-sm
                        font-medium
                        text-[#393024]
                      "
                    >
                      {pedidoSelecionado
                        .usuario
                        ?.nome ??
                        "Não informado"}
                    </p>


                    <p
                      className="
                        mt-1
                        break-all
                        text-xs
                        text-[#817664]
                      "
                    >
                      {pedidoSelecionado
                        .usuario
                        ?.email ??
                        "Não informado"}
                    </p>
                  </div>


                  {/**
                   * =============================
                   * ENDEREÇO
                   * =============================
                   */}

                  <div>
                    <h3
                      className="
                        flex
                        items-center
                        gap-2
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-[0.15em]
                        text-[#a09582]
                      "
                    >
                      <MapPin
                        size={14}
                      />

                      Endereço de entrega
                    </h3>


                    <p
                      className="
                        mt-2
                        text-sm
                        leading-6
                        text-[#756b5a]
                      "
                    >
                      {
                        pedidoSelecionado.destinatario
                      }

                      <br />

                      {
                        pedidoSelecionado.ruaEntrega
                      }
                      ,{" "}
                      {
                        pedidoSelecionado.numeroEntrega
                      }

                      {pedidoSelecionado.complementoEntrega
                        ? ` - ${pedidoSelecionado.complementoEntrega}`
                        : ""}

                      <br />

                      {
                        pedidoSelecionado.bairroEntrega
                      }

                      <br />

                      {
                        pedidoSelecionado.cidadeEntrega
                      }{" "}
                      -{" "}
                      {
                        pedidoSelecionado.estadoEntrega
                      }

                      <br />

                      CEP:{" "}
                      {
                        pedidoSelecionado.cepEntrega
                      }
                    </p>
                  </div>


                  {/**
                   * =============================
                   * PAGAMENTO
                   * =============================
                   */}

                  <div>
                    <h3
                      className="
                        flex
                        items-center
                        gap-2
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-[0.15em]
                        text-[#a09582]
                      "
                    >
                      <CreditCard
                        size={14}
                      />

                      Pagamento
                    </h3>


                    <div
                      className="
                        mt-3
                        rounded-xl
                        border
                        border-[#e9dcc4]
                        bg-white/60
                        p-4
                      "
                    >
                      {ultimoPagamento ? (
                        <div
                          className="
                            flex
                            flex-col
                            gap-3
                            sm:flex-row
                            sm:items-center
                            sm:justify-between
                          "
                        >
                          <div>
                            <p
                              className="
                                text-xs
                                font-medium
                                text-[#393024]
                              "
                            >
                              {nomeMetodoPagamento(
                                ultimoPagamento.metodo
                              )}
                            </p>

                            <p
                              className="
                                mt-1
                                text-[10px]
                                text-[#968b78]
                              "
                            >
                              Status:{" "}
                              {nomeStatusPagamento(
                                ultimoPagamento.status
                              )}
                            </p>
                          </div>


                          <p
                            className="
                              text-sm
                              font-semibold
                              text-[#393024]
                            "
                          >
                            {moeda(
                              ultimoPagamento.valor ||
                                pedidoSelecionado.valorTotal
                            )}
                          </p>
                        </div>
                      ) : (
                        <div
                          className="
                            flex
                            items-start
                            gap-2
                          "
                        >
                          <Clock3
                            size={17}
                            className="
                              mt-0.5
                              text-[#968052]
                            "
                          />

                          <p
                            className="
                              text-xs
                              leading-5
                              text-[#817664]
                            "
                          >
                            Nenhum pagamento
                            registrado para este
                            pedido.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>


                  {/**
                   * =============================
                   * PRODUTOS
                   * =============================
                   */}

                  <div>
                    <h3
                      className="
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-[0.15em]
                        text-[#a09582]
                      "
                    >
                      Itens do pedido
                    </h3>


                    <div
                      className="
                        mt-3
                        divide-y
                        divide-[#eee5d5]
                        rounded-xl
                        border
                        border-[#e9dcc4]
                        px-4
                      "
                    >
                      {itens.length ===
                      0 ? (
                        <div
                          className="
                            py-5
                            text-center
                            text-xs
                            text-[#968b78]
                          "
                        >
                          Nenhum item encontrado.
                        </div>
                      ) : (
                        itens.map(
                          (
                            item
                          ) => (
                            <div
                              key={
                                item.id
                              }
                              className="
                                flex
                                items-center
                                justify-between
                                gap-3
                                py-3
                              "
                            >
                              <div>
                                <p
                                  className="
                                    text-xs
                                    font-medium
                                    text-[#393024]
                                  "
                                >
                                  {
                                    item.nomeProduto
                                  }
                                </p>

                                <p
                                  className="
                                    mt-1
                                    text-[10px]
                                    text-[#968b78]
                                  "
                                >
                                  Quantidade:{" "}
                                  {
                                    item.quantidade
                                  }
                                </p>

                                <p
                                  className="
                                    mt-1
                                    text-[10px]
                                    text-[#968b78]
                                  "
                                >
                                  Unitário:{" "}
                                  {moeda(
                                    item.precoUnitario
                                  )}
                                </p>
                              </div>


                              <p
                                className="
                                  whitespace-nowrap
                                  text-xs
                                  font-medium
                                  text-[#393024]
                                "
                              >
                                {moeda(
                                  Number(
                                    item.precoUnitario ||
                                      0
                                  ) *
                                    Number(
                                      item.quantidade ||
                                        0
                                    )
                                )}
                              </p>
                            </div>
                          )
                        )
                      )}
                    </div>


                    <div
                      className="
                        mt-3
                        flex
                        justify-between
                        rounded-xl
                        bg-[#f1e8d8]
                        p-4
                      "
                    >
                      <span
                        className="
                          text-xs
                          font-medium
                          text-[#756b5a]
                        "
                      >
                        Total do pedido
                      </span>

                      <span
                        className="
                          text-sm
                          font-semibold
                          text-[#211c14]
                        "
                      >
                        {moeda(
                          pedidoSelecionado.valorTotal
                        )}
                      </span>
                    </div>
                  </div>


                  {/**
                   * =============================
                   * GERENCIAMENTO DO STATUS
                   * =============================
                   */}

                  <div
                    className="
                      border-t
                      border-[#eee5d5]
                      pt-6
                    "
                  >
                    <h3
                      className="
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-[0.15em]
                        text-[#a09582]
                      "
                    >
                      Andamento do pedido
                    </h3>


                    <div
                      className="
                        mt-3
                        rounded-xl
                        border
                        border-[#e9dcc4]
                        bg-white/60
                        p-4
                      "
                    >
                      <p
                        className="
                          text-[10px]
                          uppercase
                          tracking-wider
                          text-[#968b78]
                        "
                      >
                        Status atual
                      </p>


                      <div
                        className="
                          mt-2
                        "
                      >
                        <StatusBadge
                          status={
                            pedidoSelecionado.status
                          }
                        />
                      </div>
                    </div>


                    {/**
                     * PENDENTE
                     */}

                    {pedidoSelecionado.status ===
                      "PENDENTE" && (
                      <div
                        className="
                          mt-4
                          rounded-xl
                          border
                          border-amber-200
                          bg-amber-50
                          p-4
                        "
                      >
                        <div
                          className="
                            flex
                            items-start
                            gap-3
                          "
                        >
                          <Clock3
                            size={18}
                            className="
                              mt-0.5
                              shrink-0
                              text-amber-700
                            "
                          />

                          <div>
                            <p
                              className="
                                text-xs
                                font-semibold
                                text-amber-800
                              "
                            >
                              Aguardando pagamento
                            </p>

                            <p
                              className="
                                mt-1
                                text-[11px]
                                leading-5
                                text-amber-700
                              "
                            >
                              Este status não pode
                              ser alterado
                              manualmente. O pedido
                              será marcado como pago
                              automaticamente após a
                              confirmação do
                              pagamento.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}


                    {/**
                     * PRÓXIMA ETAPA
                     */}

                    {proximo &&
                      acao &&
                      AcaoIcon && (
                        <div
                          className="
                            mt-4
                          "
                        >
                          <div
                            className="
                              mb-3
                              flex
                              items-center
                              gap-3
                            "
                          >
                            <div
                              className="
                                flex
                                h-8
                                w-8
                                items-center
                                justify-center
                                rounded-full
                                bg-[#f1e8d8]
                                text-[#8b754d]
                              "
                            >
                              <ArrowRight
                                size={15}
                              />
                            </div>

                            <div>
                              <p
                                className="
                                  text-xs
                                  font-medium
                                  text-[#393024]
                                "
                              >
                                Próxima etapa
                              </p>

                              <p
                                className="
                                  mt-0.5
                                  text-[10px]
                                  text-[#968b78]
                                "
                              >
                                {
                                  acao.descricao
                                }
                              </p>
                            </div>
                          </div>


                          <button
                            type="button"
                            disabled={
                              atualizando
                            }
                            onClick={() =>
                              atualizarStatus(
                                pedidoSelecionado.id,
                                proximo
                              )
                            }
                            className="
                              flex
                              w-full
                              items-center
                              justify-center
                              gap-2
                              rounded-xl
                              bg-[#211c14]
                              px-5
                              py-3.5
                              text-xs
                              font-medium
                              text-[#fcfaf5]
                              transition
                              hover:bg-[#403629]
                              disabled:cursor-not-allowed
                              disabled:opacity-50
                            "
                          >
                            {atualizando ? (
                              <>
                                <LoaderCircle
                                  size={16}
                                  className="
                                    animate-spin
                                  "
                                />

                                Atualizando...
                              </>
                            ) : (
                              <>
                                <AcaoIcon
                                  size={16}
                                />

                                {
                                  acao.label
                                }
                              </>
                            )}
                          </button>
                        </div>
                      )}


                    {/**
                     * ENTREGUE
                     */}

                    {pedidoSelecionado.status ===
                      "ENTREGUE" && (
                      <div
                        className="
                          mt-4
                          rounded-xl
                          border
                          border-green-200
                          bg-green-50
                          p-4
                        "
                      >
                        <div
                          className="
                            flex
                            items-start
                            gap-3
                          "
                        >
                          <CheckCircle2
                            size={18}
                            className="
                              mt-0.5
                              shrink-0
                              text-green-700
                            "
                          />

                          <div>
                            <p
                              className="
                                text-xs
                                font-semibold
                                text-green-800
                              "
                            >
                              Pedido finalizado
                            </p>

                            <p
                              className="
                                mt-1
                                text-[11px]
                                leading-5
                                text-green-700
                              "
                            >
                              Este pedido já foi
                              marcado como entregue.
                              Nenhuma outra ação é
                              necessária.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}


                    {/**
                     * CANCELADO
                     */}

                    {pedidoSelecionado.status ===
                      "CANCELADO" && (
                      <div
                        className="
                          mt-4
                          rounded-xl
                          border
                          border-red-200
                          bg-red-50
                          p-4
                        "
                      >
                        <div
                          className="
                            flex
                            items-start
                            gap-3
                          "
                        >
                          <XCircle
                            size={18}
                            className="
                              mt-0.5
                              shrink-0
                              text-red-700
                            "
                          />

                          <div>
                            <p
                              className="
                                text-xs
                                font-semibold
                                text-red-800
                              "
                            >
                              Pedido cancelado
                            </p>

                            <p
                              className="
                                mt-1
                                text-[11px]
                                leading-5
                                text-red-700
                              "
                            >
                              Um pedido cancelado
                              não pode avançar para
                              outra etapa.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}


                    {erroAtualizacao && (
                      <div
                        className="
                          mt-4
                          flex
                          items-start
                          gap-2
                          rounded-xl
                          border
                          border-red-200
                          bg-red-50
                          p-3
                          text-xs
                          text-red-700
                        "
                      >
                        <AlertCircle
                          size={15}
                          className="
                            mt-0.5
                            shrink-0
                          "
                        />

                        {
                          erroAtualizacao
                        }
                      </div>
                    )}
                  </div>


                  {/**
                   * =============================
                   * FECHAR
                   * =============================
                   */}

                  <div
                    className="
                      flex
                      justify-end
                      border-t
                      border-[#eee5d5]
                      pt-4
                    "
                  >
                    <button
                      type="button"
                      disabled={
                        atualizando
                      }
                      onClick={() =>
                        setPedidoSelecionado(
                          null
                        )
                      }
                      className="
                        rounded-xl
                        border
                        border-[#e9dcc4]
                        px-5
                        py-2.5
                        text-xs
                        font-medium
                        text-[#756b5a]
                        transition
                        hover:bg-[#f2ecdf]
                        disabled:opacity-50
                      "
                    >
                      Fechar detalhes
                    </button>
                  </div>
                </div>
              </section>
            </div>
          );
        })()}
    </div>
  );
}


/**
 * =========================================
 * SUMMARY CARD
 * =========================================
 */

function SummaryCard({
  label,
  value,
  helper,
  icon: Icon,
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-[#e9dcc4]
        bg-[#fcfaf5]
        p-4
        sm:p-5
      "
    >
      <div
        className="
          flex
          items-start
          justify-between
          gap-2
        "
      >
        <p
          className="
            text-[11px]
            text-[#817664]
            sm:text-xs
          "
        >
          {label}
        </p>


        <div
          className="
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-[#f1e8d8]
            text-[#8b754d]
          "
        >
          <Icon
            size={16}
            strokeWidth={1.7}
          />
        </div>
      </div>


      <p
        className="
          mt-3
          font-serif
          text-2xl
          text-[#211c14]
          sm:text-3xl
        "
      >
        {value}
      </p>


      <p
        className="
          mt-1
          text-[10px]
          text-[#a09582]
        "
      >
        {helper}
      </p>
    </div>
  );
}