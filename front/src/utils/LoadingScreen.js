export function ocultarCapa() {
    const capa = document.getElementById("loading-screen");

    if (!capa) return;

    capa.style.opacity = "0";
    capa.style.pointerEvents = "none";

    setTimeout(() => {
        capa.remove();
    }, 500);
}