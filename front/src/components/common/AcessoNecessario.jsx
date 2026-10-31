
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, LogIn, UserPlus } from "lucide-react";

const icones = {
  favorito: Heart,
  sacola: ShoppingBag,
};

export default function AcessoNecessario({
  tipo = "favorito",
  titulo,
  descricao,
}) {
  const Icone = icones[tipo] || Heart;

  return (
    <main className="min-h-[65vh] bg-[#FCFAF5] flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-md text-center">

        {/* Ícone */}
        <div className="w-20 h-20 mx-auto mb-7 rounded-full bg-[#F1EDE5] flex items-center justify-center">
          <Icone
            size={34}
            strokeWidth={1.2}
            className="text-[#968052]"
          />
        </div>

        {/* Conteúdo */}
        <span className="text-[10px] uppercase tracking-[0.25em] text-[#968052]">
          AURELIA
        </span>

        <h1 className="text-2xl md:text-3xl font-serif text-[#211C14] mt-3">
          {titulo || "Entre na sua conta"}
        </h1>

        <p className="text-sm leading-relaxed text-[#77716A] mt-4 mb-8">
          {descricao ||
            "Entre na sua conta para acessar seus produtos e aproveitar todos os recursos da AURELIA."}
        </p>

        {/* Ações */}
        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 bg-[#211C14] text-white py-3.5 px-6 text-xs uppercase tracking-[0.15em] hover:bg-[#968052] transition-colors"
          >
            <LogIn size={16} />
            Entrar na minha conta
          </Link>

          <Link
            to="/cadastro"
            className="w-full flex items-center justify-center gap-2 border border-[#D9CCB4] text-[#211C14] py-3.5 px-6 text-xs uppercase tracking-[0.15em] hover:bg-[#F1EDE5] transition-colors"
          >
            <UserPlus size={16} />
            Criar minha conta
          </Link>
        </div>

      </div>
    </main>
  );
}
