
import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";

import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx"

export default function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

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