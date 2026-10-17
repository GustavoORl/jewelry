import { useMemo, useState } from "react";
import Sidebar from "../../components/admin/Sidebar.jsx"
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import {
  Package, Search,
  Bell, ChevronDown, Menu, X, Plus, SlidersHorizontal, ArrowUpDown,
  Pencil, Trash2, Eye, ImagePlus, Upload, CircleAlert,
  Check, ChevronLeft, ChevronRight, Download,
} from "lucide-react";

const initialProducts = [
  { id: 1, nome: "Colar Aurora", sku: "AUR-COL-001", categoria: "Colares", preco: 289.9, estoque: 24, status: "Ativo", imagem: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=160&q=80" },
  { id: 2, nome: "Brinco Pérola", sku: "AUR-BRI-002", categoria: "Brincos", preco: 159.9, estoque: 8, status: "Ativo", imagem: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=160&q=80" },
  { id: 3, nome: "Anel Solitário", sku: "AUR-ANE-003", categoria: "Anéis", preco: 349.9, estoque: 3, status: "Ativo", imagem: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=160&q=80" },
  { id: 4, nome: "Pulseira Serena", sku: "AUR-PUL-004", categoria: "Pulseiras", preco: 199.9, estoque: 0, status: "Sem estoque", imagem: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=160&q=80" },
  { id: 5, nome: "Argola Clássica", sku: "AUR-BRI-005", categoria: "Brincos", preco: 129.9, estoque: 17, status: "Ativo", imagem: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=160&q=80" },
  { id: 6, nome: "Colar Pérolas", sku: "AUR-COL-006", categoria: "Colares", preco: 429.9, estoque: 0, status: "Inativo", imagem: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=160&q=80" },
  { id: 7, nome: "Anel Dourado", sku: "AUR-ANE-007", categoria: "Anéis", preco: 219.9, estoque: 12, status: "Ativo", imagem: "https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=160&q=80" },
];

const currency = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState(product || { nome: "", sku: "", categoria: "Colares", preco: "", estoque: "", status: "Ativo", imagem: "" });
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  function submit(event) {
    event.preventDefault();
    onSave({ ...form, preco: Number(form.preco), estoque: Number(form.estoque), imagem: form.imagem || "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=160&q=80" });
  }
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#211c14]/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="product-modal-title" className="max-h-[92vh] w-full max-w-[620px] overflow-y-auto rounded-t-3xl border border-[#e9dcc4] bg-[#fcfaf5] p-5 shadow-2xl sm:rounded-3xl sm:p-7">
      <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a8151]">Catálogo AURELIA</p><h2 id="product-modal-title" className="mt-2 font-serif text-2xl text-[#211c14]">{product ? "Editar produto" : "Novo produto"}</h2><p className="mt-1 text-xs text-[#8d8270]">Preencha as informações para organizar seu catálogo.</p></div><button onClick={onClose} className="rounded-xl p-2 text-[#817664] hover:bg-[#f1e8d8]" aria-label="Fechar formulário"><X size={19} /></button></div>
      <form onSubmit={submit} className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-medium text-[#615848]">Nome do produto *</span><input required value={form.nome} onChange={(e) => update("nome", e.target.value)} placeholder="Ex.: Colar Aurora" className="w-full rounded-xl border border-[#e5d9c5] bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-[#b0a696] focus:border-[#a88c56] focus:ring-2 focus:ring-[#a88c56]/15" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-[#615848]">Código / SKU</span><input value={form.sku} onChange={(e) => update("sku", e.target.value)} placeholder="AUR-COL-001" className="w-full rounded-xl border border-[#e5d9c5] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#a88c56]" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-[#615848]">Categoria *</span><select required value={form.categoria} onChange={(e) => update("categoria", e.target.value)} className="w-full rounded-xl border border-[#e5d9c5] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#a88c56]"><option>Colares</option><option>Brincos</option><option>Anéis</option><option>Pulseiras</option><option>Conjuntos</option></select></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-[#615848]">Preço (R$) *</span><input required min="0.01" step="0.01" type="number" value={form.preco} onChange={(e) => update("preco", e.target.value)} placeholder="0,00" className="w-full rounded-xl border border-[#e5d9c5] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#a88c56]" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-[#615848]">Estoque *</span><input required min="0" step="1" type="number" value={form.estoque} onChange={(e) => update("estoque", e.target.value)} placeholder="0" className="w-full rounded-xl border border-[#e5d9c5] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#a88c56]" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-[#615848]">Status</span><select value={form.status} onChange={(e) => update("status", e.target.value)} className="w-full rounded-xl border border-[#e5d9c5] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#a88c56]"><option>Ativo</option><option>Inativo</option><option>Sem estoque</option></select></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-[#615848]">URL da imagem</span><input value={form.imagem} onChange={(e) => update("imagem", e.target.value)} placeholder="https://..." className="w-full rounded-xl border border-[#e5d9c5] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#a88c56]" /></label>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-[#eee5d6] pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-xl border border-[#e5d9c5] px-5 py-3 text-sm font-medium text-[#6e6659] transition hover:bg-[#f6f0e5]">Cancelar</button><button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#211c14] px-5 py-3 text-sm font-medium text-[#fcfaf5] transition hover:bg-[#433827]"><Check size={16} /> Salvar produto</button></div>
      </form>
    </section>
  </div>;
}

function StockBadge({ product }) {
  if (product.estoque === 0 || product.status === "Sem estoque") return <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f8e8e3] px-2.5 py-1 text-[10px] font-medium text-[#a4533f]"><span className="h-1.5 w-1.5 rounded-full bg-[#c46d55]" />Sem estoque</span>;
  if (product.estoque <= 5) return <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f7efd9] px-2.5 py-1 text-[10px] font-medium text-[#96732e]"><span className="h-1.5 w-1.5 rounded-full bg-[#b9954c]" />Estoque baixo · {product.estoque}</span>;
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f1e8] px-2.5 py-1 text-[10px] font-medium text-[#477254]"><span className="h-1.5 w-1.5 rounded-full bg-[#6d9a77]" />{product.estoque} unidades</span>;
}

export default function AdminProdutos() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas as categorias");
  const [status, setStatus] = useState("Todos os status");
  const [sort, setSort] = useState("recentes");
  const [modalProduct, setModalProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const matchesSearch = `${product.nome} ${product.sku} ${product.categoria}`.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "Todas as categorias" || product.categoria === category;
      const matchesStatus = status === "Todos os status" || (status === "Ativos" ? product.status === "Ativo" : status === "Inativos" ? product.status === "Inativo" : product.estoque === 0 || product.status === "Sem estoque");
      return matchesSearch && matchesCategory && matchesStatus;
    });
    if (sort === "nome") result.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    if (sort === "preco-maior") result.sort((a, b) => b.preco - a.preco);
    if (sort === "preco-menor") result.sort((a, b) => a.preco - b.preco);
    return result;
  }, [products, search, category, status, sort]);

  function saveProduct(product) {
    if (product.id) setProducts((items) => items.map((item) => item.id === product.id ? product : item));
    else setProducts((items) => [{ ...product, id: Math.max(0, ...items.map((item) => item.id)) + 1, sku: product.sku || `AUR-NOV-${String(items.length + 1).padStart(3, "0")}` }, ...items]);
    setModalOpen(false); setModalProduct(null); setNotice(product.id ? "Produto atualizado nesta demonstração." : "Produto adicionado nesta demonstração.");
    window.setTimeout(() => setNotice(""), 3000);
  }

  function deleteProduct(product) {
    if (window.confirm(`Deseja remover “${product.nome}” desta demonstração?`)) {
      setProducts((items) => items.filter((item) => item.id !== product.id));
      setNotice("Produto removido desta demonstração."); window.setTimeout(() => setNotice(""), 3000);
    }
  }

  const activeCount = products.filter((p) => p.status === "Ativo" && p.estoque > 0).length;
  const lowStockCount = products.filter((p) => p.estoque > 0 && p.estoque <= 5).length;
  const outStockCount = products.filter((p) => p.estoque === 0 || p.status === "Sem estoque").length;

  return <div className="min-h-screen bg-[#f8f3e8] font-sans text-[#211c14]"><Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    <main className="min-h-screen lg:pl-[258px]">
      <AdminHeader
        title="Visão geral"
        subtitle="Acompanhe o desempenho da sua loja."
        onMenuClick={() => setMobileOpen(true)}
      />
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a8151]">Seu catálogo</p><h2 className="mt-2 font-serif text-[29px] tracking-[-0.035em] sm:text-[34px]">Todos os produtos</h2><p className="mt-2 max-w-xl text-[12px] leading-5 text-[#8d8270]">Gerencie as peças, acompanhe o estoque e mantenha sua vitrine sempre impecável.</p></div><button onClick={() => { setModalProduct(null); setModalOpen(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#211c14] px-5 py-3 text-[12px] font-medium text-[#fcfaf5] shadow-sm transition hover:bg-[#433827]"><Plus size={16} /> Adicionar produto</button></div>
        <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3"><article className="flex items-center gap-4 rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] p-4 sm:p-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1e8d8] text-[#8d7547]"><Package size={19} /></span><div><p className="text-[11px] text-[#8d8270]">Produtos ativos</p><p className="mt-1 font-serif text-2xl">{activeCount}</p></div></article><article className="flex items-center gap-4 rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] p-4 sm:p-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f7efd9] text-[#96732e]"><CircleAlert size={19} /></span><div><p className="text-[11px] text-[#8d8270]">Estoque baixo</p><p className="mt-1 font-serif text-2xl">{lowStockCount}</p></div></article><article className="flex items-center gap-4 rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5] p-4 sm:p-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f8e8e3] text-[#a4533f]"><Package size={19} /></span><div><p className="text-[11px] text-[#8d8270]">Sem estoque</p><p className="mt-1 font-serif text-2xl">{outStockCount}</p></div></article></section>
        {notice && <div role="status" className="mt-4 flex items-center gap-2 rounded-xl border border-[#d5e5d5] bg-[#edf5ed] px-4 py-3 text-xs text-[#477254]"><Check size={15} />{notice}<span className="ml-auto text-[10px]">Dados temporários</span></div>}
        <section className="mt-5 overflow-hidden rounded-2xl border border-[#e9dcc4] bg-[#fcfaf5]">
          <div className="flex flex-col gap-4 border-b border-[#eee5d6] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between"><div><h3 className="font-serif text-[19px]">Catálogo de produtos</h3><p className="mt-1 text-[11px] text-[#978b78]">{filteredProducts.length} {filteredProducts.length === 1 ? "produto encontrado" : "produtos encontrados"}</p></div><div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"><label className="relative block sm:min-w-[220px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a09787]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto ou SKU..." className="w-full rounded-xl border border-[#e9dcc4] bg-white py-2.5 pl-9 pr-3 text-[11px] outline-none placeholder:text-[#b0a696] focus:border-[#a88c56]" /></label><label className="relative"><SlidersHorizontal size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8d78]" /><select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filtrar categoria" className="w-full appearance-none rounded-xl border border-[#e9dcc4] bg-white py-2.5 pl-9 pr-8 text-[11px] text-[#6e6659] outline-none focus:border-[#a88c56]"><option>Todas as categorias</option><option>Colares</option><option>Brincos</option><option>Anéis</option><option>Pulseiras</option><option>Conjuntos</option></select></label><label className="relative"><select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrar status" className="w-full appearance-none rounded-xl border border-[#e9dcc4] bg-white px-3 py-2.5 pr-8 text-[11px] text-[#6e6659] outline-none focus:border-[#a88c56]"><option>Todos os status</option><option>Ativos</option><option>Inativos</option><option>Sem estoque</option></select></label><label className="relative"><ArrowUpDown size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8d78]" /><select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar produtos" className="w-full appearance-none rounded-xl border border-[#e9dcc4] bg-white py-2.5 pl-8 pr-8 text-[11px] text-[#6e6659] outline-none focus:border-[#a88c56]"><option value="recentes">Mais recentes</option><option value="nome">Nome A–Z</option><option value="preco-menor">Menor preço</option><option value="preco-maior">Maior preço</option></select></label></div></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[820px] border-collapse text-left"><thead><tr className="border-b border-[#eee5d6] bg-[#faf7f0] text-[9px] uppercase tracking-[0.13em] text-[#a09787]"><th className="px-5 py-3.5 font-medium">Produto</th><th className="px-4 py-3.5 font-medium">Categoria</th><th className="px-4 py-3.5 font-medium">Preço</th><th className="px-4 py-3.5 font-medium">Estoque</th><th className="px-4 py-3.5 font-medium">Status</th><th className="px-4 py-3.5 text-right font-medium">Ações</th></tr></thead><tbody>{filteredProducts.map((product) => <tr key={product.id} className="border-b border-[#f0e9dd] last:border-0 transition hover:bg-[#fdfbf7]"><td className="px-5 py-3.5"><div className="flex items-center gap-3"><img src={product.imagem} alt={product.nome} className="h-[54px] w-[54px] shrink-0 rounded-xl border border-[#eee5d6] bg-[#f3ede2] object-cover" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} /><div className="min-w-0"><p className="whitespace-nowrap text-[12px] font-medium text-[#514632]">{product.nome}</p><p className="mt-1 text-[10px] text-[#a09787]">SKU: {product.sku}</p></div></div></td><td className="px-4 py-3.5 text-[11px] text-[#766c5b]">{product.categoria}</td><td className="whitespace-nowrap px-4 py-3.5 text-[12px] font-semibold">{currency(product.preco)}</td><td className="px-4 py-3.5"><StockBadge product={product} /></td><td className="px-4 py-3.5">{product.status === "Inativo" ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#efede8] px-2.5 py-1 text-[10px] font-medium text-[#81796c]"><span className="h-1.5 w-1.5 rounded-full bg-[#9b9488]" />Inativo</span> : <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f1e8] px-2.5 py-1 text-[10px] font-medium text-[#477254]"><span className="h-1.5 w-1.5 rounded-full bg-[#6d9a77]" />Ativo</span>}</td><td className="px-4 py-3.5"><div className="flex justify-end gap-1"><button title="Visualizar" aria-label={`Visualizar ${product.nome}`} onClick={() => { setModalProduct(product); setModalOpen(true); }} className="rounded-lg p-2 text-[#9a8d78] transition hover:bg-[#f1e8d8] hover:text-[#514632]"><Eye size={15} /></button><button title="Editar" aria-label={`Editar ${product.nome}`} onClick={() => { setModalProduct(product); setModalOpen(true); }} className="rounded-lg p-2 text-[#9a8d78] transition hover:bg-[#f1e8d8] hover:text-[#514632]"><Pencil size={15} /></button><button title="Excluir" aria-label={`Excluir ${product.nome}`} onClick={() => deleteProduct(product)} className="rounded-lg p-2 text-[#b2a393] transition hover:bg-[#f8e8e3] hover:text-[#a4533f]"><Trash2 size={15} /></button></div></td></tr>)}</tbody></table>
            {filteredProducts.length === 0 && <div className="px-5 py-14 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1e8d8] text-[#8d7547]"><Search size={20} /></div><p className="mt-3 font-serif text-lg">Nenhum produto encontrado</p><p className="mt-1 text-xs text-[#978b78]">Tente alterar os filtros ou o termo da busca.</p><button onClick={() => { setSearch(""); setCategory("Todas as categorias"); setStatus("Todos os status"); }} className="mt-4 text-xs font-semibold text-[#8d7547] underline underline-offset-4">Limpar filtros</button></div>}</div>
          <div className="flex flex-col gap-3 border-t border-[#eee5d6] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><p className="text-[10px] text-[#a09787]">Exibindo <span className="font-semibold text-[#6e6659]">{filteredProducts.length}</span> de <span className="font-semibold text-[#6e6659]">{products.length}</span> produtos · Dados demonstrativos</p><div className="flex items-center gap-1 self-end sm:self-auto"><button disabled className="rounded-lg border border-[#e9dcc4] p-2 text-[#c1b6a5] disabled:cursor-not-allowed" aria-label="Página anterior"><ChevronLeft size={15} /></button><span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#211c14] px-2 text-[10px] font-medium text-white">1</span><button disabled className="rounded-lg border border-[#e9dcc4] p-2 text-[#c1b6a5] disabled:cursor-not-allowed" aria-label="Próxima página"><ChevronRight size={15} /></button></div></div>
        </section>
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#e9dcc4] bg-[#f6f0e5] px-4 py-3 text-[10px] leading-5 text-[#817664]"><CircleAlert size={15} className="mt-0.5 shrink-0 text-[#9a8151]" /><p><strong className="font-semibold text-[#62543b]">Modo demonstração:</strong> as alterações feitas nesta tela ficam somente no estado do navegador e são perdidas ao recarregar. Ainda não há conexão com a API, o Prisma ou o Supabase.</p></div>
        <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-[#e9dcc4] py-5 text-[10px] text-[#a09787] sm:flex-row sm:items-center"><span>© 2026 AURELIA. Todos os direitos reservados.</span><span>Feito com cuidado, em cada detalhe.</span></footer>
      </div>
    </main>
    {modalOpen && <ProductModal product={modalProduct} onClose={() => { setModalOpen(false); setModalProduct(null); }} onSave={saveProduct} />}
  </div>;
}
