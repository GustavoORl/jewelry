
let temporizadorRemocao;

export function ocultarCapa() {
  const capa = document.getElementById("loading-screen");

  if (!capa) return;

  clearTimeout(temporizadorRemocao);

  capa.style.opacity = "0";
  capa.style.pointerEvents = "none";

  temporizadorRemocao = setTimeout(() => {
    capa.remove();
    document.documentElement.classList.remove("show-initial-loader");
  }, 500);
}
