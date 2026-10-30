import * as dashboardModel from "../models/dashboardModel.js";

const PERIODOS = {
  "7d": 7,
  "30d": 30,
  "12m": 365,
};

function criarErro(mensagem, status = 400) {
  const error = new Error(mensagem);
  error.status = status;
  return error;
}

function obterIntervalo(periodo) {
  const dias = PERIODOS[periodo];

  if (!dias) {
    throw criarErro(
      "Período inválido. Utilize 7d, 30d ou 12m."
    );
  }

  const fim = new Date();
  const inicio = new Date(fim);

  if (periodo === "12m") {
    inicio.setMonth(inicio.getMonth() - 12);
  } else {
    inicio.setDate(inicio.getDate() - dias);
  }

  return { inicio, fim };
}

export async function obterDashboard(periodo = "12m") {
  const { inicio, fim } = obterIntervalo(periodo);

  const [
    indicadores,
    pedidosRecentes,
    pedidosPorStatus,
    produtosMaisVendidos,
    vendasPorDia,
  ] = await Promise.all([
    dashboardModel.buscarIndicadores(inicio, fim),
    dashboardModel.buscarPedidosRecentes(inicio, fim),
    dashboardModel.buscarPedidosPorStatus(inicio, fim),
    dashboardModel.buscarProdutosMaisVendidos(inicio, fim),
    dashboardModel.buscarVendasPorDia(inicio, fim),
  ]);

  return {
    periodo,
    indicadores,
    pedidosRecentes,
    pedidosPorStatus,
    produtosMaisVendidos,
    vendas: vendasPorDia,
    intervalo: {
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
    },
  };
}