import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Trash2, LoaderCircle } from "lucide-react";
import { apiFetch } from "../../services/api";

export default function FavoritoUser() {
  const [favoritos, setFavoritos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [removendo, setRemovendo] = useState(null);

  const carregarFavoritos = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await apiFetch("/favoritos");

      setFavoritos(resposta.favoritos || []);
    } catch (error) {
      setErro(error.message || "Não foi possível carregar seus favoritos.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarFavoritos();
  }, [carregarFavoritos]);

  async function removerFavorito(produtoId) {
    try {
      setRemovendo(produtoId);
      setErro("");

      await apiFetch(`/favoritos/${produtoId}`, {
        method: "DELETE",
      });

      setFavoritos((anteriores) =>
        anteriores.filter(
          (favorito) => favorito.produto.id !== produtoId
        )
      );
    } catch (error) {
      setErro(error.message || "Não foi possível remover o favorito.");
    } finally {
      setRemovendo(null);
    }
  }

  if (carregando) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <LoaderCircle className="w-8 h-8 animate-spin text-[#968052]" />
      </main>
    );
  }

  return (
    <main className="bg-[#FCFAF5] min-h-screen py-12 px-5">
      <div className="max-w-[1200px] mx-auto">

        {/* Cabeçalho */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-[#968052] mb-3">
            <Heart size={19} />
            <span className="text-xs uppercase tracking-[0.2em]">
              Minha coleção
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-serif text-[#211C14]">
            Meus favoritos
          </h1>

          <p className="text-sm text-[#77716A] mt-3">
            Produtos que você guardou para encontrar novamente.
          </p>
        </div>

        {/* Erro */}
        {erro && (
          <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-700 text-sm rounded">
            {erro}
            <button
              onClick={carregarFavoritos}
              className="ml-2 underline font-medium"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Lista vazia */}
        {!erro && favoritos.length === 0 ? (
          <div className="min-h-[350px] flex flex-col items-center justify-center text-center border border-[#E9DCC4] rounded-sm px-5">
            <Heart size={42} strokeWidth={1} className="text-[#B7A47E] mb-5" />

            <h2 className="text-xl font-serif text-[#211C14] mb-2">
              Sua coleção está vazia
            </h2>

            <p className="text-sm text-[#77716A] max-w-md mb-6">
              Explore nossos produtos e salve seus favoritos para encontrá-los
              facilmente depois.
            </p>

            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-[#211C14] text-white px-6 py-3 text-xs uppercase tracking-widest hover:bg-[#968052] transition"
            >
              <ShoppingBag size={16} />
              Explorar produtos
            </Link>
          </div>
        ) : (
          /* Produtos */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
            {favoritos.map(({ produto }) => {
              const imagem = produto.imagens?.[0]?.url;

              return (
                <article key={produto.id} className="group">
                  <div className="relative aspect-[3/4] bg-[#F1EDE5] overflow-hidden">
                    {imagem ? (
                      <img
                        src={imagem}
                        alt={produto.imagens[0].textoAlternativo || produto.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#A69B89]">
                        Sem imagem
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => removerFavorito(produto.id)}
                      disabled={removendo === produto.id}
                      aria-label={`Remover ${produto.nome} dos favoritos`}
                      title="Remover dos favoritos"
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-[#968052] hover:bg-white hover:text-red-500 transition disabled:opacity-50"
                    >
                      {removendo === produto.id ? (
                        <LoaderCircle size={18} className="animate-spin" />
                      ) : (
                        <Heart size={18} fill="currentColor" />
                      )}
                    </button>
                  </div>

                  <div className="pt-4">
                    <p className="text-[10px] uppercase tracking-widest text-[#968052] mb-1">
                      {produto.categoria?.nome || "Joias"}
                    </p>

                    <h2 className="text-sm text-[#211C14] font-medium line-clamp-2 min-h-10">
                      {produto.nome}
                    </h2>

                    <p className="text-base text-[#211C14] mt-2">
                      {Number(produto.preco).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>

                    <Link
                      to={`/produto/${produto.slug}`}
                      className="inline-block mt-4 text-[10px] uppercase tracking-widest text-[#968052] border-b border-[#968052] pb-1 hover:text-[#211C14] hover:border-[#211C14] transition"
                    >
                      Ver produto
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
