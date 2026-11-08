export function mesclarMensagens(atuais, novas) {
  return [...new Map([...atuais, ...novas].map(m => [m.id, m])).values()].sort((a, b) => new Date(a.criadoEm) - new Date(b.criadoEm) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
