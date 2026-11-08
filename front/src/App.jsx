import PaginaNaoEncontrada from "./pages/PaginaNaoEncontrada.jsx";
import Editorial from "./pages/Editorial.jsx";
import AdminEditorial from "./pages/admin/AdminEditorial.jsx";
import AdminDevolucoes from "./pages/admin/AdminDevolucoes.jsx";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

import { AuthProvider } from "./contexts/AuthContext.jsx";

import Layout from "./layout/Layout.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import ListagemProdutos from "./pages/ListagemProdutos.jsx";
import ProdutoDetalhado from "./pages/ProdutoDetalhado.jsx";

import SacolaUser from "./pages/user/SacolaUser.jsx";
import Checkout from "./pages/user/Checkout.jsx";
import PedidoUser from "./pages/user/PedidoUser.jsx";
import PedidoDetalhado from "./pages/user/PedidoDetalhado.jsx";
import FavoritoUser from "./pages/user/FavoritoUser.jsx";
import Pagamento from "./pages/user/Pagamento.jsx";
import PedidoConfirmado from "./pages/user/PedidoConfirmado.jsx";
import EnderecoUser from "./pages/user/EnderecoUser.jsx";
import HistoricoCompras from "./pages/user/HistoricoCompras.jsx";
import Configuracoes from "./pages/user/Configuracoes.jsx";
import PerfilUser from "./pages/user/PerfilUser.jsx";
import DevolucoesUser from "./pages/user/DevolucoesUser.jsx";

import RotaProtegida from "./components/RotaProtegida.jsx";


import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminProdutos from "./pages/admin/AdminProdutos.jsx";
import AdminPedidos from "./pages/admin/AdminPedidos.jsx";
import AdminClientes from "./pages/admin/AdminClientes.jsx";
import AdminCategorias from "./pages/admin/AdminCategorias.jsx";
import AdminMateriais from "./pages/admin/AdminMateriais.jsx";
import AdminPromocoes from "./pages/admin/AdminPromocoes.jsx";


import { ocultarCapa } from "./utils/LoadingScreen.js";

function ControleCapaInicial() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Fora da Home, a capa não deve bloquear a aplicação.
    if (pathname !== "/") {
      ocultarCapa();
    }
  }, [pathname]);

  return null;
}


export default function App() {
  return (
    <BrowserRouter>
      <ControleCapaInicial />
      <AuthProvider>

        <Routes>
          {/* Loja pública */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="*" element={<PaginaNaoEncontrada />} />
            <Route path="/editorial" element={<Editorial />} />
            <Route path="/editorial/:id" element={<Editorial />} />

            <Route
              path="/produtos"
              element={<ListagemProdutos />}
            />

            <Route
              path="/produtos/:id"
              element={<ProdutoDetalhado />}
            />

            <Route path="/sacola" element={<SacolaUser />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pedidos" element={<PedidoUser />} />
            <Route path="/pedidos/:pedidoId" element={<PedidoDetalhado />} />
            <Route path="/favoritos" element={<FavoritoUser />} />
            <Route path="/pagamento/:pedidoId" element={<Pagamento />} />
            <Route path="/pedidos/:pedidoId/confirmado" element={<PedidoConfirmado />} />
            <Route path="/enderecos" element={<EnderecoUser />} />
            <Route path="/historico-compras" element={<HistoricoCompras />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/perfil" element={<PerfilUser />} />
            <Route element={<RotaProtegida />}>
              <Route path="/devolucoes-reembolso" element={<DevolucoesUser />} />
            </Route>
          </Route>

          {/* Login */}
          <Route path="/login" element={<Login />} />

          {/* Área administrativa protegida */}
          <Route
            element={
              <RotaProtegida tiposPermitidos={["ADMIN"]} />
            }
          >
            <Route path="/admin">
              <Route index element={<AdminDashboard />} />
              <Route path="editorial" element={<AdminEditorial />} />
              <Route path="devolucoes" element={<AdminDevolucoes />} />

              <Route
                path="produtos"
                element={<AdminProdutos />}
              />

              <Route
                path="pedidos"
                element={<AdminPedidos />}
              />

              <Route
                path="clientes"
                element={<AdminClientes />}
              />

              <Route
                path="categorias"
                element={<AdminCategorias />}
              />

              <Route
                path="materiais"
                element={<AdminMateriais />}
              />

              <Route
                path="promocoes"
                element={<AdminPromocoes />}
              />
            </Route>
          </Route>
        </Routes>

      </AuthProvider>
    </BrowserRouter>
  );
}
