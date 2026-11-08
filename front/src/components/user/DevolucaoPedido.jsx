import ChatDevolucao from "./ChatDevolucao.jsx";

import { useEffect, useId, useRef, useState } from "react";

import {
  AlertCircle,
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  ClipboardList,
  Clock3,
  FileText,
  ImagePlus,
  LoaderCircle,
  Package,
  ShieldCheck,
  X,
} from "lucide-react";

import { apiFetch } from "../../services/api.js";

import {
  nomesStatusDevolucao,
  motivosDevolucao,
} from "../../utils/devolucoes.js";

import FotoDevolucao from "./FotoDevolucao.jsx";

const MAX_FOTOS = 3;
const MAX_TAMANHO = 4 * 1024 * 1024;
const PRAZO_MS = 7 * 86400000;

const TIPOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function formatarDataHora(data) {
  const valor = new Date(data);

  return Number.isNaN(valor.getTime())
    ? "Não informada"
    : valor.toLocaleString("pt-BR");
}

function formatarQuantidade(quantidade) {
  return `${quantidade} ${
    Number(quantidade) === 1
      ? "unidade"
      : "unidades"
  }`;
}

// ============================================================
// COMPONENTE
// ============================================================

export default function DevolucaoPedido({
  pedido,
  onSolicitada,
}) {
  const inputFotosRef = useRef(null);
  const inputId = useId();

  const [devolucao, setDevolucao] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [motivo, setMotivo] = useState("");
  const [tipoMotivo, setTipoMotivo] = useState("");

  const [fotos, setFotos] = useState([]);
  const [quantidades, setQuantidades] = useState({});

  const [enviando, setEnviando] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [agora, setAgora] = useState(() => Date.now());

  const itensPedido = pedido.itens || [];

  // ============================================================
  // PRAZO
  // ============================================================

  const entrega = pedido.entregueEm
    ? new Date(pedido.entregueEm).getTime()
    : NaN;

  const limite = entrega + PRAZO_MS;

  const noPrazo =
    Number.isFinite(entrega) &&
    agora >= entrega &&
    agora < limite;

  useEffect(() => {
    const timer = setInterval(() => {
      setAgora(Date.now());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  // ============================================================
  // CONSULTAR DEVOLUÇÃO
  // ============================================================

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setCarregando(true);
      setErro("");

      try {
        const resposta = await apiFetch(
          `/devolucoes/${pedido.id}`
        );

        if (ativo) {
          setDevolucao(resposta.devolucao);
        }
      } catch (error) {
        if (ativo) {
          setErro(error.message);
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, [pedido.id, tentativa]);

  // ============================================================
  // SELEÇÃO DE PRODUTOS
  // ============================================================

  function alternarProduto(item) {
    if (enviando) return;

    setQuantidades((atuais) => {
      const novas = { ...atuais };

      if (Number(novas[item.id]) > 0) {
        delete novas[item.id];
      } else {
        novas[item.id] = 1;
      }

      return novas;
    });
  }

  function alterarQuantidade(id, quantidade) {
    setQuantidades((atuais) => ({
      ...atuais,
      [id]: Number(quantidade),
    }));
  }

  const itensSelecionados = itensPedido
    .filter(
      (item) =>
        Number(quantidades[item.id]) > 0
    )
    .map((item) => ({
      itemPedidoId: item.id,
      quantidade: Number(
        quantidades[item.id]
      ),
    }));

  // ============================================================
  // SELEÇÃO DE FOTOS
  // ============================================================

  async function selecionarFotos(evento) {
    const arquivos = Array.from(
      evento.target.files || []
    );

    evento.target.value = "";

    if (!arquivos.length) return;

    if (
      arquivos.length + fotos.length >
      MAX_FOTOS
    ) {
      setErro(
        "Você pode anexar até 3 fotos."
      );
      return;
    }

    const invalido = arquivos.some(
      (arquivo) =>
        !TIPOS.includes(arquivo.type) ||
        arquivo.size > MAX_TAMANHO
    );

    if (invalido) {
      setErro(
        "Envie JPG, PNG ou WebP de até 4 MB por foto."
      );
      return;
    }

    try {
      const novasFotos = await Promise.all(
        arquivos.map(
          (arquivo) =>
            new Promise(
              (resolve, reject) => {
                const leitor =
                  new FileReader();

                leitor.onload = () =>
                  resolve({
                    arquivo,
                    preview: leitor.result,
                  });

                leitor.onerror = reject;

                leitor.readAsDataURL(
                  arquivo
                );
              }
            )
        )
      );

      setFotos((atuais) =>
        [...atuais, ...novasFotos].slice(
          0,
          MAX_FOTOS
        )
      );

      setErro("");
    } catch {
      setErro(
        "Não foi possível carregar uma das imagens."
      );
    }
  }

  function removerFoto(indice) {
    if (enviando) return;

    setFotos((atuais) =>
      atuais.filter(
        (_, posicao) =>
          posicao !== indice
      )
    );
  }

  // ============================================================
  // ENVIAR SOLICITAÇÃO
  // ============================================================

  async function enviar(evento) {
    evento.preventDefault();

    if (enviando) return;

    if (!noPrazo) {
      setErro(
        "O prazo para devolução terminou."
      );
      return;
    }

    if (!itensSelecionados.length) {
      setErro(
        "Selecione pelo menos um produto."
      );
      return;
    }

    if (
      !tipoMotivo ||
      motivo.trim().length < 10
    ) {
      setErro(
        "Selecione o motivo e descreva o ocorrido."
      );
      return;
    }

    setEnviando(true);
    setErro("");

    const dados = new FormData();

    dados.append(
      "dados",
      JSON.stringify({
        tipoMotivo,
        motivo: motivo.trim(),
        itens: itensSelecionados,
      })
    );

    fotos.forEach((foto) => {
      dados.append(
        "fotos",
        foto.arquivo
      );
    });

    try {
      const resposta = await apiFetch(
        `/devolucoes/${pedido.id}`,
        {
          method: "POST",
          body: dados,
        }
      );

      setDevolucao(
        resposta.devolucao
      );

      setFotos([]);

      onSolicitada?.(
        resposta.devolucao
      );
    } catch (error) {
      setErro(
        error.message ||
          "Não foi possível enviar a solicitação."
      );
    } finally {
      setEnviando(false);
    }
  }

  // ============================================================
  // CARREGAMENTO
  // ============================================================

  if (carregando) {
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-2xl border border-[#EAE5DC] bg-white px-5 py-5 text-sm text-[#756C5C]"
      >
        <LoaderCircle
          size={20}
          className="animate-spin text-[#968052]"
        />

        Consultando solicitações...
      </div>
    );
  }

  // ============================================================
  // DEVOLUÇÃO EXISTENTE
  // ============================================================

  if (devolucao) {
    return (
      <section className="space-y-5">
        {/* STATUS */}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#EAE5DC] bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F1E9] text-[#968052]">
              <ClipboardList size={19} />
            </div>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#968052]">
                Status da solicitação
              </p>

              <h3 className="mt-1 text-sm font-semibold text-[#211C14]">
                {nomesStatusDevolucao[
                  devolucao.status
                ] ||
                  devolucao.status}
              </h3>
            </div>
          </div>

          <span className="rounded-full border border-[#EAE5DC] bg-white px-3 py-1.5 text-[11px] font-medium text-[#756C5C]">
            Protocolo registrado
          </span>
        </div>

        {/* PROTOCOLO */}

        <div className="rounded-2xl border border-[#EAE5DC] bg-white p-5">
          <p className="text-xs text-[#898174]">
            Número do protocolo
          </p>

          <p className="mt-2 break-all text-sm font-semibold text-[#211C14]">
            {devolucao.id}
          </p>
        </div>

        {/* DETALHES */}

        <div className="rounded-2xl border border-[#EAE5DC] bg-white p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#211C14]">
            <FileText
              size={17}
              className="text-[#968052]"
            />
            Detalhes da solicitação
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-[#898174]">
                Motivo selecionado
              </p>

              <p className="mt-1 text-sm font-medium text-[#211C14]">
                {motivosDevolucao[
                  devolucao.tipoMotivo
                ] || "Outro motivo"}
              </p>
            </div>

            <div>
              <p className="text-xs text-[#898174]">
                Descrição
              </p>

              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-[#756C5C]">
                {devolucao.motivo}
              </p>
            </div>
          </div>
        </div>

        {/* PRODUTOS */}

        <div className="rounded-2xl border border-[#EAE5DC] bg-white p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#211C14]">
            <Package
              size={17}
              className="text-[#968052]"
            />
            Produtos solicitados
          </h3>

          <div className="space-y-2">
            {(devolucao.itens || []).map(
              (item) => {
                const produto =
                  itensPedido.find(
                    (p) =>
                      p.id ===
                      item.itemPedidoId
                  );

                return (
                  <div
                    key={item.itemPedidoId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#EEE9E1] bg-[#FAF9F6] px-4 py-3"
                  >
                    <span className="text-sm text-[#211C14]">
                      {produto?.nomeProduto ||
                        "Produto"}
                    </span>

                    <span className="shrink-0 text-xs font-medium text-[#968052]">
                      {formatarQuantidade(
                        item.quantidade
                      )}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* IMAGENS */}

        {!!devolucao.fotos?.length && (
          <div className="rounded-2xl border border-[#EAE5DC] bg-white p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#211C14]">
              <Camera
                size={17}
                className="text-[#968052]"
              />
              Imagens enviadas
            </h3>

            <div className="flex flex-wrap gap-3">
              {devolucao.fotos.map(
                (foto, indice) => (
                  <FotoDevolucao
                    key={foto.id}
                    id={foto.id}
                    indice={indice}
                  />
                )
              )}
            </div>
          </div>
        )}

        <ChatDevolucao pedidoId={pedido.id} />

        {erro && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {erro}
          </div>
        )}
      </section>
    );
  }

  // ============================================================
  // PRAZO ENCERRADO
  // ============================================================

  if (!noPrazo) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-[#EAE5DC] bg-[#F7F5F0] p-5">
        <AlertCircle
          size={20}
          className="mt-0.5 shrink-0 text-[#968052]"
        />

        <div>
          <h3 className="text-sm font-semibold text-[#211C14]">
            Solicitação indisponível
          </h3>

          <p className="mt-2 text-sm leading-6 text-[#756C5C]">
            {!Number.isFinite(entrega)
              ? "A data de entrega ainda não foi registrada. Entre em contato com a equipe para verificar seu prazo."
              : "O prazo de 7 dias corridos após a entrega terminou."}
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // FORMULÁRIO
  // ============================================================

  return (
    <form
      onSubmit={enviar}
      className="space-y-7"
    >
      {/* INFORMAÇÕES */}

      <div className="flex items-start gap-3 rounded-2xl border border-[#EAE5DC] bg-[#F7F5F0] px-5 py-5">
        <Clock3
          size={20}
          className="mt-0.5 shrink-0 text-[#968052]"
        />

        <div>
          <h3 className="text-sm font-semibold text-[#211C14]">
            Informações da devolução
          </h3>

          <p className="mt-1 text-xs leading-6 text-[#756C5C]">
            Você pode solicitar até{" "}
            <strong className="text-[#211C14]">
              {formatarDataHora(limite)}
            </strong>
            . Selecione todos os produtos na mesma
            solicitação.
          </p>
        </div>
      </div>

      {/* PRODUTOS */}

      <section>
        <div className="mb-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#968052]">
            Etapa 01
          </span>

          <h3 className="mt-1 font-serif text-xl text-[#211C14]">
            Produtos para devolução
          </h3>

          <p className="mt-1 text-xs text-[#756C5C]">
            Marque os produtos que deseja devolver.
          </p>
        </div>

        <div className="space-y-3">
          {itensPedido.map((item) => {
            const marcado =
              Number(quantidades[item.id]) > 0;

            const maximo = Math.max(
              1,
              Number(item.quantidade) || 1
            );

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 transition-all duration-200 sm:p-5 ${
                  marcado
                    ? "border-[#968052] bg-[#FAF9F6] shadow-sm"
                    : "border-[#EAE5DC] bg-white hover:border-[#CDBB9A]"
                }`}
              >
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={marcado}
                    disabled={enviando}
                    onChange={() =>
                      alternarProduto(item)
                    }
                    className="peer sr-only"
                  />

                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition peer-focus-visible:ring-2 peer-focus-visible:ring-[#968052] peer-focus-visible:ring-offset-2 ${
                      marcado
                        ? "border-[#211C14] bg-[#211C14] text-white"
                        : "border-[#CDBB9A] bg-white"
                    }`}
                  >
                    {marcado && (
                      <Check
                        size={13}
                        strokeWidth={3}
                      />
                    )}
                  </span>

                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-[#211C14]">
                      {item.nomeProduto}
                    </span>

                    <span className="mt-1 block text-xs text-[#898174]">
                      {formatarQuantidade(
                        maximo
                      )}{" "}
                      no pedido
                    </span>
                  </span>
                </label>

                {marcado && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#EAE5DC] pt-4">
                    <span className="text-xs font-medium text-[#756C5C]">
                      Quantidade para devolver
                    </span>

                    <div className="relative">
                      <select
                        aria-label={`Quantidade a devolver de ${item.nomeProduto}`}
                        value={
                          quantidades[item.id]
                        }
                        disabled={enviando}
                        onChange={(evento) =>
                          alterarQuantidade(
                            item.id,
                            evento.target.value
                          )
                        }
                        className="min-w-[145px] appearance-none rounded-xl border border-[#EAE5DC] bg-white py-2.5 pl-4 pr-10 text-xs font-medium text-[#211C14] outline-none transition focus:border-[#968052] focus:ring-2 focus:ring-[#968052]/10"
                      >
                        {Array.from(
                          {
                            length: maximo,
                          },
                          (_, indice) => (
                            <option
                              key={indice + 1}
                              value={indice + 1}
                            >
                              {formatarQuantidade(
                                indice + 1
                              )}
                            </option>
                          )
                        )}
                      </select>

                      <ChevronDown
                        size={15}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#968052]"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* MOTIVO */}

      <section>
        <div className="mb-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#968052]">
            Etapa 02
          </span>

          <h3 className="mt-1 font-serif text-xl text-[#211C14]">
            Motivo da devolução
          </h3>

          <p className="mt-1 text-xs text-[#756C5C]">
            Conte-nos por que deseja devolver os produtos.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label
              htmlFor={`${inputId}-motivo`}
              className="mb-2 block text-xs font-semibold text-[#211C14]"
            >
              Selecione o motivo *
            </label>

            <div className="relative">
              <select
                id={`${inputId}-motivo`}
                required
                disabled={enviando}
                value={tipoMotivo}
                onChange={(evento) =>
                  setTipoMotivo(
                    evento.target.value
                  )
                }
                className="w-full appearance-none rounded-xl border border-[#EAE5DC] bg-white px-4 py-3.5 pr-11 text-sm text-[#211C14] outline-none transition focus:border-[#968052] focus:ring-2 focus:ring-[#968052]/10"
              >
                <option value="">
                  Selecione um motivo
                </option>

                {Object.entries(
                  motivosDevolucao
                ).map(([id, nome]) => (
                  <option
                    key={id}
                    value={id}
                  >
                    {nome}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#968052]"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                htmlFor={`${inputId}-descricao`}
                className="text-xs font-semibold text-[#211C14]"
              >
                Descreva o que aconteceu *
              </label>

              <span className="text-[11px] text-[#898174]">
                {motivo.length}/2000
              </span>
            </div>

            <textarea
              id={`${inputId}-descricao`}
              required
              disabled={enviando}
              minLength={10}
              maxLength={2000}
              value={motivo}
              onChange={(evento) =>
                setMotivo(
                  evento.target.value
                )
              }
              rows={5}
              placeholder="Descreva o motivo da devolução..."
              className="block w-full resize-y rounded-xl border border-[#EAE5DC] bg-white px-4 py-3.5 text-sm leading-6 text-[#211C14] outline-none transition placeholder:text-[#AAA294] focus:border-[#968052] focus:ring-2 focus:ring-[#968052]/10"
            />

            <p className="mt-2 text-[11px] text-[#898174]">
              Mínimo de 10 caracteres.
            </p>
          </div>
        </div>
      </section>

      {/* IMAGENS */}

      <section>
        <div className="mb-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#968052]">
            Etapa 03
          </span>

          <h3 className="mt-1 font-serif text-xl text-[#211C14]">
            Imagens dos produtos
          </h3>

          <p className="mt-1 text-xs text-[#756C5C]">
            Adicione imagens para ajudar na análise.
            Esta etapa é opcional.
          </p>
        </div>

        <input
          ref={inputFotosRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={
            enviando ||
            fotos.length >= MAX_FOTOS
          }
          onChange={selecionarFotos}
          className="sr-only"
          aria-label="Selecionar imagens para devolução"
        />

        <div className="rounded-2xl border border-dashed border-[#CDBB9A] bg-[#FAF9F6] p-6 text-center sm:p-7">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#968052] shadow-sm">
            <ImagePlus
              size={23}
              strokeWidth={1.7}
            />
          </div>

          <h4 className="mt-3 text-sm font-semibold text-[#211C14]">
            Adicione imagens do produto
          </h4>

          <p className="mt-2 text-xs leading-5 text-[#756C5C]">
            JPG, PNG ou WebP · Até 4 MB por imagem
          </p>

          <button
            type="button"
            disabled={
              enviando ||
              fotos.length >= MAX_FOTOS
            }
            onClick={() =>
              inputFotosRef.current?.click()
            }
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[#211C14] px-6 py-3 text-xs font-medium text-white transition-all duration-300 hover:bg-[#4A3D2B] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Camera size={16} />

            {fotos.length >= MAX_FOTOS
              ? "Limite atingido"
              : "Adicionar imagens"}
          </button>

          <p className="mt-3 text-[11px] text-[#898174]">
            {fotos.length} de {MAX_FOTOS} imagens anexadas
          </p>
        </div>

        {/* PRÉ-VISUALIZAÇÃO */}

        {fotos.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {fotos.map(
              (foto, indice) => (
                <div
                  key={`${foto.arquivo.name}-${indice}`}
                  className="relative overflow-hidden rounded-xl border border-[#EAE5DC] bg-white"
                >
                  <img
                    src={foto.preview}
                    alt={`Prévia da imagem ${indice + 1}`}
                    className="aspect-square w-full object-cover"
                  />

                  <button
                    type="button"
                    disabled={enviando}
                    onClick={() =>
                      removerFoto(indice)
                    }
                    aria-label={`Remover imagem ${indice + 1}`}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#211C14] shadow-sm transition hover:bg-[#211C14] hover:text-white disabled:opacity-50"
                  >
                    <X size={16} />
                  </button>

                  <p className="truncate px-3 py-2 text-[11px] text-[#756C5C]">
                    {foto.arquivo.name}
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* ERRO */}

      {erro && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <p>{erro}</p>
        </div>
      )}

      {/* ENVIO */}

      <div className="border-t border-[#EEE9E1] pt-6">
        <div className="mb-5 flex items-start gap-3">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-[#968052]"
          />

          <p className="text-xs leading-6 text-[#898174]">
            Após enviar sua solicitação, aguarde as
            instruções da equipe antes de encaminhar
            os produtos.
          </p>
        </div>

        <button
          type="submit"
          disabled={
            enviando ||
            !itensSelecionados.length ||
            !tipoMotivo ||
            motivo.trim().length < 10
          }
          className="group flex w-full items-center justify-center gap-2 rounded-full bg-[#211C14] px-7 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#4A3D2B] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? (
            <>
              <LoaderCircle
                size={18}
                className="animate-spin"
              />

              Enviando solicitação...
            </>
          ) : (
            <>
              Enviar solicitação

              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
