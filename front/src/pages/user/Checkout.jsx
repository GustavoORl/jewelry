
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

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

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  // IDs dos itens da sacola selecionados pelo usuário.
  const idsSelecionados = location.state?.itensSelecionados ?? [];

  const [sacola, setSacola] = useState(null);
  const [endereco, setEndereco] = useState(enderecoInicial);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [pedidoCriado, setPedidoCriado] = useState(null);

  useEffect(() => {
    let ativo = true;

    async function carregarSacola() {
      try {
        const dados = await apiFetch("/sacola");
        const recebida = dados?.sacola ?? dados;

        if (!Array.isArray(recebida?.itens)) {
          throw new Error("Não foi possível carregar os itens da sacola.");
        }

        if (ativo) setSacola(recebida);
      } catch (error) {
        if (ativo) {
          setErro(error.message || "Erro ao carregar a sacola.");
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarSacola();

    return () => {
      ativo = false;
    };
  }, []);

  // Mantém somente os itens selecionados na sacola.
  const itensSelecionados = useMemo(() => {
    if (!sacola?.itens || !idsSelecionados.length) return [];

    const ids = new Set(idsSelecionados);

    return sacola.itens.filter((item) => ids.has(item.id));
  }, [sacola, idsSelecionados]);

  // Calcula os valores exclusivamente dos itens selecionados.
  const total = useMemo(
    () =>
      itensSelecionados.reduce(
        (soma, item) => soma + Number(item.subtotal || 0),
        0
      ),
    [itensSelecionados]
  );

  const temItens = itensSelecionados.length > 0;

  const indisponivel = itensSelecionados.some(
    (item) => !item.disponivel
  );

  function alterarEndereco(evento) {
    const { name, value } = evento.target;

    setEndereco((atual) => ({
      ...atual,
      [name]: name === "estado" ? value.toUpperCase().slice(0, 2) : value,
    }));
  }

  async function confirmarPedido(evento) {
    evento.preventDefault();
    setErro("");

    if (!temItens) {
      setErro("Nenhum produto foi selecionado para o pedido.");
      return;
    }

    if (indisponivel) {
      setErro(
        "Existem produtos selecionados indisponíveis. Volte à sacola e ajuste os itens."
      );
      return;
    }

    setEnviando(true);

    try {
      const resposta = await apiFetch("/pedidos", {
        method: "POST",
        body: JSON.stringify({
          endereco,
          itensSelecionados: itensSelecionados.map((item) => item.id),
        }),
      });

      if (!resposta?.pedido?.id) {
        throw new Error(
          "A API não retornou os dados esperados do pedido."
        );
      }

      setPedidoCriado(resposta.pedido);
    } catch (error) {
      setErro(error.message || "Não foi possível criar o pedido.");
    } finally {
      setEnviando(false);
    }
  }

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

  if (pedidoCriado) {
    return (
      <main className="min-h-[65vh] bg-[#FCFAF5] px-4 py-16 text-[#211C14]">
        <section className="mx-auto max-w-xl border border-[#E9DCC4] bg-white px-6 py-12 text-center sm:px-12">
          <CheckCircle2
            className="mx-auto mb-6 text-[#968052]"
            size={54}
            strokeWidth={1.2}
          />

          <p className="text-xs uppercase tracking-[0.25em] text-[#968052]">
            Pedido registrado
          </p>

          <h1 className="mt-3 font-serif text-3xl sm:text-4xl">
            Obrigado pela sua compra!
          </h1>

          <p className="mt-4 text-sm leading-6 text-[#756C5C]">
            Seu pedido foi criado e está aguardando a próxima etapa de
            pagamento.
          </p>

          <div className="my-8 space-y-3 border-y border-[#E9DCC4] py-5 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-[#756C5C]">Número do pedido</span>
              <span className="break-all font-medium">
                {pedidoCriado.id}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-[#756C5C]">Status</span>
              <span className="font-medium">{pedidoCriado.status}</span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-[#756C5C]">Total</span>
              <span className="font-medium">
                {formatarPreco(pedidoCriado.valorTotal)}
              </span>
            </div>
          </div>

          <p className="mb-6 text-xs leading-5 text-[#756C5C]">
            Nenhum pagamento foi realizado nesta etapa.
          </p>

          <Link
            to="/"
            className="inline-flex items-center justify-center gap-3 bg-[#211C14] px-6 py-4 text-sm text-white transition hover:bg-[#968052]"
          >
            Voltar à loja
            <ArrowRight size={17} />
          </Link>
        </section>
      </main>
    );
  }

  if (!temItens) {
    return (
      <main className="min-h-[60vh] bg-[#FCFAF5] px-4 py-16 text-center text-[#211C14]">
        <ShoppingBag className="mx-auto mb-5 text-[#968052]" size={42} />

        <h1 className="font-serif text-3xl">
          Nenhum produto selecionado
        </h1>

        <p className="mt-3 text-sm text-[#756C5C]">
          Volte à sacola e selecione os produtos que deseja comprar.
        </p>

        <Link
          to="/sacola"
          className="mt-7 inline-flex items-center gap-2 bg-[#211C14] px-6 py-3 text-sm text-white hover:bg-[#968052]"
        >
          <ArrowLeft size={16} />
          Voltar à sacola
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FCFAF5] text-[#211C14]">
      <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Link
          to="/sacola"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#756C5C] transition hover:text-[#968052]"
        >
          <ArrowLeft size={17} />
          Voltar à sacola
        </Link>

        <header className="mb-8 border-b border-[#E9DCC4] pb-6 sm:mb-10">
          <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#968052]">
            Sua experiência AURELIA
          </p>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl">
            Finalizar pedido
          </h1>

          <p className="mt-3 text-sm text-[#756C5C]">
            Informe onde deseja receber suas joias.
          </p>
        </header>

        {erro && (
          <div
            role="alert"
            className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {erro}
          </div>
        )}

        {indisponivel && (
          <div className="mb-6 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Há produtos selecionados indisponíveis ou com quantidade acima do estoque.
            <Link to="/sacola" className="ml-1 underline underline-offset-4">
              Revisar sacola
            </Link>
          </div>
        )}

        <form
          onSubmit={confirmarPedido}
          className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12"
        >
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
                  Preencha os dados para a entrega do pedido.
                </p>
              </div>
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
                    required={campo.nome !== "complemento"}
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
                    maxLength={campo.nome === "cep" ? 9 : undefined}
                    className="w-full border border-[#E9DCC4] bg-[#FCFAF5] px-4 py-3 text-sm outline-none transition placeholder:text-[#B1A99B] focus:border-[#968052] focus:ring-1 focus:ring-[#968052]"
                  />
                </div>
              ))}
            </div>

            <div className="mt-7 flex items-start gap-3 border-t border-[#E9DCC4] pt-6">
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0 text-[#968052]"
              />
              <p className="text-xs leading-5 text-[#756C5C]">
                Confira o endereço antes de confirmar. Os dados serão
                registrados no pedido para preservar as informações da entrega.
              </p>
            </div>
          </section>

          <aside className="border border-[#E9DCC4] bg-white p-5 sm:p-6 lg:sticky lg:top-6">
            <div className="flex items-center gap-3">
              <PackageCheck className="text-[#968052]" size={22} />
              <h2 className="font-serif text-2xl">Resumo do pedido</h2>
            </div>

            <p className="mt-2 text-xs text-[#756C5C]">
              {itensSelecionados.length} produto(s) selecionado(s)
            </p>

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

            <div className="mt-2 space-y-4 border-t border-[#E9DCC4] pt-5 text-sm">
              <div className="flex justify-between gap-4 text-[#756C5C]">
                <span>Subtotal dos produtos</span>
                <span className="tabular-nums">{formatarPreco(total)}</span>
              </div>

              <div className="flex justify-between gap-4 text-[#756C5C]">
                <span>Frete</span>
                <span>A calcular</span>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-[#E9DCC4] pt-5">
                <span className="font-medium">Total atual</span>
                <span className="text-xl font-medium tabular-nums">
                  {formatarPreco(total)}
                </span>
              </div>

              <p className="text-xs leading-5 text-[#756C5C]">
                O total ainda não inclui o frete.
              </p>
            </div>

            <button
              type="submit"
              disabled={enviando || indisponivel}
              className="mt-6 flex w-full items-center justify-center gap-3 bg-[#211C14] px-5 py-4 text-sm text-white transition hover:bg-[#968052] disabled:cursor-not-allowed disabled:bg-[#B9B2A6]"
            >
              {enviando ? (
                <>
                  <LoaderCircle className="animate-spin" size={17} />
                  Criando pedido...
                </>
              ) : (
                <>
                  Confirmar pedido
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-[#756C5C]">
              Esta etapa registra o pedido. O pagamento será implementado
              separadamente.
            </p>
          </aside>
        </form>
      </div>
    </main>
  );
}
