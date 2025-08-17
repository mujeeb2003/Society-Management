import { Router } from "express";
import { DashboardController } from "../controllers/dashboardController.js";

const dashboardRouter = Router();

dashboardRouter.get("/stats", DashboardController.getDashboardStats);
dashboardRouter.get("/summary", DashboardController.getQuickSummary);

export default dashboardRouter;
