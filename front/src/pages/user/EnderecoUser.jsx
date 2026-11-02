import { useEffect, useState } from "react";

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
} from "lucide-react";

import { apiFetch } from "../../services/api.js";


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


export default function EnderecoUser() {
  const [enderecos, setEnderecos] = useState([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  const [processandoId, setProcessandoId] =
    useState(null);

  const [modalAberto, setModalAberto] =
    useState(false);

  const [enderecoEditando, setEnderecoEditando] =
    useState(null);

  const [formulario, setFormulario] =
    useState(FORMULARIO_INICIAL);

  const [salvando, setSalvando] =
    useState(false);

  const [erroFormulario, setErroFormulario] =
    useState("");


  /**
   * =========================================
   * CARREGAR ENDEREÇOS
   * =========================================
   */

  async function carregarEnderecos(
    mostrarLoading = true
  ) {
    try {
      if (mostrarLoading) {
        setCarregando(true);
      }

      setErro("");

      const resultado =
        await apiFetch("/enderecos");

      setEnderecos(
        resultado?.enderecos || []
      );
    } catch (erro) {
      console.error(
        "Erro ao carregar endereços:",
        erro
      );

      setErro(
        erro.message ||
          "Não foi possível carregar seus endereços."
      );
    } finally {
      if (mostrarLoading) {
        setCarregando(false);
      }
    }
  }


  useEffect(() => {
    carregarEnderecos();
  }, []);


  /**
   * =========================================
   * FECHAR MENSAGEM DE SUCESSO
   * =========================================
   */

  useEffect(() => {
    if (!sucesso) {
      return;
    }

    const timeout =
      setTimeout(() => {
        setSucesso("");
      }, 4000);

    return () =>
      clearTimeout(timeout);
  }, [sucesso]);


  /**
   * =========================================
   * BLOQUEAR SCROLL COM MODAL ABERTO
   * =========================================
   */

  useEffect(() => {
    if (!modalAberto) {
      return;
    }

    const overflowAnterior =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        overflowAnterior;
    };
  }, [modalAberto]);


  /**
   * =========================================
   * ESC PARA FECHAR MODAL
   * =========================================
   */

  useEffect(() => {
    if (!modalAberto) {
      return;
    }

    function handleKeyDown(event) {
      if (
        event.key === "Escape" &&
        !salvando
      ) {
        fecharModal();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [modalAberto, salvando]);


  /**
   * =========================================
   * NOVO ENDEREÇO
   * =========================================
   */

  function handleNovoEndereco() {
    setEnderecoEditando(null);

    setFormulario(
      FORMULARIO_INICIAL
    );

    setErroFormulario("");

    setModalAberto(true);
  }


  /**
   * =========================================
   * EDITAR ENDEREÇO
   * =========================================
   */

  function handleEditarEndereco(endereco) {
    setEnderecoEditando(endereco);

    setFormulario({
      destinatario:
        endereco.destinatario || "",

      cep:
        formatarCepInput(
          endereco.cep || ""
        ),

      rua:
        endereco.rua || "",

      numero:
        endereco.numero || "",

      complemento:
        endereco.complemento || "",

      bairro:
        endereco.bairro || "",

      cidade:
        endereco.cidade || "",

      estado:
        endereco.estado || "",

      principal:
        endereco.principal || false,
    });

    setErroFormulario("");

    setModalAberto(true);
  }


  /**
   * =========================================
   * FECHAR MODAL
   * =========================================
   */

  function fecharModal() {
    if (salvando) {
      return;
    }

    setModalAberto(false);

    setEnderecoEditando(null);

    setFormulario(
      FORMULARIO_INICIAL
    );

    setErroFormulario("");
  }


  /**
   * =========================================
   * ALTERAR FORMULÁRIO
   * =========================================
   */

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;


    if (name === "cep") {
      setFormulario(
        (formularioAtual) => ({
          ...formularioAtual,

          cep:
            formatarCepInput(
              value
            ),
        })
      );

      return;
    }


    if (name === "estado") {
      const estado =
        value
          .replace(/[^a-zA-Z]/g, "")
          .slice(0, 2)
          .toUpperCase();

      setFormulario(
        (formularioAtual) => ({
          ...formularioAtual,
          estado,
        })
      );

      return;
    }


    setFormulario(
      (formularioAtual) => ({
        ...formularioAtual,

        [name]:
          type === "checkbox"
            ? checked
            : value,
      })
    );
  }


  /**
   * =========================================
   * VALIDAR FORMULÁRIO
   * =========================================
   */

  function validarFormulario() {
    const camposObrigatorios = [
      {
        campo: "destinatario",
        nome: "destinatário",
      },
      {
        campo: "cep",
        nome: "CEP",
      },
      {
        campo: "rua",
        nome: "rua",
      },
      {
        campo: "numero",
        nome: "número",
      },
      {
        campo: "bairro",
        nome: "bairro",
      },
      {
        campo: "cidade",
        nome: "cidade",
      },
      {
        campo: "estado",
        nome: "estado",
      },
    ];


    for (
      const item
      of camposObrigatorios
    ) {
      if (
        !String(
          formulario[item.campo] || ""
        ).trim()
      ) {
        setErroFormulario(
          `Preencha o campo ${item.nome}.`
        );

        return false;
      }
    }


    const cep =
      formulario.cep.replace(
        /\D/g,
        ""
      );


    if (cep.length !== 8) {
      setErroFormulario(
        "Informe um CEP válido."
      );

      return false;
    }


    if (
      formulario.estado.trim().length !==
      2
    ) {
      setErroFormulario(
        "Informe a sigla do estado com 2 letras."
      );

      return false;
    }


    return true;
  }


  /**
   * =========================================
   * SALVAR ENDEREÇO
   * =========================================
   */

  async function handleSalvarEndereco(
    event
  ) {
    event.preventDefault();

    setErroFormulario("");


    if (!validarFormulario()) {
      return;
    }


    try {
      setSalvando(true);


      const dados = {
        destinatario:
          formulario.destinatario.trim(),

        cep:
          formulario.cep.replace(
            /\D/g,
            ""
          ),

        rua:
          formulario.rua.trim(),

        numero:
          formulario.numero.trim(),

        complemento:
          formulario.complemento.trim(),

        bairro:
          formulario.bairro.trim(),

        cidade:
          formulario.cidade.trim(),

        estado:
          formulario.estado
            .trim()
            .toUpperCase(),

        principal:
          formulario.principal,
      };


      /**
       * =====================================
       * EDITAR
       * =====================================
       */

      if (enderecoEditando) {
        await apiFetch(
          `/enderecos/${enderecoEditando.id}`,
          {
            method: "PATCH",

            body:
              JSON.stringify(
                dados
              ),
          }
        );


        setSucesso(
          "Endereço atualizado com sucesso."
        );
      }

      /**
       * =====================================
       * CRIAR
       * =====================================
       */

      else {
        await apiFetch(
          "/enderecos",
          {
            method: "POST",

            body:
              JSON.stringify(
                dados
              ),
          }
        );


        setSucesso(
          "Endereço cadastrado com sucesso."
        );
      }


      setModalAberto(false);

      setEnderecoEditando(null);

      setFormulario(
        FORMULARIO_INICIAL
      );

      setErroFormulario("");


      /**
       * Recarrega porque o backend pode
       * ter alterado qual endereço é o
       * principal.
       */

      await carregarEnderecos(false);

    } catch (erro) {
      console.error(
        "Erro ao salvar endereço:",
        erro
      );

      setErroFormulario(
        erro.message ||
          "Não foi possível salvar o endereço."
      );
    } finally {
      setSalvando(false);
    }
  }


  /**
   * =========================================
   * DEFINIR COMO PRINCIPAL
   * =========================================
   */

  async function handleDefinirPrincipal(
    enderecoId
  ) {
    try {
      setProcessandoId(
        enderecoId
      );

      setErro("");
      setSucesso("");


      await apiFetch(
        `/enderecos/${enderecoId}/principal`,
        {
          method: "PATCH",
        }
      );


      setEnderecos(
        (enderecosAtuais) => {
          const atualizados =
            enderecosAtuais.map(
              (endereco) => ({
                ...endereco,

                principal:
                  endereco.id ===
                  enderecoId,
              })
            );


          return atualizados.sort(
            (a, b) =>
              Number(
                b.principal
              ) -
              Number(
                a.principal
              )
          );
        }
      );


      setSucesso(
        "Endereço principal atualizado."
      );

    } catch (erro) {
      console.error(
        "Erro ao definir endereço principal:",
        erro
      );

      setErro(
        erro.message ||
          "Não foi possível alterar o endereço principal."
      );
    } finally {
      setProcessandoId(null);
    }
  }


  /**
   * =========================================
   * EXCLUIR ENDEREÇO
   * =========================================
   */

  async function handleExcluirEndereco(
    endereco
  ) {
    const confirmou =
      window.confirm(
        `Deseja realmente excluir o endereço ${endereco.rua}, ${endereco.numero}?`
      );


    if (!confirmou) {
      return;
    }


    try {
      setProcessandoId(
        endereco.id
      );

      setErro("");
      setSucesso("");


      await apiFetch(
        `/enderecos/${endereco.id}`,
        {
          method: "DELETE",
        }
      );


      /**
       * Recarrega porque, se excluirmos
       * o principal, o backend define
       * outro automaticamente.
       */

      await carregarEnderecos(false);


      setSucesso(
        "Endereço excluído com sucesso."
      );

    } catch (erro) {
      console.error(
        "Erro ao excluir endereço:",
        erro
      );

      setErro(
        erro.message ||
          "Não foi possível excluir o endereço."
      );
    } finally {
      setProcessandoId(null);
    }
  }


  /**
   * =========================================
   * LOADING INICIAL
   * =========================================
   */

  if (carregando) {
    return (
      <main className="min-h-screen bg-[#FAF8F4]">

        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-6">

          <div className="flex flex-col items-center gap-4">

            <LoaderCircle
              size={30}
              className="animate-spin text-[#A8864A]"
            />

            <p className="text-sm text-neutral-500">
              Carregando seus endereços...
            </p>

          </div>

        </div>

      </main>
    );
  }


  return (
    <main className="min-h-screen bg-[#FAF8F4]">

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">


        {/* =====================================
            CABEÇALHO
        ====================================== */}

        <section className="mb-10 flex flex-col gap-6 border-b border-black/10 pb-8 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <div className="mb-3 flex items-center gap-2 text-[#A8864A]">

              <MapPin size={17} />

              <span className="text-xs font-semibold uppercase tracking-[0.22em]">
                Minha conta
              </span>

            </div>


            <h1 className="text-3xl font-medium tracking-tight text-[#1E1E1E] sm:text-4xl">
              Meus endereços
            </h1>


            <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500">
              Gerencie os endereços utilizados
              para entrega dos seus pedidos.
            </p>

          </div>


          <button
            type="button"
            onClick={
              handleNovoEndereco
            }
            className="flex w-full items-center justify-center gap-2 bg-[#1E1E1E] px-5 py-3.5 text-sm font-medium text-white transition hover:bg-[#A8864A] sm:w-auto"
          >

            <Plus size={17} />

            Novo endereço

          </button>

        </section>


        {/* =====================================
            MENSAGEM DE SUCESSO
        ====================================== */}

        {sucesso && (

          <div className="mb-7 flex items-start gap-3 border border-green-200 bg-green-50 px-4 py-3.5 text-sm text-green-700">

            <Check
              size={19}
              className="mt-0.5 shrink-0"
            />

            <span>
              {sucesso}
            </span>

          </div>

        )}


        {/* =====================================
            ERRO
        ====================================== */}

        {erro && (

          <div className="mb-7 flex items-start gap-3 border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">

            <TriangleAlert
              size={19}
              className="mt-0.5 shrink-0"
            />

            <span>
              {erro}
            </span>

          </div>

        )}


        {/* =====================================
            SEM ENDEREÇOS
        ====================================== */}

        {enderecos.length === 0 ? (

          <EstadoVazio
            onNovoEndereco={
              handleNovoEndereco
            }
          />

        ) : (

          <>

            <div className="mb-5">

              <p className="text-sm text-neutral-500">

                {enderecos.length}{" "}

                {enderecos.length === 1
                  ? "endereço cadastrado"
                  : "endereços cadastrados"}

              </p>

            </div>


            {/* =================================
                CARDS
            ================================== */}

            <section className="grid gap-5 md:grid-cols-2">

              {enderecos.map(
                (endereco) => (

                  <EnderecoCard
                    key={
                      endereco.id
                    }
                    endereco={
                      endereco
                    }
                    processando={
                      processandoId ===
                      endereco.id
                    }
                    onEditar={
                      handleEditarEndereco
                    }
                    onExcluir={
                      handleExcluirEndereco
                    }
                    onDefinirPrincipal={
                      handleDefinirPrincipal
                    }
                  />

                )
              )}


              {/* ADICIONAR OUTRO */}

              <button
                type="button"
                onClick={
                  handleNovoEndereco
                }
                className="group flex min-h-[260px] flex-col items-center justify-center border border-dashed border-black/20 bg-white/40 p-8 text-center transition hover:border-[#A8864A] hover:bg-white"
              >

                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white text-[#A8864A] transition group-hover:border-[#A8864A]/30 group-hover:bg-[#A8864A]/5">

                  <Plus size={22} />

                </div>


                <h2 className="text-sm font-semibold text-[#1E1E1E]">
                  Adicionar outro endereço
                </h2>


                <p className="mt-2 max-w-[240px] text-xs leading-5 text-neutral-500">
                  Cadastre outro local para
                  receber seus pedidos.
                </p>

              </button>

            </section>

          </>

        )}

      </div>


      {/* =====================================
          MODAL
      ====================================== */}

      {modalAberto && (

        <EnderecoModal
          formulario={
            formulario
          }
          enderecoEditando={
            enderecoEditando
          }
          salvando={
            salvando
          }
          erro={
            erroFormulario
          }
          onChange={
            handleChange
          }
          onSubmit={
            handleSalvarEndereco
          }
          onClose={
            fecharModal
          }
        />

      )}

    </main>
  );
}


/**
 * =========================================
 * MODAL DE ENDEREÇO
 * =========================================
 */

function EnderecoModal({
  formulario,
  enderecoEditando,
  salvando,
  erro,
  onChange,
  onSubmit,
  onClose,
}) {

  const editando =
    Boolean(
      enderecoEditando
    );


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      onMouseDown={
        onClose
      }
    >

      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto bg-[#FAF8F4] shadow-2xl"
        onMouseDown={
          (event) =>
            event.stopPropagation()
        }
      >

        {/* =================================
            CABEÇALHO MODAL
        ================================== */}

        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-black/10 bg-[#FAF8F4] px-6 py-5 sm:px-8">

          <div>

            <div className="mb-2 flex items-center gap-2 text-[#A8864A]">

              <MapPin size={15} />

              <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                Endereço de entrega
              </span>

            </div>


            <h2 className="text-2xl font-medium text-[#1E1E1E]">

              {editando
                ? "Editar endereço"
                : "Novo endereço"}

            </h2>

          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              salvando
            }
            className="flex h-10 w-10 items-center justify-center text-neutral-500 transition hover:bg-black/5 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fechar"
          >

            <X size={20} />

          </button>

        </div>


        {/* =================================
            FORMULÁRIO
        ================================== */}

        <form
          onSubmit={
            onSubmit
          }
          className="px-6 py-7 sm:px-8"
        >

          {erro && (

            <div className="mb-6 flex items-start gap-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

              <TriangleAlert
                size={18}
                className="mt-0.5 shrink-0"
              />

              <span>
                {erro}
              </span>

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
                value={
                  formulario.destinatario
                }
                onChange={
                  onChange
                }
                placeholder="Nome de quem receberá o pedido"
                autoComplete="name"
                className={inputClass}
              />

            </div>


            {/* CEP */}

            <div>

              <CampoLabel
                htmlFor="cep"
                obrigatorio
              >
                CEP
              </CampoLabel>

              <input
                id="cep"
                name="cep"
                type="text"
                inputMode="numeric"
                maxLength={9}
                value={
                  formulario.cep
                }
                onChange={
                  onChange
                }
                placeholder="00000-000"
                autoComplete="postal-code"
                className={inputClass}
              />

            </div>


            {/* ESTADO */}

            <div>

              <CampoLabel
                htmlFor="estado"
                obrigatorio
              >
                Estado
              </CampoLabel>

              <input
                id="estado"
                name="estado"
                type="text"
                maxLength={2}
                value={
                  formulario.estado
                }
                onChange={
                  onChange
                }
                placeholder="SP"
                autoComplete="address-level1"
                className={inputClass}
              />

            </div>


            {/* RUA */}

            <div className="sm:col-span-2">

              <CampoLabel
                htmlFor="rua"
                obrigatorio
              >
                Rua / Avenida
              </CampoLabel>

              <input
                id="rua"
                name="rua"
                type="text"
                value={
                  formulario.rua
                }
                onChange={
                  onChange
                }
                placeholder="Nome da rua ou avenida"
                autoComplete="address-line1"
                className={inputClass}
              />

            </div>


            {/* NÚMERO */}

            <div>

              <CampoLabel
                htmlFor="numero"
                obrigatorio
              >
                Número
              </CampoLabel>

              <input
                id="numero"
                name="numero"
                type="text"
                value={
                  formulario.numero
                }
                onChange={
                  onChange
                }
                placeholder="123"
                className={inputClass}
              />

            </div>


            {/* COMPLEMENTO */}

            <div>

              <CampoLabel
                htmlFor="complemento"
              >
                Complemento
              </CampoLabel>

              <input
                id="complemento"
                name="complemento"
                type="text"
                value={
                  formulario.complemento
                }
                onChange={
                  onChange
                }
                placeholder="Apto, bloco, casa..."
                autoComplete="address-line2"
                className={inputClass}
              />

            </div>


            {/* BAIRRO */}

            <div>

              <CampoLabel
                htmlFor="bairro"
                obrigatorio
              >
                Bairro
              </CampoLabel>

              <input
                id="bairro"
                name="bairro"
                type="text"
                value={
                  formulario.bairro
                }
                onChange={
                  onChange
                }
                placeholder="Centro"
                className={inputClass}
              />

            </div>


            {/* CIDADE */}

            <div>

              <CampoLabel
                htmlFor="cidade"
                obrigatorio
              >
                Cidade
              </CampoLabel>

              <input
                id="cidade"
                name="cidade"
                type="text"
                value={
                  formulario.cidade
                }
                onChange={
                  onChange
                }
                placeholder="Sua cidade"
                autoComplete="address-level2"
                className={inputClass}
              />

            </div>

          </div>


          {/* =================================
              PRINCIPAL
          ================================== */}

          <div className="mt-7 border border-black/10 bg-white p-4">

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
                checked={
                  formulario.principal
                }
                onChange={
                  onChange
                }
                disabled={
                  Boolean(
                    enderecoEditando?.principal
                  )
                }
                className="mt-1 h-4 w-4 accent-[#A8864A]"
              />


              <div>

                <p className="text-sm font-medium text-[#1E1E1E]">
                  Endereço principal
                </p>


                <p className="mt-1 text-xs leading-5 text-neutral-500">

                  {enderecoEditando?.principal
                    ? "Este já é o seu endereço principal."
                    : "Usar este endereço como padrão nas próximas compras."}

                </p>

              </div>

            </label>

          </div>


          {/* =================================
              AÇÕES
          ================================== */}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-black/10 pt-6 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                salvando
              }
              className="px-6 py-3 text-sm font-medium text-neutral-600 transition hover:bg-black/5 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>


            <button
              type="submit"
              disabled={
                salvando
              }
              className="flex items-center justify-center gap-2 bg-[#1E1E1E] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#A8864A] disabled:cursor-not-allowed disabled:opacity-60"
            >

              {salvando ? (

                <>
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />

                  Salvando...
                </>

              ) : (

                <>
                  <Save size={17} />

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


/**
 * =========================================
 * LABEL
 * =========================================
 */

function CampoLabel({
  htmlFor,
  children,
  obrigatorio = false,
}) {

  return (
    <label
      htmlFor={
        htmlFor
      }
      className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600"
    >

      {children}

      {obrigatorio && (
        <span className="ml-1 text-[#A8864A]">
          *
        </span>
      )}

    </label>
  );
}


/**
 * =========================================
 * CARD DO ENDEREÇO
 * =========================================
 */

function EnderecoCard({
  endereco,
  processando,
  onEditar,
  onExcluir,
  onDefinirPrincipal,
}) {

  return (
    <article
      className={`relative flex min-h-[260px] flex-col bg-white p-6 transition sm:p-7 ${
        endereco.principal
          ? "border border-[#A8864A]"
          : "border border-black/10 hover:border-black/20"
      }`}
    >

      {/* TOPO */}

      <div className="mb-6 flex items-start justify-between gap-4">

        <div className="flex items-center gap-3">

          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              endereco.principal
                ? "bg-[#A8864A]/10 text-[#A8864A]"
                : "bg-[#F5F3EF] text-neutral-600"
            }`}
          >

            <Home size={18} />

          </div>


          <div>

            <p className="text-xs uppercase tracking-[0.15em] text-neutral-400">
              Entrega para
            </p>

            <h2 className="mt-1 font-medium text-[#1E1E1E]">
              {endereco.destinatario}
            </h2>

          </div>

        </div>


        {endereco.principal && (

          <div className="flex shrink-0 items-center gap-1.5 bg-[#A8864A]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8A6C37]">

            <Check size={13} />

            Principal

          </div>

        )}

      </div>


      {/* ENDEREÇO */}

      <div className="flex-1 text-sm leading-6 text-neutral-600">

        <p>
          {endereco.rua},{" "}
          {endereco.numero}
        </p>


        {endereco.complemento && (
          <p>
            {endereco.complemento}
          </p>
        )}


        <p>
          {endereco.bairro}
        </p>


        <p>
          {endereco.cidade} -{" "}
          {endereco.estado}
        </p>


        <p className="mt-1 text-neutral-400">
          CEP{" "}
          {formatarCep(
            endereco.cep
          )}
        </p>

      </div>


      {/* AÇÕES */}

      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-black/10 pt-5">

        <button
          type="button"
          disabled={
            processando
          }
          onClick={() =>
            onEditar(
              endereco
            )
          }
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-neutral-600 transition hover:bg-[#F7F5F1] hover:text-[#1E1E1E] disabled:cursor-not-allowed disabled:opacity-50"
        >

          <Pencil size={15} />

          Editar

        </button>


        <button
          type="button"
          disabled={
            processando
          }
          onClick={() =>
            onExcluir(
              endereco
            )
          }
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-neutral-600 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >

          {processando ? (

            <LoaderCircle
              size={15}
              className="animate-spin"
            />

          ) : (

            <Trash2 size={15} />

          )}

          Excluir

        </button>


        {!endereco.principal && (

          <button
            type="button"
            disabled={
              processando
            }
            onClick={() =>
              onDefinirPrincipal(
                endereco.id
              )
            }
            className="ml-0 flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#8A6C37] transition hover:bg-[#A8864A]/10 disabled:cursor-not-allowed disabled:opacity-50 sm:ml-auto"
          >

            {processando ? (

              <LoaderCircle
                size={15}
                className="animate-spin"
              />

            ) : (

              <Check size={15} />

            )}

            Tornar principal

          </button>

        )}

      </div>

    </article>
  );
}


/**
 * =========================================
 * ESTADO VAZIO
 * =========================================
 */

function EstadoVazio({
  onNovoEndereco,
}) {

  return (
    <section className="flex min-h-[420px] flex-col items-center justify-center border border-black/10 bg-white px-6 py-16 text-center">

      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#A8864A]/10 text-[#A8864A]">

        <MapPin size={27} />

      </div>


      <h2 className="text-xl font-medium text-[#1E1E1E]">
        Nenhum endereço cadastrado
      </h2>


      <p className="mt-3 max-w-md text-sm leading-6 text-neutral-500">
        Adicione um endereço para facilitar
        suas próximas compras e entregas.
      </p>


      <button
        type="button"
        onClick={
          onNovoEndereco
        }
        className="mt-7 flex items-center gap-2 bg-[#1E1E1E] px-5 py-3.5 text-sm font-medium text-white transition hover:bg-[#A8864A]"
      >

        <Plus size={17} />

        Adicionar endereço

      </button>

    </section>
  );
}


/**
 * =========================================
 * CLASSE DOS INPUTS
 * =========================================
 */

const inputClass = `
  w-full
  border
  border-black/15
  bg-white
  px-4
  py-3
  text-sm
  text-[#1E1E1E]
  outline-none
  transition
  placeholder:text-neutral-400
  focus:border-[#A8864A]
  focus:ring-1
  focus:ring-[#A8864A]/20
`;


/**
 * =========================================
 * FORMATAR CEP PARA EXIBIÇÃO
 * =========================================
 */

function formatarCep(cep) {
  if (!cep) {
    return "";
  }

  const numeros =
    String(cep).replace(
      /\D/g,
      ""
    );

  if (numeros.length !== 8) {
    return cep;
  }

  return `${numeros.slice(
    0,
    5
  )}-${numeros.slice(5)}`;
}


/**
 * =========================================
 * FORMATAR CEP DURANTE DIGITAÇÃO
 * =========================================
 */

function formatarCepInput(valor) {
  const numeros =
    String(valor)
      .replace(/\D/g, "")
      .slice(0, 8);

  if (numeros.length <= 5) {
    return numeros;
  }

  return `${numeros.slice(
    0,
    5
  )}-${numeros.slice(5)}`;
}