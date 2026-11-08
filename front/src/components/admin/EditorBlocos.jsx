import { useState } from "react";
import { apiFetch } from "../../services/api.js";

export function UploadEditorial({ onImagem, onErro, onOcupado, label = "Enviar foto" }) {
  const [enviando, setEnviando] = useState(false);
  async function enviar(e) {
    const arquivo = e.target.files?.[0]; e.target.value = "";
    if (!arquivo) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type) || arquivo.size > 4 * 1024 * 1024) { onErro("Escolha uma imagem JPG, PNG ou WebP de até 4 MB."); return; }
    const dados = new FormData(); dados.append("imagem", arquivo);
    setEnviando(true); onOcupado?.(true);
    try { const r = await apiFetch("/admin/editorial/imagens", { method: "POST", body: dados }); onImagem(r.url); onErro(""); }
    catch (e) { onErro(e.message); }
    finally { setEnviando(false); onOcupado?.(false); }
  }
  return <label className="block text-xs text-[#756C5C]">{enviando ? "Enviando foto..." : label}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={enviando} onChange={enviar} className="mt-2 block w-full text-xs" /></label>;
}

const nomes = { TITULO: "Título de seção", TEXTO: "Parágrafo", CITACAO: "Citação", IMAGEM: "Foto", PRODUTO: "Card de produto" };
export default function EditorBlocos({ blocos, onChange, produtos, onErro, onOcupado }) {
  const [busca, setBusca] = useState("");
  function alterar(i, dados) { onChange(blocos.map((b, n) => n === i ? { ...b, ...dados } : b)); }
  function adicionar(tipo) {
    if (blocos.length >= 40) return;
    onChange([...blocos, tipo === "IMAGEM" ? { tipo, url: "", legenda: "" } : tipo === "PRODUTO" ? { tipo, produtoId: "" } : { tipo, texto: "" }]);
  }
  function mover(i, passo) { const novos = [...blocos]; [novos[i], novos[i + passo]] = [novos[i + passo], novos[i]]; onChange(novos); }
  return <section className="space-y-4">
    <div><h3 className="font-serif text-xl">Conte sua história, bloco a bloco</h3><p className="mt-1 text-xs text-[#756C5C]">Combine textos, fotos e joias. Reordene os blocos para criar sua composição.</p></div>
    <div className="flex flex-wrap gap-2">{Object.entries(nomes).map(([tipo, nome]) => <button key={tipo} type="button" disabled={blocos.length >= 40} onClick={() => adicionar(tipo)} className="rounded-full border border-[#DCCDAF] bg-[#F8F3E8] px-3 py-2 text-xs hover:bg-[#E9DCC4]">+ {nome}</button>)}</div>
    {blocos.some(b => b.tipo === "PRODUTO") && <label className="block text-xs">Filtrar produtos<input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome da joia" className="mt-1 block w-full rounded border p-2" /></label>}
    {blocos.map((b, i) => <div key={i} className="space-y-3 rounded-xl border border-[#E9DCC4] bg-[#FCFAF5] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-xs font-semibold">{i + 1}. {nomes[b.tipo]}</h4><div className="flex gap-3 text-xs"><button type="button" disabled={!i} aria-label={`Subir bloco ${i + 1}`} onClick={() => mover(i, -1)}>↑</button><button type="button" disabled={i === blocos.length - 1} aria-label={`Descer bloco ${i + 1}`} onClick={() => mover(i, 1)}>↓</button><button type="button" onClick={() => onChange(blocos.filter((_, n) => n !== i))}>Remover bloco {i + 1}</button></div></div>
      {b.tipo === "IMAGEM" ? <>
        <UploadEditorial label={`Enviar foto do bloco ${i + 1}`} onOcupado={onOcupado} onErro={onErro} onImagem={url => alterar(i, { url })} />
        {b.url ? <div className="flex items-start gap-3"><img src={b.url} alt={b.legenda || `Foto do bloco ${i + 1}`} className="h-28 w-36 rounded-lg object-cover" /><button type="button" className="text-xs underline" onClick={() => alterar(i, { url: "" })}>Remover foto do texto</button></div> : <p className="text-xs text-[#756C5C]">Envie uma foto para este trecho do texto. A capa é escolhida separadamente.</p>}
        <label className="block text-xs">Legenda da foto {i + 1}<input maxLength={300} value={b.legenda} onChange={e => alterar(i, { legenda: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>
      </> : b.tipo === "PRODUTO" ? <label className="block text-xs">Produto do bloco {i + 1}<select required value={b.produtoId} onChange={e => alterar(i, { produtoId: e.target.value })} className="mt-1 w-full rounded border p-2"><option value="">Selecione um produto cadastrado</option>{produtos.filter(p => p.id === b.produtoId || p.nome.toLowerCase().includes(busca.toLowerCase())).map(p => <option key={p.id} value={p.id}>{p.nome}{p.ativo === false ? " (inativo)" : ""}</option>)}{b.produtoId && !produtos.some(p => p.id === b.produtoId) && <option value={b.produtoId}>Produto indisponível — substitua ou remova</option>}</select><span className="mt-1 block text-[#756C5C]">O card levará diretamente aos detalhes do produto.</span></label> : <label className="block text-xs">{nomes[b.tipo]} do bloco {i + 1}<textarea required value={b.texto} maxLength={b.tipo === "TITULO" ? 200 : b.tipo === "CITACAO" ? 1000 : 10000} rows={b.tipo === "TEXTO" ? 5 : 2} onChange={e => alterar(i, { texto: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>}
    </div>)}
  </section>;
}
