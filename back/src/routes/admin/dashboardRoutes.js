import { Router } from "express";
import * as dashboardController from "../../controllers/dashboards/dashboardController.js";

const router = Router();

router.get("/", dashboardController.obterDashboard);

export default router;