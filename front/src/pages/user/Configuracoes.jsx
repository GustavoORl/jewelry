import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    UserRound,
    LockKeyhole,
    Eye,
    EyeOff,
    Save,
    ShieldCheck,
    LogOut,
    LoaderCircle,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";

import {
    apiFetch,
} from "../../services/api.js";

import FaixaNavegacao from "../../components/common/FaixaNavegacao.jsx";


export default function Configuracoes() {
    const navigate = useNavigate();


    /**
     * ---------------------------------------------------------
     * DADOS DO USUÁRIO
     * ---------------------------------------------------------
     */

    const [
        carregando,
        setCarregando,
    ] = useState(true);

    const [
        salvandoPerfil,
        setSalvandoPerfil,
    ] = useState(false);

    const [
        alterandoSenha,
        setAlterandoSenha,
    ] = useState(false);

    const [
        saindo,
        setSaindo,
    ] = useState(false);


    const [
        perfil,
        setPerfil,
    ] = useState({
        nome: "",
        email: "",
        telefone: "",
    });


    /**
     * Guardamos os dados originais para saber
     * se o usuário realmente alterou alguma coisa.
     */
    const [
        perfilOriginal,
        setPerfilOriginal,
    ] = useState({
        nome: "",
        email: "",
        telefone: "",
    });


    /**
     * ---------------------------------------------------------
     * SENHA
     * ---------------------------------------------------------
     */

    const [
        senhas,
        setSenhas,
    ] = useState({
        senhaAtual: "",
        novaSenha: "",
        confirmarSenha: "",
    });


    const [
        mostrarSenhaAtual,
        setMostrarSenhaAtual,
    ] = useState(false);

    const [
        mostrarNovaSenha,
        setMostrarNovaSenha,
    ] = useState(false);

    const [
        mostrarConfirmarSenha,
        setMostrarConfirmarSenha,
    ] = useState(false);


    /**
     * ---------------------------------------------------------
     * MENSAGENS
     * ---------------------------------------------------------
     */

    const [
        mensagemPerfil,
        setMensagemPerfil,
    ] = useState(null);

    const [
        mensagemSenha,
        setMensagemSenha,
    ] = useState(null);

    const [
        erroCarregamento,
        setErroCarregamento,
    ] = useState("");


    /**
     * ---------------------------------------------------------
     * CARREGAR USUÁRIO
     * ---------------------------------------------------------
     */

    useEffect(() => {
        carregarUsuario();
    }, []);


    async function carregarUsuario() {
        try {
            setCarregando(true);
            setErroCarregamento("");


            const resposta =
                await apiFetch("/me");


            if (!resposta?.usuario) {
                throw new Error(
                    "Não foi possível carregar os dados da conta."
                );
            }


            const dadosPerfil = {
                nome:
                    resposta.usuario.nome ||
                    "",

                email:
                    resposta.usuario.email ||
                    "",

                telefone:
                    resposta.usuario.telefone ||
                    "",
            };


            setPerfil(
                dadosPerfil
            );

            setPerfilOriginal(
                dadosPerfil
            );
        } catch (erro) {
            console.error(
                "Erro ao carregar usuário:",
                erro
            );


            setErroCarregamento(
                erro.message ||
                "Não foi possível carregar os dados da sua conta."
            );
        } finally {
            setCarregando(false);
        }
    }


    /**
     * ---------------------------------------------------------
     * ALTERAÇÃO DOS CAMPOS DO PERFIL
     * ---------------------------------------------------------
     */

    function alterarCampoPerfil(
        evento
    ) {
        const {
            name,
            value,
        } = evento.target;


        setPerfil(
            (anterior) => ({
                ...anterior,

                [name]:
                    name ===
                    "telefone"
                        ? formatarTelefone(
                              value
                          )
                        : value,
            })
        );


        setMensagemPerfil(
            null
        );
    }


    /**
     * ---------------------------------------------------------
     * ALTERAÇÃO DOS CAMPOS DE SENHA
     * ---------------------------------------------------------
     */

    function alterarCampoSenha(
        evento
    ) {
        const {
            name,
            value,
        } = evento.target;


        setSenhas(
            (anterior) => ({
                ...anterior,
                [name]: value,
            })
        );


        setMensagemSenha(
            null
        );
    }


    /**
     * ---------------------------------------------------------
     * FORMATAÇÃO DO TELEFONE
     * ---------------------------------------------------------
     */

    function formatarTelefone(
        valor
    ) {
        const numeros =
            valor
                .replace(
                    /\D/g,
                    ""
                )
                .slice(
                    0,
                    11
                );


        if (
            numeros.length <=
            2
        ) {
            return numeros;
        }


        if (
            numeros.length <=
            6
        ) {
            return `(${numeros.slice(
                0,
                2
            )}) ${numeros.slice(
                2
            )}`;
        }


        if (
            numeros.length <=
            10
        ) {
            return `(${numeros.slice(
                0,
                2
            )}) ${numeros.slice(
                2,
                6
            )}-${numeros.slice(
                6
            )}`;
        }


        return `(${numeros.slice(
            0,
            2
        )}) ${numeros.slice(
            2,
            7
        )}-${numeros.slice(
            7
        )}`;
    }


    /**
     * ---------------------------------------------------------
     * VERIFICA SE O PERFIL FOI ALTERADO
     * ---------------------------------------------------------
     */

    const perfilFoiAlterado =
        perfil.nome.trim() !==
            perfilOriginal.nome.trim() ||
        perfil.email
            .trim()
            .toLowerCase() !==
            perfilOriginal.email
                .trim()
                .toLowerCase() ||
        perfil.telefone.trim() !==
            perfilOriginal.telefone.trim();


    /**
     * ---------------------------------------------------------
     * SALVAR PERFIL
     * ---------------------------------------------------------
     */

    async function salvarPerfil(
        evento
    ) {
        evento.preventDefault();


        setMensagemPerfil(
            null
        );


        const nome =
            perfil.nome.trim();

        const email =
            perfil.email
                .trim()
                .toLowerCase();

        const telefone =
            perfil.telefone.trim();


        if (
            nome.length < 2
        ) {
            setMensagemPerfil({
                tipo: "erro",

                texto:
                    "Informe um nome válido.",
            });

            return;
        }


        if (!email) {
            setMensagemPerfil({
                tipo: "erro",

                texto:
                    "Informe seu e-mail.",
            });

            return;
        }


        try {
            setSalvandoPerfil(
                true
            );


            const resposta =
                await apiFetch(
                    "/usuario/me",
                    {
                        method:
                            "PATCH",

                        body:
                            JSON.stringify(
                                {
                                    nome,
                                    email,

                                    telefone:
                                        telefone ||
                                        null,
                                }
                            ),
                    }
                );


            if (
                !resposta?.usuario
            ) {
                throw new Error(
                    resposta?.mensagem ||
                    "Não foi possível atualizar seus dados."
                );
            }


            const dadosAtualizados =
                {
                    nome:
                        resposta
                            .usuario
                            .nome ||
                        "",

                    email:
                        resposta
                            .usuario
                            .email ||
                        "",

                    telefone:
                        resposta
                            .usuario
                            .telefone ||
                        "",
                };


            setPerfil(
                dadosAtualizados
            );

            setPerfilOriginal(
                dadosAtualizados
            );


            setMensagemPerfil({
                tipo:
                    "sucesso",

                texto:
                    resposta.mensagem ||
                    "Dados atualizados com sucesso.",
            });
        } catch (erro) {
            console.error(
                "Erro ao atualizar perfil:",
                erro
            );


            setMensagemPerfil({
                tipo: "erro",

                texto:
                    erro.message ||
                    "Não foi possível atualizar seus dados.",
            });
        } finally {
            setSalvandoPerfil(
                false
            );
        }
    }


    /**
     * ---------------------------------------------------------
     * ALTERAR SENHA
     * ---------------------------------------------------------
     */

    async function alterarSenha(
        evento
    ) {
        evento.preventDefault();


        setMensagemSenha(
            null
        );


        if (
            !senhas.senhaAtual
        ) {
            setMensagemSenha({
                tipo: "erro",

                texto:
                    "Informe sua senha atual.",
            });

            return;
        }


        if (
            senhas.novaSenha.length <
            8
        ) {
            setMensagemSenha({
                tipo: "erro",

                texto:
                    "A nova senha deve possuir pelo menos 8 caracteres.",
            });

            return;
        }


        if (
            senhas.novaSenha !==
            senhas.confirmarSenha
        ) {
            setMensagemSenha({
                tipo: "erro",

                texto:
                    "As novas senhas não coincidem.",
            });

            return;
        }


        if (
            senhas.senhaAtual ===
            senhas.novaSenha
        ) {
            setMensagemSenha({
                tipo: "erro",

                texto:
                    "A nova senha deve ser diferente da senha atual.",
            });

            return;
        }


        try {
            setAlterandoSenha(
                true
            );


            const resposta =
                await apiFetch(
                    "/usuario/me/senha",
                    {
                        method:
                            "PATCH",

                        body:
                            JSON.stringify(
                                {
                                    senhaAtual:
                                        senhas.senhaAtual,

                                    novaSenha:
                                        senhas.novaSenha,

                                    confirmarSenha:
                                        senhas.confirmarSenha,
                                }
                            ),
                    }
                );


            setSenhas({
                senhaAtual: "",
                novaSenha: "",
                confirmarSenha: "",
            });


            setMostrarSenhaAtual(
                false
            );

            setMostrarNovaSenha(
                false
            );

            setMostrarConfirmarSenha(
                false
            );


            setMensagemSenha({
                tipo:
                    "sucesso",

                texto:
                    resposta?.mensagem ||
                    "Senha alterada com sucesso.",
            });
        } catch (erro) {
            console.error(
                "Erro ao alterar senha:",
                erro
            );


            setMensagemSenha({
                tipo: "erro",

                texto:
                    erro.message ||
                    "Não foi possível alterar sua senha.",
            });
        } finally {
            setAlterandoSenha(
                false
            );
        }
    }


    /**
     * ---------------------------------------------------------
     * LOGOUT
     * ---------------------------------------------------------
     */

    async function sairDaConta() {
        try {
            setSaindo(true);


            await apiFetch(
                "/sair",
                {
                    method:
                        "POST",
                }
            );
        } catch (erro) {
            /**
             * Mesmo se o backend falhar ao encerrar a sessão,
             * podemos mandar o usuário para o login.
             *
             * O backend normalmente também limpa os cookies
             * quando o logout funciona.
             */
            console.error(
                "Erro ao sair:",
                erro
            );
        } finally {
            navigate(
                "/login",
                {
                    replace: true,
                }
            );
        }
    }


    /**
     * ---------------------------------------------------------
     * LOADING
     * ---------------------------------------------------------
     */

    if (carregando) {
        return (
            <main className="min-h-[70vh] bg-[#FCFAF5]">
                <div className="mx-auto flex min-h-[60vh] max-w-[1240px] items-center justify-center px-5">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <LoaderCircle
                            size={32}
                            className="animate-spin text-[#968052]"
                        />

                        <p className="text-sm text-[#756C5C]">
                            Carregando suas
                            configurações...
                        </p>
                    </div>
                </div>
            </main>
        );
    }


    /**
     * ---------------------------------------------------------
     * ERRO AO CARREGAR
     * ---------------------------------------------------------
     */

    if (erroCarregamento) {
        return (
            <main className="min-h-[70vh] bg-[#FCFAF5]">
                <div className="mx-auto flex min-h-[60vh] max-w-[1240px] items-center justify-center px-5">
                    <div className="w-full max-w-lg rounded-2xl border border-[#E9DCC4] bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                            <AlertCircle
                                size={24}
                                className="text-red-600"
                            />
                        </div>

                        <h2 className="font-serif text-2xl text-[#211C14]">
                            Não foi possível
                            carregar sua conta
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-[#756C5C]">
                            {
                                erroCarregamento
                            }
                        </p>

                        <button
                            type="button"
                            onClick={
                                carregarUsuario
                            }
                            className="mt-6 rounded-lg bg-[#211C14] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#968052]"
                        >
                            Tentar novamente
                        </button>
                    </div>
                </div>
            </main>
        );
    }


    return (
        <main className="min-h-screen bg-[#FCFAF5]">
            <div className="max-md:hidden">
                            <FaixaNavegacao
                              mostrarVoltar={false}
                              itens={[
                                { label: "Início", to: "/" },
                                { label: "Configurações" },
                              ]}
                            />
                          </div>
            <div className="mx-auto max-w-[1240px] px-5 py-10 sm:px-6 lg:px-8 lg:py-14">

                {/* Cabeçalho */}

                <div className="mb-10">

                    <h1 className="font-serif text-3xl text-[#211C14] sm:text-4xl">
                        Configurações
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[#756C5C]">
                        Gerencie seus dados
                        pessoais e as
                        configurações de
                        segurança da sua conta.
                    </p>
                </div>


                <div className="space-y-6">

                    {/* ================================================= */}
                    {/* DADOS PESSOAIS */}
                    {/* ================================================= */}

                    <section className="overflow-hidden rounded-2xl border border-[#E9DCC4] bg-white shadow-sm">

                        <div className="border-b border-[#E9DCC4] bg-[#FDFBF7] px-6 py-5 sm:px-8">
                            <div className="flex items-start gap-4">

                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F8F3E8]">
                                    <UserRound
                                        size={21}
                                        className="text-[#968052]"
                                    />
                                </div>

                                <div>
                                    <h2 className="font-serif text-xl text-[#211C14]">
                                        Dados pessoais
                                    </h2>

                                    <p className="mt-1 text-sm text-[#756C5C]">
                                        Atualize as
                                        informações
                                        utilizadas na
                                        sua conta.
                                    </p>
                                </div>
                            </div>
                        </div>


                        <form
                            onSubmit={
                                salvarPerfil
                            }
                            className="p-6 sm:p-8"
                        >
                            <div className="grid gap-6 md:grid-cols-2">

                                {/* Nome */}

                                <div className="md:col-span-2">
                                    <label
                                        htmlFor="nome"
                                        className="mb-2 block text-sm font-medium text-[#211C14]"
                                    >
                                        Nome completo
                                    </label>

                                    <input
                                        id="nome"
                                        name="nome"
                                        type="text"
                                        value={
                                            perfil.nome
                                        }
                                        onChange={
                                            alterarCampoPerfil
                                        }
                                        autoComplete="name"
                                        placeholder="Seu nome completo"
                                        className="w-full rounded-lg border border-[#E9DCC4] bg-white px-4 py-3 text-sm text-[#211C14] outline-none transition placeholder:text-[#B5AC9D] focus:border-[#968052] focus:ring-2 focus:ring-[#968052]/10"
                                    />
                                </div>


                                {/* E-mail */}

                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-2 block text-sm font-medium text-[#211C14]"
                                    >
                                        E-mail
                                    </label>

                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={
                                            perfil.email
                                        }
                                        onChange={
                                            alterarCampoPerfil
                                        }
                                        autoComplete="email"
                                        placeholder="seu@email.com"
                                        className="w-full rounded-lg border border-[#E9DCC4] bg-white px-4 py-3 text-sm text-[#211C14] outline-none transition placeholder:text-[#B5AC9D] focus:border-[#968052] focus:ring-2 focus:ring-[#968052]/10"
                                    />

                                    <p className="mt-2 text-xs leading-5 text-[#8B8171]">
                                        Este e-mail
                                        também é
                                        utilizado para
                                        acessar sua
                                        conta.
                                    </p>
                                </div>


                                {/* Telefone */}

                                <div>
                                    <label
                                        htmlFor="telefone"
                                        className="mb-2 block text-sm font-medium text-[#211C14]"
                                    >
                                        Telefone
                                    </label>

                                    <input
                                        id="telefone"
                                        name="telefone"
                                        type="tel"
                                        value={
                                            perfil.telefone
                                        }
                                        onChange={
                                            alterarCampoPerfil
                                        }
                                        autoComplete="tel"
                                        placeholder="(12) 99999-9999"
                                        className="w-full rounded-lg border border-[#E9DCC4] bg-white px-4 py-3 text-sm text-[#211C14] outline-none transition placeholder:text-[#B5AC9D] focus:border-[#968052] focus:ring-2 focus:ring-[#968052]/10"
                                    />
                                </div>

                            </div>


                            {mensagemPerfil && (
                                <Mensagem
                                    tipo={
                                        mensagemPerfil.tipo
                                    }
                                >
                                    {
                                        mensagemPerfil.texto
                                    }
                                </Mensagem>
                            )}


                            <div className="mt-7 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={
                                        salvandoPerfil ||
                                        !perfilFoiAlterado
                                    }
                                    className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-lg bg-[#211C14] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#968052] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {salvandoPerfil ? (
                                        <>
                                            <LoaderCircle
                                                size={
                                                    17
                                                }
                                                className="animate-spin"
                                            />

                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save
                                                size={
                                                    17
                                                }
                                            />

                                            Salvar alterações
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>


                    {/* ================================================= */}
                    {/* SEGURANÇA */}
                    {/* ================================================= */}

                    <section className="overflow-hidden rounded-2xl border border-[#E9DCC4] bg-white shadow-sm">

                        <div className="border-b border-[#E9DCC4] bg-[#FDFBF7] px-6 py-5 sm:px-8">
                            <div className="flex items-start gap-4">

                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F8F3E8]">
                                    <LockKeyhole
                                        size={21}
                                        className="text-[#968052]"
                                    />
                                </div>

                                <div>
                                    <h2 className="font-serif text-xl text-[#211C14]">
                                        Segurança
                                    </h2>

                                    <p className="mt-1 text-sm text-[#756C5C]">
                                        Altere sua
                                        senha para
                                        manter sua
                                        conta segura.
                                    </p>
                                </div>
                            </div>
                        </div>


                        <form
                            onSubmit={
                                alterarSenha
                            }
                            className="p-6 sm:p-8"
                        >
                            <div className="max-w-2xl space-y-5">

                                {/* Senha atual */}

                                <CampoSenha
                                    id="senhaAtual"
                                    name="senhaAtual"
                                    label="Senha atual"
                                    value={
                                        senhas.senhaAtual
                                    }
                                    onChange={
                                        alterarCampoSenha
                                    }
                                    mostrar={
                                        mostrarSenhaAtual
                                    }
                                    alternarMostrar={() =>
                                        setMostrarSenhaAtual(
                                            (
                                                anterior
                                            ) =>
                                                !anterior
                                        )
                                    }
                                    autoComplete="current-password"
                                />


                                <div className="grid gap-5 sm:grid-cols-2">

                                    {/* Nova senha */}

                                    <CampoSenha
                                        id="novaSenha"
                                        name="novaSenha"
                                        label="Nova senha"
                                        value={
                                            senhas.novaSenha
                                        }
                                        onChange={
                                            alterarCampoSenha
                                        }
                                        mostrar={
                                            mostrarNovaSenha
                                        }
                                        alternarMostrar={() =>
                                            setMostrarNovaSenha(
                                                (
                                                    anterior
                                                ) =>
                                                    !anterior
                                            )
                                        }
                                        autoComplete="new-password"
                                    />


                                    {/* Confirmar */}

                                    <CampoSenha
                                        id="confirmarSenha"
                                        name="confirmarSenha"
                                        label="Confirmar nova senha"
                                        value={
                                            senhas.confirmarSenha
                                        }
                                        onChange={
                                            alterarCampoSenha
                                        }
                                        mostrar={
                                            mostrarConfirmarSenha
                                        }
                                        alternarMostrar={() =>
                                            setMostrarConfirmarSenha(
                                                (
                                                    anterior
                                                ) =>
                                                    !anterior
                                            )
                                        }
                                        autoComplete="new-password"
                                    />

                                </div>


                                <div className="flex gap-3 rounded-xl bg-[#F8F3E8] p-4">
                                    <ShieldCheck
                                        size={20}
                                        className="mt-0.5 shrink-0 text-[#968052]"
                                    />

                                    <div>
                                        <p className="text-sm font-medium text-[#211C14]">
                                            Escolha uma
                                            senha segura
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-[#756C5C]">
                                            Sua nova senha
                                            deve possuir
                                            pelo menos 8
                                            caracteres e
                                            ser diferente
                                            da senha atual.
                                        </p>
                                    </div>
                                </div>

                            </div>


                            {mensagemSenha && (
                                <Mensagem
                                    tipo={
                                        mensagemSenha.tipo
                                    }
                                >
                                    {
                                        mensagemSenha.texto
                                    }
                                </Mensagem>
                            )}


                            <div className="mt-7 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={
                                        alterandoSenha
                                    }
                                    className="inline-flex min-w-[170px] items-center justify-center gap-2 rounded-lg bg-[#211C14] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#968052] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {alterandoSenha ? (
                                        <>
                                            <LoaderCircle
                                                size={
                                                    17
                                                }
                                                className="animate-spin"
                                            />

                                            Alterando...
                                        </>
                                    ) : (
                                        <>
                                            <LockKeyhole
                                                size={
                                                    17
                                                }
                                            />

                                            Alterar senha
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>


                    {/* ================================================= */}
                    {/* CONTA */}
                    {/* ================================================= */}

                    <section className="overflow-hidden rounded-2xl border border-[#E9DCC4] bg-white shadow-sm">

                        <div className="border-b border-[#E9DCC4] bg-[#FDFBF7] px-6 py-5 sm:px-8">
                            <div className="flex items-start gap-4">

                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F8F3E8]">
                                    <UserRound
                                        size={21}
                                        className="text-[#968052]"
                                    />
                                </div>

                                <div>
                                    <h2 className="font-serif text-xl text-[#211C14]">
                                        Conta
                                    </h2>

                                    <p className="mt-1 text-sm text-[#756C5C]">
                                        Gerencie sua
                                        sessão na
                                        Aurelia.
                                    </p>
                                </div>
                            </div>
                        </div>


                        <div className="p-6 sm:p-8">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                                <div>
                                    <h3 className="text-sm font-semibold text-[#211C14]">
                                        Sair da conta
                                    </h3>

                                    <p className="mt-1 max-w-xl text-sm leading-6 text-[#756C5C]">
                                        Você precisará
                                        informar seu
                                        e-mail e senha
                                        novamente para
                                        acessar sua
                                        conta.
                                    </p>
                                </div>


                                <button
                                    type="button"
                                    onClick={
                                        sairDaConta
                                    }
                                    disabled={
                                        saindo
                                    }
                                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#D8C9AE] bg-white px-5 py-3 text-sm font-medium text-[#211C14] transition hover:border-[#968052] hover:bg-[#F8F3E8] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saindo ? (
                                        <>
                                            <LoaderCircle
                                                size={
                                                    17
                                                }
                                                className="animate-spin"
                                            />

                                            Saindo...
                                        </>
                                    ) : (
                                        <>
                                            <LogOut
                                                size={
                                                    17
                                                }
                                            />

                                            Sair da conta
                                        </>
                                    )}
                                </button>

                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </main>
    );
}


/**
 * ============================================================
 * CAMPO DE SENHA
 * ============================================================
 */

function CampoSenha({
    id,
    name,
    label,
    value,
    onChange,
    mostrar,
    alternarMostrar,
    autoComplete,
}) {
    return (
        <div>
            <label
                htmlFor={id}
                className="mb-2 block text-sm font-medium text-[#211C14]"
            >
                {label}
            </label>


            <div className="relative">
                <input
                    id={id}
                    name={name}
                    type={
                        mostrar
                            ? "text"
                            : "password"
                    }
                    value={value}
                    onChange={
                        onChange
                    }
                    autoComplete={
                        autoComplete
                    }
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[#E9DCC4] bg-white px-4 py-3 pr-12 text-sm text-[#211C14] outline-none transition placeholder:text-[#B5AC9D] focus:border-[#968052] focus:ring-2 focus:ring-[#968052]/10"
                />


                <button
                    type="button"
                    onClick={
                        alternarMostrar
                    }
                    aria-label={
                        mostrar
                            ? "Ocultar senha"
                            : "Mostrar senha"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#756C5C] transition hover:bg-[#F8F3E8] hover:text-[#211C14]"
                >
                    {mostrar ? (
                        <EyeOff
                            size={18}
                        />
                    ) : (
                        <Eye
                            size={18}
                        />
                    )}
                </button>
            </div>
        </div>
    );
}


/**
 * ============================================================
 * MENSAGEM DE SUCESSO / ERRO
 * ============================================================
 */

function Mensagem({
    tipo,
    children,
}) {
    const sucesso =
        tipo === "sucesso";


    return (
        <div
            className={`mt-6 flex items-start gap-3 rounded-xl border p-4 ${
                sucesso
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-red-200 bg-red-50"
            }`}
        >
            {sucesso ? (
                <CheckCircle2
                    size={19}
                    className="mt-0.5 shrink-0 text-emerald-600"
                />
            ) : (
                <AlertCircle
                    size={19}
                    className="mt-0.5 shrink-0 text-red-600"
                />
            )}


            <p
                className={`text-sm leading-5 ${
                    sucesso
                        ? "text-emerald-800"
                        : "text-red-700"
                }`}
            >
                {children}
            </p>
        </div>
    );
}