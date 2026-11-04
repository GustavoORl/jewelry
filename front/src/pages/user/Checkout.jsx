
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

import FaixaNavegacao from "../../components/common/FaixaNavegacao.jsx";
import { apiFetch } from "../../services/api.js";

const formatarPreco = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);

const camposEndereco = [
  { nome: "destinatario", label: "Nome do destinatário", placeholder: "Nome completo", tipo: "text", largo: true },
  { nome: "cep", label: "CEP", placeholder: "00000-000", tipo: "text" },
  { nome: "rua", label: "Rua", placeholder: "Nome da rua", tipo: "text" },
  { nome: "numero", label: "Número", placeholder: "123", tipo: "text" },
  { nome: "complemento", label: "Complemento (opcional)", placeholder: "Apartamento, bloco...", tipo: "text", largo: true },
  { nome: "bairro", label: "Bairro", placeholder: "Seu bairro", tipo: "text" },
  { nome: "cidade", label: "Cidade", placeholder: "Sua cidade", tipo: "text" },
  { nome: "estado", label: "Estado", placeholder: "SP", tipo: "text" },
];

const enderecoInicial = {
  destinatario: "",
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
};

function montarEnderecoPedido(origem = {}) {
  return {
    destinatario: String(
      origem.destinatario || ""
    ).trim(),

    cep: String(
      origem.cep ?? origem.cepEntrega ?? ""
    ).trim(),

    rua: String(
      origem.rua ?? origem.ruaEntrega ?? ""
    ).trim(),

    numero: String(
      origem.numero ?? origem.numeroEntrega ?? ""
    ).trim(),

    complemento: String(
      origem.complemento ?? origem.complementoEntrega ?? ""
    ).trim(),

    bairro: String(
      origem.bairro ?? origem.bairroEntrega ?? ""
    ).trim(),

    cidade: String(
      origem.cidade ?? origem.cidadeEntrega ?? ""
    ).trim(),

    estado: String(
      origem.estado ?? origem.estadoEntrega ?? ""
    ).trim().toUpperCase(),
  };
}

function enderecoIgual(primeiro, segundo) {
  if (!primeiro || !segundo) return false;

  const campos = Object.keys(enderecoInicial);
  return campos.every(
    (campo) =>
      String(primeiro[campo] || "").trim().toLowerCase() ===
      String(segundo[campo] || "").trim().toLowerCase()
  );
}

function enderecoCompleto(endereco) {
  if (!endereco) return false;

  return ["destinatario", "cep", "rua", "numero", "bairro", "cidade", "estado"]
    .every((campo) => String(endereco[campo] || "").trim());
}

function normalizarItemPedido(item) {
  const quantidade = Number(item.quantidade) || 1;

  const precoUnitario = Number(
    item.precoUnitario ?? item.preco ?? 0
  );

  return {
    id: item.id,

    nome:
      item.nomeProduto ||
      item.nome ||
      item.produto?.nome ||
      "Produto",

    quantidade,

    subtotal: precoUnitario * quantidade,

    imagem:
      item.imagem ||
      item.produto?.imagens?.[0]?.url ||
      null,

    disponivel: true,
  };
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Se existir pedidoId na URL, estamos editando um pedido.
  const pedidoIdEdicao = searchParams.get("pedidoId");
  const editandoPedido = Boolean(pedidoIdEdicao);

  // Utilizados somente na criação de um novo pedido.
  const idsSelecionados = useMemo(
    () => location.state?.itensSelecionados ?? [],
    [location.state]
  );

  const [sacola, setSacola] = useState(null);
  const [pedidoExistente, setPedidoExistente] = useState(null);
  const [enderecos, setEnderecos] = useState([]);

  const [enderecoSelecionadoId, setEnderecoSelecionadoId] = useState("");
  const [usarNovoEndereco, setUsarNovoEndereco] = useState(false);
  const [endereco, setEndereco] = useState(enderecoInicial);
  const [salvarNovoEndereco, setSalvarNovoEndereco] = useState(true);

  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  // ============================================================
  // CARREGAR CHECKOUT
  // ============================================================

  useEffect(() => {
    let ativo = true;

    async function carregarCheckout() {
      setCarregando(true);
      setErro("");

      try {
        const requisicoes = [apiFetch("/enderecos")];

        if (editandoPedido) {
          requisicoes.push(apiFetch(`/pedidos/${pedidoIdEdicao}`));
        } else {
          requisicoes.push(apiFetch("/sacola"));
        }

        const [dadosEnderecos, dadosCompra] = await Promise.all(requisicoes);

        if (!ativo) return;

        const listaEnderecos = Array.isArray(dadosEnderecos?.enderecos)
          ? dadosEnderecos.enderecos
          : Array.isArray(dadosEnderecos)
            ? dadosEnderecos
            : [];

        setEnderecos(listaEnderecos);

        const principal =
          listaEnderecos.find((item) => item.principal) ||
          listaEnderecos[0] ||
          null;

        if (editandoPedido) {
          const pedido = dadosCompra?.pedido;

          if (!pedido?.id) {
            throw new Error("Não foi possível encontrar o pedido.");
          }

          if (pedido.status !== "PENDENTE") {
            throw new Error(
              "Este pedido não está mais pendente e não pode ser alterado."
            );
          }

          if (pedido.expiraEm && new Date(pedido.expiraEm).getTime() <= Date.now()) {
            throw new Error(
              "O prazo deste pedido terminou. Não é possível alterar o endereço."
            );
          }

          setPedidoExistente(pedido);
          setSacola(null);

          // O pedido guarda um snapshot do endereço de entrega.
          const enderecoPedido = montarEnderecoPedido(
            pedido.endereco || pedido.enderecoEntrega || pedido
          );

          const enderecoCadastrado = listaEnderecos.find((item) =>
            enderecoIgual(montarEnderecoPedido(item), enderecoPedido)
          );

          if (enderecoCadastrado) {
            setEnderecoSelecionadoId(enderecoCadastrado.id);
            setUsarNovoEndereco(false);
          } else {
            // Se o endereço original não estiver na lista do usuário,
            // abrimos o formulário já preenchido para permitir correções.
            setEnderecoSelecionadoId("");
            setEndereco(enderecoPedido);
            setUsarNovoEndereco(true);
            setSalvarNovoEndereco(false);
          }
        } else {
          const recebida = dadosCompra?.sacola ?? dadosCompra;

          if (!Array.isArray(recebida?.itens)) {
            throw new Error("Não foi possível carregar os itens da sacola.");
          }

          setSacola(recebida);
          setPedidoExistente(null);

          if (principal) {
            setEnderecoSelecionadoId(principal.id);
            setUsarNovoEndereco(false);
          } else {
            setEnderecoSelecionadoId("");
            setUsarNovoEndereco(true);
            setSalvarNovoEndereco(true);
          }
        }
      } catch (error) {
        if (ativo) {
          setErro(error.message || "Erro ao carregar o checkout.");
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarCheckout();

    return () => {
      ativo = false;
    };
  }, [editandoPedido, pedidoIdEdicao]);

  // ============================================================
  // ITENS DA COMPRA
  // ============================================================

  const itensSelecionados = useMemo(() => {
    if (editandoPedido) {
      return Array.isArray(pedidoExistente?.itens)
        ? pedidoExistente.itens.map(normalizarItemPedido)
        : [];
    }

    if (!sacola?.itens || !idsSelecionados.length) return [];

    const ids = new Set(idsSelecionados);
    return sacola.itens.filter((item) => ids.has(item.id));
  }, [editandoPedido, pedidoExistente, sacola, idsSelecionados]);

  const total = useMemo(() => {
    if (editandoPedido) {
      return Number(pedidoExistente?.valorTotal || 0);
    }

    return itensSelecionados.reduce(
      (soma, item) => soma + Number(item.subtotal || 0),
      0
    );
  }, [editandoPedido, pedidoExistente, itensSelecionados]);

  const temItens = itensSelecionados.length > 0;

  // Em pedidos já criados, o estoque foi tratado na criação.
  // Não devemos aplicar novamente a disponibilidade da sacola.
  const indisponivel =
    !editandoPedido && itensSelecionados.some((item) => !item.disponivel);

  const enderecoSelecionado = useMemo(() => {
    if (usarNovoEndereco) return null;

    return (
      enderecos.find((item) => item.id === enderecoSelecionadoId) || null
    );
  }, [enderecos, enderecoSelecionadoId, usarNovoEndereco]);

  // ============================================================
  // FORMULÁRIO DE ENDEREÇO
  // ============================================================

  function alterarEndereco(evento) {
    const { name, value } = evento.target;
    let novoValor = value;

    if (name === "estado") {
      novoValor = value.toUpperCase().slice(0, 2);
    }

    if (name === "cep") {
      const numeros = value.replace(/\D/g, "").slice(0, 8);
      novoValor =
        numeros.length > 5
          ? `${numeros.slice(0, 5)}-${numeros.slice(5)}`
          : numeros;
    }

    setEndereco((atual) => ({
      ...atual,
      [name]: novoValor,
    }));
  }

  function selecionarEndereco(id) {
    setEnderecoSelecionadoId(id);
    setUsarNovoEndereco(false);
    setErro("");
  }

  function selecionarNovoEndereco() {
    setEnderecoSelecionadoId("");
    setUsarNovoEndereco(true);
    setErro("");
  }

  // ============================================================
  // CONFIRMAR OU ATUALIZAR PEDIDO
  // ============================================================

  async function confirmarPedido(evento) {
    evento.preventDefault();

    if (enviando) return;
    setErro("");

    if (!temItens) {
      setErro("Não foi possível carregar os produtos deste pedido.");
      return;
    }

    if (indisponivel) {
      setErro(
        "Existem produtos indisponíveis. Volte à sacola e ajuste os itens."
      );
      return;
    }

    if (!usarNovoEndereco && !enderecoSelecionadoId) {
      setErro("Selecione um endereço de entrega.");
      return;
    }

    setEnviando(true);

    try {
      let enderecoEntrega;

      if (usarNovoEndereco) {
        enderecoEntrega = montarEnderecoPedido(endereco);

        if (!enderecoCompleto(enderecoEntrega)) {
          throw new Error("Preencha todos os campos obrigatórios do endereço.");
        }

        if (enderecoEntrega.cep.replace(/\D/g, "").length !== 8) {
          throw new Error("Informe um CEP válido com 8 dígitos.");
        }

        if (enderecoEntrega.estado.length !== 2) {
          throw new Error("Informe a sigla do estado com 2 letras.");
        }

        if (salvarNovoEndereco) {
          const respostaEndereco = await apiFetch("/enderecos", {
            method: "POST",
            body: JSON.stringify(enderecoEntrega),
          });

          if (respostaEndereco?.endereco) {
            enderecoEntrega = montarEnderecoPedido(respostaEndereco.endereco);
          }
        }
      } else {
        const encontrado = enderecos.find(
          (item) => item.id === enderecoSelecionadoId
        );

        if (!encontrado) {
          throw new Error("O endereço selecionado não foi encontrado.");
        }

        enderecoEntrega = montarEnderecoPedido(encontrado);
      }

      // ========================================================
      // MODO EDIÇÃO: NÃO CRIA OUTRO PEDIDO
      // ========================================================

      if (editandoPedido) {
        if (pedidoExistente?.status !== "PENDENTE") {
          throw new Error("Este pedido não pode mais ser alterado.");
        }

        if (
          pedidoExistente.expiraEm &&
          new Date(pedidoExistente.expiraEm).getTime() <= Date.now()
        ) {
          throw new Error("O prazo de pagamento do pedido terminou.");
        }

        const resposta = await apiFetch(
          `/pedidos/${pedidoIdEdicao}/endereco`,
          {
            method: "PATCH",
            body: JSON.stringify({
              endereco: enderecoEntrega,
            }),
          }
        );

        if (resposta?.sucesso === false) {
          throw new Error(
            resposta.mensagem || "Não foi possível atualizar o endereço."
          );
        }

        navigate(`/pagamento/${pedidoIdEdicao}`, { replace: true });
        return;
      }

      // ========================================================
      // MODO NORMAL: CRIAR NOVO PEDIDO
      // ========================================================

      const resposta = await apiFetch("/pedidos", {
        method: "POST",
        body: JSON.stringify({
          endereco: enderecoEntrega,
          itensSelecionados: itensSelecionados.map((item) => item.id),
        }),
      });

      if (!resposta?.pedido?.id) {
        throw new Error(
          "A API não retornou os dados esperados do pedido."
        );
      }

      navigate(`/pagamento/${resposta.pedido.id}`, { replace: true });
    } catch (error) {
      setErro(
        error.message ||
          (editandoPedido
            ? "Não foi possível atualizar o pedido."
            : "Não foi possível criar o pedido.")
      );
    } finally {
      setEnviando(false);
    }
  }

  // ============================================================
  // CARREGAMENTO
  // ============================================================

  if (carregando) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#FCFAF5]">
        <div className="flex items-center gap-3 text-sm text-[#756C5C]">
          <LoaderCircle className="animate-spin" size={22} />
          Carregando seu checkout...
        </div>
      </main>
    );
  }

  // ============================================================
  // ERRO AO CARREGAR UM PEDIDO PARA EDIÇÃO
  // ============================================================

  if (editandoPedido && !pedidoExistente) {
    return (
      <main className="min-h-[60vh] bg-[#FCFAF5] px-4 py-16 text-center text-[#211C14]">
        <MapPin className="mx-auto mb-5 text-[#968052]" size={42} />

        <h1 className="font-serif text-3xl">
          Não foi possível editar o pedido
        </h1>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#756C5C]">
          {erro || "Não foi possível carregar as informações deste pedido."}
        </p>

        <Link
          to={`/pagamento/${pedidoIdEdicao}`}
          className="mt-7 inline-flex items-center gap-2 bg-[#211C14] px-6 py-3 text-sm text-white hover:bg-[#968052]"
        >
          <ArrowLeft size={16} />
          Voltar ao pagamento
        </Link>
      </main>
    );
  }

  // ============================================================
  // NENHUM ITEM SELECIONADO
  // ============================================================

  if (!temItens) {
    return (
      <main className="min-h-[60vh] bg-[#FCFAF5] px-4 py-16 text-center text-[#211C14]">
        <ShoppingBag className="mx-auto mb-5 text-[#968052]" size={42} />

        <h1 className="font-serif text-3xl">
          {editandoPedido
            ? "Produtos do pedido indisponíveis"
            : "Nenhum produto selecionado"}
        </h1>

        <p className="mt-3 text-sm text-[#756C5C]">
          {editandoPedido
            ? "Não foi possível recuperar os itens do pedido."
            : "Volte à sacola e selecione os produtos que deseja comprar."}
        </p>

        <Link
          to={
            editandoPedido
              ? `/pagamento/${pedidoIdEdicao}`
              : "/sacola"
          }
          className="mt-7 inline-flex items-center gap-2 bg-[#211C14] px-6 py-3 text-sm text-white hover:bg-[#968052]"
        >
          <ArrowLeft size={16} />
          {editandoPedido ? "Voltar ao pagamento" : "Voltar à sacola"}
        </Link>
      </main>
    );
  }

  // ============================================================
  // CHECKOUT
  // ============================================================

  return (
    <main className="min-h-screen bg-[#FCFAF5] text-[#211C14]">
      <div className="w-full max-md:hidden">
        <FaixaNavegacao
          mostrarVoltar={false}
          itens={[
            { label: "Início", to: "/" },
            editandoPedido
              ? {
                  label: "Pagamento",
                  to: `/pagamento/${pedidoIdEdicao}`,
                }
              : {
                  label: "Minha Sacola",
                  to: "/sacola",
                },
            { label: "Checkout" },
          ]}
        />
      </div>

      <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">

        {/* CABEÇALHO */}

        <header className="mb-8 border-b border-[#E9DCC4] pb-6 sm:mb-10">
          <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#968052]">
            Sua experiência AURELIA
          </p>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl">
            {editandoPedido ? "Corrigir informações" : "Finalizar pedido"}
          </h1>

          <p className="mt-3 text-sm text-[#756C5C]">
            {editandoPedido
              ? "Revise o endereço de entrega antes de concluir seu pagamento."
              : "Escolha onde deseja receber suas joias."}
          </p>

          {editandoPedido && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border border-[#E9DCC4] bg-white px-5 py-4">
              <div className="flex items-start gap-3">
                <Clock3 size={19} className="mt-0.5 text-[#968052]" />

                <div>
                  <p className="text-sm font-medium">
                    Você está editando um pedido existente
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#756C5C]">
                    Os produtos, valores e prazo original de pagamento
                    serão mantidos.
                  </p>
                </div>
              </div>

              <Link
                to={`/pagamento/${pedidoIdEdicao}`}
                className="inline-flex items-center gap-2 border border-[#968052] px-4 py-3 text-xs font-medium text-[#806B43] transition hover:bg-[#F1E8D8]"
              >
                <ArrowLeft size={15} />
                Voltar ao pagamento
              </Link>
            </div>
          )}
        </header>

        {/* ERRO */}

        {erro && (
          <div
            role="alert"
            className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {erro}
          </div>
        )}

        {/* PRODUTO INDISPONÍVEL */}

        {indisponivel && (
          <div className="mb-6 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Há produtos selecionados indisponíveis ou com quantidade
            acima do estoque.
            <Link
              to="/sacola"
              className="ml-1 underline underline-offset-4"
            >
              Revisar sacola
            </Link>
          </div>
        )}

        <form
          onSubmit={confirmarPedido}
          className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12"
        >

          {/* ENDEREÇO DE ENTREGA */}

          <section className="border border-[#E9DCC4] bg-white p-5 sm:p-8">
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center bg-[#F8F3E8] text-[#968052]">
                <MapPin size={21} strokeWidth={1.4} />
              </div>

              <div>
                <h2 className="font-serif text-2xl">
                  Endereço de entrega
                </h2>
                <p className="mt-1 text-xs text-[#756C5C]">
                  Escolha um endereço cadastrado ou informe um novo.
                </p>
              </div>
            </div>

            {/* ENDEREÇOS CADASTRADOS */}

            {enderecos.length > 0 && (
              <>
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-[#968052]">
                  Seus endereços
                </p>

                <div className="space-y-3">
                  {enderecos.map((item) => {
                    const selecionado =
                      !usarNovoEndereco &&
                      enderecoSelecionadoId === item.id;

                    return (
                      <label
                        key={item.id}
                        className={`block cursor-pointer border p-4 transition ${
                          selecionado
                            ? "border-[#968052] bg-[#FCFAF5]"
                            : "border-[#E9DCC4] bg-white hover:border-[#CDBB98]"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="radio"
                            name="enderecoEntrega"
                            checked={selecionado}
                            onChange={() => selecionarEndereco(item.id)}
                            className="mt-1 h-4 w-4 accent-[#968052]"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium">
                                {item.destinatario}
                              </p>

                              {item.principal && (
                                <span className="bg-[#F8F3E8] px-2 py-1 text-[10px] uppercase tracking-wider text-[#968052]">
                                  Principal
                                </span>
                              )}

                              {selecionado && (
                                <CheckCircle2
                                  size={16}
                                  className="ml-auto text-[#968052]"
                                />
                              )}
                            </div>

                            <p className="mt-2 text-sm leading-6 text-[#756C5C]">
                              {item.rua}, {item.numero}
                              {item.complemento
                                ? ` - ${item.complemento}`
                                : ""}
                            </p>

                            <p className="text-sm leading-6 text-[#756C5C]">
                              {item.bairro} — {item.cidade}/{item.estado}
                            </p>

                            <p className="mt-1 text-xs text-[#968052]">
                              CEP {item.cep}
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })}

                  {/* OUTRO ENDEREÇO */}

                  <label
                    className={`block cursor-pointer border p-4 transition ${
                      usarNovoEndereco
                        ? "border-[#968052] bg-[#FCFAF5]"
                        : "border-[#E9DCC4] bg-white hover:border-[#CDBB98]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="enderecoEntrega"
                        checked={usarNovoEndereco}
                        onChange={selecionarNovoEndereco}
                        className="h-4 w-4 accent-[#968052]"
                      />

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#F8F3E8] text-[#968052]">
                        <Plus size={18} />
                      </div>

                      <div>
                        <p className="text-sm font-medium">
                          Usar outro endereço
                        </p>
                        <p className="mt-1 text-xs text-[#756C5C]">
                          Informe um endereço diferente para esta entrega.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </>
            )}

            {/* FORMULÁRIO NOVO ENDEREÇO */}

            {usarNovoEndereco && (
              <div
                className={
                  enderecos.length > 0
                    ? "mt-8 border-t border-[#E9DCC4] pt-7"
                    : ""
                }
              >
                <div className="mb-6">
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#968052]">
                    {editandoPedido
                      ? "Editar endereço de entrega"
                      : enderecos.length > 0
                        ? "Novo endereço"
                        : "Cadastre seu endereço"}
                  </p>

                  <h3 className="mt-2 font-serif text-xl">
                    {editandoPedido
                      ? "Confira e corrija os dados da entrega"
                      : enderecos.length > 0
                        ? "Informe o novo endereço de entrega"
                        : "Onde você deseja receber seu pedido?"}
                  </h3>

                  {enderecos.length === 0 && !editandoPedido && (
                    <p className="mt-2 text-xs leading-5 text-[#756C5C]">
                      Este será seu primeiro endereço e poderá ser utilizado
                      nas próximas compras.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
                  {camposEndereco.map((campo) => (
                    <div
                      key={campo.nome}
                      className={campo.largo ? "sm:col-span-2" : ""}
                    >
                      <label
                        htmlFor={campo.nome}
                        className="mb-2 block text-xs font-medium text-[#756C5C]"
                      >
                        {campo.label}
                        {campo.nome !== "complemento" && (
                          <span className="text-red-700"> *</span>
                        )}
                      </label>

                      <input
                        id={campo.nome}
                        name={campo.nome}
                        type={campo.tipo}
                        value={endereco[campo.nome]}
                        onChange={alterarEndereco}
                        placeholder={campo.placeholder}
                        required={
                          usarNovoEndereco &&
                          campo.nome !== "complemento"
                        }
                        autoComplete={
                          {
                            destinatario: "name",
                            cep: "postal-code",
                            rua: "street-address",
                            numero: "address-line2",
                            bairro: "address-level3",
                            cidade: "address-level2",
                            estado: "address-level1",
                          }[campo.nome] || "off"
                        }
                        maxLength={
                          campo.nome === "cep" ? 9 : undefined
                        }
                        className="w-full border border-[#E9DCC4] bg-[#FCFAF5] px-4 py-3 text-sm outline-none transition placeholder:text-[#B1A99B] focus:border-[#968052] focus:ring-1 focus:ring-[#968052]"
                      />
                    </div>
                  ))}
                </div>

                {/* SALVAR ENDEREÇO NA CONTA */}

                <label className="mt-6 flex cursor-pointer items-start gap-3 border-t border-[#E9DCC4] pt-6">
                  <input
                    type="checkbox"
                    checked={salvarNovoEndereco}
                    onChange={(evento) =>
                      setSalvarNovoEndereco(evento.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 accent-[#968052]"
                  />

                  <div>
                    <p className="text-sm font-medium">
                      Salvar este endereço na minha conta
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#756C5C]">
                      Assim você poderá utilizá-lo novamente em compras futuras.
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* ENDEREÇO SELECIONADO */}

            {!usarNovoEndereco && enderecoSelecionado && (
              <div className="mt-7 flex items-start gap-3 border-t border-[#E9DCC4] pt-6">
                <CheckCircle2
                  size={20}
                  className="mt-0.5 shrink-0 text-[#968052]"
                />

                <div>
                  <p className="text-xs font-medium">
                    Endereço selecionado para entrega
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#756C5C]">
                    {enderecoSelecionado.rua}, {enderecoSelecionado.numero}
                    {" — "}
                    {enderecoSelecionado.cidade}/{enderecoSelecionado.estado}
                  </p>
                </div>
              </div>
            )}

            {/* AVISO */}

            <div className="mt-7 flex items-start gap-3 border-t border-[#E9DCC4] pt-6">
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0 text-[#968052]"
              />

              <p className="text-xs leading-5 text-[#756C5C]">
                {editandoPedido
                  ? "As alterações serão registradas no pedido existente. Os produtos, valores e prazo de pagamento não serão modificados."
                  : "Confira o endereço antes de confirmar. Os dados serão registrados no pedido para preservar as informações da entrega."}
              </p>
            </div>
          </section>

          {/* RESUMO DO PEDIDO */}

          <aside className="border border-[#E9DCC4] bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <PackageCheck className="text-[#968052]" size={22} />
              <h2 className="font-serif text-2xl">
                Resumo do pedido
              </h2>
            </div>

            <p className="mt-2 text-xs text-[#756C5C]">
              {itensSelecionados.length} produto(s) selecionado(s)
            </p>

            {editandoPedido && (
              <p className="mt-3 text-xs leading-5 text-[#968052]">
                Os produtos deste pedido já foram reservados.
              </p>
            )}

            {/* PRODUTOS */}

            <div className="mt-6 divide-y divide-[#E9DCC4]">
              {itensSelecionados.map((item) => (
                <div key={item.id} className="flex gap-3 py-4">
                  <div className="h-16 w-14 shrink-0 overflow-hidden bg-[#F8F3E8]">
                    {item.imagem ? (
                      <img
                        src={item.imagem}
                        alt={item.nome}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#968052]">
                        <ShoppingBag size={20} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{item.nome}</p>

                    <p className="mt-1 text-xs text-[#756C5C]">
                      Quantidade: {item.quantidade}
                    </p>

                    <p className="mt-2 text-sm font-medium">
                      {formatarPreco(item.subtotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* VALORES */}

            <div className="mt-2 space-y-4 border-t border-[#E9DCC4] pt-5 text-sm">
              <div className="flex justify-between gap-4 text-[#756C5C]">
                <span>
                  {editandoPedido
                    ? "Total do pedido"
                    : "Subtotal dos produtos"}
                </span>
                <span className="tabular-nums">
                  {formatarPreco(total)}
                </span>
              </div>

              {!editandoPedido && (
                <div className="flex justify-between gap-4 text-[#756C5C]">
                  <span>Frete</span>
                  <span>A calcular</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-4 border-t border-[#E9DCC4] pt-5">
                <span className="font-medium">
                  {editandoPedido ? "Total a pagar" : "Total atual"}
                </span>

                <span className="text-xl font-medium tabular-nums">
                  {formatarPreco(total)}
                </span>
              </div>

              <p className="text-xs leading-5 text-[#756C5C]">
                {editandoPedido
                  ? "O valor do pedido será mantido."
                  : "O total ainda não inclui o frete."}
              </p>
            </div>

            {/* CONFIRMAR */}

            <button
              type="submit"
              disabled={enviando || indisponivel}
              className="mt-6 flex w-full items-center justify-center gap-3 bg-[#211C14] px-5 py-4 text-sm text-white transition hover:bg-[#968052] disabled:cursor-not-allowed disabled:bg-[#B9B2A6]"
            >
              {enviando ? (
                <>
                  <LoaderCircle className="animate-spin" size={17} />
                  {editandoPedido
                    ? "Salvando alterações..."
                    : "Criando pedido..."}
                </>
              ) : (
                <>
                  {editandoPedido
                    ? "Salvar e voltar ao pagamento"
                    : "Confirmar pedido"}
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-[#756C5C]">
              {editandoPedido
                ? "Após salvar, você retornará à página de pagamento do mesmo pedido."
                : "Após confirmar o pedido, você será direcionado para escolher a forma de pagamento."}
            </p>

            {editandoPedido && (
              <Link
                to={`/pagamento/${pedidoIdEdicao}`}
                className="mt-4 flex w-full items-center justify-center gap-2 py-2 text-xs text-[#756C5C] transition hover:text-[#968052]"
              >
                <ArrowLeft size={15} />
                Voltar sem salvar
              </Link>
            )}
          </aside>
        </form>
      </div>
    </main>
  );
}
