
import { Outlet } from "react-router-dom";

import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx"

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FCFAF6]">
      <Header />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}