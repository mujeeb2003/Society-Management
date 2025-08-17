import { ExpenseController } from "../controllers/expenseController.js";
import { Router } from "express";
const expenseRouter = Router();

expenseRouter.get("/", ExpenseController.getAllExpenses);
expenseRouter.get("/summary", ExpenseController.getExpensesSummary);
expenseRouter.get("/analytics", ExpenseController.getExpenseAnalytics);
expenseRouter.get("/categories", ExpenseController.getExpenseCategories);
expenseRouter.get("/monthly/:year", ExpenseController.getMonthlyExpenseTotals);
expenseRouter.get("/category/:category", ExpenseController.getExpensesByCategory);
expenseRouter.get("/:id", ExpenseController.getExpenseById);
expenseRouter.post("/", ExpenseController.createExpense);
expenseRouter.put("/:id", ExpenseController.updateExpense);
expenseRouter.delete("/:id", ExpenseController.deleteExpense);

export default expenseRouter;
