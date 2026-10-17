import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Tags,
  Package,
  Eye,
  EyeOff,
  ChevronDown,
  Image as ImageIcon,
  Check,
  AlertCircle,
} from "lucide-react";
import Sidebar from "../../components/admin/Sidebar.jsx";
import AdminHeader from "../../components/admin/AdminHeader.jsx";

const CATEGORIAS_INICIAIS = [
  {
    id: 1,
    nome: "Anéis",
    slug: "aneis",
    descricao: "Anéis para ocasiões especiais e uso diário.",
    produtos: 18,
    status: "Ativa",
    cor: "#E8DCC7",
  },
  {
    id: 2,
    nome: "Colares",
    slug: "colares",
    descricao: "Colares delicados, correntes e pingentes.",
    produtos: 24,
    status: "Ativa",
    cor: "#D7E2D2",
  },
  {
    id: 3,
    nome: "Brincos",
    slug: "brincos",
    descricao: "Brincos clássicos e contemporâneos.",
    produtos: 32,
    status: "Ativa",
    cor: "#E8D6D8",
  },
  {
    id: 4,
    nome: "Pulseiras",
    slug: "pulseiras",
    descricao: "Pulseiras e braceletes para complementar o visual.",
    produtos: 12,
    status: "Ativa",
    cor: "#D9DDEE",
  },
  {
    id: 5,
    nome: "Noivas",
    slug: "noivas",
    descricao: "Peças selecionadas para noivas e cerimônias.",
    produtos: 9,
    status: "Inativa",
    cor: "#F0E7C9",
  },
];

const vazia = {
  nome: "",
  slug: "",
  descricao: "",
  status: "Ativa",
  cor: "#E8DCC7",
};

const inputClass =
  "w-full rounded-xl border border-[#E9DCC4] bg-[#FCFAF5] px-3.5 py-3 text-sm text-[#211C14] outline-none transition placeholder:text-[#A39A8A] focus:border-[#968052] focus:ring-2 focus:ring-[#968052]/10";

function gerarSlug(valor) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function Modal({ titulo, subtitulo, onClose, children, largura = "max-w-xl" }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#211C14]/45 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className={`max-h-[92vh] w-full ${largura} overflow-y-auto rounded-2xl border border-[#E9DCC4] bg-[#FCFAF5] shadow-2xl`}>
        <div className="flex items-start justify-between gap-4 border-b border-[#E9DCC4] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-[#211C14]">{titulo}</h2>
            {subtitulo && <p className="mt-1 text-sm text-[#817766]">{subtitulo}</p>}
          </div>
          <button onClick={onClose} aria-label="Fechar" className="rounded-lg p-2 text-[#817766] transition hover:bg-[#F1E9DC] hover:text-[#211C14]">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </section>
    </div>
  );
}

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState(CATEGORIAS_INICIAIS);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todas");
  const [modalAberto, setModalAberto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [categoriaExcluindo, setCategoriaExcluindo] = useState(null);
  const [form, setForm] = useState(vazia);
  const [erro, setErro] = useState("");

  const categoriasFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return categorias.filter((categoria) => {
      const correspondeBusca =
        !termo ||
        categoria.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
        categoria.slug.includes(termo) ||
        categoria.descricao.toLocaleLowerCase("pt-BR").includes(termo);
      const correspondeStatus =
        filtroStatus === "Todas" || categoria.status === filtroStatus;
      return correspondeBusca && correspondeStatus;
    });
  }, [categorias, busca, filtroStatus]);

  const totalProdutos = categorias.reduce((soma, categoria) => soma + categoria.produtos, 0);
  const totalAtivas = categorias.filter((categoria) => categoria.status === "Ativa").length;
  const totalInativas = categorias.filter((categoria) => categoria.status === "Inativa").length;

  function abrirNovaCategoria() {
    setCategoriaEditando(null);
    setForm(vazia);
    setErro("");
    setModalAberto(true);
  }

  function abrirEdicao(categoria) {
    setCategoriaEditando(categoria);
    setForm({
      nome: categoria.nome,
      slug: categoria.slug,
      descricao: categoria.descricao,
      status: categoria.status,
      cor: categoria.cor,
    });
    setErro("");
    setModalAberto(true);
  }

  function alterarCampo(campo, valor) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
      ...(campo === "nome" && !categoriaEditando ? { slug: gerarSlug(valor) } : {}),
    }));
  }

  function salvarCategoria(event) {
    event.preventDefault();
    const nome = form.nome.trim();
    const slug = gerarSlug(form.slug);
    if (!nome) {
      setErro("Informe o nome da categoria.");
      return;
    }
    if (!slug) {
      setErro("Informe um slug válido.");
      return;
    }
    const slugDuplicado = categorias.some(
      (categoria) =>
        categoria.slug === slug && categoria.id !== categoriaEditando?.id
    );
    if (slugDuplicado) {
      setErro("Já existe uma categoria com esse slug.");
      return;
    }

    const dados = {
      nome,
      slug,
      descricao: form.descricao.trim(),
      status: form.status,
      cor: form.cor,
    };

    if (categoriaEditando) {
      setCategorias((atuais) =>
        atuais.map((categoria) =>
          categoria.id === categoriaEditando.id
            ? { ...categoria, ...dados }
            : categoria
        )
      );
    } else {
      setCategorias((atuais) => [
        ...atuais,
        { id: Date.now(), ...dados, produtos: 0 },
      ]);
    }
    setModalAberto(false);
  }

  function alternarStatus(categoria) {
    setCategorias((atuais) =>
      atuais.map((item) =>
        item.id === categoria.id
          ? { ...item, status: item.status === "Ativa" ? "Inativa" : "Ativa" }
          : item
      )
    );
  }

  function excluirCategoria() {
    if (!categoriaExcluindo) return;
    if (categoriaExcluindo.produtos > 0) {
      setErroExclusao("Esta categoria possui produtos vinculados. Remova ou mova os produtos antes de excluí-la.");
      return;
    }
    setCategorias((atuais) => atuais.filter((item) => item.id !== categoriaExcluindo.id));
    setCategoriaExcluindo(null);
    setErroExclusao("");
  }

  const [erroExclusao, setErroExclusao] = useState("");

  return (
    <div className="min-h-screen bg-[#F8F3E8] text-[#211C14]">
      <Sidebar />
      <main className="min-h-screen lg:pl-[260px]">
        <AdminHeader
          title="Categorias"
          subtitle="Organize as categorias que ajudam seus clientes a encontrar as peças."
        />
        <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-[#817766]">Catálogo / Categorias</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Gerenciar categorias</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#817766]">
                Crie, edite e organize as categorias exibidas na loja AURELIA.
              </p>
            </div>
            <button onClick={abrirNovaCategoria} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#211C14] px-5 py-3 text-sm font-medium text-[#FCFAF5] shadow-sm transition hover:bg-[#3A3023]">
              <Plus size={17} /> Nova categoria
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Categorias cadastradas", value: categorias.length, icon: Tags },
              { label: "Categorias ativas", value: totalAtivas, icon: Eye },
              { label: "Categorias inativas", value: totalInativas, icon: EyeOff },
              { label: "Produtos categorizados", value: totalProdutos, icon: Package },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-[#E9DCC4] bg-[#FCFAF5] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-[#817766]">{label}</p>
                    <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
                  </div>
                  <span className="rounded-xl bg-[#F1E9DC] p-3 text-[#968052]"><Icon size={20} /></span>
                </div>
              </div>
            ))}
          </div>

          <section className="overflow-hidden rounded-2xl border border-[#E9DCC4] bg-[#FCFAF5]">
            <div className="flex flex-col gap-3 border-b border-[#E9DCC4] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <h2 className="font-semibold">Todas as categorias</h2>
                <p className="mt-1 text-sm text-[#817766]">{categoriasFiltradas.length} resultado(s)</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 sm:w-64">
                  <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A907F]" />
                  <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar categoria..." className={`${inputClass} pl-9`} />
                </div>
                <div className="relative sm:w-40">
                  <select value={filtroStatus} onChange={(event) => setFiltroStatus(event.target.value)} className={`${inputClass} appearance-none pr-9`}>
                    <option>Todas</option>
                    <option>Ativa</option>
                    <option>Inativa</option>
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#817766]" />
                </div>
              </div>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {categoriasFiltradas.map((categoria) => (
                <article key={categoria.id} className="rounded-xl border border-[#E9DCC4] p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E9DCC4]" style={{ backgroundColor: categoria.cor }}>
                      <Tags size={20} className="text-[#5B4A2D]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{categoria.nome}</h3>
                        <Status status={categoria.status} />
                      </div>
                      <p className="mt-1 text-xs text-[#968052]">/{categoria.slug}</p>
                      <p className="mt-2 text-sm text-[#817766]">{categoria.descricao || "Sem descrição"}</p>
                      <p className="mt-2 text-xs text-[#817766]">{categoria.produtos} produto(s)</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2 border-t border-[#E9DCC4] pt-3">
                    <button onClick={() => abrirEdicao(categoria)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#E9DCC4] px-3 py-2 text-sm hover:bg-[#F1E9DC]"><Pencil size={15} /> Editar</button>
                    <button onClick={() => alternarStatus(categoria)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#E9DCC4] px-3 py-2 text-sm hover:bg-[#F1E9DC]">{categoria.status === "Ativa" ? <EyeOff size={15} /> : <Eye size={15} />}{categoria.status === "Ativa" ? "Desativar" : "Ativar"}</button>
                    <button onClick={() => { setCategoriaExcluindo(categoria); setErroExclusao(""); }} aria-label="Excluir categoria" className="rounded-lg border border-[#E9DCC4] px-3 py-2 text-[#9B4A3C] hover:bg-[#F8EAE6]"><Trash2 size={15} /></button>
                  </div>
                </article>
              ))}
              {categoriasFiltradas.length === 0 && <EmptyState />}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-[#F7F1E6] text-xs uppercase tracking-wide text-[#817766]">
                  <tr>
                    <th className="px-5 py-4 font-medium">Categoria</th>
                    <th className="px-5 py-4 font-medium">Slug</th>
                    <th className="px-5 py-4 font-medium">Produtos</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE5D5]">
                  {categoriasFiltradas.map((categoria) => (
                    <tr key={categoria.id} className="transition hover:bg-[#FAF6EE]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E9DCC4]" style={{ backgroundColor: categoria.cor }}>
                            <Tags size={19} className="text-[#5B4A2D]" />
                          </span>
                          <div>
                            <p className="font-medium">{categoria.nome}</p>
                            <p className="mt-1 max-w-xs truncate text-xs text-[#817766]">{categoria.descricao || "Sem descrição"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-[#817766]">/{categoria.slug}</td>
                      <td className="px-5 py-4">{categoria.produtos}</td>
                      <td className="px-5 py-4"><Status status={categoria.status} /></td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => abrirEdicao(categoria)} title="Editar" className="rounded-lg p-2 text-[#817766] hover:bg-[#F1E9DC] hover:text-[#211C14]"><Pencil size={16} /></button>
                          <button onClick={() => alternarStatus(categoria)} title={categoria.status === "Ativa" ? "Desativar" : "Ativar"} className="rounded-lg p-2 text-[#817766] hover:bg-[#F1E9DC] hover:text-[#211C14]">{categoria.status === "Ativa" ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                          <button onClick={() => { setCategoriaExcluindo(categoria); setErroExclusao(""); }} title="Excluir" className="rounded-lg p-2 text-[#9B4A3C] hover:bg-[#F8EAE6]"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categoriasFiltradas.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-12"><EmptyState /></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          <p className="text-xs leading-5 text-[#968B79]">
            Observação: esta versão usa dados demonstrativos no estado do React. As alterações ainda não são salvas no Supabase.
          </p>
        </div>
      </main>

      {modalAberto && (
        <Modal
          titulo={categoriaEditando ? "Editar categoria" : "Nova categoria"}
          subtitulo={categoriaEditando ? "Atualize os dados da categoria." : "Cadastre uma categoria para organizar os produtos."}
          onClose={() => setModalAberto(false)}
        >
          <form onSubmit={salvarCategoria} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nome da categoria *</label>
              <input autoFocus value={form.nome} onChange={(event) => alterarCampo("nome", event.target.value)} placeholder="Ex.: Anéis" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Slug *</label>
              <input value={form.slug} onChange={(event) => alterarCampo("slug", event.target.value)} placeholder="ex.: aneis" className={inputClass} />
              <p className="mt-1.5 text-xs text-[#968B79]">Identificador usado em URLs. Letras minúsculas e hífens.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Descrição</label>
              <textarea rows={3} value={form.descricao} onChange={(event) => alterarCampo("descricao", event.target.value)} placeholder="Descreva brevemente esta categoria..." className={`${inputClass} resize-y`} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Status</label>
                <select value={form.status} onChange={(event) => alterarCampo("status", event.target.value)} className={inputClass}>
                  <option>Ativa</option>
                  <option>Inativa</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Cor de identificação</label>
                <div className="flex items-center gap-3 rounded-xl border border-[#E9DCC4] bg-[#FCFAF5] p-2.5">
                  <input type="color" value={form.cor} onChange={(event) => alterarCampo("cor", event.target.value)} className="h-9 w-10 cursor-pointer rounded border-0 bg-transparent" />
                  <span className="text-sm text-[#817766]">{form.cor.toUpperCase()}</span>
                  <span className="ml-auto h-7 w-7 rounded-lg border border-[#E9DCC4]" style={{ backgroundColor: form.cor }} />
                </div>
              </div>
            </div>
            {erro && <p className="flex items-start gap-2 rounded-xl bg-[#F8EAE6] p-3 text-sm text-[#9B4A3C]"><AlertCircle size={17} className="mt-0.5 shrink-0" />{erro}</p>}
            <div className="flex flex-col-reverse gap-3 border-t border-[#E9DCC4] pt-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setModalAberto(false)} className="rounded-xl border border-[#E9DCC4] px-4 py-2.5 text-sm font-medium hover:bg-[#F1E9DC]">Cancelar</button>
              <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#211C14] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#3A3023]"><Check size={16} />{categoriaEditando ? "Salvar alterações" : "Criar categoria"}</button>
            </div>
          </form>
        </Modal>
      )}

      {categoriaExcluindo && (
        <Modal titulo="Excluir categoria?" subtitulo={`Você está prestes a excluir "${categoriaExcluindo.nome}".`} onClose={() => setCategoriaExcluindo(null)} largura="max-w-md">
          <div className="space-y-4">
            {erroExclusao ? (
              <p className="rounded-xl bg-[#F8EAE6] p-3 text-sm leading-5 text-[#9B4A3C]">{erroExclusao}</p>
            ) : (
              <p className="text-sm leading-6 text-[#817766]">
                {categoriaExcluindo.produtos > 0
                  ? `Esta categoria possui ${categoriaExcluindo.produtos} produto(s). Para evitar deixar produtos sem categoria, ela não poderá ser excluída nesta tela demonstrativa.`
                  : "Essa ação removerá a categoria desta lista demonstrativa."}
              </p>
            )}
            <div className="flex justify-end gap-3 border-t border-[#E9DCC4] pt-4">
              <button onClick={() => { setCategoriaExcluindo(null); setErroExclusao(""); }} className="rounded-xl border border-[#E9DCC4] px-4 py-2.5 text-sm hover:bg-[#F1E9DC]">Fechar</button>
              {categoriaExcluindo.produtos === 0 && !erroExclusao && <button onClick={excluirCategoria} className="rounded-xl bg-[#9B4A3C] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#803A30]">Excluir categoria</button>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Status({ status }) {
  const ativa = status === "Ativa";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${ativa ? "bg-[#E4EEE2] text-[#466A42]" : "bg-[#F1E9DC] text-[#817766]"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${ativa ? "bg-[#62845B]" : "bg-[#A39A8A]"}`} />
      {status}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <span className="rounded-2xl bg-[#F1E9DC] p-3 text-[#968052]"><ImageIcon size={22} /></span>
      <p className="mt-3 font-medium">Nenhuma categoria encontrada</p>
      <p className="mt-1 text-sm text-[#817766]">Tente alterar a busca ou o filtro de status.</p>
    </div>
  );
}
