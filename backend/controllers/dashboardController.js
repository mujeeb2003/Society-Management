import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

export class DashboardController {
    // Get comprehensive dashboard statistics
    static async getDashboardStats(req, res) {
        try {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1;
            const currentYear = currentDate.getFullYear();

            // 1. Villa Statistics (FIXED)
            const villaStats = await prisma.villa.aggregate({
                _count: { id: true },
            });

            const occupancyStats = await prisma.villa.groupBy({
                by: ["occupancyType"],
                _count: { id: true },
            });

            // Convert occupancy stats to proper format
            const occupancyBreakdown = {};
            let activeVillas = 0;

            occupancyStats.forEach((stat) => {
                const type = stat.occupancyType.toLowerCase();
                occupancyBreakdown[type] = stat._count.id;

                // Count active villas (non-vacant)
                if (stat.occupancyType !== "VACANT") {
                    activeVillas += stat._count.id;
                }
            });

            // Add occupied count (owner + tenant)
            occupancyBreakdown.occupied =
                (occupancyBreakdown.owner || 0) +
                (occupancyBreakdown.tenant || 0);

            // 2. Get standard maintenance amount from recent payments
            const standardMaintenancePayment = await prisma.payment.findFirst({
                where: {
                    category: {
                        isRecurring: true,
                        name: { contains: "Maintenance" },
                    },
                },
                orderBy: { paymentDate: "desc" },
            });

            const standardAmount = standardMaintenancePayment
                ? parseFloat(standardMaintenancePayment.receivableAmount)
                : 4000;

            // 3. Payment Statistics (Current Month) - FIXED
            const currentMonthPayments = await prisma.payment.findMany({
                where: {
                    paymentMonth: currentMonth,
                    paymentYear: currentYear,
                    category: { isRecurring: true },
                },
                include: {
                    villa: true,
                    category: true,
                },
            });

            // Calculate payment totals
            let monthlyReceived = 0;
            let monthlyReceivable = 0;
            const paidVillas = new Set();
            const partiallyPaidVillas = new Set();

            currentMonthPayments.forEach((payment) => {
                monthlyReceived += parseFloat(payment.receivedAmount);
                monthlyReceivable += parseFloat(payment.receivableAmount);

                const received = parseFloat(payment.receivedAmount);
                const receivable = parseFloat(payment.receivableAmount);

                if (received >= receivable) {
                    paidVillas.add(payment.villaId);
                } else if (received > 0) {
                    partiallyPaidVillas.add(payment.villaId);
                }
            });

            // Add expected amounts for villas that haven't paid
            const villasWithPayments = new Set(
                currentMonthPayments.map((p) => p.villaId)
            );
            const villasWithoutPayments =
                activeVillas - villasWithPayments.size;

            if (villasWithoutPayments > 0) {
                monthlyReceivable += villasWithoutPayments * standardAmount;
            }

            const monthlyPending = monthlyReceivable - monthlyReceived;

            // 4. Expense Statistics (Current Month)
            const currentMonthExpenses = await prisma.expense.aggregate({
                where: {
                    expenseMonth: currentMonth,
                    expenseYear: currentYear,
                },
                _sum: { amount: true },
                _count: { id: true },
            });

            // 5. Recent Payments (Last 5 transactions)
            const recentPayments = await prisma.payment.findMany({
                take: 5,
                orderBy: { paymentDate: "desc" },
                include: {
                    villa: true,
                    category: true,
                },
            });

            // 6. Top Pending Villas - FIXED (Calculate for current year)
            const allActiveVillasData = await prisma.villa.findMany({
                where: { occupancyType: { not: "VACANT" } },
            });

            // Calculate pending for each active villa
            const villaPendingAmounts = [];

            for (const villa of allActiveVillasData) {
                // Get all payments for this villa this year
                const villaPayments = await prisma.payment.findMany({
                    where: {
                        villaId: villa.id,
                        // paymentYear: currentYear,
                        category: { isRecurring: true },
                    },
                });

                let totalReceivable = 0;
                let totalReceived = 0;

                // Calculate total from actual payments
                villaPayments.forEach((payment) => {
                    totalReceivable += parseFloat(payment.receivableAmount);
                    totalReceived += parseFloat(payment.receivedAmount);
                });

                // Add expected amount for months without payments
                const monthsWithPayments = new Set(
                    villaPayments.map((p) => p.paymentMonth)
                );
                const currentMonthIndex = currentMonth;

                for (let month = 1; month <= currentMonthIndex; month++) {
                    if (!monthsWithPayments.has(month)) {
                        totalReceivable += standardAmount;
                    }
                }

                const pendingAmount = totalReceivable - totalReceived;

                if (pendingAmount > 0) {
                    villaPendingAmounts.push({
                        villaId: villa.id,
                        villaNumber: villa.villaNumber,
                        residentName: villa.residentName,
                        pendingAmount: pendingAmount,
                    });
                }
            }

            const topPendingVillas = villaPendingAmounts
                .sort((a, b) => b.pendingAmount - a.pendingAmount)
                .slice(0, 5);

            // 7. Monthly Trends (Last 6 months)
            const monthlyTrends = [];
            for (let i = 5; i >= 0; i--) {
                const targetDate = new Date(
                    currentYear,
                    currentMonth - 1 - i,
                    1
                );
                const targetMonth = targetDate.getMonth() + 1;
                const targetYear = targetDate.getFullYear();

                const monthPayments = await prisma.payment.aggregate({
                    where: {
                        paymentMonth: targetMonth,
                        paymentYear: targetYear,
                    },
                    _sum: { receivedAmount: true },
                });

                const monthExpenses = await prisma.expense.aggregate({
                    where: {
                        expenseMonth: targetMonth,
                        expenseYear: targetYear,
                    },
                    _sum: { amount: true },
                });

                monthlyTrends.push({
                    month: targetMonth,
                    year: targetYear,
                    monthName: targetDate.toLocaleString("default", {
                        month: "long",
                    }),
                    totalReceived: parseFloat(
                        monthPayments._sum.receivedAmount || 0
                    ),
                    totalExpenses: parseFloat(monthExpenses._sum.amount || 0),
                });
            }

            // 8. Payment Category Breakdown - FIXED
            const allCategories = await prisma.paymentCategory.findMany();
            const categoryStats = [];

            for (const category of allCategories) {
                const categoryPayments = await prisma.payment.aggregate({
                    where: {
                        categoryId: category.id,
                        paymentYear: currentYear,
                    },
                    _sum: {
                        receivedAmount: true,
                        receivableAmount: true,
                    },
                    _count: { id: true },
                });

                const totalReceived = parseFloat(
                    categoryPayments._sum.receivedAmount || 0
                );
                const totalReceivable = parseFloat(
                    categoryPayments._sum.receivableAmount || 0
                );
                const transactionCount = categoryPayments._count;

                // Only include categories that have transactions
                if (transactionCount > 0) {
                    categoryStats.push({
                        categoryId: category.id,
                        categoryName: category.name,
                        totalReceived: totalReceived,
                        totalReceivable: totalReceivable,
                        transactionCount: transactionCount,
                        collectionRate:
                            totalReceivable > 0
                                ? (totalReceived / totalReceivable) * 100
                                : 0,
                    });
                }
            }

            // Compile dashboard response
            const dashboardData = {
                overview: {
                    currentMonth: currentMonth,
                    currentYear: currentYear,
                    monthName: currentDate.toLocaleString("default", {
                        month: "long",
                    }),
                },
                villaStats: {
                    totalVillas: villaStats._count.id,
                    occupancyBreakdown: occupancyBreakdown,
                    activeVillas: activeVillas,
                },
                monthlyFinancials: {
                    totalReceived: monthlyReceived,
                    totalReceivable: monthlyReceivable,
                    totalPending: monthlyPending,
                    collectionRate:
                        monthlyReceivable > 0
                            ? (
                                  (monthlyReceived / monthlyReceivable) *
                                  100
                              ).toFixed(2)
                            : "0.00",
                },
                paymentStats: {
                    villasFullyPaid: paidVillas.size,
                    villasPartiallyPaid: partiallyPaidVillas.size,
                    villasUnpaid:
                        activeVillas -
                        paidVillas.size -
                        partiallyPaidVillas.size,
                    totalPaymentTransactions: currentMonthPayments.length,
                },
                expenseStats: {
                    monthlyExpenses: parseFloat(
                        currentMonthExpenses._sum.amount || 0
                    ),
                    expenseTransactions: currentMonthExpenses._count.id || 0,
                },
                recentPayments: recentPayments.map((payment) => ({
                    id: payment.id,
                    villaNumber: payment.villa.villaNumber,
                    residentName: payment.villa.residentName,
                    categoryName: payment.category.name,
                    receivedAmount: parseFloat(payment.receivedAmount),
                    paymentDate: payment.paymentDate,
                    paymentMonth: payment.paymentMonth,
                    paymentYear: payment.paymentYear,
                })),
                topPendingVillas: topPendingVillas,
                monthlyTrends: monthlyTrends,
                categoryBreakdown: categoryStats,
                generatedAt: new Date(),
            };

            res.json({
                success: true,
                message: "Dashboard stats retrieved successfully",
                data: dashboardData,
            });
        } catch (error) {
            console.error("Dashboard stats error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to retrieve dashboard statistics",
                error: error.message,
            });
        }
    }

    // Get quick summary for dashboard cards - FIXED
    static async getQuickSummary(req, res) {
        try {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1;
            const currentYear = currentDate.getFullYear();

            // Get active villas count
            const activeVillasCount = await prisma.villa.count({
                where: { occupancyType: { not: "VACANT" } },
            });

            // Get standard maintenance amount
            const standardMaintenancePayment = await prisma.payment.findFirst({
                where: {
                    category: {
                        isRecurring: true,
                        name: { contains: "Maintenance" },
                    },
                },
                orderBy: { paymentDate: "desc" },
            });

            const standardAmount = standardMaintenancePayment
                ? parseFloat(standardMaintenancePayment.receivableAmount)
                : 4000;

            // Quick aggregations
            const [villaCount, monthlyPayments, monthlyExpenses] =
                await Promise.all([
                    prisma.villa.count(),
                    prisma.payment.aggregate({
                        where: {
                            paymentMonth: currentMonth,
                            paymentYear: currentYear,
                            category: { isRecurring: true },
                        },
                        _sum: {
                            receivedAmount: true,
                            receivableAmount: true,
                        },
                    }),
                    prisma.expense.aggregate({
                        where: {
                            expenseMonth: currentMonth,
                            expenseYear: currentYear,
                        },
                        _sum: { amount: true },
                    }),
                ]);

            let totalReceived = parseFloat(
                monthlyPayments._sum.receivedAmount || 0
            );
            let totalReceivable = parseFloat(
                monthlyPayments._sum.receivableAmount || 0
            );

            // Get unique villas with payments this month - FIXED
            const villasWithPaymentsData = await prisma.payment.findMany({
                where: {
                    paymentMonth: currentMonth,
                    paymentYear: currentYear,
                    category: { isRecurring: true },
                },
                select: {
                    villaId: true,
                },
            });

            // Get unique villa IDs
            const uniqueVillaIds = new Set(
                villasWithPaymentsData.map((p) => p.villaId)
            );
            const villasWithPayments = uniqueVillaIds.size;

            const villasWithoutPayments =
                activeVillasCount - villasWithPayments;
            if (villasWithoutPayments > 0) {
                totalReceivable += villasWithoutPayments * standardAmount;
            }

            const totalExpenses = parseFloat(monthlyExpenses._sum.amount || 0);

            res.json({
                success: true,
                data: {
                    totalVillas: villaCount,
                    monthlyReceived: totalReceived,
                    monthlyPending: totalReceivable - totalReceived,
                    monthlyExpenses: totalExpenses,
                    netBalance: totalReceived - totalExpenses,
                    month: currentMonth,
                    year: currentYear,
                },
            });
        } catch (error) {
            console.error("Quick summary error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to retrieve quick summary",
                error: error.message,
            });
        }
    }
}
