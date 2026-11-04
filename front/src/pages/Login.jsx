
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  UserRound,
  Mail,
  LockKeyhole,
  IdCard,
  ShieldCheck,
  Truck,
  Headset,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  Gem,
} from "lucide-react";

import { apiFetch } from "../services/api.js";
import { useAuth } from "../contexts/AuthContext.jsx";

// ==========================================
// FORMATADORES E VALIDAÇÕES
// ==========================================

function formatarCpf(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  return numeros
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function validarCpf(valor) {
  const cpf = valor.replace(/\D/g, "");

  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  for (let posicao = 9; posicao <= 10; posicao++) {
    let soma = 0;

    for (let indice = 0; indice < posicao; indice++) {
      soma += Number(cpf[indice]) * (posicao + 1 - indice);
    }

    const resto = (soma * 10) % 11;
    const digito = resto === 10 ? 0 : resto;

    if (digito !== Number(cpf[posicao])) {
      return false;
    }
  }

  return true;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function Login() {
  const navigate = useNavigate();
  const { entrar } = useAuth();

  const [modo, setModo] = useState("login");
  const [carregando, setCarregando] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);

  const [formulario, setFormulario] = useState({
    nome: "",
    cpf: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });

  const isCadastro = modo === "cadastro";

  // ==========================================
  // ALTERAR CAMPOS
  // ==========================================

  function alterarCampo(evento) {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: name === "cpf" ? formatarCpf(value) : value,
    }));

    setErro("");
  }

  // ==========================================
  // ALTERNAR ENTRE LOGIN E CADASTRO
  // ==========================================

  function alterarModo(novoModo) {
    if (carregando) return;

    setModo(novoModo);
    setErro("");
    setSucesso("");
    setMostrarSenha(false);
    setMostrarConfirmarSenha(false);
    setAceitouTermos(false);

    setFormulario({
      nome: "",
      cpf: "",
      email: "",
      senha: "",
      confirmarSenha: "",
    });
  }

  // ==========================================
  // VALIDAÇÃO DO CADASTRO
  // ==========================================

  function validarCadastro() {
    if (formulario.nome.trim().length < 2) {
      return "Informe seu nome completo.";
    }

    if (formulario.cpf && !validarCpf(formulario.cpf)) {
      return "Informe um CPF válido.";
    }

    if (formulario.senha.length < 8) {
      return "Sua senha deve possuir pelo menos 8 caracteres.";
    }

    if (formulario.senha !== formulario.confirmarSenha) {
      return "As senhas informadas não coincidem.";
    }

    if (!aceitouTermos) {
      return "Você precisa aceitar os termos de uso e a política de privacidade.";
    }

    return null;
  }

  // ==========================================
  // ENVIAR FORMULÁRIO
  // ==========================================

  async function handleSubmit(evento) {
    evento.preventDefault();

    if (carregando) return;

    setErro("");
    setSucesso("");

    const nome = formulario.nome.trim();
    const email = formulario.email.trim().toLowerCase();
    const senha = formulario.senha;
    const cpf = formulario.cpf.replace(/\D/g, "");

    if (isCadastro) {
      const erroValidacao = validarCadastro();

      if (erroValidacao) {
        setErro(erroValidacao);
        return;
      }
    }

    try {
      setCarregando(true);

      // ======================================
      // CADASTRO
      // ======================================

      if (isCadastro) {
        await apiFetch("/usuario", {
          method: "POST",
          body: JSON.stringify({
            nome,
            email,
            senha,
            ...(cpf ? { cpfCnpj: cpf } : {}),
          }),
        });

        setModo("login");

        setFormulario({
          nome: "",
          cpf: "",
          email,
          senha: "",
          confirmarSenha: "",
        });

        setAceitouTermos(false);
        setMostrarSenha(false);
        setMostrarConfirmarSenha(false);

        setSucesso("Sua conta foi criada com sucesso! Agora entre com seu e-mail e senha.");

        return;
      }

      // ======================================
      // LOGIN
      // ======================================

      const resultado = await apiFetch("/entrar", {
        method: "POST",
        body: JSON.stringify({
          email,
          senha,
        }),
      });

      if (!resultado?.usuario) {
        throw new Error("Não foi possível obter os dados da sua conta.");
      }

      // A sessão é mantida por cookies HTTP-Only.
      // Não armazenamos tokens no localStorage.

      entrar(resultado.usuario);

      if (resultado.usuario.tipo === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (erroApi) {
      console.error("Erro na autenticação:", erroApi);

      setErro(
        erroApi.message || "Não foi possível concluir a operação. Tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  }

  // ==========================================
  // INTERFACE
  // ==========================================

  return (
    <main className="min-h-screen bg-[#F8F3E8] text-[#211C14]">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        {/* PAINEL VISUAL */}

        <section className="relative hidden overflow-hidden bg-[#211C14] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          {/* LOGO */}

          <Link to="/" className="relative z-10 w-fit font-serif text-3xl tracking-[0.18em] text-[#F8F3E8]">
            AURELIA
          </Link>

          {/* APRESENTAÇÃO */}

          <div className="relative z-10 max-w-lg">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-[#B9975B]">
              Elegância em cada detalhe
            </span>

            <h1 className="mt-5 font-serif text-5xl leading-tight text-[#FCFAF5] xl:text-6xl">
              Joias que iluminam sua essência.
            </h1>

            <p className="mt-6 max-w-md text-sm leading-7 text-[#C8BFAF]">
              Descubra peças especiais, criadas para acompanhar seus momentos mais importantes. Na AURELIA, cada detalhe celebra sua beleza e autenticidade.
            </p>

            {/* DESTAQUES */}

            <div className="mt-10 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#B9975B]/40 bg-[#B9975B]/10">
                <Gem size={23} className="text-[#D6BD87]" strokeWidth={1.5} />
              </div>

              <div>
                <p className="font-serif text-lg text-[#FCFAF5]">
                  AURELIA Joias
                </p>

                <p className="mt-1 text-xs text-[#C8BFAF]">
                  Seu brilho, sua história.
                </p>
              </div>
            </div>
          </div>

          {/* RODAPÉ */}

          <p className="relative z-10 text-xs text-[#A69B8B]">
            © 2026 AURELIA. Todos os direitos reservados.
          </p>

          {/* ELEMENTOS DECORATIVOS */}

          <div className="pointer-events-none absolute -right-28 top-1/4 h-[430px] w-[430px] rounded-full border border-[#B9975B]/20" />
          <div className="pointer-events-none absolute -right-12 top-[32%] h-[300px] w-[300px] rounded-full border border-[#B9975B]/20" />
          <div className="pointer-events-none absolute bottom-20 right-16 h-32 w-32 rounded-full bg-[#B9975B]/10 blur-3xl" />
        </section>

        {/* PAINEL DO FORMULÁRIO */}

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:px-6">
          <div className="w-full max-w-[540px] rounded-[24px] border border-[#EFE5D6] bg-[#FFFEFC] px-5 py-7 shadow-sm sm:px-8 sm:py-9">
            {/* LOGO MOBILE */}

            <Link to="/" className="mb-7 block text-center font-serif text-2xl tracking-[0.18em] text-[#211C14] lg:hidden">
              AURELIA
            </Link>

            {/* ALTERNÂNCIA DE MODO */}

            <div className="grid grid-cols-2 rounded-xl border-4 border-[#F0E7D8] bg-[#F0E7D8]">
              <button
                type="button"
                onClick={() => alterarModo("login")}
                disabled={carregando}
                className={`rounded-lg py-3 text-sm font-medium transition ${!isCadastro ? "bg-[#211C14] text-white shadow-sm" : "bg-transparent text-[#6F6558] hover:text-[#211C14]"}`}
              >
                Entrar
              </button>

              <button
                type="button"
                onClick={() => alterarModo("cadastro")}
                disabled={carregando}
                className={`rounded-lg py-3 text-sm font-medium transition ${isCadastro ? "bg-[#211C14] text-white shadow-sm" : "bg-transparent text-[#6F6558] hover:text-[#211C14]"}`}
              >
                Criar conta
              </button>
            </div>

            {/* TÍTULO */}

            <div className="mt-7">
              <h2 className="font-serif text-[27px] leading-tight text-[#211C14] sm:text-[31px]">
                {isCadastro ? "Crie sua conta" : "Bem-vindo de volta"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#8A7E6D]">
                {isCadastro
                  ? "Cadastre-se para acompanhar seus pedidos e aproveitar uma experiência exclusiva na AURELIA."
                  : "Entre na sua conta e continue descobrindo suas joias favoritas."}
              </p>
            </div>

            {/* FORMULÁRIO */}

            <form onSubmit={handleSubmit} className="mt-6">
              {/* MENSAGENS */}

              {erro && (
                <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                  {erro}
                </div>
              )}

              {sucesso && (
                <div role="status" className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                  {sucesso}
                </div>
              )}

              {/* CAMPOS EXCLUSIVOS DO CADASTRO */}

              {isCadastro && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* NOME */}

                  <div>
                    <label htmlFor="nome" className="mb-2 block text-xs font-medium text-[#211C14]">
                      Nome completo
                    </label>

                    <div className="flex h-12 items-center gap-3 rounded-xl border border-[#EFE5D6] px-3.5 transition focus-within:border-[#B9975B]">
                      <UserRound size={17} className="shrink-0 text-[#8A7E6D]" />

                      <input
                        id="nome"
                        name="nome"
                        type="text"
                        value={formulario.nome}
                        onChange={alterarCampo}
                        autoComplete="name"
                        placeholder="Maria Silva"
                        required
                        minLength={2}
                        className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-[#A69B8B]"
                      />
                    </div>
                  </div>

                  {/* CPF */}

                  <div>
                    <label htmlFor="cpf" className="mb-2 block text-xs font-medium text-[#211C14]">
                      CPF <span className="font-normal text-[#8A7E6D]">(opcional)</span>
                    </label>

                    <div className="flex h-12 items-center gap-3 rounded-xl border border-[#EFE5D6] px-3.5 transition focus-within:border-[#B9975B]">
                      <IdCard size={17} className="shrink-0 text-[#8A7E6D]" />

                      <input
                        id="cpf"
                        name="cpf"
                        type="text"
                        inputMode="numeric"
                        value={formulario.cpf}
                        onChange={alterarCampo}
                        autoComplete="off"
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-[#A69B8B]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* E-MAIL */}

              <div className={isCadastro ? "mt-4" : ""}>
                <label htmlFor="email" className="mb-2 block text-xs font-medium text-[#211C14]">
                  E-mail
                </label>

                <div className="flex h-12 items-center gap-3 rounded-xl border border-[#EFE5D6] px-3.5 transition focus-within:border-[#B9975B]">
                  <Mail size={17} className="shrink-0 text-[#8A7E6D]" />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formulario.email}
                    onChange={alterarCampo}
                    autoComplete="email"
                    placeholder="voce@email.com"
                    required
                    className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-[#A69B8B]"
                  />
                </div>
              </div>

              {/* SENHA */}

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="senha" className="text-xs font-medium text-[#211C14]">
                    Senha
                  </label>

                  {isCadastro ? (
                    <span className="text-[11px] text-[#8A7E6D]">
                      Mínimo de 8 caracteres
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#8A7E6D]">
                      Acesso seguro
                    </span>
                  )}
                </div>

                <div className="flex h-12 items-center gap-3 rounded-xl border border-[#EFE5D6] px-3.5 transition focus-within:border-[#B9975B]">
                  <LockKeyhole size={17} className="shrink-0 text-[#8A7E6D]" />

                  <input
                    id="senha"
                    name="senha"
                    type={mostrarSenha ? "text" : "password"}
                    value={formulario.senha}
                    onChange={alterarCampo}
                    autoComplete={isCadastro ? "new-password" : "current-password"}
                    placeholder="Digite sua senha"
                    minLength={isCadastro ? 8 : undefined}
                    required
                    className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-[#A69B8B]"
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarSenha((anterior) => !anterior)}
                    aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                    className="shrink-0 rounded-md p-1 text-[#8A7E6D] transition hover:text-[#211C14]"
                  >
                    {mostrarSenha ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* CONFIRMAR SENHA */}

              {isCadastro && (
                <div className="mt-4">
                  <label htmlFor="confirmarSenha" className="mb-2 block text-xs font-medium text-[#211C14]">
                    Confirmar senha
                  </label>

                  <div className="flex h-12 items-center gap-3 rounded-xl border border-[#EFE5D6] px-3.5 transition focus-within:border-[#B9975B]">
                    <LockKeyhole size={17} className="shrink-0 text-[#8A7E6D]" />

                    <input
                      id="confirmarSenha"
                      name="confirmarSenha"
                      type={mostrarConfirmarSenha ? "text" : "password"}
                      value={formulario.confirmarSenha}
                      onChange={alterarCampo}
                      autoComplete="new-password"
                      placeholder="Digite a senha novamente"
                      minLength={8}
                      required
                      className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-[#A69B8B]"
                    />

                    <button
                      type="button"
                      onClick={() => setMostrarConfirmarSenha((anterior) => !anterior)}
                      aria-label={mostrarConfirmarSenha ? "Ocultar senha" : "Mostrar senha"}
                      className="shrink-0 rounded-md p-1 text-[#8A7E6D] transition hover:text-[#211C14]"
                    >
                      {mostrarConfirmarSenha ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
              )}

              {/* TERMOS */}

              {isCadastro && (
                <label className="mt-5 flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={aceitouTermos}
                    onChange={(evento) => setAceitouTermos(evento.target.checked)}
                    required
                    className="mt-1 h-4 w-4 shrink-0 accent-[#968052]"
                  />

                  <span className="text-xs leading-5 text-[#8A7E6D]">
                    Li e concordo com os{" "}
                    <Link to="/termos" className="font-medium text-[#211C14] underline underline-offset-2">
                      Termos de uso
                    </Link>{" "}
                    e com a{" "}
                    <Link to="/privacidade" className="font-medium text-[#211C14] underline underline-offset-2">
                      Política de privacidade
                    </Link>.
                  </span>
                </label>
              )}

              {/* BOTÃO PRINCIPAL */}

              <button
                type="submit"
                disabled={carregando}
                className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#211C14] px-5 text-sm font-semibold text-white transition hover:bg-[#968052] focus:outline-none focus:ring-2 focus:ring-[#968052]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {carregando ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    {isCadastro ? "Criando sua conta..." : "Entrando..."}
                  </>
                ) : (
                  <>
                    {isCadastro ? "Criar minha conta" : "Entrar na minha conta"}
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            {/* ALTERNÂNCIA INFERIOR */}

            <p className="mt-6 text-center text-xs leading-6 text-[#8A7E6D]">
              {isCadastro ? "Já possui uma conta?" : "Ainda não possui uma conta?"}{" "}
              <button
                type="button"
                onClick={() => alterarModo(isCadastro ? "login" : "cadastro")}
                disabled={carregando}
                className="font-semibold text-[#968052] underline-offset-2 transition hover:text-[#211C14] hover:underline"
              >
                {isCadastro ? "Entrar" : "Cadastre-se"}
              </button>
            </p>

            {/* BENEFÍCIOS */}

            <div className="mt-7 grid grid-cols-3 gap-2 border-t border-[#EFE5D6] pt-6">
              <div className="flex flex-col items-center gap-2 rounded-xl bg-[#F8F3E8] px-2 py-4 text-center">
                <ShieldCheck size={20} className="text-[#968052]" />
                <span className="text-[11px] leading-4 text-[#6F6558]">
                  Compra protegida
                </span>
              </div>

              <div className="flex flex-col items-center gap-2 rounded-xl bg-[#F8F3E8] px-2 py-4 text-center">
                <Truck size={20} className="text-[#968052]" />
                <span className="text-[11px] leading-4 text-[#6F6558]">
                  Acompanhe pedidos
                </span>
              </div>

              <div className="flex flex-col items-center gap-2 rounded-xl bg-[#F8F3E8] px-2 py-4 text-center">
                <Headset size={20} className="text-[#968052]" />
                <span className="text-[11px] leading-4 text-[#6F6558]">
                  Atendimento
                </span>
              </div>
            </div>

            {/* SEGURANÇA */}

            <div className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] text-[#8A7E6D]">
              <LockKeyhole size={13} />
              Seus dados são protegidos com segurança.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
