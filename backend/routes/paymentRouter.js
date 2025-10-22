import { Router } from "express";
import { PaymentsController } from "../controllers/paymentsController.js";

const paymentRouter = Router();

// Payment CRUD routes
paymentRouter.get("/", PaymentsController.getAllPayments);
paymentRouter.get("/filtered", PaymentsController.getFilteredPayments);
paymentRouter.get("/summary", PaymentsController.getPaymentsSummary);
paymentRouter.get("/statistics", PaymentsController.getPaymentStatistics);
paymentRouter.get("/villa/:villaId", PaymentsController.getPaymentsByVilla);
paymentRouter.get("/villa/:villaId/pending-maintenance", PaymentsController.getPendingMaintenancePayments);
paymentRouter.post("/", PaymentsController.createPayment);
paymentRouter.put("/:id", PaymentsController.updatePayment);
paymentRouter.delete("/:id", PaymentsController.deletePayment);

export default paymentRouter;