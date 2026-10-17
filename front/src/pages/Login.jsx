import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {

  ArrowRight,

  ShoppingBag,

  Store,

  UserRound,

  Mail,

  LockKeyhole,

  IdCard,

  ShieldCheck,

  Truck,

  Headset,

  Gift,

  CheckCircle2,

  Eye,

  EyeOff,

} from "lucide-react";

import { FaGoogle, FaApple, FaFacebook} from "react-icons/fa";

export default function Login() {

  const [modo, setModo] = useState("cadastro");

  const [perfil, setPerfil] = useState("vendedor");

  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const navigate = useNavigate();

  const isCadastro = modo === "cadastro";

  async function handleSubmit(e) {
    e.preventDefault();
    const formulario = e.currentTarget;

    setErro("");
    setSucesso("");

    if (carregando) return;

    if (isCadastro && !aceitouTermos) {
      setErro("Você precisa aceitar os termos para continuar.");
      return;
    }

    const campos = new FormData(formulario);
    const nome = campos.get("nome")?.toString().trim();
    const documento = campos.get("documento")?.toString().trim();
    const email = campos.get("email")?.toString().trim();
    const senha = campos.get("senha")?.toString();

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    setCarregando(true);

    try {
      const endpoint = isCadastro
        ? `${API_URL}/api/usuarios`
        : `${API_URL}/api/auth/login`;

      const dados = isCadastro
        ? { nome, email, senha, cpfCnpj: documento || undefined }
        : { email, senha };

      const resposta = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(resultado.mensagem || "Não foi possível concluir a operação.");
      }

      if (isCadastro) {
        setModo("login");
        setSucesso("Conta criada! Entre com seu email e senha.");
        formulario.reset();
        setAceitouTermos(false);
        return;
      }

      // Armazenamento temporário para desenvolvimento.
      // Para produção, prefira uma sessão com cookie HttpOnly.
      sessionStorage.setItem("aurora_token", resultado.token);
      sessionStorage.setItem("aurora_usuario", JSON.stringify(resultado.usuario));

      setSucesso("Login realizado com sucesso!");
      navigate("/");
    } catch (erroApi) {
      setErro(
        erroApi.message ||
          "Não foi possível conectar ao servidor. Tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (

    <main className="min-h-screen bg-[#F8F3E8] text-[#211C14]">

      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">

        {/* PAINEL VISUAL */}

        <section className="relative hidden overflow-hidden bg-[#211C14] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">

          <a

            href="/"

            className="relative z-10 w-fit text-3xl tracking-[0.18em] text-[#F8F3E8]"

          >

            AURORA

          </a>

          <div className="relative z-10 max-w-lg">

            <span className="text-xs font-medium uppercase tracking-[0.3em] text-[#B9975B]">

              Sua beleza, seus negócios

            </span>

            <h1 className="mt-5 text-5xl leading-tight text-[#FCFAF5] xl:text-6xl">

              O brilho das joias. As possibilidades de um novo começo.

            </h1>

            <p className="mt-6 max-w-md text-sm leading-7 text-[#C8BFAF]">

              Descubra peças especiais ou transforme sua paixão por joias

              em um negócio. Seu próximo capítulo começa aqui.

            </p>

            <div className="mt-10 flex items-center gap-4">

              <div className="flex -space-x-2">

                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#211C14] bg-[#E5D4B7]">

                  <UserRound size={17} />

                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#211C14] bg-[#C4A778]">

                  <ShoppingBag size={17} />

                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#211C14] bg-[#F0E8D9]">

                  <Store size={17} />

                </div>

              </div>

              <p className="text-xs leading-5 text-[#C8BFAF]">

                Uma experiência especial

                <br />

                para quem ama joias.

              </p>

            </div>

          </div>

          <p className="relative z-10 text-xs text-[#A69B8B]">

            © 2026 AURORA. Todos os direitos reservados.

          </p>

          {/* Elementos decorativos */}

          <div className="pointer-events-none absolute -right-28 top-1/4 h-[430px] w-[430px] rounded-full border border-[#B9975B]/20" />

          <div className="pointer-events-none absolute -right-12 top-[32%] h-[300px] w-[300px] rounded-full border border-[#B9975B]/20" />

          <div className="pointer-events-none absolute bottom-20 right-16 h-32 w-32 rounded-full bg-[#B9975B]/10 blur-3xl" />

        </section>

        {/* PAINEL DO FORMULÁRIO */}

        <section className="flex min-h-screen items-center justify-center px-4 py-5 sm:px-8 lg:px-6">

          <div className="w-full max-w-[540px] rounded-[24px] border border-[#EFE5D6] bg-[#FFFEFC] px-5 py-6 sm:px-8 sm:py-8">

            {/* Alternância de modo */}

            <div className="mt-4 grid grid-cols-2 rounded-xl border-4 border-[#F0E7D8] bg-[#F0E7D8]">

              <button

                type="button"

                onClick={() => setModo("login")}

                className={`rounded-lg py-2 text-xs transition ${

                  !isCadastro

                    ? "bg-white text-[#211C14] shadow-sm"

                    : "bg-transparent text-[#6F6558]"

                }`}

              >

                Entrar

              </button>

              <button

                type="button"

                onClick={() => setModo("cadastro")}

                className={`rounded-lg py-2 text-xs font-semibold transition ${

                  isCadastro

                    ? "bg-[#203E2F] text-white shadow-sm"

                    : "bg-transparent text-[#6F6558]"

                }`}

              >

                {isCadastro ? "Criar conta" : "Cadastre-se"}

                {isCadastro && (

                  <span className="ml-2 rounded-full bg-[#F4C400] px-2 py-0.5 text-[9px] text-[#211C14]">

                    Grátis

                  </span>

                )}

              </button>

            </div>

            {/* Título */}

            <div className="mt-6">

              <h2 className="text-[25px] font-semibold leading-tight tracking-tight sm:text-[28px]">

                {isCadastro

                  ? "Crie sua conta e comece a vender"

                  : "Bem-vindo de volta"}

              </h2>

              <p className="mt-2 text-xs leading-5 text-[#8A7E6D]">

                {isCadastro

                  ? "Leva menos de 2 minutos. Sem cartão, sem mensalidade inicial."

                  : "Entre na sua conta e continue sua experiência na AURORA."}

              </p>

            </div>

            <form onSubmit={handleSubmit}>
              {erro && (
                <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {erro}
                </div>
              )}

              {sucesso && (
                <div role="status" className="mt-4 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                  {sucesso}
                </div>
              )}

              {/* Perfil */}

              {isCadastro && (

                <fieldset className="mt-5">

                  <legend className="mb-2 text-[10px] font-medium">

                    Quero usar como

                  </legend>

                  <div className="grid grid-cols-2 gap-2">

                    <button

                      type="button"

                      onClick={() => setPerfil("comprador")}

                      className={`flex min-h-[58px] items-center gap-2 rounded-xl border px-3 text-left transition ${

                        perfil === "comprador"

                          ? "border-[#203E2F] bg-[#F7F9F5]"

                          : "border-[#EFE5D6] bg-[#FFFCF7] hover:border-[#CFC2AC]"

                      }`}

                    >

                      <ShoppingBag

                        size={19}

                        className="shrink-0 text-[#82745F]"

                      />

                      <span>

                        <span className="block text-[10px] font-medium">

                          Comprar

                        </span>

                        <span className="mt-0.5 block text-[9px] text-[#8A7E6D]">

                          Explorar ofertas

                        </span>

                      </span>

                    </button>

                    <button

                      type="button"

                      onClick={() => setPerfil("vendedor")}

                      className={`flex min-h-[58px] items-center gap-2 rounded-xl border px-3 text-left transition ${

                        perfil === "vendedor"

                          ? "border-[#203E2F] bg-[#F7F9F5]"

                          : "border-[#EFE5D6] bg-[#FFFCF7] hover:border-[#CFC2AC]"

                      }`}

                    >

                      <span

                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${

                          perfil === "vendedor"

                            ? "bg-[#203E2F] text-white"

                            : "bg-[#F0E7D8] text-[#82745F]"

                        }`}

                      >

                        <Store size={17} />

                      </span>

                      <span>

                        <span className="flex items-center gap-1 text-[10px] font-medium">

                          Vender

                          {perfil === "vendedor" && (

                            <CheckCircle2

                              size={11}

                              className="text-[#23804A]"

                            />

                          )}

                        </span>

                        <span className="mt-0.5 block text-[9px] text-[#8A7E6D]">

                          Seja um Afiliado

                        </span>

                      </span>

                    </button>

                  </div>

                </fieldset>

              )}

              {/* Login social ilustrativo */}

              <div className="mt-4 grid grid-cols-3 gap-2">

                <button

                  type="button"

                  onClick={() =>

                    alert("Login com Google será integrado futuramente.")

                  }

                  className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#EFE5D6] text-[10px] transition hover:bg-[#F8F3E8]"

                >

                <FaGoogle/>

                  Google

                </button>

                <button

                  type="button"

                  onClick={() =>

                    alert("Login com Apple será integrado futuramente.")

                  }

                  className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#EFE5D6] text-[10px] transition hover:bg-[#F8F3E8]"

                >

                  <FaApple size={13} />

                  Apple

                </button>

                <button

                  type="button"

                  onClick={() =>

                    alert("Login com Facebook será integrado futuramente.")

                  }

                  className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#EFE5D6] text-[10px] transition hover:bg-[#F8F3E8]"

                >

                  <FaFacebook/>

                  Facebook

                </button>

              </div>

              {/* Divisor */}

              <div className="my-4 flex items-center gap-3">

                <div className="h-px flex-1 bg-[#EFE5D6]" />

                <span className="text-[9px] text-[#9A8D7A]">

                  ou com e-mail

                </span>

                <div className="h-px flex-1 bg-[#EFE5D6]" />

              </div>

              {/* Nome e documento */}

              {isCadastro && (

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                  <div>

                    <label

                      htmlFor="nome"

                      className="mb-1.5 block text-[10px] font-medium"

                    >

                      Nome

                    </label>

                    <div className="flex h-10 items-center gap-2 rounded-xl border border-[#EFE5D6] px-3 focus-within:border-[#B9975B]">

                      <UserRound

                        size={14}

                        className="shrink-0 text-[#8A7E6D]"

                      />

                      <input

                        id="nome"

                        name="nome"

                        type="text"

                        autoComplete="name"

                        placeholder="Maria Silva"

                        required

                        minLength={2}

                        className="w-full min-w-0 bg-transparent text-[10px] outline-none placeholder:text-[#A69B8B]"

                      />

                    </div>

                  </div>

                  <div>

                    <label

                      htmlFor="documento"

                      className="mb-1.5 block text-[10px] font-medium"

                    >

                      CPF / CNPJ

                    </label>

                    <div className="flex h-10 items-center gap-2 rounded-xl border border-[#EFE5D6] px-3 focus-within:border-[#B9975B]">

                      <IdCard

                        size={14}

                        className="shrink-0 text-[#8A7E6D]"

                      />

                      <input

                        id="documento"

                        name="documento"

                        type="text"

                        autoComplete="off"

                        placeholder="000.000.000-00"

                        required

                        className="w-full min-w-0 bg-transparent text-[10px] outline-none placeholder:text-[#A69B8B]"

                      />

                    </div>

                  </div>

                </div>

              )}

              {/* E-mail */}

              <div className="mt-3">

                <label

                  htmlFor="email"

                  className="mb-1.5 block text-[10px] font-medium"

                >

                  E-mail

                </label>

                <div className="flex h-10 items-center gap-2 rounded-xl border border-[#EFE5D6] px-3 focus-within:border-[#B9975B]">

                  <Mail

                    size={14}

                    className="shrink-0 text-[#8A7E6D]"

                  />

                  <input

                    id="email"

                    name="email"

                    type="email"

                    autoComplete="email"

                    placeholder="voce@email.com"

                    required

                    className="w-full bg-transparent text-[10px] outline-none placeholder:text-[#A69B8B]"

                  />

                </div>

              </div>

              {/* Senha */}

              <div className="mt-3">

                <div className="mb-1.5 flex items-center justify-between">

                  <label

                    htmlFor="senha"

                    className="text-[10px] font-medium"

                  >

                    Senha

                  </label>

                  {isCadastro ? (

                    <span className="text-[9px] text-[#8A7E6D]">

                      Mínimo de 8 caracteres

                    </span>

                  ) : (

                    <button

                      type="button"

                      onClick={() =>

                        alert("A recuperação de senha será implementada.")

                      }

                      className="text-[9px] text-[#8A7E6D] underline"

                    >

                      Esqueci minha senha

                    </button>

                  )}

                </div>

                <div className="flex h-10 items-center gap-2 rounded-xl border border-[#EFE5D6] px-3 focus-within:border-[#B9975B]">

                  <LockKeyhole

                    size={14}

                    className="shrink-0 text-[#8A7E6D]"

                  />

                  <input

                    id="senha"

                    name="senha"

                    type={mostrarSenha ? "text" : "password"}

                    autoComplete={

                      isCadastro ? "new-password" : "current-password"

                    }

                    placeholder={

                      isCadastro

                        ? "Mínimo 8 caracteres"

                        : "Digite sua senha"

                    }

                    minLength={isCadastro ? 8 : undefined}

                    required

                    className="w-full min-w-0 bg-transparent text-[10px] outline-none placeholder:text-[#A69B8B]"

                  />

                  <button

                    type="button"

                    aria-label={

                      mostrarSenha ? "Ocultar senha" : "Mostrar senha"

                    }

                    onClick={() => setMostrarSenha(!mostrarSenha)}

                    className="shrink-0 text-[#8A7E6D]"

                  >

                    {mostrarSenha ? (

                      <EyeOff size={15} />

                    ) : (

                      <Eye size={15} />

                    )}

                  </button>

                </div>

              </div>

              {/* Termos */}

              {isCadastro && (

                <label className="mt-4 flex cursor-pointer items-start gap-2">

                  <input

                    type="checkbox"

                    checked={aceitouTermos}

                    onChange={(e) =>

                      setAceitouTermos(e.target.checked)

                    }

                    className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#203E2F]"

                  />

                  <span className="text-[10px] leading-[1.6] text-[#8A7E6D]">

                    Concordo com os{" "}

                    <a

                      href="/termos"

                      className="font-medium text-[#211C14] underline"

                    >

                      Termos de uso

                    </a>{" "}

                    e a{" "}

                    <a

                      href="/privacidade"

                      className="font-medium text-[#211C14] underline"

                    >

                      Política de privacidade

                    </a>

                    , incluindo o recebimento de dicas de vendas.

                  </span>

                </label>

              )}

              {/* Botão principal */}

              <button
                type="submit"
                disabled={carregando}
                className={`mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#E9522B] px-4 text-xs font-semibold text-white transition hover:bg-[#D94723] focus:outline-none focus:ring-2 focus:ring-[#E9522B]/40 focus:ring-offset-2 ${carregando ? "cursor-not-allowed opacity-70" : ""}`}
              >
                {carregando
                  ? "Aguarde..."
                  : isCadastro
                    ? perfil === "vendedor"
                      ? "Tornar-se Afiliado"
                      : "Criar minha conta grátis"
                    : "Entrar na minha conta"}

                {!carregando && <ArrowRight size={15} />}

              </button>

            </form>

            {/* Benefício promocional */}

            {isCadastro && (

              <div className="mt-3 flex min-h-9 items-center justify-center gap-2 rounded-xl border border-dashed border-[#EFE5D6] bg-[#FFFCF7] px-2 py-2 text-center text-[9px]">

                <Gift size={13} className="shrink-0 text-[#E9522B]" />

                <span>

                  <strong className="font-semibold">

                    Bônus de boas-vindas:

                  </strong>{" "}

                  0% de comissão nos primeiros 30 dias

                </span>

              </div>

            )}

            {/* Vantagens */}

            <div className="mt-4 grid grid-cols-3 gap-2">

              <div className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#F2E9D8] px-2 py-2">

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#203E2F]">

                  <ShieldCheck size={15} />

                </div>

                <span className="text-[9px] leading-tight">

                  Pagamento

                  <br />

                  protegido

                </span>

              </div>

              <div className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#F2E9D8] px-2 py-2">

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#203E2F]">

                  <Truck size={15} />

                </div>

                <span className="text-[9px] leading-tight">

                  Envio com

                  <br />

                  desconto

                </span>

              </div>

              <div className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#F2E9D8] px-2 py-2">

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#203E2F]">

                  <Headset size={15} />

                </div>

                <span className="text-[9px] leading-tight">

                  Suporte em

                  <br />

                  português

                </span>

              </div>

            </div>

            {/* Segurança */}

            <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-[9px] text-[#8A7E6D]">

              <LockKeyhole size={11} className="shrink-0" />

              Seus dados são protegidos com segurança.

            </div>

          </div>

        </section>

      </div>

    </main>

  );

}
