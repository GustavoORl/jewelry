
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { apiFetch } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  const requisicaoAtual = useRef(0);

  const carregarUsuario = useCallback(async () => {
    const idRequisicao = ++requisicaoAtual.current;

    setCarregandoAuth(true);

    try {
      const resultado = await apiFetch("/me");

      if (idRequisicao !== requisicaoAtual.current) {
        return null;
      }

      setUsuario(resultado.usuario);
      return resultado.usuario;
    } catch {
      if (idRequisicao === requisicaoAtual.current) {
        setUsuario(null);
      }

      return null;
    } finally {
      if (idRequisicao === requisicaoAtual.current) {
        setCarregandoAuth(false);
      }
    }
  }, []);

  useEffect(() => {
    carregarUsuario();

    return () => {
      requisicaoAtual.current++;
    };
  }, [carregarUsuario]);

  const entrar = useCallback((dadosUsuario) => {
    requisicaoAtual.current++;
    setUsuario(dadosUsuario);
    setCarregandoAuth(false);
  }, []);

  const atualizarUsuario = useCallback((novoUsuario) => {
    setUsuario(novoUsuario);
  }, []);

  const sair = useCallback(async () => {
    requisicaoAtual.current++;

    try {
      await apiFetch("/sair", {
        method: "POST",
      });
    } finally {
      setUsuario(null);
      setCarregandoAuth(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregandoAuth,
        entrar,
        atualizarUsuario,
        carregarUsuario,
        sair,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return contexto;
}
