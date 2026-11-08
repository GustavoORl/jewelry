import PostagemVisual from "../components/PostagemVisual.jsx";
import FaixaNavegacao from "../components/common/FaixaNavegacao.jsx";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, BookOpen, Search } from "lucide-react";
import { apiFetch } from "../services/api.js";

export default function Editorial() {
  const { id } = useParams();
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState("RECENTES");
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    let ativo = true;
    async function carregar() {
      setDados(null); setErro("");
      try { const r = await apiFetch(id ? `/editorial/${id}` : "/editorial"); if (ativo) setDados(r); }
      catch (e) { if (ativo) setErro(e.message); }
    }
    carregar(); return () => { ativo = false; };
  }, [id, tentativa]);
  const postagens = useMemo(() => {
    const normalizar = texto => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const termo = normalizar(busca.trim());
    return (dados?.postagens || []).filter(p => normalizar(`${p.titulo} ${p.resumo}`).includes(termo))
      .sort((a, b) => ordem === "RECENTES" ? new Date(b.publicadoEm) - new Date(a.publicadoEm) : new Date(a.publicadoEm) - new Date(b.publicadoEm));
  }, [dados, busca, ordem]);
  return <main className="min-h-screen bg-[#FCFAF5] text-[#211C14]">
    <FaixaNavegacao mostrarVoltar={Boolean(id)} rotaVoltar="/editorial" textoVoltar="Editorial" textoEditorial="Aurora · Histórias que brilham" itens={[{ label: "Início", to: "/" }, { label: "Editorial", ...(id ? { to: "/editorial" } : {}) }, ...(id ? [{ label: dados?.postagem?.titulo || "Postagem" }] : [])]} />
    <div className="mx-auto max-w-[1320px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
      {!id && <header className="mb-10 border-b border-[#E9DCC4] pb-8">
        <span className="text-xs uppercase tracking-[0.25em] text-[#968052]">O universo Aurora</span>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl">Histórias que brilham</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#756C5C]">Inspirações, cuidados e pequenos detalhes que transformam a sua relação com as joias. Explore o editorial Aurora.</p>
      </header>}
      {erro ? <div role="alert" className="rounded-2xl border border-[#E9DCC4] bg-white p-8 text-center"><p>{erro}</p><button type="button" onClick={() => setTentativa(t => t + 1)} className="mt-4 text-sm text-[#968052] underline">Tentar novamente</button></div> : !dados ? <p role="status" className="py-12 text-center text-sm text-[#756C5C]">Carregando editorial...</p> : id ? <PostagemVisual postagem={dados.postagem} /> : <>
        <section aria-label="Filtros do editorial" className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <label className="relative block w-full sm:max-w-md"><span className="mb-2 block text-xs text-[#756C5C]">Buscar no editorial</span><Search size={17} className="absolute bottom-3.5 left-4 text-[#968052]" /><input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Inspirações, cuidados, estilo..." className="w-full rounded-full border border-[#E9DCC4] bg-white py-3 pl-11 pr-4 text-sm" /></label>
          <label className="text-xs text-[#756C5C]">Ordenar postagens<select value={ordem} onChange={e => setOrdem(e.target.value)} className="mt-2 block w-full rounded-full border border-[#E9DCC4] bg-white px-4 py-3 text-sm text-[#211C14]"><option value="RECENTES">Mais recentes</option><option value="ANTIGAS">Mais antigas</option></select></label>
        </section>
        <p role="status" className="mb-6 text-xs text-[#756C5C]">{postagens.length} {postagens.length === 1 ? "postagem encontrada" : "postagens encontradas"}</p>
        {!postagens.length ? <div className="rounded-2xl border border-[#E9DCC4] bg-white p-12 text-center"><BookOpen size={36} className="mx-auto text-[#968052]" /><h2 className="mt-5 font-serif text-2xl">{busca ? "Nenhuma história encontrada" : "Novas histórias chegam em breve"}</h2><p className="mt-3 text-sm text-[#756C5C]">{busca ? "Experimente outra palavra para encontrar sua inspiração." : "Enquanto isso, descubra as joias da nossa coleção."}</p>{busca ? <button type="button" onClick={() => setBusca("")} className="mt-5 text-sm underline">Limpar busca</button> : <Link to="/produtos" className="mt-5 inline-block rounded-full bg-[#211C14] px-6 py-3 text-sm text-white">Explorar joias</Link>}</div> : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{postagens.map(p => <article key={p.id} className="group flex flex-col overflow-hidden rounded-2xl border border-[#E9DCC4] bg-white transition hover:shadow-md">
          <Link to={`/editorial/${p.id}`} aria-label={`Ler ${p.titulo}`} className="block aspect-[4/3] overflow-hidden bg-[#F8F3E8]"><img src={p.imagemUrl || "/assets/images/promocao-joia.png"} alt={p.titulo} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></Link>
          <div className="flex flex-1 flex-col p-6"><p className="text-[10px] uppercase tracking-[0.18em] text-[#968052]">Editorial · {new Date(p.publicadoEm).toLocaleDateString("pt-BR")}</p><h2 className="mt-3 break-words font-serif text-2xl leading-tight"><Link to={`/editorial/${p.id}`}>{p.titulo}</Link></h2><p className="mt-3 line-clamp-3 break-words text-sm leading-6 text-[#756C5C]">{p.resumo}</p><Link to={`/editorial/${p.id}`} className="mt-6 inline-flex items-center gap-2 self-start text-sm font-medium text-[#968052]">Ler história <ArrowRight size={16} /></Link></div>
        </article>)}</div>}
      </>}
    </div>
  </main>;
}
