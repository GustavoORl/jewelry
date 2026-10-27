
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./layout/Layout.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";

import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminProdutos from "./pages/admin/AdminProdutos.jsx";
import AdminPedidos from "./pages/admin/AdminPedidos.jsx";
import AdminClientes from "./pages/admin/AdminClientes.jsx";
import AdminCategorias from "./pages/admin/AdminCategorias.jsx";
import AdminMateriais from "./pages/admin/AdminMateriais.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Loja pública */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
        </Route>

        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Área administrativa protegida */}
        <Route
          path="/admin"
         
        >
          <Route index element={<AdminDashboard />} />
          <Route path="produtos" element={<AdminProdutos />} />
          <Route path="pedidos" element={<AdminPedidos />} />
          <Route path="clientes" element={<AdminClientes />} />
          <Route path="categorias" element={<AdminCategorias />} />
          <Route path="/admin/materiais" element={<AdminMateriais />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
