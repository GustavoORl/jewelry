
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  UserRound,
  RotateCcw,
  Package,
  MapPin,
  Heart,
  Settings,
  ChevronRight,
  ShoppingBag,
  Clock3,
  CheckCircle2,
  Truck,
  LoaderCircle,
  AlertCircle,
  Mail,
  Phone,
} from "lucide-react";

import { apiFetch } from "../../services/api.js";
import FaixaNavegacao from "../../components/common/FaixaNavegacao.jsx";

// ==========================================
// CONFIGURAÇÃO DOS STATUS
// ==========================================

const STATUS_PEDIDO = {
  PENDENTE: {
    texto: "Aguardando pagamento",
    Icone: Clock3,
  },
  PAGO: {
    texto: "Pagamento aprovado",
    Icone: CheckCircle2,
  },
  EM_PREPARACAO: {
    texto: "Em preparação",
    Icone: Package,
  },
  ENVIADO: {
    texto: "Pedido enviado",
    Icone: Truck,
  },
  ENTREGUE: {
    texto: "Pedido entregue",
    Icone: CheckCircle2,
  },
  CANCELADO: {
    texto: "Pedido cancelado",
    Icone: AlertCircle,
  },
};

// ==========================================
// FORMATADORES
// ==========================================

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));
}

function formatarData(data) {
  if (!data) return "";

  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(valor);
}

function reduzirId(id) {
  if (!id) return "";

  return id.slice(-8).toUpperCase();
}

function obterIniciais(nome) {
  if (!nome) return "U";

  const partes = nome.trim().split(/\s+/).filter(Boolean);

  if (partes.length === 1) {
    return partes[0].charAt(0).toUpperCase();
  }

  return (
    partes[0].charAt(0) + partes[partes.length - 1].charAt(0)
  ).toUpperCase();
}

function obterPrimeiroNome(nome) {
  if (!nome) return "";

  return nome.trim().split(/\s+/)[0];
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function PerfilUser() {
  const [usuario, setUsuario] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // ==========================================
  // CARREGAR PERFIL
  // ==========================================

  useEffect(() => {
    carregarPerfil();
  }, []);

  async function carregarPerfil() {
    try {
      setCarregando(true);
      setErro("");

      // Carrega usuário e pedidos simultaneamente.
      const [respostaUsuario, respostaPedidos] = await Promise.all([
        apiFetch("/me"),
        apiFetch("/pedidos"),
      ]);

      if (!respostaUsuario?.usuario) {
        throw new Error(
          "Não foi possível carregar os dados da sua conta."
        );
      }

      setUsuario(respostaUsuario.usuario);

      setPedidos(
        Array.isArray(respostaPedidos?.pedidos)
          ? respostaPedidos.pedidos
          : []
      );
    } catch (erro) {
      console.error("Erro ao carregar perfil:", erro);

      setErro(
        erro.message || "Não foi possível carregar seu perfil."
      );
    } finally {
      setCarregando(false);
    }
  }

  // ==========================================
  // RESUMO DOS PEDIDOS
  // ==========================================

  const resumoPedidos = useMemo(() => {
    const total = pedidos.length;

    const emAndamento = pedidos.filter((pedido) =>
      ["PENDENTE", "PAGO", "EM_PREPARACAO", "ENVIADO"].includes(
        pedido.status
      )
    ).length;

    const entregues = pedidos.filter(
      (pedido) => pedido.status === "ENTREGUE"
    ).length;

    return {
      total,
      emAndamento,
      entregues,
    };
  }, [pedidos]);

  // Os pedidos já vêm ordenados pelo backend por criadoEm desc.
  const pedidosRecentes = pedidos.slice(0, 3);

  // ==========================================
  // CARREGANDO
  // ==========================================

  if (carregando) {
    return (
      <main className="min-h-[70vh] bg-[#FCFAF5]">
        <div className="mx-auto flex min-h-[60vh] max-w-[1240px] items-center justify-center px-5">
          <div className="flex flex-col items-center gap-4">
            <LoaderCircle size={32} className="animate-spin text-[#968052]" />

            <p className="text-sm text-[#756C5C]">
              Carregando seu perfil...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // ERRO
  // ==========================================

  if (erro || !usuario) {
    return (
      <main className="min-h-[70vh] bg-[#FCFAF5]">
        <div className="mx-auto flex min-h-[60vh] max-w-[1240px] items-center justify-center px-5">
          <div className="w-full max-w-lg rounded-2xl border border-[#E9DCC4] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertCircle size={24} className="text-red-600" />
            </div>

            <h2 className="mt-4 font-serif text-2xl text-[#211C14]">
              Não foi possível carregar seu perfil
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#756C5C]">
              {erro || "Ocorreu um erro ao consultar sua conta."}
            </p>

            <button
              type="button"
              onClick={carregarPerfil}
              className="mt-6 rounded-lg bg-[#211C14] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#968052]"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // DADOS DO USUÁRIO
  // ==========================================

  const iniciais = obterIniciais(usuario.nome);
  const primeiroNome = obterPrimeiroNome(usuario.nome);

  return (
    <main className="min-h-screen bg-[#FCFAF5]">
      {/* NAVEGAÇÃO */}

      <div className="max-md:hidden">
        <FaixaNavegacao
          mostrarVoltar={false}
          itens={[
            { label: "Início", to: "/" },
            { label: "Perfil" },
          ]}
        />
      </div>

      <div className="mx-auto max-w-[1240px] px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* CABEÇALHO */}

        <section className="overflow-hidden rounded-2xl border border-[#E9DCC4] bg-white shadow-sm">
          <div className="border-b border-[#E9DCC4] bg-[#FDFBF7] p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              {/* AVATAR */}

              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-[#E9DCC4] bg-[#F8F3E8] font-serif text-2xl font-medium text-[#968052]">
                {iniciais}
              </div>

              {/* INFORMAÇÕES */}

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#968052]">
                  Minha conta
                </p>

                <h1 className="mt-2 font-serif text-3xl text-[#211C14] sm:text-4xl">
                  Olá, {primeiroNome}
                </h1>

                <p className="mt-2 text-sm leading-6 text-[#756C5C]">
                  Acompanhe seus pedidos e gerencie sua conta Aurelia.
                </p>
              </div>

              <Link
                to="/configuracoes"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#D8C9AE] bg-white px-5 py-3 text-sm font-medium text-[#211C14] transition hover:border-[#968052] hover:bg-[#F8F3E8]"
              >
                <Settings size={17} />
                Configurações
              </Link>
            </div>
          </div>

          {/* DADOS BÁSICOS */}

          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F8F3E8]">
                <Mail size={16} className="text-[#968052]" />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-[#8B8171]">
                  E-mail
                </p>

                <p className="truncate text-sm font-medium text-[#211C14]">
                  {usuario.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F8F3E8]">
                <Phone size={16} className="text-[#968052]" />
              </div>

              <div>
                <p className="text-xs text-[#8B8171]">
                  Telefone
                </p>

                <p className="text-sm font-medium text-[#211C14]">
                  {usuario.telefone || "Não informado"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* RESUMO DA CONTA */}

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="font-serif text-2xl text-[#211C14]">
              Resumo da conta
            </h2>

            <p className="mt-1 text-sm text-[#756C5C]">
              Veja rapidamente a situação dos seus pedidos.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <CardResumo
              Icone={ShoppingBag}
              titulo="Pedidos"
              valor={resumoPedidos.total}
              descricao="Pedidos realizados"
            />

            <CardResumo
              Icone={Clock3}
              titulo="Em andamento"
              valor={resumoPedidos.emAndamento}
              descricao="Pedidos em processamento"
            />

            <CardResumo
              Icone={CheckCircle2}
              titulo="Entregues"
              valor={resumoPedidos.entregues}
              descricao="Pedidos concluídos"
            />
          </div>
        </section>

        {/* CONTEÚDO */}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* PEDIDOS RECENTES */}

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl text-[#211C14]">
                  Pedidos recentes
                </h2>

                <p className="mt-1 text-sm text-[#756C5C]">
                  Acompanhe suas compras mais recentes.
                </p>
              </div>

              {pedidos.length > 0 && (
                <Link
                  to="/pedidos"
                  className="hidden shrink-0 text-sm font-medium text-[#968052] transition hover:text-[#211C14] sm:block"
                >
                  Ver todos
                </Link>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#E9DCC4] bg-white shadow-sm">
              {pedidosRecentes.length > 0 ? (
                <div className="divide-y divide-[#E9DCC4]">
                  {pedidosRecentes.map((pedido) => (
                    <PedidoRecente key={pedido.id} pedido={pedido} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center px-6 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F8F3E8]">
                    <ShoppingBag size={24} className="text-[#968052]" />
                  </div>

                  <h3 className="mt-4 font-serif text-xl text-[#211C14]">
                    Nenhum pedido ainda
                  </h3>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-[#756C5C]">
                    Quando você realizar sua primeira compra, ela aparecerá aqui.
                  </p>

                  <Link
                    to="/produtos"
                    className="mt-5 rounded-lg bg-[#211C14] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#968052]"
                  >
                    Explorar produtos
                  </Link>
                </div>
              )}

              {pedidos.length > 0 && (
                <div className="border-t border-[#E9DCC4] p-4 sm:hidden">
                  <Link
                    to="/historico-compras"
                    className="flex items-center justify-center gap-2 text-sm font-medium text-[#968052]"
                  >
                    Ver todos os pedidos
                    <ChevronRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* ATALHOS */}

          <aside>
            <div className="mb-4">
              <h2 className="font-serif text-2xl text-[#211C14]">
                Minha conta
              </h2>

              <p className="mt-1 text-sm text-[#756C5C]">
                Acesse rapidamente suas informações.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#E9DCC4] bg-white shadow-sm">
              <Atalho
                to="/pedidos"
                Icone={Package}
                titulo="Meus pedidos"
                descricao="Histórico e acompanhamento"
              />

              <Atalho
                to="/historico-compras"
                Icone={Clock3}
                titulo="Histórico de compras"
                descricao="Entregues, cancelados e reembolsados"
              />

              <Atalho
                to="/devolucoes-reembolso"
                Icone={RotateCcw}
                titulo="Devoluções e reembolso"
                descricao="Solicite e acompanhe suas devoluções"
              />

              <Atalho
                to="/enderecos"
                Icone={MapPin}
                titulo="Meus endereços"
                descricao="Endereços de entrega"
              />

              <Atalho
                to="/favoritos"
                Icone={Heart}
                titulo="Favoritos"
                descricao="Produtos que você salvou"
              />

              <Atalho
                to="/configuracoes"
                Icone={Settings}
                titulo="Configurações"
                descricao="Dados pessoais e segurança"
                ultimo
              />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

// ==========================================
// CARD DE RESUMO
// ==========================================

function CardResumo({ Icone, titulo, valor, descricao }) {
  return (
    <div className="rounded-2xl border border-[#E9DCC4] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8F3E8]">
          <Icone size={19} className="text-[#968052]" />
        </div>

        <span className="font-serif text-3xl text-[#211C14]">
          {valor}
        </span>
      </div>

      <h3 className="mt-5 text-sm font-semibold text-[#211C14]">
        {titulo}
      </h3>

      <p className="mt-1 text-xs leading-5 text-[#756C5C]">
        {descricao}
      </p>
    </div>
  );
}

// ==========================================
// PEDIDO RECENTE
// ==========================================

function PedidoRecente({ pedido }) {
  const configuracao = STATUS_PEDIDO[pedido.status] || {
    texto: pedido.status || "Pedido",
    Icone: Package,
  };

  const Icone = configuracao.Icone;

  const quantidadeItens = Array.isArray(pedido.itens)
    ? pedido.itens.reduce(
        (total, item) => total + Number(item.quantidade || 0),
        0
      )
    : 0;

  return (
    <Link
      to={`/pedidos/${pedido.id}`}
      className="group block p-5 transition hover:bg-[#FDFBF7] sm:p-6"
    >
      <div className="flex gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F8F3E8]">
          <Icone size={19} className="text-[#968052]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#211C14]">
                Pedido #{reduzirId(pedido.id)}
              </p>

              <p className="mt-1 text-xs text-[#756C5C]">
                {formatarData(pedido.criadoEm)}

                {quantidadeItens > 0 && (
                  <>
                    {" "}• {quantidadeItens}{" "}
                    {quantidadeItens === 1 ? "item" : "itens"}
                  </>
                )}
              </p>
            </div>

            <p className="shrink-0 text-sm font-semibold text-[#211C14]">
              {formatarMoeda(pedido.valorTotal)}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <span className="inline-flex items-center rounded-full bg-[#F8F3E8] px-3 py-1.5 text-xs font-medium text-[#756C5C]">
              {configuracao.texto}
            </span>

            <span className="flex items-center gap-1 text-xs font-medium text-[#968052] transition group-hover:text-[#211C14]">
              Ver detalhes
              <ChevronRight size={15} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ==========================================
// ATALHO
// ==========================================

function Atalho({ to, Icone, titulo, descricao, ultimo = false }) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-4 p-5 transition hover:bg-[#FDFBF7] ${!ultimo ? "border-b border-[#E9DCC4]" : ""}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F8F3E8]">
        <Icone size={18} className="text-[#968052]" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#211C14]">
          {titulo}
        </p>

        <p className="mt-0.5 text-xs text-[#756C5C]">
          {descricao}
        </p>
      </div>

      <ChevronRight
        size={18}
        className="shrink-0 text-[#B9A77F] transition group-hover:translate-x-1 group-hover:text-[#968052]"
      />
    </Link>
  );
}
