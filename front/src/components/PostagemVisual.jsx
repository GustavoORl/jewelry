import { Link } from "react-router-dom";

export default function PostagemVisual({ postagem, produtos = [], previa = false }) {
  const revista = postagem.estilo === "REVISTA";
  return <article className={`mx-auto max-w-3xl overflow-hidden ${revista ? "rounded-2xl bg-[#F8F3E8]" : "bg-white"}`}>
    {revista && postagem.imagemUrl && <img src={postagem.imagemUrl} alt="" className="max-h-[460px] w-full object-cover" />}
    <div className="p-5 sm:p-8">
      <p className="text-xs uppercase tracking-[0.2em] text-[#968052]">{previa ? "Pré-visualização · Editorial Aurora" : `Editorial Aurora${postagem.publicadoEm ? ` · ${new Date(postagem.publicadoEm).toLocaleDateString("pt-BR")}` : ""}`}</p>
      <h1 className={`mt-4 break-words font-serif ${revista ? "text-4xl italic sm:text-5xl" : "text-3xl sm:text-4xl"}`}>{postagem.titulo || "Sua próxima história começa aqui"}</h1>
      <p className="my-6 break-words text-lg leading-8 text-[#756C5C]">{postagem.resumo || "Um convite para descobrir o universo Aurora."}</p>
      {!revista && postagem.imagemUrl && <img src={postagem.imagemUrl} alt={postagem.titulo || "Capa da postagem"} className="mb-8 max-h-[460px] w-full rounded-xl object-cover" />}
      <div className="whitespace-pre-wrap break-words leading-8">{postagem.conteudo}</div>
      <div className="mt-8 space-y-8">{(postagem.blocos || []).map((b, i) => {
        if (b.tipo === "TEXTO") return <p key={i} className="whitespace-pre-wrap break-words leading-8">{b.texto}</p>;
        if (b.tipo === "TITULO") return <h2 key={i} className="break-words font-serif text-3xl">{b.texto}</h2>;
        if (b.tipo === "CITACAO") return <blockquote key={i} className="whitespace-pre-wrap break-words border-l-2 border-[#968052] pl-6 font-serif text-2xl italic leading-relaxed">{b.texto}</blockquote>;
        if (b.tipo === "IMAGEM") return <figure key={i}>{b.url ? <img loading="lazy" src={b.url} alt={b.legenda || "Imagem do editorial"} className="max-h-[600px] w-full rounded-xl object-cover" /> : previa && <div className="bg-[#E9DCC4] p-12 text-center text-sm">Escolha uma foto para este bloco</div>}{b.legenda && <figcaption className="mt-3 text-center text-sm text-[#756C5C]">{b.legenda}</figcaption>}</figure>;
        if (b.tipo !== "PRODUTO") return null;
        const p = b.produto || produtos.find(p => p.id === b.produtoId);
        if (!p || p.ativo === false) return <p key={i} className="rounded-xl border p-5 text-sm text-[#756C5C]">{previa ? p?.ativo === false ? "Este produto está inativo. Ative-o no catálogo para disponibilizar o card aos leitores." : "Selecione um produto para montar o card." : "Este produto não está mais disponível."}</p>;
        return <Link key={i} to={`/produtos/${p.id}`} target={previa ? "_blank" : undefined} rel={previa ? "noreferrer" : undefined} className="group flex flex-col overflow-hidden rounded-2xl border border-[#E9DCC4] bg-white sm:flex-row">
          {p.imagens?.[0]?.url && <img src={p.imagens[0].url} alt={p.nome} className="h-56 object-cover sm:h-auto sm:w-2/5" />}
          <div className="flex-1 p-6"><span className="text-[10px] uppercase tracking-[0.2em] text-[#968052]">Escolha da curadoria</span><h3 className="mt-3 break-words font-serif text-2xl">{p.nome}</h3><p className="mt-4 text-lg">{Number(p.precoPromocional ?? p.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p><span className="mt-5 inline-block rounded-full bg-[#211C14] px-5 py-3 text-sm text-white group-hover:bg-[#968052]">Conhecer a joia →</span></div>
        </Link>;
      })}</div>
    </div>
  </article>;
}
