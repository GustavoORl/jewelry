
import Hero from "../components/Hero.jsx";
import Categorias from "../components/Categorias.jsx";
import Produtos from "../components/Produtos.jsx";
import Promocoes from "../components/Promocoes.jsx";

export default function Home() {
  return (
    <>
      <Hero />
      <Categorias />
      <Produtos />
      <Promocoes/>
    </>
  );
}