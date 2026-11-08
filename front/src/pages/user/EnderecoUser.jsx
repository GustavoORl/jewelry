
import { useCallback, useEffect, useState } from "react";

import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Check,
  LoaderCircle,
  TriangleAlert,
  Home,
  X,
  Save,
  CheckCircle2,
} from "lucide-react";

import { apiFetch } from "../../services/api.js";
import FaixaNavegacao from "../../components/common/FaixaNavegacao.jsx";

// ============================================================
// CONFIGURAÇÕES
// ============================================================

const FORMULARIO_INICIAL = {
  destinatario: "",
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  principal: false,
};

const inputClass = `
  w-full
  rounded-xl
  border
  border-[#E5D9C6]
  bg-white
  px-4
  py-3
  text-sm
  text-[#211C14]
  outline-none
  transition
  placeholder:text-[#A49A8C]
  focus:border-[#968052]
  focus:ring-2
  focus:ring-[#968052]/10
  disabled:cursor-not-allowed
  disabled:opacity-60
`;

// ============================================================
// FORMATADORES
// ============================================================

function formatarCep(cep) {
  if (!cep) return "";

  const numeros = String(cep).replace(/\D/g, "");

  if (numeros.length !== 8) return String(cep);

  return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
}

function formatarCepInput(valor) {
  const numeros = String(valor)
    .replace(/\D/g, "")
    .slice(0, 8);

  if (numeros.length <= 5) return numeros;

  return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
}

// ============================================================
// LABEL
// ============================================================

function CampoLabel({
  htmlFor,
  children,
  obrigatorio = false,
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71675B]"
    >
      {children}

      {obrigatorio && (
        <span className="ml-1 text-[#A47B43]">*</span>
      )}
    </label>
  );
}

// ============================================================
// CARD DO ENDEREÇO
// ============================================================

function EnderecoCard({
  endereco,
  processando,
  onEditar,
  onExcluir,
  onDefinirPrincipal,
}) {
  return (
    <article
      className={`group flex min-h-[270px] flex-col overflow-hidden rounded-[22px] border bg-white p-5 transition-all duration-300 sm:p-6 ${
        endereco.principal
          ? "border-[#D6C29C]"
          : "border-[#EAE0D1] hover:border-[#C9B692]"
      }`}
    >
      {/* CABEÇALHO */}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F7F2E8] text-[#968052]">
            <Home size={19} strokeWidth={1.7} />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#A47B43]">
              Entrega para
            </p>

            <h2 className="mt-1 break-words text-sm font-semibold text-[#211C14]">
              {endereco.destinatario}
            </h2>
          </div>
        </div>

        {endereco.principal && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F7F2E8] px-3 py-1.5 text-[10px] font-semibold text-[#968052]">
            <Check size={13} />
            Principal
          </span>
        )}
      </div>

      {/* INFORMAÇÕES DO ENDEREÇO */}

      <div className="mt-6 flex-1 rounded-[16px] bg-[#FAF7F1] p-4">
        <div className="flex items-start gap-3">
          <MapPin
            size={17}
            strokeWidth={1.7}
            className="mt-0.5 shrink-0 text-[#968052]"
          />

          <div className="min-w-0 space-y-1 text-xs leading-relaxed text-[#81776A]">
            <p className="font-medium text-[#514635]">
              {endereco.rua}, {endereco.numero}
            </p>

            {endereco.complemento && (
              <p>{endereco.complemento}</p>
            )}

            <p>{endereco.bairro}</p>

            <p>
              {endereco.cidade} - {endereco.estado}
            </p>

            <p className="pt-1 text-[#A49A8C]">
              CEP {formatarCep(endereco.cep)}
            </p>
          </div>
        </div>
      </div>

      {/* AÇÕES */}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={processando}
          onClick={() => onEditar(endereco)}
          className="inline-flex items-center gap-2 rounded-full border border-[#E5D9C6] px-4 py-2.5 text-xs font-medium text-[#514635] transition hover:border-[#968052] hover:bg-[#F7F2E8] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Pencil size={14} />
          Editar
        </button>

        <button
          type="button"
          disabled={processando}
          onClick={() => onExcluir(endereco)}
          className="inline-flex items-center gap-2 rounded-full border border-[#EAE0D1] px-4 py-2.5 text-xs font-medium text-[#81776A] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processando ? (
            <LoaderCircle
              size={14}
              className="animate-spin"
            />
          ) : (
            <Trash2 size={14} />
          )}

          Excluir
        </button>

        {!endereco.principal && (
          <button
            type="button"
            disabled={processando}
            onClick={() => onDefinirPrincipal(endereco.id)}
            className="inline-flex items-center gap-2 rounded-full bg-[#F7F2E8] px-4 py-2.5 text-xs font-medium text-[#968052] transition hover:bg-[#E9DCC4] disabled:cursor-not-allowed disabled:opacity-50 sm:ml-auto"
          >
            {processando ? (
              <LoaderCircle
                size={14}
                className="animate-spin"
              />
            ) : (
              <Check size={14} />
            )}

            Tornar principal
          </button>
        )}
      </div>
    </article>
  );
}

// ============================================================
// ESTADO VAZIO
// ============================================================

function EstadoVazio({ onNovoEndereco }) {
  return (
    <section className="flex min-h-[420px] flex-col items-center justify-center rounded-[24px] border border-[#EAE0D1] bg-white px-6 py-16 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#F7F2E8] text-[#968052]">
        <MapPin size={31} strokeWidth={1.5} />
      </div>

      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A47B43]">
        Seus locais de entrega
      </p>

      <h2 className="font-serif text-2xl text-[#211C14] sm:text-3xl">
        Nenhum endereço cadastrado
      </h2>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-[#81776A]">
        Adicione um endereço para facilitar suas próximas
        compras e receber suas joias com tranquilidade.
      </p>

      <button
        type="button"
        onClick={onNovoEndereco}
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#211C14] px-6 py-3 text-xs font-medium text-white transition hover:bg-[#4A3D2B]"
      >
        <Plus size={16} />
        Adicionar endereço
      </button>
    </section>
  );
}

// ============================================================
// MODAL DE ENDEREÇO
// ============================================================

function EnderecoModal({
  formulario,
  enderecoEditando,
  salvando,
  erro,
  onChange,
  onSubmit,
  onClose,
}) {
  const editando = Boolean(enderecoEditando);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-endereco"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-[#FCFAF6] shadow-2xl"
      >
        {/* CABEÇALHO DO MODAL */}

        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#EAE0D1] bg-[#FCFAF6] px-5 py-5 sm:px-8">
          <div>
            <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A47B43]">
              <MapPin size={14} />
              Endereço de entrega
            </p>

            <h2
              id="titulo-modal-endereco"
              className="font-serif text-2xl text-[#211C14]"
            >
              {editando
                ? "Editar endereço"
                : "Novo endereço"}
            </h2>

            <p className="mt-2 text-xs text-[#81776A]">
              {editando
                ? "Atualize as informações do endereço selecionado."
                : "Preencha os dados para cadastrar um novo local de entrega."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={salvando}
            aria-label="Fechar formulário"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#EAE0D1] bg-white text-[#81776A] transition hover:bg-[#F7F2E8] hover:text-[#211C14] disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* FORMULÁRIO */}

        <form
          onSubmit={onSubmit}
          className="px-5 py-6 sm:px-8 sm:py-8"
        >
          {erro && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-xs leading-relaxed text-red-700"
            >
              <TriangleAlert
                size={17}
                className="mt-0.5 shrink-0"
              />

              <span>{erro}</span>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            {/* DESTINATÁRIO */}

            <div className="sm:col-span-2">
              <CampoLabel
                htmlFor="destinatario"
                obrigatorio
              >
                Destinatário
              </CampoLabel>

              <input
                id="destinatario"
                name="destinatario"
                type="text"
                value={formulario.destinatario}
                onChange={onChange}
                placeholder="Nome de quem receberá o pedido"
                autoComplete="name"
                required
                disabled={salvando}
                className={inputClass}
              />
            </div>

            {/* CEP */}

            <div>
              <CampoLabel htmlFor="cep" obrigatorio>
                CEP
              </CampoLabel>

              <input
                id="cep"
                name="cep"
                type="text"
                inputMode="numeric"
                maxLength={9}
                value={formulario.cep}
                onChange={onChange}
                placeholder="00000-000"
                autoComplete="postal-code"
                required
                disabled={salvando}
                className={inputClass}
              />
            </div>

            {/* ESTADO */}

            <div>
              <CampoLabel htmlFor="estado" obrigatorio>
                Estado
              </CampoLabel>

              <input
                id="estado"
                name="estado"
                type="text"
                maxLength={2}
                value={formulario.estado}
                onChange={onChange}
                placeholder="SP"
                autoComplete="address-level1"
                required
                disabled={salvando}
                className={inputClass}
              />
            </div>

            {/* RUA */}

            <div className="sm:col-span-2">
              <CampoLabel htmlFor="rua" obrigatorio>
                Rua / Avenida
              </CampoLabel>

              <input
                id="rua"
                name="rua"
                type="text"
                value={formulario.rua}
                onChange={onChange}
                placeholder="Nome da rua ou avenida"
                autoComplete="address-line1"
                required
                disabled={salvando}
                className={inputClass}
              />
            </div>

            {/* NÚMERO */}

            <div>
              <CampoLabel htmlFor="numero" obrigatorio>
                Número
              </CampoLabel>

              <input
                id="numero"
                name="numero"
                type="text"
                value={formulario.numero}
                onChange={onChange}
                placeholder="123"
                required
                disabled={salvando}
                className={inputClass}
              />
            </div>

            {/* COMPLEMENTO */}

            <div>
              <CampoLabel htmlFor="complemento">
                Complemento
              </CampoLabel>

              <input
                id="complemento"
                name="complemento"
                type="text"
                value={formulario.complemento}
                onChange={onChange}
                placeholder="Apto, bloco, casa..."
                autoComplete="address-line2"
                disabled={salvando}
                className={inputClass}
              />
            </div>

            {/* BAIRRO */}

            <div>
              <CampoLabel htmlFor="bairro" obrigatorio>
                Bairro
              </CampoLabel>

              <input
                id="bairro"
                name="bairro"
                type="text"
                value={formulario.bairro}
                onChange={onChange}
                placeholder="Centro"
                required
                disabled={salvando}
                className={inputClass}
              />
            </div>

            {/* CIDADE */}

            <div>
              <CampoLabel htmlFor="cidade" obrigatorio>
                Cidade
              </CampoLabel>

              <input
                id="cidade"
                name="cidade"
                type="text"
                value={formulario.cidade}
                onChange={onChange}
                placeholder="Sua cidade"
                autoComplete="address-level2"
                required
                disabled={salvando}
                className={inputClass}
              />
            </div>
          </div>

          {/* ENDEREÇO PRINCIPAL */}

          <div className="mt-7 rounded-[18px] border border-[#EAE0D1] bg-white p-4 sm:p-5">
            <label
              className={`flex items-start gap-3 ${
                enderecoEditando?.principal
                  ? "cursor-default"
                  : "cursor-pointer"
              }`}
            >
              <input
                type="checkbox"
                name="principal"
                checked={formulario.principal}
                onChange={onChange}
                disabled={
                  salvando ||
                  Boolean(enderecoEditando?.principal)
                }
                className="mt-1 h-4 w-4 rounded accent-[#968052]"
              />

              <div>
                <p className="text-sm font-medium text-[#211C14]">
                  Definir como endereço principal
                </p>

                <p className="mt-1.5 text-xs leading-relaxed text-[#81776A]">
                  {enderecoEditando?.principal
                    ? "Este já é seu endereço principal."
                    : "Usar este endereço como padrão nas próximas compras."}
                </p>
              </div>
            </label>
          </div>

          {/* BOTÕES */}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#EAE0D1] pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="rounded-full border border-[#E5D9C6] px-6 py-3 text-xs font-medium text-[#514635] transition hover:bg-[#F7F2E8] disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#211C14] px-6 py-3 text-xs font-medium text-white transition hover:bg-[#4A3D2B] disabled:cursor-wait disabled:opacity-50"
            >
              {salvando ? (
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
                  {editando
                    ? "Salvar alterações"
                    : "Cadastrar endereço"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function EnderecoUser() {
  const [enderecos, setEnderecos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [processandoId, setProcessandoId] = useState(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [enderecoEditando, setEnderecoEditando] =
    useState(null);

  const [formulario, setFormulario] = useState({
    ...FORMULARIO_INICIAL,
  });

  const [salvando, setSalvando] = useState(false);
  const [erroFormulario, setErroFormulario] = useState("");

  // ============================================================
  // CARREGAR ENDEREÇOS
  // ============================================================

  const carregarEnderecos = useCallback(
    async (mostrarLoading = true) => {
      try {
        if (mostrarLoading) {
          setCarregando(true);
        }

        setErro("");

        const resultado = await apiFetch("/enderecos");

        const lista = Array.isArray(resultado?.enderecos)
          ? resultado.enderecos
          : [];

        setEnderecos(
          [...lista].sort(
            (a, b) =>
              Number(b.principal) - Number(a.principal)
          )
        );

        return true;
      } catch (error) {
        console.error(
          "Erro ao carregar endereços:",
          error
        );

        setErro(
          error.message ||
            "Não foi possível carregar seus endereços."
        );

        return false;
      } finally {
        if (mostrarLoading) {
          setCarregando(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    carregarEnderecos();
  }, [carregarEnderecos]);

  // ============================================================
  // FECHAR MENSAGEM DE SUCESSO
  // ============================================================

  useEffect(() => {
    if (!sucesso) return;

    const timeout = setTimeout(() => {
      setSucesso("");
    }, 4000);

    return () => clearTimeout(timeout);
  }, [sucesso]);

  // ============================================================
  // BLOQUEAR SCROLL COM MODAL ABERTO
  // ============================================================

  useEffect(() => {
    if (!modalAberto) return;

    const overflowAnterior =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [modalAberto]);

  // ============================================================
  // ABRIR / FECHAR MODAL
  // ============================================================

  function handleNovoEndereco() {
    setEnderecoEditando(null);
    setFormulario({ ...FORMULARIO_INICIAL });
    setErroFormulario("");
    setModalAberto(true);
  }

  function handleEditarEndereco(endereco) {
    setEnderecoEditando(endereco);

    setFormulario({
      destinatario: endereco.destinatario || "",
      cep: formatarCepInput(endereco.cep || ""),
      rua: endereco.rua || "",
      numero: endereco.numero || "",
      complemento: endereco.complemento || "",
      bairro: endereco.bairro || "",
      cidade: endereco.cidade || "",
      estado: endereco.estado || "",
      principal: Boolean(endereco.principal),
    });

    setErroFormulario("");
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) return;

    setModalAberto(false);
    setEnderecoEditando(null);
    setFormulario({ ...FORMULARIO_INICIAL });
    setErroFormulario("");
  }

  useEffect(() => {
    if (!modalAberto) return;

    function handleKeyDown(event) {
      if (event.key === "Escape" && !salvando) {
        fecharModal();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [modalAberto, salvando]);

  // ============================================================
  // ALTERAR FORMULÁRIO
  // ============================================================

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    if (name === "cep") {
      setFormulario((anterior) => ({
        ...anterior,
        cep: formatarCepInput(value),
      }));

      return;
    }

    if (name === "estado") {
      const estado = value
        .replace(/[^a-zA-Z]/g, "")
        .slice(0, 2)
        .toUpperCase();

      setFormulario((anterior) => ({
        ...anterior,
        estado,
      }));

      return;
    }

    setFormulario((anterior) => ({
      ...anterior,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  // ============================================================
  // VALIDAR FORMULÁRIO
  // ============================================================

  function validarFormulario() {
    const camposObrigatorios = [
      { campo: "destinatario", nome: "destinatário" },
      { campo: "cep", nome: "CEP" },
      { campo: "rua", nome: "rua" },
      { campo: "numero", nome: "número" },
      { campo: "bairro", nome: "bairro" },
      { campo: "cidade", nome: "cidade" },
      { campo: "estado", nome: "estado" },
    ];

    for (const item of camposObrigatorios) {
      const valor = String(
        formulario[item.campo] || ""
      ).trim();

      if (!valor) {
        setErroFormulario(
          `Preencha o campo ${item.nome}.`
        );

        return false;
      }
    }

    const cep = formulario.cep.replace(/\D/g, "");

    if (cep.length !== 8) {
      setErroFormulario("Informe um CEP válido.");
      return false;
    }

    if (formulario.estado.trim().length !== 2) {
      setErroFormulario(
        "Informe a sigla do estado com 2 letras."
      );

      return false;
    }

    return true;
  }

  // ============================================================
  // SALVAR ENDEREÇO
  // ============================================================

  async function handleSalvarEndereco(event) {
    event.preventDefault();
    setErroFormulario("");

    if (!validarFormulario()) return;

    try {
      setSalvando(true);

      const dados = {
        destinatario: formulario.destinatario.trim(),
        cep: formulario.cep.replace(/\D/g, ""),
        rua: formulario.rua.trim(),
        numero: formulario.numero.trim(),
        complemento: formulario.complemento.trim(),
        bairro: formulario.bairro.trim(),
        cidade: formulario.cidade.trim(),
        estado: formulario.estado.trim().toUpperCase(),
        principal: formulario.principal,
      };

      if (enderecoEditando) {
        await apiFetch(
          `/enderecos/${enderecoEditando.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(dados),
          }
        );

        setSucesso(
          "Endereço atualizado com sucesso."
        );
      } else {
        await apiFetch("/enderecos", {
          method: "POST",
          body: JSON.stringify(dados),
        });

        setSucesso(
          "Endereço cadastrado com sucesso."
        );
      }

      setModalAberto(false);
      setEnderecoEditando(null);
      setFormulario({ ...FORMULARIO_INICIAL });
      setErroFormulario("");

      await carregarEnderecos(false);
    } catch (error) {
      console.error(
        "Erro ao salvar endereço:",
        error
      );

      setErroFormulario(
        error.message ||
          "Não foi possível salvar o endereço."
      );
    } finally {
      setSalvando(false);
    }
  }

  // ============================================================
  // DEFINIR COMO PRINCIPAL
  // ============================================================

  async function handleDefinirPrincipal(enderecoId) {
    try {
      setProcessandoId(enderecoId);
      setErro("");
      setSucesso("");

      await apiFetch(
        `/enderecos/${enderecoId}/principal`,
        {
          method: "PATCH",
        }
      );

      setEnderecos((anteriores) =>
        anteriores
          .map((endereco) => ({
            ...endereco,
            principal: endereco.id === enderecoId,
          }))
          .sort(
            (a, b) =>
              Number(b.principal) - Number(a.principal)
          )
      );

      setSucesso(
        "Endereço principal atualizado."
      );
    } catch (error) {
      console.error(
        "Erro ao definir endereço principal:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível alterar o endereço principal."
      );
    } finally {
      setProcessandoId(null);
    }
  }

  // ============================================================
  // EXCLUIR ENDEREÇO
  // ============================================================

  async function handleExcluirEndereco(endereco) {
    const confirmou = window.confirm(
      `Deseja realmente excluir o endereço ${endereco.rua}, ${endereco.numero}?`
    );

    if (!confirmou) return;

    try {
      setProcessandoId(endereco.id);
      setErro("");
      setSucesso("");

      await apiFetch(`/enderecos/${endereco.id}`, {
        method: "DELETE",
      });

      await carregarEnderecos(false);

      setSucesso(
        "Endereço excluído com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao excluir endereço:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível excluir o endereço."
      );
    } finally {
      setProcessandoId(null);
    }
  }

  // ============================================================
  // LOADING INICIAL
  // ============================================================

  if (carregando) {
    return (
      <main className="flex min-h-[75vh] items-center justify-center bg-[#FCFAF6]">
        <div className="flex flex-col items-center gap-4 text-center">
          <LoaderCircle
            size={32}
            className="animate-spin text-[#968052]"
          />

          <div>
            <p className="font-serif text-xl text-[#211C14]">
              Carregando seus endereços
            </p>

            <p className="mt-2 text-sm text-[#81776A]">
              Estamos buscando seus locais de entrega.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // RENDERIZAÇÃO
  // ============================================================

  return (
    <main className="min-h-screen bg-[#FCFAF6] text-[#211C14]">
      {/* NAVEGAÇÃO */}

      <div className="max-md:hidden">
        <FaixaNavegacao
          mostrarVoltar={false}
          itens={[
            { label: "Início", to: "/" },
            { label: "Endereços" },
          ]}
        />
      </div>

      <div className="mx-auto max-w-[1180px] px-5 pb-20 pt-10 sm:px-8 lg:px-10 lg:pt-14">
        {/* CABEÇALHO */}

        <section className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#A47B43]">
              <MapPin size={14} />
              Minha conta / Endereços
            </p>

            <h1 className="font-serif text-3xl tracking-tight text-[#211C14] sm:text-4xl">
              Meus endereços
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#81776A]">
              Gerencie seus endereços de entrega e escolha
              onde deseja receber suas próximas joias.
            </p>
          </div>

          <button
            type="button"
            onClick={handleNovoEndereco}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#211C14] px-6 py-3.5 text-xs font-medium text-white transition hover:bg-[#4A3D2B] sm:w-auto"
          >
            <Plus size={17} />
            Novo endereço
          </button>
        </section>

        {/* MENSAGEM DE SUCESSO */}

        {sucesso && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-[18px] border border-[#D7E7D5] bg-[#EDF5EC] px-5 py-4 text-sm text-[#547D5D]"
          >
            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0"
            />

            <span>{sucesso}</span>
          </div>
        )}

        {/* MENSAGEM DE ERRO */}

        {erro && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-[18px] border border-[#F0D8D5] bg-[#FBEEEE] px-5 py-4 text-sm text-[#A45B52]"
          >
            <TriangleAlert
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              <p>{erro}</p>

              <button
                type="button"
                onClick={() => carregarEnderecos()}
                className="mt-2 text-xs font-semibold underline underline-offset-2"
              >
                Atualizar endereços
              </button>
            </div>
          </div>
        )}

        {/* SEM ENDEREÇOS */}

        {enderecos.length === 0 ? (
          <EstadoVazio
            onNovoEndereco={handleNovoEndereco}
          />
        ) : (
          <>
            {/* CONTADOR */}

            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs text-[#81776A]">
                <span className="font-semibold text-[#211C14]">
                  {enderecos.length}
                </span>{" "}
                {enderecos.length === 1
                  ? "endereço cadastrado"
                  : "endereços cadastrados"}
              </p>

              <span className="hidden text-[11px] text-[#A49A8C] sm:block">
                Seus locais de entrega
              </span>
            </div>

            {/* CARDS */}

            <section className="grid gap-5 md:grid-cols-2">
              {enderecos.map((endereco) => (
                <EnderecoCard
                  key={endereco.id}
                  endereco={endereco}
                  processando={
                    processandoId === endereco.id
                  }
                  onEditar={handleEditarEndereco}
                  onExcluir={handleExcluirEndereco}
                  onDefinirPrincipal={
                    handleDefinirPrincipal
                  }
                />
              ))}

              {/* ADICIONAR OUTRO */}

              <button
                type="button"
                onClick={handleNovoEndereco}
                className="group flex min-h-[270px] flex-col items-center justify-center rounded-[22px] border border-dashed border-[#D8CBB7] bg-white/60 p-8 text-center transition-all duration-300 hover:border-[#968052] hover:bg-white"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#E5D9C6] bg-white text-[#968052] transition group-hover:border-[#968052] group-hover:bg-[#F7F2E8]">
                  <Plus size={22} strokeWidth={1.7} />
                </div>

                <h2 className="text-sm font-semibold text-[#211C14]">
                  Adicionar outro endereço
                </h2>

                <p className="mt-2 max-w-[240px] text-xs leading-relaxed text-[#81776A]">
                  Cadastre outro local para receber seus
                  pedidos com mais praticidade.
                </p>
              </button>
            </section>
          </>
        )}
      </div>

      {/* MODAL */}

      {modalAberto && (
        <EnderecoModal
          formulario={formulario}
          enderecoEditando={enderecoEditando}
          salvando={salvando}
          erro={erroFormulario}
          onChange={handleChange}
          onSubmit={handleSalvarEndereco}
          onClose={fecharModal}
        />
      )}
    </main>
  );
}
