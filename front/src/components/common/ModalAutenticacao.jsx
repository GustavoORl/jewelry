
import { Link } from "react-router-dom";
import {
  Heart,
  ShoppingBag,
  UserRound,
  UserPlus,
  X,
} from "lucide-react";

export default function ModalAutenticacao({
  aberto,
  onFechar,
  motivo = "geral",
}) {
  if (!aberto) return null;

  const mensagens = {
    favoritos: {
      icone: Heart,
      titulo: "Salve suas joias favoritas",
      descricao:
        "Entre na sua conta ou cadastre-se para salvar suas peças preferidas e encontrá-las facilmente depois.",
    },
    sacola: {
      icone: ShoppingBag,
      titulo: "Sua próxima joia está aqui",
      descricao:
        "Entre na sua conta ou cadastre-se para adicionar produtos à sua sacola e continuar suas compras.",
    },
    geral: {
      icone: UserRound,
      titulo: "Faça parte da nossa experiência",
      descricao:
        "Entre na sua conta ou cadastre-se para aproveitar todos os benefícios da AURELIA.",
    },
  };

  const mensagem = mensagens[motivo] || mensagens.geral;
  const Icone = mensagem.icone;

  function handleKeyDown(evento) {
    if (evento.key === "Escape") {
      onFechar();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#211C14]/60 px-4 py-6 backdrop-blur-[3px]"
      onClick={onFechar}
      onKeyDown={handleKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-autenticacao"
        className="relative w-full max-w-md bg-[#FCFAF5] px-6 py-9 shadow-2xl sm:px-10 sm:py-11"
        onClick={(evento) => evento.stopPropagation()}
      >
        {/* Fechar */}
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar modal"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center text-[#82796D] transition hover:bg-[#F3EDE2] hover:text-[#211C14]"
        >
          <X size={19} strokeWidth={1.5} />
        </button>

        {/* Conteúdo */}
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[#E9DCC4] text-[#968052]">
            <Icone size={23} strokeWidth={1.4} />
          </div>

          <p className="text-[10px] uppercase tracking-[0.3em] text-[#968052]">
            AURELIA
          </p>

          <h2
            id="titulo-modal-autenticacao"
            className="mt-3 font-serif text-3xl text-[#211C14]"
          >
            {mensagem.titulo}
          </h2>

          <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-[#82796D]">
            {mensagem.descricao}
          </p>
        </div>

        {/* Opções */}
        <div className="mt-8 space-y-3">
          <Link
            to="/login"
            onClick={onFechar}
            className="flex min-h-12 w-full items-center justify-center gap-3 bg-[#211C14] px-5 py-4 text-xs uppercase tracking-[0.18em] text-white transition hover:bg-[#968052]"
          >
            <UserRound size={17} strokeWidth={1.6} />
            Entrar na minha conta
          </Link>

          <Link
            to="/cadastro"
            onClick={onFechar}
            className="flex min-h-12 w-full items-center justify-center gap-3 border border-[#DCCDB5] px-5 py-4 text-xs uppercase tracking-[0.18em] text-[#211C14] transition hover:border-[#968052] hover:bg-[#F3EDE2]"
          >
            <UserPlus size={17} strokeWidth={1.6} />
            Criar uma conta
          </Link>
        </div>

        <button
          type="button"
          onClick={onFechar}
          className="mt-6 w-full text-center text-xs text-[#82796D] transition hover:text-[#211C14]"
        >
          Continuar explorando produtos
        </button>
      </div>
    </div>
  );
}
