
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Layers3,
  Package,
  Link2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
} from "lucide-react";

import Sidebar from "../../components/admin/Sidebar.jsx";
import AdminHeader from "../../components/admin/AdminHeader.jsx";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/materiais`;

const LIMITE_POR_PAGINA = 8;

const CORES = {
  fundo: "#FCFAF5",
  creme: "#F8F3E8",
  dourado: "#968052",
  douradoClaro: "#E9DCC4",
  texto: "#211C14",
};

async function requisicaoMateriais(url, opcoes = {}) {
  const resposta = await fetch(url, {
    ...opcoes,
    headers: {
      ...(opcoes.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...opcoes.headers,
    },
  });

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(
      dados.mensagem || "Não foi possível concluir a operação."
    );
  }

  return dados;
}

function formatarData(data) {
  if (!data) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(data));
}

function obterMensagemErro(erro) {
  if (erro.message === "Failed to fetch") {
    return "Não foi possível conectar ao servidor. Verifique se o backend está funcionando.";
  }

  return erro.message || "Ocorreu um erro inesperado.";
}

function ModalMaterial({
  aberto,
  material,
  salvando,
  onFechar,
  onSalvar,
}) {
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");

  const editando = Boolean(material);

  useEffect(() => {
    if (aberto) {
      setNome(material?.nome ?? "");
      setErro("");
    }
  }, [aberto, material]);

  if (!aberto) return null;

  async function handleSubmit(evento) {
    evento.preventDefault();

    const nomeNormalizado = nome.trim();

    if (nomeNormalizado.length < 2) {
      setErro("O nome deve possuir pelo menos 2 caracteres.");
      return;
    }

    if (nomeNormalizado.length > 100) {
      setErro("O nome deve possuir no máximo 100 caracteres.");
      return;
    }

    setErro("");

    try {
      await onSalvar({ nome: nomeNormalizado });
    } catch (erroSalvar) {
      setErro(obterMensagemErro(erroSalvar));
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#211C14]/50 p-4 backdrop-blur-[3px]"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !salvando) {
          onFechar();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-material"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#E9DCC4] bg-[#FCFAF5] shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-[#E9DCC4] px-6 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F8F3E8] text-[#968052]">
              <Layers3 size={21} strokeWidth={1.7} />
            </div>

            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#968052]">
                Catálogo AURELIA
              </p>

              <h2
                id="titulo-modal-material"
                className="font-serif text-2xl text-[#211C14]"
              >
                {editando ? "Editar material" : "Novo material"}
              </h2>

              <p className="mt-1 text-sm text-[#81786A]">
                {editando
                  ? "Atualize as informações do material."
                  : "Cadastre um material para associá-lo aos produtos."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            disabled={salvando}
            aria-label="Fechar modal"
            className="rounded-lg p-2 text-[#81786A] transition hover:bg-[#F0E8D9] hover:text-[#211C14] disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-7">
          <div>
            <label
              htmlFor="nome-material"
              className="mb-2 block text-sm font-medium text-[#211C14]"
            >
              Nome do material
              <span className="ml-1 text-[#968052]">*</span>
            </label>

            <input
              id="nome-material"
              type="text"
              autoFocus
              maxLength={100}
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              placeholder="Ex.: Ouro, Prata, Pérolas..."
              className="w-full rounded-xl border border-[#E2D8C6] bg-white px-4 py-3 text-sm text-[#211C14] outline-none transition placeholder:text-[#B3AA9A] focus:border-[#968052] focus:ring-2 focus:ring-[#968052]/15"
            />

            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-[#81786A]">
                Utilize um nome claro e fácil de identificar.
              </p>

              <span className="text-xs tabular-nums text-[#A59A87]">
                {nome.length}/100
              </span>
            </div>
          </div>

          {erro && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-[#E9DCC4] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="rounded-xl border border-[#E2D8C6] px-5 py-3 text-sm font-medium text-[#5F5648] transition hover:bg-[#F8F3E8] disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#968052] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#796640] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando && (
                <RefreshCw size={16} className="animate-spin" />
              )}
              {salvando
                ? "Salvando..."
                : editando
                  ? "Salvar alterações"
                  : "Cadastrar material"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ModalExclusao({
  material,
  excluindo,
  onFechar,
  onConfirmar,
}) {
  const [erro, setErro] = useState("");

  useEffect(() => {
    setErro("");
  }, [material]);

  if (!material) return null;

  async function handleExcluir() {
    setErro("");

    try {
      await onConfirmar(material);
    } catch (erroExclusao) {
      setErro(obterMensagemErro(erroExclusao));
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#211C14]/50 p-4 backdrop-blur-[3px]">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="titulo-exclusao-material"
        className="w-full max-w-md rounded-2xl border border-[#E9DCC4] bg-[#FCFAF5] p-6 shadow-2xl sm:p-7"
      >
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Trash2 size={22} />
        </div>

        <h2
          id="titulo-exclusao-material"
          className="font-serif text-2xl text-[#211C14]"
        >
          Excluir material
        </h2>

        <p className="mt-3 text-sm leading-6 text-[#81786A]">
          Tem certeza de que deseja excluir{" "}
          <strong className="font-semibold text-[#211C14]">
            {material.nome}
          </strong>
          ? Essa ação não poderá ser desfeita.
        </p>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#F8F3E8] p-3 text-xs leading-5 text-[#74664D]">
          <CircleHelp size={16} className="mt-0.5 shrink-0" />
          <span>
            Se o material estiver associado a produtos, o servidor impedirá
            a exclusão para preservar os relacionamentos.
          </span>
        </div>

        {erro && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onFechar}
            disabled={excluindo}
            className="rounded-xl border border-[#E2D8C6] px-5 py-3 text-sm font-medium text-[#5F5648] transition hover:bg-[#F8F3E8] disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleExcluir}
            disabled={excluindo}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {excluindo && (
              <RefreshCw size={16} className="animate-spin" />
            )}
            {excluindo ? "Excluindo..." : "Excluir material"}
          </button>
        </div>
      </section>
    </div>
  );
}

function CartaoResumo({ titulo, valor, descricao, icone: Icon }) {
  return (
    <article className="flex min-w-0 items-center gap-4 rounded-2xl border border-[#E9DCC4] bg-white p-5 shadow-sm shadow-[#211C14]/[0.02] sm:p-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F8F3E8] text-[#968052]">
        <Icon size={22} strokeWidth={1.7} />
      </div>

      <div className="min-w-0">
        <p className="text-sm text-[#81786A]">{titulo}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-[#211C14]">
          {valor}
        </p>
        <p className="mt-1 truncate text-xs text-[#A59A87]">{descricao}</p>
      </div>
    </article>
  );
}

export default function AdminMateriais() {
  const [materiais, setMateriais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);

  const [modalAberto, setModalAberto] = useState(false);
  const [materialEditando, setMaterialEditando] = useState(null);
  const [materialExcluindo, setMaterialExcluindo] = useState(null);

  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [notificacao, setNotificacao] = useState("");

  const carregarMateriais = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const dados = await requisicaoMateriais(API_URL);
      setMateriais(dados.materiais ?? []);
    } catch (erroCarregamento) {
      setErro(obterMensagemErro(erroCarregamento));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarMateriais();
  }, [carregarMateriais]);

  useEffect(() => {
    if (!notificacao) return undefined;

    const timeout = setTimeout(() => setNotificacao(""), 3500);

    return () => clearTimeout(timeout);
  }, [notificacao]);

  const materiaisFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return materiais.filter((material) =>
      material.nome?.toLocaleLowerCase("pt-BR").includes(termo)
    );
  }, [materiais, busca]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(materiaisFiltrados.length / LIMITE_POR_PAGINA)
  );

  const paginaAtual = Math.min(pagina, totalPaginas);

  const materiaisPaginados = materiaisFiltrados.slice(
    (paginaAtual - 1) * LIMITE_POR_PAGINA,
    paginaAtual * LIMITE_POR_PAGINA
  );

  const totalAssociacoes = materiais.reduce(
    (total, material) => total + (material.produtos?.length ?? 0),
    0
  );

  function abrirCadastro() {
    setMaterialEditando(null);
    setModalAberto(true);
  }

  function abrirEdicao(material) {
    setMaterialEditando(material);
    setModalAberto(true);
  }

  async function salvarMaterial(dados) {
    setSalvando(true);

    try {
      if (materialEditando) {
        await requisicaoMateriais(
          `${API_URL}/${materialEditando.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(dados),
          }
        );

        setNotificacao("Material atualizado com sucesso.");
      } else {
        await requisicaoMateriais(API_URL, {
          method: "POST",
          body: JSON.stringify(dados),
        });

        setNotificacao("Material cadastrado com sucesso.");
      }

      setModalAberto(false);
      setMaterialEditando(null);
      await carregarMateriais();
    } catch (erroSalvar) {
      throw erroSalvar;
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao(material) {
    setExcluindo(true);

    try {
      await requisicaoMateriais(`${API_URL}/${material.id}`, {
        method: "DELETE",
      });

      setMaterialExcluindo(null);
      setNotificacao("Material excluído com sucesso.");
      await carregarMateriais();
    } catch (erroExclusao) {
      throw erroExclusao;
    } finally {
      setExcluindo(false);
    }
  }

  const inicioItens =
    materiaisFiltrados.length === 0
      ? 0
      : (paginaAtual - 1) * LIMITE_POR_PAGINA + 1;

  const fimItens = Math.min(
    paginaAtual * LIMITE_POR_PAGINA,
    materiaisFiltrados.length
  );

  return (
    <div className="min-h-screen bg-[#FCFAF5] text-[#211C14]">
      <Sidebar />

      <div className="min-h-screen min-w-0 lg:pl-64">
        <AdminHeader />

        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 xl:px-10">
          {/* Cabeçalho da página */}
          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-medium text-[#968052]">
                <span>Administração</span>
                <span className="text-[#C8B99C]">/</span>
                <span className="text-[#81786A]">Materiais</span>
              </div>

              <h1 className="font-serif text-3xl tracking-tight text-[#211C14] sm:text-4xl">
                Materiais
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#81786A]">
                Gerencie os materiais das joias e organize as características
                dos produtos do seu catálogo.
              </p>
            </div>

            <button
              type="button"
              onClick={abrirCadastro}
              className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-[#968052] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#796640] focus:outline-none focus:ring-2 focus:ring-[#968052]/40 focus:ring-offset-2 md:self-auto"
            >
              <Plus size={18} />
              Novo material
            </button>
          </div>

          {/* Notificação */}
          {notificacao && (
            <div
              role="status"
              className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            >
              <CheckCircle2 size={19} />
              {notificacao}
              <button
                type="button"
                aria-label="Fechar notificação"
                onClick={() => setNotificacao("")}
                className="ml-auto rounded-md p-1 hover:bg-emerald-100"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Indicadores */}
          <section
            aria-label="Resumo dos materiais"
            className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            <CartaoResumo
              titulo="Materiais cadastrados"
              valor={carregando ? "—" : materiais.length}
              descricao="Total no catálogo"
              icone={Layers3}
            />

            <CartaoResumo
              titulo="Materiais encontrados"
              valor={carregando ? "—" : materiaisFiltrados.length}
              descricao="Considerando a pesquisa"
              icone={Search}
            />

            <CartaoResumo
              titulo="Associações com produtos"
              valor={carregando ? "—" : totalAssociacoes}
              descricao="Vínculos retornados pela API"
              icone={Link2}
            />
          </section>

          {/* Área da tabela */}
          <section className="overflow-hidden rounded-2xl border border-[#E9DCC4] bg-white shadow-sm shadow-[#211C14]/[0.03]">
            <div className="flex flex-col gap-4 border-b border-[#EEE6D8] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-serif text-xl text-[#211C14]">
                  Todos os materiais
                </h2>
                <p className="mt-1 text-sm text-[#81786A]">
                  Consulte e gerencie os materiais cadastrados.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative w-full sm:w-72">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A59A87]"
                  />
                  <input
                    type="search"
                    value={busca}
                    onChange={(evento) => {
                      setBusca(evento.target.value);
                      setPagina(1);
                    }}
                    placeholder="Buscar material..."
                    aria-label="Buscar material pelo nome"
                    className="h-11 w-full rounded-xl border border-[#E2D8C6] bg-[#FCFAF5] pl-10 pr-4 text-sm text-[#211C14] outline-none transition placeholder:text-[#A59A87] focus:border-[#968052] focus:ring-2 focus:ring-[#968052]/10"
                  />
                </div>

                <button
                  type="button"
                  onClick={carregarMateriais}
                  disabled={carregando}
                  aria-label="Atualizar lista"
                  title="Atualizar lista"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E2D8C6] px-4 text-sm font-medium text-[#5F5648] transition hover:bg-[#F8F3E8] disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={carregando ? "animate-spin" : ""}
                  />
                  <span className="sm:hidden">Atualizar</span>
                </button>
              </div>
            </div>

            {erro && (
              <div className="m-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:m-6 sm:flex-row sm:items-center">
                <AlertCircle
                  size={20}
                  className="shrink-0 text-red-600"
                />

                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">
                    Não foi possível carregar os materiais.
                  </p>
                  <p className="mt-1 text-sm text-red-700">{erro}</p>
                </div>

                <button
                  type="button"
                  onClick={carregarMateriais}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {carregando ? (
              <div className="flex min-h-72 flex-col items-center justify-center gap-4 px-6 text-center">
                <RefreshCw
                  size={26}
                  className="animate-spin text-[#968052]"
                />
                <div>
                  <p className="text-sm font-medium text-[#211C14]">
                    Carregando materiais...
                  </p>
                  <p className="mt-1 text-xs text-[#81786A]">
                    Consultando o catálogo da AURELIA.
                  </p>
                </div>
              </div>
            ) : erro ? null : materiaisFiltrados.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8F3E8] text-[#968052]">
                  {busca ? (
                    <Search size={27} strokeWidth={1.5} />
                  ) : (
                    <Layers3 size={27} strokeWidth={1.5} />
                  )}
                </div>

                <h3 className="font-serif text-xl text-[#211C14]">
                  {busca
                    ? "Nenhum material encontrado"
                    : "Seu catálogo está começando"}
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-[#81786A]">
                  {busca
                    ? "Tente pesquisar por outro nome."
                    : "Cadastre o primeiro material para começar a organizar as características das suas joias."}
                </p>

                {!busca && (
                  <button
                    type="button"
                    onClick={abrirCadastro}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#968052] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#796640]"
                  >
                    <Plus size={17} />
                    Cadastrar material
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Tabela para telas médias e grandes */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[650px] border-collapse text-left">
                    <thead>
                      <tr className="bg-[#FCFAF5] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#81786A]">
                        <th className="px-6 py-4">Material</th>
                        <th className="px-6 py-4">Identificador</th>
                        <th className="px-6 py-4">Cadastrado em</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#F0E9DD]">
                      {materiaisPaginados.map((material) => (
                        <tr
                          key={material.id}
                          className="transition hover:bg-[#FCFAF5]/80"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E9DCC4] bg-[#F8F3E8] text-[#968052]">
                                <Layers3 size={19} strokeWidth={1.7} />
                              </div>

                              <div>
                                <p className="text-sm font-medium text-[#211C14]">
                                  {material.nome}
                                </p>
                                <p className="mt-1 text-xs text-[#A59A87]">
                                  Material de produto
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="rounded-lg border border-[#E9DCC4] bg-[#FCFAF5] px-2.5 py-1.5 font-mono text-xs text-[#74664D]">
                              #{material.id}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-sm text-[#81786A]">
                            {formatarData(material.criadoEm)}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => abrirEdicao(material)}
                                title="Editar material"
                                aria-label={`Editar ${material.nome}`}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E9DCC4] text-[#968052] transition hover:bg-[#F8F3E8]"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() => setMaterialExcluindo(material)}
                                title="Excluir material"
                                aria-label={`Excluir ${material.nome}`}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-600 transition hover:bg-red-50"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cards para celular */}
                <div className="divide-y divide-[#F0E9DD] md:hidden">
                  {materiaisPaginados.map((material) => (
                    <article
                      key={material.id}
                      className="p-4 sm:p-5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E9DCC4] bg-[#F8F3E8] text-[#968052]">
                          <Layers3 size={20} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-words text-sm font-semibold text-[#211C14]">
                              {material.nome}
                            </h3>

                            <span className="rounded-md bg-[#F8F3E8] px-2 py-1 font-mono text-[10px] text-[#74664D]">
                              #{material.id}
                            </span>
                          </div>

                          <p className="mt-2 text-xs text-[#81786A]">
                            Cadastrado em: {formatarData(material.criadoEm)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => abrirEdicao(material)}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#E9DCC4] px-3 py-2.5 text-sm font-medium text-[#74664D] transition hover:bg-[#F8F3E8]"
                        >
                          <Pencil size={15} />
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => setMaterialExcluindo(material)}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-100 px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 size={15} />
                          Excluir
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Paginação */}
                <div className="flex flex-col gap-4 border-t border-[#EEE6D8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="text-xs text-[#81786A]">
                    Exibindo{" "}
                    <strong className="font-semibold text-[#211C14]">
                      {inicioItens}–{fimItens}
                    </strong>{" "}
                    de{" "}
                    <strong className="font-semibold text-[#211C14]">
                      {materiaisFiltrados.length}
                    </strong>{" "}
                    materiais
                  </p>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <button
                      type="button"
                      disabled={paginaAtual <= 1}
                      onClick={() =>
                        setPagina((atual) => Math.max(1, atual - 1))
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E2D8C6] px-3 py-2 text-xs font-medium text-[#5F5648] transition hover:bg-[#F8F3E8] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={15} />
                      Anterior
                    </button>

                    <span className="whitespace-nowrap text-xs text-[#81786A]">
                      Página{" "}
                      <strong className="text-[#211C14]">
                        {paginaAtual}
                      </strong>{" "}
                      de {totalPaginas}
                    </span>

                    <button
                      type="button"
                      disabled={paginaAtual >= totalPaginas}
                      onClick={() =>
                        setPagina((atual) =>
                          Math.min(totalPaginas, atual + 1)
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E2D8C6] px-3 py-2 text-xs font-medium text-[#5F5648] transition hover:bg-[#F8F3E8] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Próxima
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          <p className="mt-5 text-center text-xs text-[#A59A87]">
            AURELIA · Administração do catálogo
          </p>
        </main>
      </div>

      <ModalMaterial
        aberto={modalAberto}
        material={materialEditando}
        salvando={salvando}
        onFechar={() => {
          if (!salvando) {
            setModalAberto(false);
            setMaterialEditando(null);
          }
        }}
        onSalvar={salvarMaterial}
      />

      <ModalExclusao
        material={materialExcluindo}
        excluindo={excluindo}
        onFechar={() => {
          if (!excluindo) setMaterialExcluindo(null);
        }}
        onConfirmar={confirmarExclusao}
      />
    </div>
  );
}
