
import { useState } from "react";
import { ArrowRight } from "lucide-react";

import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaFacebook,
} from "react-icons/fa";

const linksCompra = [
  { nome: "Colares", href: "/categoria/colares" },
  { nome: "Brincos", href: "/categoria/brincos" },
  { nome: "Anéis", href: "/categoria/aneis" },
  { nome: "Pulseiras", href: "/categoria/pulseiras" },
];

const linksAjuda = [
  { nome: "Trocas", href: "/trocas" },
  { nome: "Garantia", href: "/garantia" },
  { nome: "Guia de medidas", href: "/guia-de-medidas" },
  { nome: "Fale conosco", href: "/contato" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");

  function handleNewsletter(e) {
    e.preventDefault();

    if (!email.trim()) {
      setMensagem("Digite seu e-mail.");
      return;
    }

    setMensagem(
      "Formulário pronto! Conecte sua newsletter para concluir a inscrição."
    );
  }

  return (
    <footer className="border-t border-white/10 bg-[#211C14] text-[#F8F3E8]">

      {/* Conteúdo principal */}
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-10 px-6 py-12 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.3fr_0.55fr_0.55fr_1.2fr] lg:gap-12 lg:px-12 lg:py-12">

        {/* Marca */}
        <div>
          <a
            href="/"
            className="font-serif text-2xl tracking-tight"
          >
            AURELIA
          </a>

          <p className="mt-3 max-w-[280px] text-xs leading-[1.7] text-[#C1BAAF]">
            O marketplace que une ourives independentes e
            design acessível. Beleza que dura, sem excesso.
          </p>

          {/* Redes sociais */}
          <div className="mt-5 flex items-center gap-2">
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-[#B9975B] hover:bg-white/10"
            >
              <FaInstagram size={16} />
            </a>

            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-[#B9975B] hover:bg-white/10"
            >
              <FaFacebook size={16} />
            </a>

            <a
              href="https://www.youtube.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-[#B9975B] hover:bg-white/10"
            >
              <FaYoutube size={16} />
            </a>
          </div>
        </div>

        {/* Comprar */}
        <div>
          <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A9A197]">
            Comprar
          </h3>

          <ul className="space-y-2.5">
            {linksCompra.map((link) => (
              <li key={link.nome}>
                <a
                  href={link.href}
                  className="text-xs transition-colors hover:text-[#C9AA73]"
                >
                  {link.nome}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Ajuda */}
        <div>
          <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A9A197]">
            Ajuda
          </h3>

          <ul className="space-y-2.5">
            {linksAjuda.map((link) => (
              <li key={link.nome}>
                <a
                  href={link.href}
                  className="text-xs transition-colors hover:text-[#C9AA73]"
                >
                  {link.nome}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter */}
        <div className="rounded-[22px] bg-[#373129] p-5 sm:p-6">
          <h3 className="font-serif text-lg leading-tight">
            10% off na primeira compra
          </h3>

          <p className="mt-1 text-xs text-[#C1BAAF]">
            Cadastre-se e receba curadoria semanal.
          </p>

          <form
            onSubmit={handleNewsletter}
            className="mt-3 flex flex-col gap-2 min-[400px]:flex-row"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setMensagem("");
              }}
              placeholder="Seu e-mail"
              aria-label="Seu e-mail"
              required
              className="h-10 min-w-0 flex-1 rounded-full border border-transparent bg-[#FCFAF6] px-4 text-xs text-[#211C14] outline-none placeholder:text-[#8B8174] focus:border-[#B9975B]"
            />

            <button
              type="submit"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#FCFAF6] px-5 text-xs font-medium text-[#211C14] transition-colors hover:bg-[#E9DDC9]"
            >
              Assinar
              <ArrowRight size={13} className="sm:hidden" />
            </button>
          </form>

          {mensagem && (
            <p
              role="status"
              className="mt-3 text-xs leading-relaxed text-[#E4D2AF]"
            >
              {mensagem}
            </p>
          )}
        </div>
      </div>

      {/* Barra inferior */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-3 px-6 py-5 text-[10px] text-[#A9A197] sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <p>
            © 2026 Aurelia Marketplace · CNPJ 00.000.000/0001-00
          </p>

          <p>
            Pagamento seguro · Pix · Cartão em até 10x
          </p>
        </div>
      </div>
    </footer>
  );
}