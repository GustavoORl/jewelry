export function proximoIndice(indice, passo, total) { return total > 0 ? ((indice + passo) % total + total) % total : 0; }
export function direcaoSwipe(dx, dy) { return Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.4 ? dx < 0 ? 1 : -1 : 0; }
