import { ExpenseModel } from "../models/expensesModel.js";

export class ExpenseController {
    // Get all expenses with optional filters
    static async getAllExpenses(req, res) {
        try {
            const filters = {
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                category: req.query.category,
                month: req.query.month,
                year: req.query.year,
            };

            const expenses = await ExpenseModel.getAll(filters);

            res.status(200).json({
                message: "success",
                data: expenses,
            });
        } catch (error) {
            console.error("Error fetching expenses:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Get expense by ID
    static async getExpenseById(req, res) {
        try {
            const { id } = req.params;
            const expense = await ExpenseModel.getById(id);

            if (!expense) {
                return res.status(404).json({
                    error: "Expense not found",
                });
            }

            res.status(200).json({
                message: "success",
                data: expense,
            });
        } catch (error) {
            console.error("Error fetching expense:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Create new expense
    static async createExpense(req, res) {
        try {
            const {
                category,
                description,
                amount,
                expenseDate,
                expenseMonth,
                expenseYear,
                paymentMethod,
            } = req.body;

            // Validate required fields
            if (
                !category ||
                !description ||
                !amount ||
                !expenseDate ||
                !expenseMonth ||
                !expenseYear
            ) {
                return res.status(400).json({
                    error: "Required fields: category, description, amount, expenseDate, expenseMonth, expenseYear",
                });
            }

            // Validate amount is positive
            if (parseFloat(amount) <= 0) {
                return res.status(400).json({
                    error: "Amount must be greater than 0",
                });
            }

            // Validate month and year
            const month = parseInt(expenseMonth);
            const year = parseInt(expenseYear);

            if (month < 1 || month > 12) {
                return res.status(400).json({
                    error: "Month must be between 1 and 12",
                });
            }

            if (year < 2020 || year > 2030) {
                return res.status(400).json({
                    error: "Year must be between 2020 and 2030",
                });
            }

            const expense = await ExpenseModel.create({
                category,
                description,
                amount,
                expenseDate,
                expenseMonth,
                expenseYear,
                paymentMethod: paymentMethod || "CASH",
            });

            res.status(201).json({
                message: "success",
                data: expense,
            });
        } catch (error) {
            console.error("Error creating expense:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Update expense
    static async updateExpense(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Check if expense exists
            const existingExpense = await ExpenseModel.getById(id);
            if (!existingExpense) {
                return res.status(404).json({
                    error: "Expense not found",
                });
            }

            // Validate amount if provided
            if (updateData.amount && parseFloat(updateData.amount) <= 0) {
                return res.status(400).json({
                    error: "Amount must be greater than 0",
                });
            }

            // Validate month if provided
            if (updateData.expenseMonth) {
                const month = parseInt(updateData.expenseMonth);
                if (month < 1 || month > 12) {
                    return res.status(400).json({
                        error: "Month must be between 1 and 12",
                    });
                }
            }

            // Validate year if provided
            if (updateData.expenseYear) {
                const year = parseInt(updateData.expenseYear);
                if (year < 2020 || year > 2030) {
                    return res.status(400).json({
                        error: "Year must be between 2020 and 2030",
                    });
                }
            }

            const expense = await ExpenseModel.update(id, updateData);

            res.status(200).json({
                message: "success",
                data: expense,
            });
        } catch (error) {
            console.error("Error updating expense:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Delete expense
    static async deleteExpense(req, res) {
        try {
            const { id } = req.params;

            // Check if expense exists
            const existingExpense = await ExpenseModel.getById(id);
            if (!existingExpense) {
                return res.status(404).json({
                    error: "Expense not found",
                });
            }

            await ExpenseModel.delete(id);

            res.status(200).json({
                message: "success",
                data: { message: "Expense deleted successfully" },
            });
        } catch (error) {
            console.error("Error deleting expense:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Get expenses summary for date range
    static async getExpensesSummary(req, res) {
        try {
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({
                    error: "Start date and end date are required",
                });
            }

            const summary = await ExpenseModel.getSummaryByDateRange(
                startDate,
                endDate
            );

            res.status(200).json({
                message: "success",
                data: summary,
            });
        } catch (error) {
            console.error("Error fetching expense summary:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Get expenses by category
    static async getExpensesByCategory(req, res) {
        try {
            const { category } = req.params;
            const { year } = req.query;

            const expenses = await ExpenseModel.getByCategory(category, year);

            res.status(200).json({
                message: "success",
                data: expenses,
            });
        } catch (error) {
            console.error("Error fetching expenses by category:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Get monthly expense totals for a year
    static async getMonthlyExpenseTotals(req, res) {
        try {
            const { year } = req.params;

            if (!year) {
                return res.status(400).json({
                    error: "Year is required",
                });
            }

            const monthlyTotals = await ExpenseModel.getMonthlyTotals(year);

            // Format the response to include month names
            // console.log(monthlyTotals);
            const formattedTotals = monthlyTotals.map((item) => ({
                month: item.expenseMonth,
                monthName: ExpenseModel.getMonthName(item.expenseMonth),
                total: parseFloat(item._sum.amount || 0),
            }));

            res.status(200).json({
                message: "success",
                data: formattedTotals,
            });
        } catch (error) {
            console.error("Error fetching monthly expense totals:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Get expense categories (distinct categories used)
    static async getExpenseCategories(req, res) {
        try {
            const categories = await ExpenseModel.getDistinctCategories();

            res.status(200).json({
                message: "success",
                data: categories,
            });
        } catch (error) {
            console.error("Error fetching expense categories:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Get expense analytics for dashboard
    static async getExpenseAnalytics(req, res) {
        try {
            const { year } = req.query;
            const currentYear = year || new Date().getFullYear();

            const analytics = await ExpenseModel.getExpenseAnalytics(
                currentYear
            );

            res.status(200).json({
                message: "success",
                data: analytics,
            });
        } catch (error) {
            console.error("Error fetching expense analytics:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error.message,
            });
        }
    }

    // Helper method to convert month number to name
    static getMonthName(monthNumber) {
        // console.log(monthNumber);
        const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];
        return months[monthNumber - 1] || "Unknown";
    }
}
