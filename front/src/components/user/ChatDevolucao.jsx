import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, RefreshCw } from "lucide-react";
import { useLocation } from "react-router-dom";
import { apiFetch } from "../../services/api.js";
import { mesclarMensagens } from "../../utils/mensagens.js";

export default function ChatDevolucao({ pedidoId, admin = false }) {
  const ancora = `conversa-${pedidoId}`;
  const { hash, key: chaveNavegacao } = useLocation();
  const [aberto, setAberto] = useState(() => !admin || window.location.hash === `#${ancora}`);
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [anteriores, setAnteriores] = useState(false);
  const [carregandoAntigas, setCarregandoAntigas] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const primeira = useRef(true);
  const envio = useRef(null);
  const bloco = useRef(null);
  useEffect(() => {
    if (hash === `#${ancora}`) {
      // Sincroniza a abertura da conversa com o destino de uma notificação.
      const frame = requestAnimationFrame(() => { setAberto(true); bloco.current?.scrollIntoView({ block: "center" }); });
      return () => cancelAnimationFrame(frame);
    }
  }, [hash, ancora, chaveNavegacao]);
  const log = useRef(null);
  const noFim = useRef(true);
  useEffect(() => { if (aberto && noFim.current && log.current) log.current.scrollTop = log.current.scrollHeight; }, [mensagens.length, aberto]);
  const base = `/devolucoes/${pedidoId}/mensagens`;
  useEffect(() => {
    if (!aberto) return;
    let ativo = true;
    async function atualizar() {
      try {
        const r = await apiFetch(base);
        if (!ativo) return;
        setMensagens(m => mesclarMensagens(m, r.mensagens));
        if (primeira.current) { setAnteriores(r.temAnteriores); primeira.current = false; }
        setErro("");
      } catch (e) { if (ativo) setErro(e.message); }
      finally { if (ativo) setCarregando(false); }
    }
    atualizar();
    const aoVoltar = () => { if (!document.hidden) atualizar(); };
    const timer = setInterval(aoVoltar, 10000);
    window.addEventListener("focus", aoVoltar); document.addEventListener("visibilitychange", aoVoltar);
    if (window.location.hash === `#${ancora}`) bloco.current?.scrollIntoView({ block: "center" });
    return () => { ativo = false; clearInterval(timer); window.removeEventListener("focus", aoVoltar); document.removeEventListener("visibilitychange", aoVoltar); };
  }, [aberto, base, tentativa, ancora]);
  async function carregarAnteriores() {
    if (!mensagens.length) return;
    setCarregandoAntigas(true);
    noFim.current = false;
    try { const r = await apiFetch(`${base}?antes=${encodeURIComponent(mensagens[0].id)}`); setMensagens(m => mesclarMensagens(m, r.mensagens)); setAnteriores(r.temAnteriores); setErro(""); }
    catch (e) { setErro(e.message); }
    finally { setCarregandoAntigas(false); }
  }
  async function enviar(e) {
    e.preventDefault();
    const conteudo = texto.trim();
    if (!conteudo || enviando) return;
    if (envio.current?.texto !== conteudo) envio.current = { texto: conteudo, chaveCliente: crypto.randomUUID() };
    setEnviando(true); setErro("");
    try {
      const r = await apiFetch(base, { method: "POST", body: JSON.stringify(envio.current) });
      setMensagens(m => mesclarMensagens(m, [r.mensagem])); setTexto(""); envio.current = null;
    } catch (e) { setErro(e.message); }
    finally { setEnviando(false); }
  }
  return <section ref={bloco} id={ancora} className="rounded-2xl border border-[#E9DCC4] bg-white p-4 sm:p-5">
    <button type="button" onClick={() => setAberto(a => !a)} aria-expanded={aberto} className="flex w-full items-center justify-between gap-3 text-left"><span className="flex items-center gap-2 font-medium text-[#211C14]"><MessageCircle size={18} className="text-[#968052]" />{admin ? "Conversa com o cliente" : "Conversa com a equipe"}</span><span className="text-xs text-[#968052]">{aberto ? "Recolher" : "Abrir conversa"}</span></button>
    {aberto && <div className="mt-4 space-y-4">
      <p className="text-xs leading-5 text-[#81776A]">Envie novas mensagens para continuar o atendimento. A conversa é atualizada automaticamente a cada 10 segundos enquanto a página estiver visível.</p>
      {anteriores && <button type="button" disabled={carregandoAntigas} onClick={carregarAnteriores} className="text-xs text-[#968052] underline">{carregandoAntigas ? "Carregando..." : "Carregar mensagens anteriores"}</button>}
      <div ref={log} onScroll={() => { const e = log.current; noFim.current = e.scrollHeight - e.scrollTop - e.clientHeight < 60; }} role="log" aria-label="Mensagens da devolução" aria-live="polite" aria-relevant="additions" className="max-h-96 space-y-3 overflow-y-auto rounded-xl bg-[#FCFAF6] p-3">
        {carregando ? <p role="status" className="text-xs">Carregando conversa...</p> : !mensagens.length ? <p className="text-xs text-[#81776A]">Comece a conversa enviando uma mensagem.</p> : mensagens.map(m => <div key={m.id} className={`max-w-[92%] rounded-xl p-3 ${m.autorTipo === (admin ? "ADMIN" : "CLIENTE") ? "ml-auto bg-[#211C14] text-white" : "border border-[#E9DCC4] bg-white text-[#211C14]"}`}>
          <p className="mb-1 text-[10px] font-semibold">{m.autorTipo === "ADMIN" ? "Equipe Aurora" : admin ? m.autor?.nome || "Cliente" : "Você"}</p>
          <p className="whitespace-pre-wrap break-words text-sm leading-6">{m.texto}</p><time dateTime={m.criadoEm} className="mt-2 block text-[10px] opacity-60">{new Date(m.criadoEm).toLocaleString("pt-BR")}</time>
        </div>)}
      </div>
      {erro && <p role="alert" className="text-xs text-red-700">{erro} <button type="button" onClick={() => setTentativa(t => t + 1)} className="inline-flex items-center gap-1 underline"><RefreshCw size={12} />Atualizar</button></p>}
      <form onSubmit={enviar} className="space-y-2"><label className="block text-xs text-[#756C5C]" htmlFor={`mensagem-${pedidoId}`}>Sua mensagem</label><textarea id={`mensagem-${pedidoId}`} required maxLength={4000} disabled={enviando} rows={3} value={texto} onChange={e => setTexto(e.target.value)} placeholder="Escreva para continuar o atendimento..." className="w-full rounded-xl border border-[#E9DCC4] p-3 text-sm text-[#211C14]" /><div className="flex items-center justify-between gap-3"><span className="text-[10px] text-[#81776A]">{texto.length}/4000</span><button disabled={enviando || !texto.trim()} className="inline-flex items-center gap-2 rounded-full bg-[#211C14] px-5 py-2.5 text-xs text-white disabled:opacity-50"><Send size={14} />{enviando ? "Enviando..." : "Enviar mensagem"}</button></div></form>
    </div>}
  </section>;
}
