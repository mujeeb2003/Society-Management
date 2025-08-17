import { PrismaClient } from "../generated/prisma/index.js";
const prisma = new PrismaClient();

class MonthlyBalance {
    static async create(data) {
        return prisma.monthlyBalance.create({
            data: {
                ...data,
                currentBalance:
                    data.previousBalance +
                    data.totalReceipts -
                    data.totalExpenses,
            },
        });
    }

    static async findUnique(where) {
        return prisma.monthlyBalance.findUnique({
            where,
        });
    }

    static async findMany(options = {}) {
        return prisma.monthlyBalance.findMany(options);
    }

    static async update(where, data) {
        // Recalculate current balance if any of the amounts changed
        if (
            data.totalReceipts !== undefined ||
            data.totalExpenses !== undefined ||
            data.previousBalance !== undefined
        ) {
            const existing = await prisma.monthlyBalance.findUnique({ where });
            if (existing) {
                data.currentBalance =
                    (data.previousBalance ?? existing.previousBalance) +
                    (data.totalReceipts ?? existing.totalReceipts) -
                    (data.totalExpenses ?? existing.totalExpenses);
            }
        }

        return prisma.monthlyBalance.update({
            where,
            data,
        });
    }

    static async delete(where) {
        return prisma.monthlyBalance.delete({
            where,
        });
    }

    static async getBalanceForMonth(month, year) {
        return prisma.monthlyBalance.findUnique({
            where: {
                month_year: {
                    month,
                    year,
                },
            },
        });
    }

    static async getLastBalance() {
        return prisma.monthlyBalance.findFirst({
            orderBy: [{ year: "desc" }, { month: "desc" }],
        });
    }

    static async generateMonthlyBalance(month, year) {
        // Get previous month's balance
        let previousMonth = month - 1;
        let previousYear = year;

        if (previousMonth === 0) {
            previousMonth = 12;
            previousYear = year - 1;
        }

        const previousBalance = await this.getBalanceForMonth(
            previousMonth,
            previousYear
        );
        const previousAmount = previousBalance
            ? parseInt(previousBalance.currentBalance)
            : 0;

        // Calculate total receipts for the month
        const totalReceipts = await prisma.payment.aggregate({
            where: {
                paymentMonth: month,
                paymentYear: year,
            },
            _sum: {
                receivedAmount: true,
            },
        });

        // Calculate total expenses for the month
        const totalExpenses = await prisma.expense.aggregate({
            where: {
                expenseMonth: month,
                expenseYear: year,
            },
            _sum: {
                amount: true,
            },
        });

        const receiptsAmount = parseInt(totalReceipts._sum.receivedAmount || 0);
        const expensesAmount = parseInt(totalExpenses._sum.amount || 0);
        const currentBalance = previousAmount + receiptsAmount - expensesAmount;
        // console.log(
        //     "Current Balance: ",
        //     currentBalance,
        //     "<Previous Balance: ",
        //     previousAmount,
        //     "Receipts: ",
        //     receiptsAmount,
        //     "Expenses: ",
        //     expensesAmount
        // );

        // Check if balance already exists
        const existingBalance = await this.getBalanceForMonth(month, year);

        if (existingBalance) {
            return this.update(
                {
                    month_year: { month, year },
                },
                {
                    totalReceipts: receiptsAmount,
                    totalExpenses: expensesAmount,
                    previousBalance: parseInt(previousAmount),
                    currentBalance: parseInt(currentBalance),
                    isGenerated: true,
                    generatedAt: new Date(),
                }
            );
        } else {
            return this.create({
                month,
                year,
                totalReceipts: receiptsAmount,
                totalExpenses: expensesAmount,
                previousBalance: previousAmount,
                currentBalance: currentBalance,
                isGenerated: true,
                generatedAt: new Date(),
            });
        }
    }

    static async getAllBalances(options = {}) {
        return prisma.monthlyBalance.findMany({
            orderBy: [{ year: "desc" }, { month: "desc" }],
            ...options,
        });
    }

    
}

export default MonthlyBalance;
