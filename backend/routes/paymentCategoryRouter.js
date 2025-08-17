import { PaymentCategoryController } from "../controllers/paymentCategoryController.js";
import { Router } from "express";
const paymentCategoryRouter = Router();

paymentCategoryRouter.get("/", PaymentCategoryController.getAllCategories);
paymentCategoryRouter.get("/:id", PaymentCategoryController.getCategoryById);
paymentCategoryRouter.post("/", PaymentCategoryController.createCategory);
paymentCategoryRouter.patch("/:id", PaymentCategoryController.updateCategory);
paymentCategoryRouter.delete("/:id", PaymentCategoryController.deleteCategory);

export default paymentCategoryRouter;
