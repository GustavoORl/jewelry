import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext.jsx";
import Layout from "./layout/Layout.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import ListagemProdutos from "./pages/ListagemProdutos.jsx";
import ProdutoDetalhado from "./pages/ProdutoDetalhado.jsx";

import RotaProtegida from "./components/RotaProtegida.jsx";

import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminProdutos from "./pages/admin/AdminProdutos.jsx";
import AdminPedidos from "./pages/admin/AdminPedidos.jsx";
import AdminClientes from "./pages/admin/AdminClientes.jsx";
import AdminCategorias from "./pages/admin/AdminCategorias.jsx";
import AdminMateriais from "./pages/admin/AdminMateriais.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Loja pública */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />

            <Route
              path="/produtos"
              element={<ListagemProdutos />}
            />

            <Route
              path="/produtos/:id"
              element={<ProdutoDetalhado />}
            />
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
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}