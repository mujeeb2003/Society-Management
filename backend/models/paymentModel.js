import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

export class PaymentModel {
    // Get all payments with filters
    static async getAll(filters = {}) {
        const where = {};

        if (filters.startDate && filters.endDate) {
            where.paymentDate = {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate),
            };
        }

        if (filters.villaId) {
            where.villaId = parseInt(filters.villaId);
        }

        if (filters.categoryId) {
            where.categoryId = parseInt(filters.categoryId);
        }

        return await prisma.payment.findMany({
            where,
            include: {
                villa: true,
                category: true,
            },
            orderBy: {
                paymentDate: "desc",
            },
        });
    }

    // This method creates the structure your UI expects with correct payment logic
    static async getAllWithVillaStructure() {
        try {
            // Get all villas with their payment data
            const villas = await prisma.villa.findMany({
                include: {
                    payments: {
                        include: {
                            category: true,
                        },
                        orderBy: [
                            { paymentYear: "desc" },
                            { paymentMonth: "desc" },
                        ],
                    },
                },
                orderBy: {
                    villaNumber: "asc",
                },
            });

            // Transform the data to match your UI structure
            const transformedData = villas.map((villa) => {
                // Group payments by category to show latest payment info and calculate totals
                const paymentsByCategory = {};

                villa.payments.forEach((payment) => {
                    const categoryId = payment.categoryId;
                    if (!paymentsByCategory[categoryId]) {
                        paymentsByCategory[categoryId] = {
                            categoryInfo: payment.category,
                            payments: [],
                        };
                    }
                    paymentsByCategory[categoryId].payments.push(payment);
                });

                // Transform each category's payments into the UI format
                const paymentsStructure = Object.values(paymentsByCategory).map(
                    (categoryGroup) => {
                        const { categoryInfo, payments } = categoryGroup;

                        // Calculate totals for this category
                        const totalReceivable = payments.reduce(
                            (sum, p) => sum + parseFloat(p.receivableAmount),
                            0
                        );
                        const totalReceived = payments.reduce(
                            (sum, p) => sum + parseFloat(p.receivedAmount),
                            0
                        );
                        const totalPending = totalReceivable - totalReceived;

                        // Get latest payment info
                        const latestPayment = payments[0]; // Already sorted by date desc

                        return {
                            latest_payment: parseFloat(
                                latestPayment.receivedAmount
                            ),
                            latest_payment_date: latestPayment.paymentDate,
                            latest_payment_month: this.getMonthName(
                                latestPayment.paymentMonth
                            ),
                            payment_year: latestPayment.paymentYear,
                            payment_id: latestPayment.id,
                            payment_head_id: latestPayment.categoryId,
                            payment_head_name: categoryInfo.name,

                            // New fields for flexible payment structure
                            total_receivable: totalReceivable,
                            total_received: totalReceived,
                            total_pending: totalPending,

                            // Compatibility with old UI (using latest payment's receivable as reference)
                            payment_head_amount: parseFloat(
                                latestPayment.receivableAmount
                            ),

                            // Payment status
                            payment_status:
                                totalPending <= 0
                                    ? "paid"
                                    : totalPending < totalReceivable
                                    ? "partial"
                                    : "unpaid",

                            // All payments for this category (for detailed view)
                            all_payments: payments.map((p) => ({
                                id: p.id,
                                receivableAmount: parseFloat(
                                    p.receivableAmount
                                ),
                                receivedAmount: parseFloat(p.receivedAmount),
                                pendingAmount:
                                    parseFloat(p.receivableAmount) -
                                    parseFloat(p.receivedAmount),
                                paymentDate: p.paymentDate,
                                paymentMonth: p.paymentMonth,
                                paymentYear: p.paymentYear,
                                paymentMethod: p.paymentMethod,
                                notes: p.notes,
                            })),
                        };
                    }
                );

                return {
                    id: villa.id,
                    villa_number: villa.villaNumber,
                    resident_name: villa.residentName,
                    occupancy_type: villa.occupancyType,
                    Payments: paymentsStructure,
                };
            });

            return transformedData;
        } catch (error) {
            console.error("Error in getAllWithVillaStructure:", error);
            throw error;
        }
    }

    // Helper method to convert month number to name
    static getMonthName(monthNumber) {
        const months = [
            "Jan",
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
        return months[monthNumber - 1] || "Jan";
    }

    // Create new payment with correct logic
    static async create(data) {
        // Check for existing payment in same month/year for same category
        const existingPayment = await prisma.payment.findFirst({
            where: {
                villaId: parseInt(data.villaId),
                categoryId: parseInt(data.categoryId),
                paymentMonth: parseInt(data.paymentMonth),
                paymentYear: parseInt(data.paymentYear),
            },
        });

        if (existingPayment) {
            // Update existing payment by adding to received amount
            // This maintains the original receivable amount but increases received amount
            return await prisma.payment.update({
                where: { id: existingPayment.id },
                data: {
                    receivedAmount:
                        parseFloat(existingPayment.receivedAmount) + parseFloat(data.receivedAmount),
                    paymentDate: new Date(data.paymentDate),
                    notes: data.notes
                        ? `${existingPayment.notes || ""}\n${data.notes}`
                        : existingPayment.notes,
                    paymentMethod:
                        data.paymentMethod || existingPayment.paymentMethod,
                },
                include: {
                    villa: true,
                    category: true,
                },
            });
        } else {
            // Create new payment
            return await prisma.payment.create({
                data: {
                    villaId: parseInt(data.villaId),
                    categoryId: parseInt(data.categoryId),
                    receivableAmount: parseFloat(data.receivableAmount),
                    receivedAmount: parseFloat(data.receivedAmount),
                    paymentDate: new Date(data.paymentDate),
                    paymentMonth: parseInt(data.paymentMonth),
                    paymentYear: parseInt(data.paymentYear),
                    paymentMethod: data.paymentMethod || "CASH",
                    notes: data.notes,
                },
                include: {
                    villa: true,
                    category: true,
                },
            });
        }
    }

    // Get payments by villa with proper calculation
    static async getByVilla(villaId, filters = {}) {
        const where = {
            villaId: parseInt(villaId),
        };

        if (filters.year && filters.year !== "all") {
            where.paymentYear = parseInt(filters.year);
        }

        if (filters.categoryId && filters.categoryId !== "all") {
            where.categoryId = parseInt(filters.categoryId);
        }

        const payments = await prisma.payment.findMany({
            where,
            include: {
                villa: true,
                category: true,
            },
            orderBy: [{ paymentYear: "desc" }, { paymentMonth: "desc" }],
        });

        // Add calculated fields to each payment
        return payments.map((payment) => ({
            ...payment,
            pendingAmount:
                parseFloat(payment.receivableAmount) -
                parseFloat(payment.receivedAmount),
            paymentStatus:
                parseFloat(payment.receivedAmount) >=
                parseFloat(payment.receivableAmount)
                    ? "paid"
                    : parseFloat(payment.receivedAmount) > 0
                    ? "partial"
                    : "unpaid",
        }));
    }

    // Get payments summary by date range with proper calculation
    static async getSummaryByDateRange(startDate, endDate) {
        const result = await prisma.payment.aggregate({
            where: {
                paymentDate: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
            _sum: {
                receivedAmount: true,
                receivableAmount: true,
            },
            _count: {
                id: true,
            },
        });

        // Calculate additional metrics
        const totalReceivable = parseFloat(result._sum.receivableAmount || 0);
        const totalReceived = parseFloat(result._sum.receivedAmount || 0);
        const totalPending = totalReceivable - totalReceived;
        const collectionRate =
            totalReceivable > 0 ? (totalReceived / totalReceivable) * 100 : 0;

        return {
            ...result,
            _sum: {
                ...result._sum,
                pendingAmount: totalPending,
            },
            _additional: {
                collectionRate: parseFloat(collectionRate.toFixed(2)),
                totalPending: totalPending,
            },
        };
    }

    // Update payment
    static async update(id, data) {
        return await prisma.payment.update({
            where: { id: parseInt(id) },
            data: {
                receivableAmount: data.receivableAmount
                    ? parseFloat(data.receivableAmount)
                    : undefined,
                receivedAmount: data.receivedAmount
                    ? parseFloat(data.receivedAmount)
                    : undefined,
                paymentDate: data.paymentDate
                    ? new Date(data.paymentDate)
                    : undefined,
                paymentMonth: data.paymentMonth
                    ? parseInt(data.paymentMonth)
                    : undefined,
                paymentYear: data.paymentYear
                    ? parseInt(data.paymentYear)
                    : undefined,
                paymentMethod: data.paymentMethod,
                notes: data.notes,
            },
            include: {
                villa: true,
                category: true,
            },
        });
    }

    // Delete payment
    static async delete(id) {
        return await prisma.payment.delete({
            where: { id: parseInt(id) },
        });
    }

    // Get payment statistics for reporting
    static async getPaymentStatistics(filters = {}) {
        const where = {};

        if (filters.startDate && filters.endDate) {
            where.paymentDate = {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate),
            };
        }

        // Get detailed statistics
        const payments = await prisma.payment.findMany({
            where,
            include: {
                villa: true,
                category: true,
            },
        });

        // Calculate statistics
        const stats = {
            totalPayments: payments.length,
            totalReceivable: 0,
            totalReceived: 0,
            totalPending: 0,
            paymentsByStatus: {
                paid: 0,
                partial: 0,
                unpaid: 0,
            },
            paymentsByCategory: {},
            paymentsByVilla: {},
        };

        payments.forEach((payment) => {
            const receivable = parseFloat(payment.receivableAmount);
            const received = parseFloat(payment.receivedAmount);
            const pending = receivable - received;

            stats.totalReceivable += receivable;
            stats.totalReceived += received;
            stats.totalPending += pending;

            // Status classification
            if (received >= receivable) {
                stats.paymentsByStatus.paid++;
            } else if (received > 0) {
                stats.paymentsByStatus.partial++;
            } else {
                stats.paymentsByStatus.unpaid++;
            }

            // Category statistics
            const categoryName = payment.category.name;
            if (!stats.paymentsByCategory[categoryName]) {
                stats.paymentsByCategory[categoryName] = {
                    count: 0,
                    totalReceivable: 0,
                    totalReceived: 0,
                    totalPending: 0,
                };
            }
            stats.paymentsByCategory[categoryName].count++;
            stats.paymentsByCategory[categoryName].totalReceivable +=
                receivable;
            stats.paymentsByCategory[categoryName].totalReceived += received;
            stats.paymentsByCategory[categoryName].totalPending += pending;

            // Villa statistics
            const villaNumber = payment.villa.villaNumber;
            if (!stats.paymentsByVilla[villaNumber]) {
                stats.paymentsByVilla[villaNumber] = {
                    count: 0,
                    totalReceivable: 0,
                    totalReceived: 0,
                    totalPending: 0,
                };
            }
            stats.paymentsByVilla[villaNumber].count++;
            stats.paymentsByVilla[villaNumber].totalReceivable += receivable;
            stats.paymentsByVilla[villaNumber].totalReceived += received;
            stats.paymentsByVilla[villaNumber].totalPending += pending;
        });

        // Calculate collection rate
        stats.collectionRate =
            stats.totalReceivable > 0
                ? parseFloat(
                      (
                          (stats.totalReceived / stats.totalReceivable) *
                          100
                      ).toFixed(2)
                  )
                : 0;

        return stats;
    }

    // Get villa-wise payments for a specific month/year (for reports)
    static async getVillaWisePayments(month, year) {
        // console.log(month, year );

        const payments = await prisma.payment.findMany({
            where: {
                paymentMonth: month,
                paymentYear: year,
            },
            include: {
                villa: true,
                category: true,
            },
        });
        // Group by villa and calculate totals
        const villaPayments = {};
        
        payments.forEach((payment) => {
            const villaId = payment.villaId;
            if (!villaPayments[villaId]) {
                villaPayments[villaId] = {
                    villaId: villaId,
                    villaNumber: payment.villa.villaNumber,
                    residentName: payment.villa.residentName,
                    totalReceivable: 0,
                    totalReceived: 0,
                    payments: [],
                };
            }
            
            villaPayments[villaId].totalReceivable += parseFloat(payment.receivableAmount);
            villaPayments[villaId].totalReceived += parseFloat(payment.receivedAmount);
            villaPayments[villaId].payments.push({
                id: payment.id,
                categoryName: payment.category?.name,
                receivableAmount: parseFloat(payment.receivableAmount),
                receivedAmount: parseFloat(payment.receivedAmount),
                paymentDate: payment.paymentDate,
                paymentMethod: payment.paymentMethod,
                notes: payment.notes,
            });
        });

        return Object.values(villaPayments);
    }

    static async getStandardMaintenanceAmount(month, year) {
        const payments = await prisma.payment.findMany({
            where: {
                paymentMonth: month,
                paymentYear: year,
            },
            select: {
                receivableAmount: true,
            },
        });

        if (payments.length === 0) {
            // If no payments for this month, look at the previous month
            let prevMonth = month - 1;
            let prevYear = year;
            
            if (prevMonth === 0) {
                prevMonth = 12;
                prevYear = year - 1;
            }

            const prevPayments = await prisma.payment.findMany({
                where: {
                    paymentMonth: prevMonth,
                    paymentYear: prevYear,
                },
                select: {
                    receivableAmount: true,
                },
            });

            if (prevPayments.length === 0) {
                // Default fallback amount (you can adjust this)
                return 1000.00;
            }

            payments.push(...prevPayments);
        }

        // Find the most common receivable amount (mode)
        const amountCounts = {};
        payments.forEach(payment => {
            const amount = parseFloat(payment.receivableAmount);
            amountCounts[amount] = (amountCounts[amount] || 0) + 1;
        });

        // Get the amount with highest frequency
        let maxCount = 0;
        let standardAmount = 1000.00; // fallback

        for (const [amount, count] of Object.entries(amountCounts)) {
            if (count > maxCount) {
                maxCount = count;
                standardAmount = parseFloat(amount);
            }
        }

        return standardAmount;
    }

    // Add this method to your PaymentModel
    static async getCrossMonthPayments(reportMonth, reportYear) {
        try {
            // Define the start and end of the report month for the actual paymentDate
            const startDate = new Date(reportYear, reportMonth - 1, 1);
            const endDate = new Date(reportYear, reportMonth, 1); // Use exclusive end date (start of next month)

            const payments = await prisma.payment.findMany({
                where: {
                    // Condition 1: Payment was made within the report month/year
                    paymentDate: {
                        gte: startDate,
                        lt: endDate,
                    },
                    // Condition 2: Payment is NOT for the report month/year
                    NOT: {
                        paymentMonth: reportMonth,
                        paymentYear: reportYear,
                    },
                },
                include: {
                    villa: {
                        select: {
                            villaNumber: true,
                            residentName: true,
                        },
                    },
                    category: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: {
                    paymentDate: "desc",
                },
            });

            // Transform the result to match the expected output structure
            return payments.map((p) => ({
                payment_id: p.id,
                villa_id: p.villaId,
                received_amount: p.receivedAmount,
                payment_category: p.category.name,
                payment_date: p.paymentDate,
                paymentMonth: p.paymentMonth,
                paymentYear: p.paymentYear,
                villa_number: p.villa.villaNumber,
                resident_name: p.villa.residentName,
            }));
        } catch (error) {
            console.error("Error getting cross-month payments:", error);
            throw error;
        }
    }

    // Get pending maintenance payments for a villa (for receipt)
    static async getPendingMaintenancePayments(villaId) {
        try {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1;
            const currentYear = currentDate.getFullYear();

            // Get the oldest payment record for this villa
            const oldestPayment = await prisma.payment.findFirst({
                where: {
                    villaId: parseInt(villaId),
                },
                orderBy: [
                    { paymentYear: 'asc' },
                    { paymentMonth: 'asc' }
                ],
                select: {
                    paymentMonth: true,
                    paymentYear: true,
                }
            });

            // If no payment record exists, start from January of current year
            let startMonth = 1;
            let startYear = currentYear;

            if (oldestPayment) {
                startMonth = oldestPayment.paymentMonth;
                startYear = oldestPayment.paymentYear;
            }

            // Get maintenance category ID
            const maintenanceCategory = await prisma.paymentCategory.findFirst({
                where: {
                    name: {
                        contains: 'Maintenance Fee'
                    },
                    isActive: true,
                },  
            });


            if (!maintenanceCategory) {
                return [];
            }

            // Get all maintenance payments for this villa
            const payments = await prisma.payment.findMany({
                where: {
                    villaId: parseInt(villaId),
                    categoryId: maintenanceCategory.id,
                    paymentYear: {
                        gte: startYear,
                    },
                },
                select: {
                    paymentMonth: true,
                    paymentYear: true,
                    receivableAmount: true,
                    receivedAmount: true,
                },
            });

            // Get standard maintenance amount
            const standardAmount = await this.getStandardMaintenanceAmount(currentMonth, currentYear);

            // Create a map of existing payments
            const paymentMap = new Map();
            payments.forEach(payment => {
                const key = `${payment.paymentYear}-${payment.paymentMonth}`;
                paymentMap.set(key, {
                    receivable: parseFloat(payment.receivableAmount),
                    received: parseFloat(payment.receivedAmount),
                });
            });

            // Check each month from start until current month
            const pendingPayments = [];
            let checkMonth = startMonth;
            let checkYear = startYear;


            while (
                checkYear < currentYear || 
                (checkYear === currentYear && checkMonth <= currentMonth)
            ) {
                const key = `${checkYear}-${checkMonth}`;
                const payment = paymentMap.get(key);

                if (!payment) {
                    // No payment record - fully pending
                    pendingPayments.push({
                        month: checkMonth,
                        year: checkYear,
                        monthName: this.getMonthName(checkMonth),
                        pendingAmount: standardAmount,
                        status: 'unpaid',
                    });
                } else {
                    // Payment record exists - check if there's pending amount
                    const pending = payment.receivable - payment.received;
                    if (pending > 0) {
                        pendingPayments.push({
                            month: checkMonth,
                            year: checkYear,
                            monthName: this.getMonthName(checkMonth),
                            pendingAmount: pending,
                            status: payment.received > 0 ? 'partial' : 'unpaid',
                        });
                    }
                }

                // Move to next month
                checkMonth++;
                if (checkMonth > 12) {
                    checkMonth = 1;
                    checkYear++;
                }
            }

            return pendingPayments;
        } catch (error) {
            console.error("Error getting pending maintenance payments:", error);
            throw error;
        }
    }


}
