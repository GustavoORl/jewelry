import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { apiFetch } from "../services/api.js";

export default function NotificacoesConta({ usuarioId, abertas, onAlternar, onFechar }) {
  const navigate = useNavigate();
  const [dados, setDados] = useState({ notificacoes: [], naoLidas: 0 });
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const versao = useRef(0);
  const carregar = useCallback(async () => {
    if (!usuarioId) return;
    const numero = ++versao.current;
    try { const r = await apiFetch("/notificacoes"); if (numero === versao.current) { setDados(r); setErro(""); } }
    catch (e) { if (numero === versao.current) setErro(e.message); }
    finally { if (numero === versao.current) setCarregando(false); }
  }, [usuarioId]);
  useEffect(() => {
    if (!usuarioId) return;
    let ativo = true;
    async function atualizar() {
      const numero = ++versao.current;
      try { const r = await apiFetch("/notificacoes"); if (ativo && numero === versao.current) { setDados(r); setErro(""); } }
      catch (e) { if (ativo && numero === versao.current) setErro(e.message); }
      finally { if (ativo && numero === versao.current) setCarregando(false); }
    }
    atualizar();
    const aoVoltar = () => { if (!document.hidden) atualizar(); };
    const timer = setInterval(aoVoltar, 20000); window.addEventListener("focus", aoVoltar); document.addEventListener("visibilitychange", aoVoltar);
    return () => { ativo = false; clearInterval(timer); window.removeEventListener("focus", aoVoltar); document.removeEventListener("visibilitychange", aoVoltar); };
  }, [usuarioId]);
  async function marcar(ids, url, todas = false) {
    if (ocupado) return;
    setOcupado(true);
    ++versao.current;
    try {
      if (todas || ids.length) await apiFetch("/notificacoes/lidas", { method: "PATCH", body: JSON.stringify(todas ? { ate: dados.ate } : { ids }) });
      if (url) { onFechar(); navigate(url); }
      await carregar();
    } catch (e) { setErro(e.message); }
    finally { setOcupado(false); }
  }
  if (!usuarioId) return null;
  return <>
    <button type="button" onClick={() => { onAlternar(); if (!abertas) carregar(); }} aria-label={`Notificações${dados.naoLidas ? `, ${dados.naoLidas} não lidas` : ""}`} aria-expanded={abertas} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E7E0CE] text-[#756b5a] transition hover:bg-[#F3EFE3] sm:h-12 sm:w-12"><Bell size={20} strokeWidth={1.8} />{dados.naoLidas > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#968052] px-1 text-[9px] font-semibold text-white">{dados.naoLidas > 99 ? "99+" : dados.naoLidas}</span>}</button>
    {abertas && <section aria-label="Central de notificações" className="absolute right-0 top-full z-50 mt-3 w-[min(340px,calc(100vw-40px))] overflow-hidden rounded-2xl border border-[#E9DCC4] bg-[#FCFAF5] shadow-xl max-sm:fixed max-sm:left-4 max-sm:right-4 max-sm:top-24 max-sm:w-auto">
      <header className="border-b border-[#E9DCC4] p-4"><h2 className="text-sm font-semibold text-[#211C14]">Notificações</h2><p className="mt-1 text-[10px] text-[#81776A]">Pedidos, devoluções e novas mensagens</p>{dados.naoLidas > 0 && <button disabled={ocupado} type="button" onClick={() => marcar([], undefined, true)} className="mt-2 text-[10px] text-[#968052] underline">Marcar todas como lidas</button>}</header>
      {erro && <p role="alert" className="p-3 text-xs text-red-700">{erro} <button type="button" onClick={carregar} className="underline">Tentar novamente</button></p>}
      {carregando ? <p role="status" className="p-6 text-xs text-[#81776A]">Carregando notificações...</p> : !dados.notificacoes.length && !erro ? <div className="p-6 text-center"><CheckCheck size={24} className="mx-auto text-[#968052]" /><p className="mt-3 text-xs text-[#756C5C]">Você está em dia. Novidades aparecerão aqui.</p></div> : <ul className="max-h-96 divide-y divide-[#E9DCC4] overflow-y-auto">{dados.notificacoes.map(n => <li key={n.id}><button type="button" disabled={ocupado} onClick={() => marcar(n.lidaEm ? [] : [n.id], n.url)} className={`w-full p-4 text-left transition hover:bg-[#F3EFE3] ${n.lidaEm ? "bg-white" : "bg-[#F8F3E8]"}`}><span className="flex items-center gap-2 text-xs font-semibold text-[#211C14]">{!n.lidaEm && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#968052]" />}{n.titulo}</span><span className="mt-1 block break-words text-xs leading-5 text-[#756C5C]">{n.texto}</span><time dateTime={n.criadoEm} className="mt-2 block text-[10px] text-[#968052]">{new Date(n.criadoEm).toLocaleString("pt-BR")}</time></button></li>)}</ul>}
    </section>}
  </>;
}
