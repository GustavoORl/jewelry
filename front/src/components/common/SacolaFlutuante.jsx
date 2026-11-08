
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag } from "lucide-react";

import { apiFetch } from "../../services/api.js";
import { useAuth } from "../../contexts/AuthContext";

// Extrai os itens da resposta da API.
function extrairItens(resposta) {
  if (Array.isArray(resposta)) return resposta;

  if (Array.isArray(resposta?.itens)) {
    return resposta.itens;
  }

  if (Array.isArray(resposta?.sacola?.itens)) {
    return resposta.sacola.itens;
  }

  if (Array.isArray(resposta?.dados?.itens)) {
    return resposta.dados.itens;
  }

  if (Array.isArray(resposta?.dados?.sacola?.itens)) {
    return resposta.dados.sacola.itens;
  }

  return [];
}

export default function SacolaFlutuante() {
  const { usuario, carregandoAuth } = useAuth();

  const [quantidade, setQuantidade] = useState(0);
  const [carregando, setCarregando] = useState(true);

  const carregarSacola = useCallback(async () => {
    if (!usuario) {
      setQuantidade(0);
      setCarregando(false);
      return;
    }

    try {
      const resposta = await apiFetch("/sacola");

      const itens = extrairItens(resposta);

      const total = itens.reduce((acumulador, item) => {
        const quantidadeItem = Number(item.quantidade);

        return (
          acumulador +
          (Number.isFinite(quantidadeItem)
            ? Math.max(0, quantidadeItem)
            : 0)
        );
      }, 0);

      setQuantidade(total);
    } catch (erro) {
      console.error(
        "Erro ao carregar quantidade da sacola:",
        erro
      );
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  // Consulta a sacola ao iniciar ou trocar de usuário.
  useEffect(() => {
    if (carregandoAuth) return;

    carregarSacola();
  }, [carregandoAuth, carregarSacola]);

  // Atualiza sempre que um produto é adicionado
  // ou quando a sacola é modificada.
  useEffect(() => {
    function atualizarSacola() {
      carregarSacola();
    }

    window.addEventListener(
      "carrinhoAtualizado",
      atualizarSacola
    );

    return () => {
      window.removeEventListener(
        "carrinhoAtualizado",
        atualizarSacola
      );
    };
  }, [carregarSacola]);

  // Não exibe para visitantes ou sacolas vazias.
  if (
    carregandoAuth ||
    carregando ||
    !usuario ||
    quantidade <= 0
  ) {
    return null;
  }

  return (
    <Link
      to="/sacola"
      aria-label={`Ver sacola com ${quantidade} ${
        quantidade === 1 ? "produto" : "produtos"
      }`}
      className="fixed bottom-5 right-4 z-50 inline-flex items-center gap-3 rounded-full bg-[#211C14] px-5 py-3.5 text-xs font-medium text-white shadow-[0_12px_35px_rgba(33,28,20,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#4A3D2B] active:scale-[0.98] sm:bottom-7 sm:right-7"
    >
      {/* ÍCONE E CONTADOR */}

      <span className="relative">
        <ShoppingBag size={19} strokeWidth={1.7} />

        <span className="absolute -right-2.5 -top-2.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#B59A68] px-1 text-[9px] font-bold text-white">
          {quantidade > 99 ? "99+" : quantidade}
        </span>
      </span>

      {/* TEXTO */}

      <span>
        {quantidade}{" "}
        {quantidade === 1
          ? "produto na sacola"
          : "produtos na sacola"}
      </span>

      <ArrowRight size={16} />
    </Link>
  );
}
