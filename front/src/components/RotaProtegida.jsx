import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function RotaProtegida({ tiposPermitidos }) {
  const { usuario, carregandoAuth } = useAuth();
  const localizacao = useLocation();

  if (carregandoAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FCFAF5]">
        <p className="text-sm text-[#968052]">
          Verificando sua sessão...
        </p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ origem: localizacao }}
      />
    );
  }

  if (
    tiposPermitidos &&
    !tiposPermitidos.includes(usuario.tipo)
  ) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
