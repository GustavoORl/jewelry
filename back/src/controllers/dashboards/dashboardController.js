import * as dashboardService from "../../services/dashboardService.js";

export async function obterDashboard(req, res) {
  try {
    const { periodo = "12m" } = req.query;

    const dashboard = await dashboardService.obterDashboard(
      periodo
    );

    return res.status(200).json({
      sucesso: true,
      dashboard,
    });
  } catch (error) {
    console.error("Erro ao consultar dashboard:", error);

    return res.status(error.status || 500).json({
      sucesso: false,
      mensagem: error.status
        ? error.message
        : "Erro interno ao consultar o dashboard.",
    });
  }
}