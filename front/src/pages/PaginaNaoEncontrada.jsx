import { Link } from "react-router-dom";

export default function PaginaNaoEncontrada() {
  return <section className="mx-auto max-w-3xl px-6 py-24 text-center text-[#211C14]">
    <p className="text-sm text-[#968052]">Página não encontrada</p>
    <h1 className="mt-3 font-serif text-3xl">Este endereço não está disponível</h1>
    <p className="mt-4 text-sm text-[#756C5C]">Continue explorando nossas joias ou acesse sua conta para acompanhar suas compras.</p>
    <div className="mt-8 flex flex-wrap justify-center gap-4">
      <Link to="/produtos" className="bg-[#211C14] px-6 py-3 text-sm text-white">Ver produtos</Link>
      <Link to="/" className="border border-[#E9DCC4] px-6 py-3 text-sm">Página inicial</Link>
    </div>
  </section>;
}
