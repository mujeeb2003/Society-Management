import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

export class ExpenseModel {
    static async getAll(filters = {}) {
        const where = {};

        if (filters.startDate && filters.endDate) {
            where.expenseDate = {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate),
            };
        }

        if (filters.category) {
            where.category = {
                contains: filters.category,
                mode: "insensitive",
            };
        }

        if (filters.month && filters.year) {
            where.expenseMonth = parseInt(filters.month);
            where.expenseYear = parseInt(filters.year);
        }

        return await prisma.expense.findMany({
            where,
            orderBy: {
                expenseDate: "desc",
            },
        });
    }

    // Get expense by ID
    static async getById(id) {
        return await prisma.expense.findUnique({
            where: { id: parseInt(id) },
        });
    }

    // Create new expense
    static async create(data) {
        return await prisma.expense.create({
            data: {
                category: data.category,
                description: data.description,
                amount: parseFloat(data.amount),
                expenseDate: new Date(data.expenseDate),
                expenseMonth: parseInt(data.expenseMonth),
                expenseYear: parseInt(data.expenseYear),
                paymentMethod: data.paymentMethod || "CASH",
            },
        });
    }

    // Update expense
    static async update(id, data) {
        return await prisma.expense.update({
            where: { id: parseInt(id) },
            data: {
                category: data.category,
                description: data.description,
                amount: parseFloat(data.amount),
                expenseDate: new Date(data.expenseDate),
                expenseMonth: parseInt(data.expenseMonth),
                expenseYear: parseInt(data.expenseYear),
                paymentMethod: data.paymentMethod,
            },
        });
    }

    // Delete expense
    static async delete(id) {
        return await prisma.expense.delete({
            where: { id: parseInt(id) },
        });
    }

    // Get expenses summary by date range
    static async getSummaryByDateRange(startDate, endDate) {
        return await prisma.expense.aggregate({
            where: {
                expenseDate: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
            _sum: {
                amount: true,
            },
            _count: {
                id: true,
            },
        });
    }

    // Get expenses by category
    static async getByCategory(category, year = null) {
        const where = {
            category: {
                contains: category,
            },
        };

        if (year) {
            where.expenseYear = parseInt(year);
        }

        return await prisma.expense.findMany({
            where,
            orderBy: {
                expenseDate: "desc",
            },
        });
    }

    // Get monthly expense totals
    static async getMonthlyTotals(year) {
        return await prisma.expense.groupBy({
            by: ["expenseMonth"],
            where: {
                expenseYear: parseInt(year),
            },
            _sum: {
                amount: true,
            },
            orderBy: {
                expenseMonth: "asc",
            },
        });
    }

    static async getDistinctCategories() {
        const result = await prisma.expense.findMany({
            select: {
                category: true,
            },
            distinct: ["category"],
            orderBy: {
                category: "asc",
            },
        });

        return result.map((item) => item.category);
    }

    // Get comprehensive expense analytics
    static async getExpenseAnalytics(year) {
        const startDate = new Date(`${year}-01-01`);
        const endDate = new Date(`${year}-12-31`);

        // Get total expenses for the year
        const yearTotal = await prisma.expense.aggregate({
            where: {
                expenseYear: parseInt(year),
            },
            _sum: {
                amount: true,
            },
            _count: {
                id: true,
            },
        });

        // Get monthly breakdown
        const monthlyBreakdown = await this.getMonthlyTotals(year);

        // Get category breakdown
        const categoryBreakdown = await prisma.expense.groupBy({
            by: ["category"],
            where: {
                expenseYear: parseInt(year),
            },
            _sum: {
                amount: true,
            },
            _count: {
                id: true,
            },
            orderBy: {
                _sum: {
                    amount: "desc",
                },
            },
        });

        // Get payment method breakdown
        const paymentMethodBreakdown = await prisma.expense.groupBy({
            by: ["paymentMethod"],
            where: {
                expenseYear: parseInt(year),
            },
            _sum: {
                amount: true,
            },
            _count: {
                id: true,
            },
        });

        // Calculate averages
        const totalAmount = parseFloat(yearTotal._sum.amount || 0);
        const totalCount = yearTotal._count || 0;
        const averagePerExpense = totalCount > 0 ? totalAmount / totalCount : 0;
        const averagePerMonth = totalAmount / 12;

        // Get top categories (limit to 5)
        const topCategories = categoryBreakdown.slice(0, 5).map((item) => ({
            category: item.category,
            amount: parseFloat(item._sum.amount || 0),
            count: item._count,
            percentage:
                totalAmount > 0
                    ? (
                          (parseFloat(item._sum.amount || 0) / totalAmount) *
                          100
                      ).toFixed(2)
                    : 0,
        }));

        return {
            year: parseInt(year),
            summary: {
                totalAmount: totalAmount,
                totalCount: totalCount,
                averagePerExpense: parseFloat(averagePerExpense.toFixed(2)),
                averagePerMonth: parseFloat(averagePerMonth.toFixed(2)),
            },
            monthlyBreakdown: monthlyBreakdown.map((item) => ({
                month: item.expenseMonth,
                monthName: this.getMonthName(item.expenseMonth),
                amount: parseFloat(item._sum.amount || 0),
            })),
            categoryBreakdown: categoryBreakdown.map((item) => ({
                category: item.category,
                amount: parseFloat(item._sum.amount || 0),
                count: item._count,
                percentage:
                    totalAmount > 0
                        ? (
                              (parseFloat(item._sum.amount || 0) /
                                  totalAmount) *
                              100
                          ).toFixed(2)
                        : 0,
            })),
            paymentMethodBreakdown: paymentMethodBreakdown.map((item) => ({
                method: item.paymentMethod,
                amount: parseFloat(item._sum.amount || 0),
                count: item._count,
                percentage:
                    totalAmount > 0
                        ? (
                              (parseFloat(item._sum.amount || 0) /
                                  totalAmount) *
                              100
                          ).toFixed(2)
                        : 0,
            })),
            topCategories,
        };
    }

    // Helper method for month names
    static getMonthName(monthNumber) {
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

    // Get expenses by category for a specific month/year (for reports)
    static async getExpensesByCategory(month, year) {
        return await prisma.expense
            .groupBy({
                by: ["category"],
                where: {
                    expenseMonth: month,
                    expenseYear: year,
                },
                _sum: {
                    amount: true,
                },
                _count: {
                    id: true,
                },
                orderBy: {
                    _sum: {
                        amount: "desc",
                    },
                },
            })
            .then((results) =>
                results.map((result) => ({
                    category: result.category,
                    total: parseFloat(result._sum.amount || 0),
                    count: result._count,
                }))
            );
    }

    static async getExpensesWithDescriptions(month, year) {
        const monthInt = parseInt(month);
        const yearInt = parseInt(year);

        return await prisma.expense.findMany({
            where: {
                expenseMonth: monthInt,
                expenseYear: yearInt,
            },
            orderBy: [{ expenseDate: "desc" }, { category: "asc" }],
        });
    }
}
