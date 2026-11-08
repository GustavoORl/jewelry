
import { useCallback, useEffect, useState } from "react";

import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Eye,
  FilePenLine,
  FilePlus2,
  FileText,
  ImagePlus,
  LayoutTemplate,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import PostagemVisual from "../../components/PostagemVisual.jsx";
import EditorBlocos, {
  UploadEditorial,
} from "../../components/admin/EditorBlocos.jsx";

import Sidebar from "../../components/admin/Sidebar.jsx";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import { apiFetch } from "../../services/api.js";

// ============================================================
// CONFIGURAÇÕES
// ============================================================

const criarFormularioInicial = () => ({
  titulo: "",
  resumo: "",
  conteudo: "",
  imagemUrl: "",
  publicada: false,
  blocos: [],
  estilo: "CLASSICO",
});

const inputClass =
  "mt-2 w-full rounded-xl border border-[#E5D9C6] bg-white px-4 py-3 text-sm text-[#211C14] outline-none transition placeholder:text-[#A49A8C] focus:border-[#968052] focus:ring-2 focus:ring-[#968052]/10 disabled:opacity-60";

const labelClass =
  "block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71675B]";

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function CabecalhoSecao({ numero, titulo, descricao, Icone }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7F2E8] text-[#968052]">
        <Icone size={18} strokeWidth={1.7} />
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A47B43]">
          Etapa {numero}
        </p>

        <h3 className="text-sm font-semibold text-[#211C14]">
          {titulo}
        </h3>

        {descricao && (
          <p className="mt-1 text-xs leading-relaxed text-[#81776A]">
            {descricao}
          </p>
        )}
      </div>
    </div>
  );
}

function CartaoResumo({ Icone, titulo, valor }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[20px] border border-[#EAE0D1] bg-white p-4 sm:p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F7F2E8] text-[#968052]">
        <Icone size={19} strokeWidth={1.7} />
      </div>

      <div>
        <p className="text-[11px] text-[#918679]">
          {titulo}
        </p>

        <p className="mt-1 text-xl font-semibold text-[#211C14]">
          {valor}
        </p>
      </div>
    </div>
  );
}

function CardPostagem({
  postagem,
  ocupado,
  onEditar,
  onExcluir,
}) {
  const publicada = Boolean(postagem.publicada);

  return (
    <article className="overflow-hidden rounded-[22px] border border-[#EAE0D1] bg-white transition-colors hover:border-[#C9B692]">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
        {/* CAPA */}

        <div className="h-40 w-full shrink-0 overflow-hidden rounded-[16px] bg-[#F7F2E8] sm:h-[112px] sm:w-[140px]">
          {postagem.imagemUrl ? (
            <img
              src={postagem.imagemUrl}
              alt={`Capa de ${postagem.titulo}`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#B9A77F]">
              <BookOpen size={29} strokeWidth={1.4} />
            </div>
          )}
        </div>

        {/* INFORMAÇÕES */}

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${
                publicada
                  ? "border-[#D1E5DE] bg-[#EAF3F0] text-[#537B72]"
                  : "border-[#E9DCC4] bg-[#F7F2E8] text-[#968052]"
              }`}
            >
              {publicada ? (
                <CheckCircle2 size={12} />
              ) : (
                <FilePenLine size={12} />
              )}

              {publicada ? "Publicada" : "Rascunho"}
            </span>

            <span className="text-[10px] uppercase tracking-[0.12em] text-[#A49A8C]">
              {postagem.estilo === "REVISTA"
                ? "Estilo revista"
                : "Estilo clássico"}
            </span>
          </div>

          <h3 className="line-clamp-2 text-sm font-semibold leading-relaxed text-[#211C14]">
            {postagem.titulo}
          </h3>

          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#81776A]">
            {postagem.resumo || "Sem resumo cadastrado."}
          </p>
        </div>
      </div>

      {/* AÇÕES */}

      <div className="flex flex-wrap items-center gap-2 border-t border-[#F0EADF] px-4 py-3 sm:px-5">
        <button
          type="button"
          disabled={ocupado}
          onClick={() => onEditar(postagem)}
          className="inline-flex items-center gap-2 rounded-full border border-[#E5D9C6] px-4 py-2.5 text-xs font-medium text-[#514635] transition hover:border-[#968052] hover:bg-[#F7F2E8] disabled:opacity-50"
        >
          <Pencil size={14} />
          Editar postagem
        </button>

        <button
          type="button"
          disabled={ocupado}
          onClick={() => onExcluir(postagem)}
          className="inline-flex items-center gap-2 rounded-full border border-[#F0D8D5] px-4 py-2.5 text-xs font-medium text-[#A45B52] transition hover:bg-[#FBEEEE] disabled:opacity-50"
        >
          <Trash2 size={14} />
          Excluir
        </button>
      </div>
    </article>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function AdminEditorial() {
  const [postagens, setPostagens] = useState([]);
  const [form, setForm] = useState(criarFormularioInicial);

  const [produtos, setProdutos] = useState([]);

  const [previa, setPrevia] = useState(true);
  const [uploadando, setUploadando] = useState(false);

  const [id, setId] = useState(null);

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [ocupado, setOcupado] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const [mobileOpen, setMobileOpen] = useState(false);

  // ============================================================
  // CARREGAR POSTAGENS
  // ============================================================

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);

      const resposta = await apiFetch("/admin/editorial");

      setPostagens(
        Array.isArray(resposta?.postagens)
          ? resposta.postagens
          : []
      );

      setErro("");
    } catch (error) {
      console.error("Erro ao carregar postagens:", error);

      setErro(
        error.message ||
          "Não foi possível carregar as postagens."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // ============================================================
  // CARREGAR PRODUTOS
  // ============================================================

  useEffect(() => {
    let ativo = true;

    async function carregarProdutos() {
      try {
        const resposta = await apiFetch("/admin/produtos");

        if (!ativo) return;

        const lista = Array.isArray(resposta)
          ? resposta
          : resposta?.produtos ||
            resposta?.dados?.produtos ||
            resposta?.dados ||
            [];

        setProdutos(Array.isArray(lista) ? lista : []);
      } catch (error) {
        if (!ativo) return;

        console.error("Erro ao carregar produtos:", error);

        setErro(
          "Não foi possível carregar os produtos para os cards."
        );
      }
    }

    carregarProdutos();

    return () => {
      ativo = false;
    };
  }, []);

  // ============================================================
  // ATUALIZAR CAMPO
  // ============================================================

  function atualizarCampo(campo, valor) {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  // ============================================================
  // LIMPAR FORMULÁRIO
  // ============================================================

  function limparFormulario() {
    setForm(criarFormularioInicial());
    setId(null);
    setErro("");
  }

  // ============================================================
  // EDITAR POSTAGEM
  // ============================================================

  function editarPostagem(postagem) {
    setId(postagem.id);

    setForm({
      titulo: postagem.titulo || "",
      resumo: postagem.resumo || "",
      conteudo: postagem.conteudo || "",
      imagemUrl: postagem.imagemUrl || "",
      publicada: Boolean(postagem.publicada),
      blocos: Array.isArray(postagem.blocos)
        ? postagem.blocos
        : [],
      estilo: postagem.estilo || "CLASSICO",
    });

    setPrevia(true);
    setErro("");
    setMensagem("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ============================================================
  // MODELOS DE INSPIRAÇÃO
  // ============================================================

  function aplicarInspiracao(tipo) {
    const inspiracoes = {
      cuidados: {
        titulo: "Guia de cuidados",
        resumo:
          "Pequenos detalhes para celebrar suas joias e preservar a beleza de cada peça.",
        conteudo:
          "Cada joia conta uma história. Descubra cuidados especiais para valorizar suas peças favoritas.",
        blocos: [
          {
            tipo: "TITULO",
            texto: "Cuidados que preservam o brilho",
          },
          {
            tipo: "CITACAO",
            texto: "Guarde memórias, preserve o brilho.",
          },
        ],
      },

      estilo: {
        titulo: "Inspiração de estilo",
        resumo:
          "Descubra novas formas de combinar suas joias e expressar sua personalidade.",
        conteudo:
          "As joias acompanham momentos especiais e traduzem a personalidade de quem as usa.",
        blocos: [
          {
            tipo: "TITULO",
            texto: "Encontre sua combinação favorita",
          },
          {
            tipo: "CITACAO",
            texto: "Seu estilo vive nos detalhes.",
          },
        ],
      },
    };

    const inspiracao = inspiracoes[tipo];

    if (!inspiracao) return;

    setForm((anterior) => ({
      ...anterior,
      titulo: anterior.titulo || inspiracao.titulo,
      resumo: anterior.resumo || inspiracao.resumo,
      conteudo: anterior.conteudo || inspiracao.conteudo,
      blocos: [
        ...anterior.blocos,
        ...inspiracao.blocos,
      ].slice(0, 40),
    }));
  }

  // ============================================================
  // SALVAR POSTAGEM
  // ============================================================

  async function salvar(event) {
    event.preventDefault();

    if (ocupado || uploadando) return;

    if (
      form.blocos.some(
        (bloco) =>
          bloco.tipo === "IMAGEM" && !bloco.url
      )
    ) {
      setErro(
        "Envie a foto dos blocos de imagem ou remova os blocos vazios."
      );

      return;
    }

    setOcupado(true);
    setErro("");
    setMensagem("");

    try {
      await apiFetch(
        id
          ? `/admin/editorial/${id}`
          : "/admin/editorial",
        {
          method: id ? "PUT" : "POST",
          body: JSON.stringify(form),
        }
      );

      limparFormulario();

      setMensagem("Postagem salva com sucesso.");

      await carregar();
    } catch (error) {
      console.error("Erro ao salvar postagem:", error);

      setErro(
        error.message ||
          "Não foi possível salvar a postagem."
      );
    } finally {
      setOcupado(false);
    }
  }

  // ============================================================
  // EXCLUIR POSTAGEM
  // ============================================================

  async function excluir(postagem) {
    if (
      !window.confirm(
        `Excluir a postagem "${postagem.titulo}"?`
      )
    ) {
      return;
    }

    setOcupado(true);
    setErro("");
    setMensagem("");

    try {
      await apiFetch(
        `/admin/editorial/${postagem.id}`,
        {
          method: "DELETE",
        }
      );

      if (id === postagem.id) {
        limparFormulario();
      }

      setMensagem("Postagem excluída com sucesso.");

      await carregar();
    } catch (error) {
      console.error("Erro ao excluir postagem:", error);

      setErro(
        error.message ||
          "Não foi possível excluir a postagem."
      );
    } finally {
      setOcupado(false);
    }
  }

  // ============================================================
  // ESTATÍSTICAS
  // ============================================================

  const totalPostagens = postagens.length;

  const publicadas = postagens.filter(
    (postagem) => postagem.publicada
  ).length;

  const rascunhos = totalPostagens - publicadas;

  // ============================================================
  // RENDERIZAÇÃO
  // ============================================================

  return (
    <div className="min-h-screen bg-[#FCFAF6] text-[#211C14]">
      {/* SIDEBAR */}

      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="lg:pl-64">
        {/* HEADER */}

        <AdminHeader
          title="Editorial / Blog"
          subtitle="Gerencie histórias, inspirações e conteúdos da AURELIA."
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="mx-auto max-w-[1400px] px-5 pb-16 pt-8 sm:px-8">
          {/* ===================================== */}
          {/* CABEÇALHO */}
          {/* ===================================== */}

          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A47B43]">
                <Sparkles size={14} />
                Ateliê de histórias
              </p>

              <h1 className="font-serif text-3xl tracking-tight text-[#211C14] sm:text-4xl">
                Editorial / Blog
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#81776A]">
                Crie conteúdos inspiradores e compartilhe
                histórias que valorizam cada detalhe da marca.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPrevia((anterior) => !anterior)}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E5D9C6] bg-white px-5 py-3 text-xs font-medium text-[#514635] transition hover:border-[#968052] hover:bg-[#F7F2E8]"
            >
              {previa ? (
                <>
                  <FileText size={16} />
                  Ver postagens
                </>
              ) : (
                <>
                  <Eye size={16} />
                  Pré-visualizar
                </>
              )}
            </button>
          </div>

          {/* ===================================== */}
          {/* ESTATÍSTICAS */}
          {/* ===================================== */}

          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            <CartaoResumo
              Icone={BookOpen}
              titulo="Total de postagens"
              valor={totalPostagens}
            />

            <CartaoResumo
              Icone={CheckCircle2}
              titulo="Publicadas"
              valor={publicadas}
            />

            <CartaoResumo
              Icone={FilePenLine}
              titulo="Rascunhos"
              valor={rascunhos}
            />
          </div>

          {/* ===================================== */}
          {/* ERROS E MENSAGENS */}
          {/* ===================================== */}

          {erro && (
            <div
              role="alert"
              className="mb-6 flex flex-col gap-3 rounded-[18px] border border-[#F0D8D5] bg-[#FBEEEE] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0 text-[#A45B52]"
                />

                <p className="text-xs leading-relaxed text-[#A45B52]">
                  {erro}
                </p>
              </div>

              <button
                type="button"
                onClick={carregar}
                className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-[#A45B52] hover:opacity-70"
              >
                <RefreshCw size={14} />
                Tentar novamente
              </button>
            </div>
          )}

          {mensagem && (
            <div
              role="status"
              className="mb-6 flex items-center gap-3 rounded-[18px] border border-[#D1E5DE] bg-[#EAF3F0] p-4 text-xs font-medium text-[#537B72]"
            >
              <CheckCircle2 size={19} />
              {mensagem}
            </div>
          )}

          {/* ===================================== */}
          {/* EDITOR + PRÉVIA / LISTAGEM */}
          {/* ===================================== */}

          <div className="grid items-start gap-6 xl:grid-cols-2">
            {/* COLUNA DO EDITOR */}

            <form
              onSubmit={salvar}
              className="min-w-0 overflow-hidden rounded-[24px] border border-[#EAE0D1] bg-white"
            >
              {/* CABEÇALHO DO EDITOR */}

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0EADF] px-5 py-5 sm:px-7">
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#A47B43]">
                    Gerenciar conteúdo
                  </p>

                  <h2 className="font-serif text-2xl text-[#211C14]">
                    {id ? "Editar postagem" : "Nova postagem"}
                  </h2>
                </div>

                {id && (
                  <button
                    type="button"
                    onClick={limparFormulario}
                    disabled={ocupado || uploadando}
                    className="inline-flex items-center gap-2 rounded-full border border-[#E5D9C6] px-3.5 py-2 text-[11px] font-medium text-[#81776A] transition hover:bg-[#F7F2E8] disabled:opacity-50"
                  >
                    <X size={14} />
                    Cancelar edição
                  </button>
                )}
              </div>

              <fieldset
                disabled={ocupado || uploadando}
                className="min-w-0"
              >
                {/* ===================================== */}
                {/* ETAPA 1 - INFORMAÇÕES */}
                {/* ===================================== */}

                <section className="border-b border-[#F0EADF] p-5 sm:p-7">
                  <CabecalhoSecao
                    numero="01"
                    titulo="Informações da postagem"
                    descricao="Defina o título, o resumo e a introdução do artigo."
                    Icone={FileText}
                  />

                  <div className="space-y-5">
                    <div>
                      <label
                        htmlFor="editorial-titulo"
                        className={labelClass}
                      >
                        Título da postagem
                      </label>

                      <input
                        id="editorial-titulo"
                        type="text"
                        required
                        minLength={3}
                        maxLength={160}
                        value={form.titulo}
                        onChange={(event) =>
                          atualizarCampo(
                            "titulo",
                            event.target.value
                          )
                        }
                        placeholder="Ex.: A beleza está nos detalhes"
                        className={inputClass}
                      />

                      <p className="mt-1.5 text-right text-[10px] text-[#A49A8C]">
                        {form.titulo.length}/160
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="editorial-resumo"
                        className={labelClass}
                      >
                        Resumo
                      </label>

                      <textarea
                        id="editorial-resumo"
                        required
                        minLength={10}
                        maxLength={500}
                        rows={3}
                        value={form.resumo}
                        onChange={(event) =>
                          atualizarCampo(
                            "resumo",
                            event.target.value
                          )
                        }
                        placeholder="Uma breve descrição para despertar o interesse do leitor..."
                        className={`${inputClass} resize-y`}
                      />

                      <p className="mt-1.5 text-right text-[10px] text-[#A49A8C]">
                        {form.resumo.length}/500
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="editorial-conteudo"
                        className={labelClass}
                      >
                        Introdução
                      </label>

                      <textarea
                        id="editorial-conteudo"
                        required
                        minLength={20}
                        maxLength={50000}
                        rows={9}
                        value={form.conteudo}
                        onChange={(event) =>
                          atualizarCampo(
                            "conteudo",
                            event.target.value
                          )
                        }
                        placeholder="Comece contando a história por trás da sua inspiração..."
                        className={`${inputClass} resize-y leading-relaxed`}
                      />

                      <p className="mt-1.5 text-right text-[10px] text-[#A49A8C]">
                        {form.conteudo.length} caracteres
                      </p>
                    </div>
                  </div>
                </section>

                {/* ===================================== */}
                {/* ETAPA 2 - CAPA */}
                {/* ===================================== */}

                <section className="border-b border-[#F0EADF] p-5 sm:p-7">
                  <CabecalhoSecao
                    numero="02"
                    titulo="Imagem de capa"
                    descricao="Escolha a imagem principal que representa sua história."
                    Icone={ImagePlus}
                  />

                  <div className="rounded-[18px] border border-[#EAE0D1] bg-[#FAF7F1] p-4">
                    <UploadEditorial
                      label="Escolher arquivo da capa"
                      onErro={setErro}
                      onOcupado={setUploadando}
                      onImagem={(url) =>
                        atualizarCampo("imagemUrl", url)
                      }
                    />

                    {form.imagemUrl ? (
                      <div className="mt-4">
                        <div className="aspect-[16/9] overflow-hidden rounded-[14px] bg-[#EEE7DC]">
                          <img
                            src={form.imagemUrl}
                            alt="Pré-visualização da capa"
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-[11px] text-[#81776A]">
                            Capa selecionada
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              atualizarCampo("imagemUrl", "")
                            }
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A45B52] transition hover:opacity-70"
                          >
                            <Trash2 size={13} />
                            Remover capa
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 flex min-h-[150px] flex-col items-center justify-center rounded-[14px] border border-dashed border-[#D8CBB7] bg-white/70 px-5 py-7 text-center">
                        <ImagePlus
                          size={27}
                          strokeWidth={1.4}
                          className="text-[#B9A77F]"
                        />

                        <p className="mt-3 text-xs font-medium text-[#514635]">
                          Nenhuma capa selecionada
                        </p>

                        <p className="mt-1 text-[11px] text-[#918679]">
                          A imagem aparecerá na listagem e no artigo.
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                {/* ===================================== */}
                {/* ETAPA 3 - ESTILO */}
                {/* ===================================== */}

                <section className="border-b border-[#F0EADF] p-5 sm:p-7">
                  <CabecalhoSecao
                    numero="03"
                    titulo="Estilo de apresentação"
                    descricao="Escolha como o artigo será apresentado aos leitores."
                    Icone={LayoutTemplate}
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        valor: "CLASSICO",
                        titulo: "Clássico",
                        descricao:
                          "Leitura elegante e minimalista.",
                      },
                      {
                        valor: "REVISTA",
                        titulo: "Revista",
                        descricao:
                          "Capa e conteúdo em destaque.",
                      },
                    ].map((estilo) => {
                      const selecionado =
                        form.estilo === estilo.valor;

                      return (
                        <label
                          key={estilo.valor}
                          className={`flex cursor-pointer flex-col rounded-[16px] border p-4 transition ${
                            selecionado
                              ? "border-[#BDA679] bg-[#FAF7F1]"
                              : "border-[#EAE0D1] bg-white hover:border-[#C9B692]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-[#211C14]">
                              {estilo.titulo}
                            </span>

                            <input
                              type="radio"
                              name="estilo-editorial"
                              value={estilo.valor}
                              checked={selecionado}
                              onChange={() =>
                                atualizarCampo(
                                  "estilo",
                                  estilo.valor
                                )
                              }
                              className="accent-[#968052]"
                            />
                          </div>

                          <p className="mt-2 text-xs leading-relaxed text-[#81776A]">
                            {estilo.descricao}
                          </p>
                        </label>
                      );
                    })}
                  </div>
                </section>

                {/* ===================================== */}
                {/* ETAPA 4 - INSPIRAÇÕES */}
                {/* ===================================== */}

                <section className="border-b border-[#F0EADF] p-5 sm:p-7">
                  <CabecalhoSecao
                    numero="04"
                    titulo="Inspirações"
                    descricao="Use uma sugestão como ponto de partida para o conteúdo."
                    Icone={Sparkles}
                  />

                  <div className="rounded-[18px] bg-[#F8F3E8] p-4">
                    <p className="mb-3 text-xs text-[#81776A]">
                      Escolha uma inspiração para preencher
                      campos vazios e adicionar blocos.
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          aplicarInspiracao("cuidados")
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-[#DCCDAF] bg-white px-4 py-2.5 text-[11px] font-medium text-[#514635] transition hover:border-[#968052] hover:bg-[#F7F2E8]"
                      >
                        <Plus size={13} />
                        Guia de cuidados
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          aplicarInspiracao("estilo")
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-[#DCCDAF] bg-white px-4 py-2.5 text-[11px] font-medium text-[#514635] transition hover:border-[#968052] hover:bg-[#F7F2E8]"
                      >
                        <Plus size={13} />
                        Inspiração de estilo
                      </button>
                    </div>
                  </div>
                </section>

                {/* ===================================== */}
                {/* ETAPA 5 - BLOCOS */}
                {/* ===================================== */}

                <section className="border-b border-[#F0EADF] p-5 sm:p-7">
                  <CabecalhoSecao
                    numero="05"
                    titulo="Conteúdo complementar"
                    descricao="Adicione títulos, imagens, citações e produtos à sua história."
                    Icone={FilePlus2}
                  />

                  <div className="min-w-0">
                    <EditorBlocos
                      blocos={form.blocos}
                      onChange={(blocos) =>
                        atualizarCampo("blocos", blocos)
                      }
                      produtos={produtos}
                      onErro={setErro}
                      onOcupado={setUploadando}
                    />
                  </div>
                </section>

                {/* ===================================== */}
                {/* PUBLICAÇÃO */}
                {/* ===================================== */}

                <section className="p-5 sm:p-7">
                  <div className="rounded-[18px] border border-[#EAE0D1] bg-[#FAF7F1] p-4 sm:p-5">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={form.publicada}
                        onChange={(event) =>
                          atualizarCampo(
                            "publicada",
                            event.target.checked
                          )
                        }
                        className="mt-1 h-4 w-4 shrink-0 accent-[#968052]"
                      />

                      <div>
                        <p className="text-sm font-semibold text-[#211C14]">
                          Publicar postagem
                        </p>

                        <p className="mt-1.5 text-xs leading-relaxed text-[#81776A]">
                          Quando ativado, o conteúdo ficará
                          disponível no editorial e no
                          carrossel da página inicial.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* BOTÕES */}

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="submit"
                      disabled={ocupado || uploadando}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#211C14] px-6 py-3.5 text-xs font-medium text-white transition hover:bg-[#4A3D2B] disabled:cursor-wait disabled:opacity-50"
                    >
                      {ocupado ? (
                        <>
                          <LoaderCircle
                            size={16}
                            className="animate-spin"
                          />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          {id
                            ? "Salvar alterações"
                            : "Salvar postagem"}
                        </>
                      )}
                    </button>

                    {id && (
                      <button
                        type="button"
                        onClick={limparFormulario}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E5D9C6] px-6 py-3.5 text-xs font-medium text-[#514635] transition hover:bg-[#F7F2E8]"
                      >
                        <X size={15} />
                        Cancelar
                      </button>
                    )}
                  </div>

                  <p className="mt-4 text-center text-[11px] text-[#918679]">
                    {form.publicada
                      ? "A postagem será publicada ao salvar."
                      : "A postagem será salva como rascunho."}
                  </p>
                </section>
              </fieldset>
            </form>

            {/* ===================================== */}
            {/* COLUNA DIREITA */}
            {/* ===================================== */}

            <section className="min-w-0">
              {previa ? (
                /* PRÉ-VISUALIZAÇÃO */

                <div className="xl:sticky xl:top-4">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#A47B43]">
                        Visualização
                      </p>

                      <h2 className="font-serif text-2xl text-[#211C14]">
                        Sua história, ao vivo
                      </h2>
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5D9C6] bg-white px-3 py-1.5 text-[10px] font-medium text-[#968052]">
                      <Eye size={13} />
                      Prévia
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-[24px] border border-[#EAE0D1] bg-white">
                    <div className="flex items-center justify-between border-b border-[#F0EADF] bg-[#FAF7F1] px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#D8CBB7]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#D8CBB7]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#D8CBB7]" />
                      </div>

                      <p className="text-[10px] uppercase tracking-[0.16em] text-[#968052]">
                        AURELIA EDITORIAL
                      </p>
                    </div>

                    <div className="max-h-[80vh] overflow-y-auto">
                      <PostagemVisual
                        postagem={form}
                        produtos={produtos}
                        previa
                      />
                    </div>
                  </div>

                  <p className="mt-3 text-center text-[11px] text-[#918679]">
                    Esta é uma prévia do conteúdo antes da publicação.
                  </p>
                </div>
              ) : (
                /* LISTAGEM */

                <div>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#A47B43]">
                        Biblioteca editorial
                      </p>

                      <h2 className="font-serif text-2xl text-[#211C14]">
                        Suas postagens
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={carregar}
                      disabled={carregando}
                      className="inline-flex items-center gap-2 rounded-full border border-[#E5D9C6] bg-white px-4 py-2.5 text-xs font-medium text-[#514635] transition hover:bg-[#F7F2E8] disabled:opacity-50"
                    >
                      <RefreshCw
                        size={14}
                        className={
                          carregando ? "animate-spin" : ""
                        }
                      />
                      Atualizar
                    </button>
                  </div>

                  {carregando ? (
                    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[22px] border border-[#EAE0D1] bg-white">
                      <LoaderCircle
                        size={29}
                        className="animate-spin text-[#968052]"
                      />

                      <p className="mt-4 text-xs text-[#81776A]">
                        Carregando postagens...
                      </p>
                    </div>
                  ) : postagens.length === 0 ? (
                    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[22px] border border-[#EAE0D1] bg-white px-6 py-12 text-center">
                      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#F7F2E8] text-[#968052]">
                        <BookOpen size={27} strokeWidth={1.5} />
                      </div>

                      <h3 className="font-serif text-xl text-[#211C14]">
                        Nenhuma postagem cadastrada
                      </h3>

                      <p className="mt-3 max-w-xs text-xs leading-relaxed text-[#81776A]">
                        Comece criando sua primeira história
                        no editor ao lado.
                      </p>

                      <button
                        type="button"
                        onClick={() => setPrevia(true)}
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#211C14] px-5 py-3 text-xs font-medium text-white transition hover:bg-[#4A3D2B]"
                      >
                        <Plus size={15} />
                        Criar postagem
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {postagens.map((postagem) => (
                        <CardPostagem
                          key={postagem.id}
                          postagem={postagem}
                          ocupado={ocupado || uploadando}
                          onEditar={editarPostagem}
                          onExcluir={excluir}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
