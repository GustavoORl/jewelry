import { useEffect, useMemo, useState } from "react";

import Sidebar from "../../components/admin/Sidebar.jsx";

import AdminHeader from "../../components/admin/AdminHeader.jsx";

import {

  Package,

  Search,

  Plus,

  SlidersHorizontal,

  ArrowUpDown,

  Pencil,

  Trash2,

  Eye,

  CircleAlert,

  Check,

  X,

  ChevronLeft,

  ChevronRight,

  RefreshCw,

} from "lucide-react";




const API_URL = import.meta.env.VITE_API_URL;

async function requisicao(endpoint, opcoes = {}) {
  if (!API_URL) {
    throw new Error(
      "A variável VITE_API_URL não está configurada no arquivo .env do frontend."
    );
  }

  const token = sessionStorage.getItem("aurora_token");
  const ehFormData = opcoes.body instanceof FormData;

  const response = await fetch(
    `${API_URL.replace(/\/$/, "")}${endpoint}`,
    {
      ...opcoes,
      headers: {
        ...(!ehFormData && opcoes.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opcoes.headers,
      },
    }
  );

  if (response.status === 204) return null;

  const texto = await response.text();
  let resultado = null;

  if (texto) {
    try {
      resultado = JSON.parse(texto);
    } catch {
      resultado = { mensagem: texto };
    }
  }

  if (!response.ok) {
    throw new Error(
      resultado?.mensagem ||
      resultado?.message ||
      `Erro na requisição (${response.status}).`
    );
  }

  return resultado;
}

const currency = (value) =>

  new Intl.NumberFormat("pt-BR", {

    style: "currency",

    currency: "BRL",

  }).format(Number(value) || 0);



const imagemPadrao =

  "https\://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=160&q=80";



function obterNomeCategoria(produto) {

  return produto.categoria?.nome || "Sem categoria";

}



function obterImagem(produto) {

  return produto.imagens?.[0]?.url || imagemPadrao;

}



function obterStatus(produto) {

  return produto.ativo ? "Ativo" : "Inativo";

}



function ProductModal({

  product,

  categories,

  onClose,

  onSave,

  saving,

  error,

}) {

  const [form, setForm] = useState({

    nome: product?.nome || "",

    slug: product?.slug || "",

    descricao: product?.descricao || "",

    categoriaId: product?.categoriaId || product?.categoria?.id || "",

    preco: product?.preco != null ? String(product.preco) : "",

    estoque: product?.estoque != null ? String(product.estoque) : "0",

  });

  const [imagem, setImagem] = useState(null);
  const [imagemPreview, setImagemPreview] = useState(
    product?.imagens?.[0]?.url || ""
  );



  const [slugManual, setSlugManual] = useState(Boolean(product?.slug));



  const update = (field, value) => {

    setForm((current) => {

      const updated = { ...current, [field]: value };



      if (field === "nome" && !slugManual) {

        updated.slug = value

          .normalize("NFD")

          .replace(/[\u0300-\u036f]/g, "")

          .toLowerCase()

          .trim()

          .replace(/[^a-z0-9]+/g, "-")

          .replace(/^-|-$/g, "");

      }



      return updated;

    });

  };



  async function submit(event) {
    event.preventDefault();

    await onSave({
      nome: form.nome.trim(),
      slug: form.slug.trim(),
      descricao: form.descricao.trim(),
      categoriaId: form.categoriaId,
      preco: Number(form.preco),
      estoque: Number(form.estoque),
      imagem,
    });
  }



  return (

    <div

      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#211c14]/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"

      onMouseDown={(event) => {

        if (event.target === event.currentTarget && !saving) onClose();

      }}

    >

      <section

        role="dialog"

        aria-modal="true"

        aria-labelledby="product-modal-title"

        className="max-h-[92vh] w-full max-w-[620px] overflow-y-auto rounded-t-3xl border border-[#e9dcc4] bg-[#fcfaf5] p-5 shadow-2xl sm:rounded-3xl sm:p-7"

      >

        <div className="flex items-start justify-between gap-4">

          <div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a8151]">

              Catálogo AURORA

            </p>



            <h2

              id="product-modal-title"

              className="mt-2 font-serif text-2xl text-[#211c14]"

            >

              {product ? "Editar produto" : "Novo produto"}

            </h2>



            <p className="mt-1 text-xs text-[#8d8270]">

              Preencha as informações da peça para cadastrar no catálogo.

            </p>

          </div>



          <button

            type="button"

            onClick={onClose}

            disabled={saving}

            className="rounded-xl p-2 text-[#817664] hover:bg-[#f1e8d8] disabled:opacity-50"

            aria-label="Fechar formulário"

          >

            <X size={19} />

          </button>

        </div>



        {product && (

          <div className="mt-5 rounded-xl border border-[#e9dcc4] bg-[#f6f0e5] px-4 py-3 text-xs leading-5 text-[#817664]">

            Edite os dados do produto e salve as alterações no catálogo.

          </div>

        )}



        <form onSubmit={submit} className="mt-6 space-y-5">

          <fieldset disabled={saving}>

            <div className="grid gap-4 sm:grid-cols-2">

              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-[#615848]">
                  Imagem do produto
                </span>

                <div className="rounded-xl border border-dashed border-[#d8c6a6] bg-white p-4">
                  {imagemPreview && (
                    <img
                      src={imagemPreview}
                      alt="Prévia do produto"
                      className="mb-4 h-40 w-full rounded-lg object-cover"
                    />
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const arquivo = event.target.files?.[0];

                      if (!arquivo) return;

                      setImagem(arquivo);
                      setImagemPreview(URL.createObjectURL(arquivo));
                    }}
                    className="w-full text-xs text-[#615848] file:mr-3 file:rounded-lg file:border-0 file:bg-[#f1e8d8] file:px-3 file:py-2 file:text-xs file:font-medium file:text-[#5b4a2d]"
                  />

                  <p className="mt-2 text-[10px] text-[#978b78]">
                    Selecione uma imagem para a peça. Ao editar, deixe vazio para manter a imagem atual.
                  </p>
                </div>
              </label>

              <label className="block sm:col-span-2">

                <span className="mb-1.5 block text-xs font-medium text-[#615848]">

                  Nome do produto *

                </span>

                <input

                  required

                  minLength={2}

                  maxLength={150}

                  value={form.nome}

                  onChange={(event) => update("nome", event.target.value)}

                  placeholder="Ex.: Colar Aurora"

                  className="w-full rounded-xl border border-[#e5d9c5] bg-white px-3.5 py-3 text-sm outline-none placeholder:text-[#b0a696] focus:border-[#a88c56] focus:ring-2 focus:ring-[#a88c56]/15"

                />

              </label>



              <label className="block sm:col-span-2">

                <span className="mb-1.5 block text-xs font-medium text-[#615848]">

                  Slug do produto *

                </span>

                <input

                  required

                  minLength={2}

                  maxLength={180}

                  value={form.slug}

                  onChange={(event) => {

                    setSlugManual(true);

                    update("slug", event.target.value);

                  }}

                  placeholder="colar-aurora"

                  className="w-full rounded-xl border border-[#e5d9c5] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#a88c56]"

                />

                <span className="mt-1 block text-[10px] text-[#978b78]">

                  Usado para identificar o produto na URL.

                </span>

              </label>



              <label className="block sm:col-span-2">

                <span className="mb-1.5 block text-xs font-medium text-[#615848]">

                  Descrição *

                </span>

                <textarea

                  required

                  minLength={1}

                  rows={3}

                  value={form.descricao}

                  onChange={(event) => update("descricao", event.target.value)}

                  placeholder="Descreva os detalhes da joia..."

                  className="w-full resize-y rounded-xl border border-[#e5d9c5] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#a88c56]"

                />

              </label>



              <label className="block sm:col-span-2">

                <span className="mb-1.5 block text-xs font-medium text-[#615848]">

                  Categoria *

                </span>

                <select

                  required

                  value={form.categoriaId}

                  onChange={(event) =>

                    update("categoriaId", event.target.value)

                  }

                  className="w-full rounded-xl border border-[#e5d9c5] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#a88c56]"

                >

                  <option value="">Selecione uma categoria</option>

                  {categories

                    .filter((category) => category.ativo !== false)

                    .map((category) => (

                      <option key={category.id} value={category.id}>

                        {category.nome}

                      </option>

                    ))}

                </select>



                {categories.length === 0 && (

                  <span className="mt-1 block text-[10px] text-[#a4533f]">

                    Nenhuma categoria encontrada. Cadastre uma categoria antes

                    de adicionar produtos.

                  </span>

                )}

              </label>



              <label className="block">

                <span className="mb-1.5 block text-xs font-medium text-[#615848]">

                  Preço (R$) *

                </span>

                <input

                  required

                  min="0.01"

                  step="0.01"

                  type="number"

                  value={form.preco}

                  onChange={(event) => update("preco", event.target.value)}

                  placeholder="0,00"

                  className="w-full rounded-xl border border-[#e5d9c5] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#a88c56]"

                />

              </label>



              <label className="block">

                <span className="mb-1.5 block text-xs font-medium text-[#615848]">

                  Estoque *

                </span>

                <input

                  required

                  min="0"

                  step="1"

                  type="number"

                  value={form.estoque}

                  onChange={(event) => update("estoque", event.target.value)}

                  placeholder="0"

                  className="w-full rounded-xl border border-[#e5d9c5] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#a88c56]"

                />

              </label>

            </div>

          </fieldset>



          {error && (

            <div

              role="alert"

              className="rounded-xl border border-[#edc9be] bg-[#fdf0ec] px-4 py-3 text-xs leading-5 text-[#a4533f]"

            >

              {error}

            </div>

          )}



          <div className="flex flex-col-reverse gap-2 border-t border-[#eee5d6] pt-5 sm:flex-row sm:justify-end">

            <button

              type="button"

              onClick={onClose}

              disabled={saving}

              className="rounded-xl border border-[#e5d9c5] px-5 py-3 text-sm font-medium text-[#6e6659] transition hover:bg-[#f6f0e5]"

            >

              Fechar

            </button>



            <button

              type="submit"

              disabled={saving || categories.length === 0}

              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#211c14] px-5 py-3 text-sm font-medium text-[#fcfaf5] transition hover:bg-[#433827] disabled:cursor-not-allowed disabled:opacity-60"

            >

              {saving ? (

                <>

                  <RefreshCw size={16} className="animate-spin" />

                  Salvando...

                </>

              ) : (

                <>

                  <Check size={16} />

                  {product ? "Salvar alterações" : "Salvar produto"}

                </>

              )}

            </button>

          </div>

        </form>

      </section>

    </div>

  );

}



function StockBadge({ product }) {

  if (product.estoque === 0) {

    return (

      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f8e8e3] px-2.5 py-1 text-[10px] font-medium text-[#a4533f]">

        <span className="h-1.5 w-1.5 rounded-full bg-[#c46d55]" />

        Sem estoque

      </span>

    );

  }



  if (product.estoque <= 5) {

    return (

      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f7efd9] px-2.5 py-1 text-[10px] font-medium text-[#96732e]">

        <span className="h-1.5 w-1.5 rounded-full bg-[#b9954c]" />

        Estoque baixo · {product.estoque}

      </span>

    );

  }



  return (

    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f1e8] px-2.5 py-1 text-[10px] font-medium text-[#477254]">

      <span className="h-1.5 w-1.5 rounded-full bg-[#6d9a77]" />

      {product.estoque} unidades

    </span>

  );

}



export default function AdminProdutos() {

  const [mobileOpen, setMobileOpen] = useState(false);

  const [products, setProducts] = useState([]);

  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("Todas as categorias");

  const [status, setStatus] = useState("Todos os status");

  const [sort, setSort] = useState("recentes");

  const [modalProduct, setModalProduct] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);

  const [notice, setNotice] = useState("");

  const [error, setError] = useState("");

  const [loadError, setLoadError] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);



  async function carregarDados() {

    try {

      setLoading(true);

      setLoadError("");



      const [respostaProdutos, respostaCategorias] = await Promise.all([
        requisicao("/produtos"),
        requisicao("/categorias"),
      ]);

      const produtosRecebidos = Array.isArray(respostaProdutos)
        ? respostaProdutos
        : respostaProdutos?.produtos || respostaProdutos?.dados || [];
      const categoriasRecebidas = Array.isArray(respostaCategorias)
        ? respostaCategorias
        : respostaCategorias?.categorias || respostaCategorias?.dados || [];

      setProducts(produtosRecebidos);
      setCategories(categoriasRecebidas);

    } catch (erro) {

      setLoadError(

        erro.message || "Não foi possível carregar os dados do catálogo."

      );

    } finally {

      setLoading(false);

    }

  }



  useEffect(() => {

    carregarDados();

  }, []);



  const filteredProducts = useMemo(() => {

    const termo = search.trim().toLowerCase();



    const result = products.filter((product) => {

      const nomeCategoria = obterNomeCategoria(product);



      const matchesSearch =

        `${product.nome} ${product.slug} ${nomeCategoria}`

          .toLowerCase()

          .includes(termo);



      const matchesCategory =

        category === "Todas as categorias" ||

        nomeCategoria === category;



      const productStatus = obterStatus(product);



      const matchesStatus =

        status === "Todos os status" ||

        (status === "Ativos" && productStatus === "Ativo") ||

        (status === "Inativos" && productStatus === "Inativo") ||

        (status === "Sem estoque" && Number(product.estoque) === 0);



      return matchesSearch && matchesCategory && matchesStatus;

    });



    if (sort === "nome") {

      result.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    }



    if (sort === "preco-maior") {

      result.sort((a, b) => Number(b.preco) - Number(a.preco));

    }



    if (sort === "preco-menor") {

      result.sort((a, b) => Number(a.preco) - Number(b.preco));

    }



    return result;

  }, [products, search, category, status, sort]);



  async function saveProduct(dados) {
    try {
      setSaving(true);
      setError("");

      const formData = new FormData();

      formData.append("nome", dados.nome);
      formData.append("slug", dados.slug);
      formData.append("descricao", dados.descricao);
      formData.append("categoriaId", dados.categoriaId);
      formData.append("preco", String(dados.preco));
      formData.append("estoque", String(dados.estoque));

      if (dados.imagem) {
        formData.append("imagem", dados.imagem);
      }

      if (modalProduct) {
        const resultado = await requisicao(
          `/produtos/${modalProduct.id}`,
          {
            method: "PATCH",
            body: formData,
          }
        );

        const produtoAtualizado = resultado?.produto || resultado;

        setProducts((items) =>
          items.map((item) =>
            item.id === modalProduct.id
              ? { ...item, ...produtoAtualizado }
              : item
          )
        );

        setNotice("Produto atualizado com sucesso.");
      } else {
        const resultado = await requisicao("/produtos", {
          method: "POST",
          body: formData,
        });

        const produtoCriado = resultado?.produto || resultado;

        if (produtoCriado?.id) {
          setProducts((items) => [produtoCriado, ...items]);
        } else {
          await carregarDados();
        }

        setNotice("Produto cadastrado com sucesso no catálogo.");
      }

      setModalOpen(false);
      setModalProduct(null);

      window.setTimeout(() => setNotice(""), 3000);
    } catch (erro) {
      setError(
        erro.message || "Não foi possível salvar o produto."
      );
    } finally {
      setSaving(false);
    }
  }



  async function alterarStatusProduto(product) {
    const novoStatus = !product.ativo;
    const acao = novoStatus ? "ativar" : "desativar";
    const confirmar = window.confirm(
      `Deseja ${acao} o produto "${product.nome}"?`
    );
    if (!confirmar) return;

    try {
      setError("");
      const resultado = await requisicao(`/produtos/${product.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ ativo: novoStatus }),
      });
      const produtoAtualizado = resultado?.produto || resultado;
      setProducts((items) => items.map((item) =>
        item.id === product.id
          ? { ...item, ...produtoAtualizado, ativo: novoStatus }
          : item
      ));
      setNotice(`Produto ${novoStatus ? "ativado" : "desativado"} com sucesso.`);
      window.setTimeout(() => setNotice(""), 3000);
    } catch (erro) {
      setError(erro.message || `Não foi possível ${acao} o produto.`);
    }
  }

  async function excluirProduto(product) {
    const confirmar = window.confirm(
      `Tem certeza de que deseja excluir "${product.nome}"? Essa ação não pode ser desfeita.`
    );
    if (!confirmar) return;

    try {
      setError("");
      await requisicao(`/produtos/${product.id}`, {
        method: "DELETE",
      });

      setProducts((items) => items.filter((item) => item.id !== product.id));
      setNotice("Produto excluído com sucesso.");
      window.setTimeout(() => setNotice(""), 3000);
    } catch (erro) {
      setError(erro.message || "Não foi possível excluir o produto.");
    }
  }

  const activeCount = products.filter(

    (product) => product.ativo && product.estoque > 0

  ).length;



  const lowStockCount = products.filter(

    (product) => product.ativo && product.estoque > 0 && product.estoque <= 5

  ).length;



  const outStockCount = products.filter(

    (product) => product.ativo && product.estoque === 0

  ).length;



  return (

    <div className="min-h-screen bg-[#f8f3e8] font-sans text-[#211c14]">

      <Sidebar

        mobileOpen={mobileOpen}

        onClose={() => setMobileOpen(false)}

      />



      <main className="min-h-screen lg:pl-[258px]">

        <AdminHeader

          title="Produtos"

          subtitle="Gerencie o catálogo da sua loja."

          onMenuClick={() => setMobileOpen(true)}

        />



        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10">

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a8151]">

                Seu catálogo

              </p>

              <h2 className="mt-2 font-serif text-[29px] tracking-[-0.035em] sm:text-[34px]">

                Todos os produtos

              </h2>

              <p className="mt-2 max-w-xl text-[12px] leading-5 text-[#8d8270]">

                Gerencie as peças, acompanhe o estoque e mantenha sua vitrine

                sempre impecável.

              </p>

            </div>



            <button

              onClick={() => {

                setModalProduct(null);

                setError("");

                setModalOpen(true);

              }}

              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#211c14] px-5 py-3 text-[12px] font-medium text-[#fcfaf5] shadow-sm transition hover:bg-[#433827]"

            >

              <Plus size={16} />

              Adicionar produto

            </button>

          </div>



          {loadError && (

            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[#edc9be] bg-[#fdf0ec] px-4 py-3 text-xs text-[#a4533f] sm:flex-row sm:items-center sm:justify-between">

              <p>{loadError}</p>

              <button

                onClick={carregarDados}

                className="inline-flex shrink-0 items-center gap-2 font-semibold underline underline-offset-4"

              >

                <RefreshCw size={13} />

                Tentar novamente

              </button>

            </div>

          )}



          {notice && (

            <div

              role="status"

              className="mt-4 flex items-center gap-2 rounded-xl border border-[#d5e5d5] bg-[#edf5ed] px-4 py-3 text-xs text-[#477254]"

            >

              <Check size={15} />

              {notice}

            </div>

          )}



          {error && !modalOpen && (

            <div

              role="alert"

              className="mt-4 flex items-center gap-2 rounded-xl border border-[#edc9be] bg-[#fdf0ec] px-4 py-3 text-xs text-[#a4533f]"

            >

              <CircleAlert size={15} />

              {error}

              <button

                className="ml-auto underline"

                onClick={() => setError("")}

              >

                Fechar

              </button>

            </div>

          )}



          <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">

            <article className="flex items-center gap-4 rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] p-4 sm:p-5">

              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1e8d8] text-[#8d7547]">

                <Package size={19} />

              </span>

              <div>

                <p className="text-[11px] text-[#8d8270]">Produtos ativos</p>

                <p className="mt-1 font-serif text-2xl">{activeCount}</p>

              </div>

            </article>



            <article className="flex items-center gap-4 rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] p-4 sm:p-5">

              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f7efd9] text-[#96732e]">

                <CircleAlert size={19} />

              </span>

              <div>

                <p className="text-[11px] text-[#8d8270]">Estoque baixo</p>

                <p className="mt-1 font-serif text-2xl">{lowStockCount}</p>

              </div>

            </article>



            <article className="flex items-center gap-4 rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] p-4 sm:p-5">

              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f8e8e3] text-[#a4533f]">

                <Package size={19} />

              </span>

              <div>

                <p className="text-[11px] text-[#8d8270]">Sem estoque</p>

                <p className="mt-1 font-serif text-2xl">{outStockCount}</p>

              </div>

            </article>

          </section>



          <section className="mt-5 overflow-hidden rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5]">

            <div className="flex flex-col gap-4 border-b border-[#eee5d6] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <h3 className="font-serif text-[19px]">

                  Catálogo de produtos

                </h3>

                <p className="mt-1 text-[11px] text-[#978b78]">

                  {loading

                    ? "Carregando catálogo..."

                    : `${filteredProducts.length} ${filteredProducts.length === 1

                      ? "produto encontrado"

                      : "produtos encontrados"

                    }`}

                </p>

              </div>



              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">

                <label className="relative block sm:min-w-[220px]">

                  <Search

                    size={15}

                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a09787]"

                  />

                  <input

                    value={search}

                    onChange={(event) => setSearch(event.target.value)}

                    placeholder="Buscar produto..."

                    className="w-full rounded-xl border border-[#e9dcc4] bg-white py-2.5 pl-9 pr-3 text-[11px] outline-none placeholder:text-[#b0a696] focus:border-[#a88c56]"

                  />

                </label>



                <label className="relative">

                  <SlidersHorizontal

                    size={14}

                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8d78]"

                  />

                  <select

                    value={category}

                    onChange={(event) => setCategory(event.target.value)}

                    aria-label="Filtrar categoria"

                    className="w-full appearance-none rounded-xl border border-[#e9dcc4] bg-white py-2.5 pl-9 pr-8 text-[11px] text-[#6e6659] outline-none focus:border-[#a88c56]"

                  >

                    <option>Todas as categorias</option>

                    {categories.map((item) => (

                      <option key={item.id} value={item.nome}>

                        {item.nome}

                      </option>

                    ))}

                  </select>

                </label>



                <label>

                  <select

                    value={status}

                    onChange={(event) => setStatus(event.target.value)}

                    aria-label="Filtrar status"

                    className="w-full appearance-none rounded-xl border border-[#e9dcc4] bg-white px-3 py-2.5 pr-8 text-[11px] text-[#6e6659] outline-none focus:border-[#a88c56]"

                  >

                    <option>Todos os status</option>

                    <option>Ativos</option>

                    <option>Inativos</option>

                    <option>Sem estoque</option>

                  </select>

                </label>



                <label className="relative">

                  <ArrowUpDown

                    size={13}

                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8d78]"

                  />

                  <select

                    value={sort}

                    onChange={(event) => setSort(event.target.value)}

                    aria-label="Ordenar produtos"

                    className="w-full appearance-none rounded-xl border border-[#e9dcc4] bg-white py-2.5 pl-8 pr-8 text-[11px] text-[#6e6659] outline-none focus:border-[#a88c56]"

                  >

                    <option value="recentes">Mais recentes</option>

                    <option value="nome">Nome A–Z</option>

                    <option value="preco-menor">Menor preço</option>

                    <option value="preco-maior">Maior preço</option>

                  </select>

                </label>

              </div>

            </div>



            <div className="overflow-x-auto">

              <table className="w-full min-w-[820px] border-collapse text-left">

                <thead>

                  <tr className="border-b border-[#eee5d6] bg-[#faf7f0] text-[9px] uppercase tracking-[0.13em] text-[#a09787]">

                    <th className="px-5 py-3.5 font-medium">Produto</th>

                    <th className="px-4 py-3.5 font-medium">Categoria</th>

                    <th className="px-4 py-3.5 font-medium">Preço</th>

                    <th className="px-4 py-3.5 font-medium">Estoque</th>

                    <th className="px-4 py-3.5 font-medium">Status</th>

                    <th className="px-4 py-3.5 text-right font-medium">

                      Ações

                    </th>

                  </tr>

                </thead>



                <tbody>

                  {loading ? (

                    <tr>

                      <td colSpan={6} className="px-5 py-14 text-center">

                        <RefreshCw

                          size={22}

                          className="mx-auto animate-spin text-[#9a8151]"

                        />

                        <p className="mt-3 text-xs text-[#978b78]">

                          Carregando produtos da API...

                        </p>

                      </td>

                    </tr>

                  ) : (

                    filteredProducts.map((product) => (

                      <tr

                        key={product.id}

                        className="border-b border-[#f0e9dd] last:border-0 transition hover:bg-[#fdfbf7]"

                      >

                        <td className="px-5 py-3.5">

                          <div className="flex items-center gap-3">

                            <img

                              src={obterImagem(product)}

                              alt={product.nome}

                              className="h-[54px] w-[54px] shrink-0 rounded-xl border border-[#eee5d6] bg-[#f3ede2] object-cover"

                              onError={(event) => {

                                event.currentTarget.src = imagemPadrao;

                              }}

                            />

                            <div className="min-w-0">

                              <p className="whitespace-nowrap text-[12px] font-medium text-[#514632]">

                                {product.nome}

                              </p>

                              <p className="mt-1 text-[10px] text-[#a09787]">

                                Slug: {product.slug}

                              </p>

                            </div>

                          </div>

                        </td>



                        <td className="px-4 py-3.5 text-[11px] text-[#766c5b]">

                          {obterNomeCategoria(product)}

                        </td>



                        <td className="whitespace-nowrap px-4 py-3.5 text-[12px] font-semibold">

                          {currency(product.preco)}

                        </td>



                        <td className="px-4 py-3.5">

                          <StockBadge product={product} />

                        </td>



                        <td className="px-4 py-3.5">

                          {product.ativo ? (

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f1e8] px-2.5 py-1 text-[10px] font-medium text-[#477254]">

                              <span className="h-1.5 w-1.5 rounded-full bg-[#6d9a77]" />

                              Ativo

                            </span>

                          ) : (

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#efede8] px-2.5 py-1 text-[10px] font-medium text-[#81796c]">

                              <span className="h-1.5 w-1.5 rounded-full bg-[#9b9488]" />

                              Inativo

                            </span>

                          )}

                        </td>



                        <td className="px-4 py-3.5">

                          <div className="flex justify-end gap-1">



                            <button

                              title="Editar"

                              aria-label={`Editar ${product.nome}`}

                              onClick={() => {

                                setModalProduct(product);

                                setError("");

                                setModalOpen(true);

                              }}

                              className="rounded-lg p-2 text-[#9a8d78] transition hover:bg-[#f1e8d8] hover:text-[#514632]"

                            >

                              <Pencil size={15} />

                            </button>



                            <button
                              title={product.ativo ? "Desativar produto" : "Ativar produto"}
                              aria-label={`${product.ativo ? "Desativar" : "Ativar"} ${product.nome}`}
                              onClick={() => alterarStatusProduto(product)}
                              className={`rounded-lg p-2 transition ${product.ativo ? "text-[#b2a393] hover:bg-[#f8e8e3] hover:text-[#a4533f]" : "text-[#6d9a77] hover:bg-[#e7f1e8] hover:text-[#477254]"}`}
                            >
                              {product.ativo ? <Eye size={15} /> : <Check size={15} />}
                            </button>
                            <button
                              title="Excluir produto"
                              aria-label={`Excluir ${product.nome}`}
                              onClick={() => excluirProduto(product)}
                              className="rounded-lg p-2 text-[#b2a393] transition hover:bg-[#f8e8e3] hover:text-[#a4533f]"
                            >
                              <Trash2 size={15} />
                            </button>

                          </div>

                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>



              {!loading && filteredProducts.length === 0 && (

                <div className="px-5 py-14 text-center">

                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1e8d8] text-[#8d7547]">

                    <Search size={20} />

                  </div>

                  <p className="mt-3 font-serif text-lg">

                    Nenhum produto encontrado

                  </p>

                  <p className="mt-1 text-xs text-[#978b78]">

                    Tente alterar os filtros ou o termo da busca.

                  </p>

                  <button

                    onClick={() => {

                      setSearch("");

                      setCategory("Todas as categorias");

                      setStatus("Todos os status");

                    }}

                    className="mt-4 text-xs font-semibold text-[#8d7547] underline underline-offset-4"

                  >

                    Limpar filtros

                  </button>

                </div>

              )}

            </div>



            <div className="flex flex-col gap-3 border-t border-[#eee5d6] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">

              <p className="text-[10px] text-[#a09787]">

                Exibindo{" "}

                <span className="font-semibold text-[#6e6659]">

                  {filteredProducts.length}

                </span>{" "}

                de{" "}

                <span className="font-semibold text-[#6e6659]">

                  {products.length}

                </span>{" "}

                produtos

              </p>



              <div className="flex items-center gap-1 self-end sm:self-auto">

                <button

                  disabled

                  className="rounded-lg border border-[#e9dcc4] p-2 text-[#c1b6a5] disabled:cursor-not-allowed"

                  aria-label="Página anterior"

                >

                  <ChevronLeft size={15} />

                </button>

                <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#211c14] px-2 text-[10px] font-medium text-white">

                  1

                </span>

                <button

                  disabled

                  className="rounded-lg border border-[#e9dcc4] p-2 text-[#c1b6a5] disabled:cursor-not-allowed"

                  aria-label="Próxima página"

                >

                  <ChevronRight size={15} />

                </button>

              </div>

            </div>

          </section>



          <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#e9dcc4] bg-[#f6f0e5] px-4 py-3 text-[10px] leading-5 text-[#817664]">

            <CircleAlert

              size={15}

              className="mt-0.5 shrink-0 text-[#9a8151]"

            />

            <p>

              <strong className="font-semibold text-[#62543b]">

                Catálogo conectado:

              </strong>{" "}

              os produtos e as categorias são carregados pela API. O cadastro

              utiliza o backend para persistir os dados no banco.

            </p>

          </div>



          <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-[#e9dcc4] py-5 text-[10px] text-[#a09787] sm:flex-row sm:items-center">

            <span>© 2026 AURORA. Todos os direitos reservados.</span>

            <span>Feito com cuidado, em cada detalhe.</span>

          </footer>

        </div>

      </main>



      {modalOpen && (

        <ProductModal

          product={modalProduct}

          categories={categories}

          onClose={() => {

            setModalOpen(false);

            setModalProduct(null);

            setError("");

          }}

          onSave={saveProduct}

          saving={saving}

          error={error}

        />

      )}

    </div>

  );

}
