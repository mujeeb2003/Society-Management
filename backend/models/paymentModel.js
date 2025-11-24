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
            // console.log("Fetched villas with payments:", JSON.stringify(villas, null, 4));
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

                // Add one time categories that are not recurring based on the created_at field. Check the year and add them only if they match the current year,
                
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

        // Remove paymentMethod field conditionally after fetching
        if (!filters?.paymentMethod) {
            payments.forEach(payment => {
            delete payment.paymentMethod;
            });
        }

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

    // Get payment by ID with full details
    static async getById(id) {
        return await prisma.payment.findUnique({
            where: { id: parseInt(id) },
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
                villa:true,
                category: true,
            },
            orderBy: { villaId: "asc" }
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
                    receivedAmount:{
                        gt: 0
                    },
                    // Condition 2: Payment is NOT for the report month/year
                    NOT: {
                        paymentMonth: {
                            gte: reportMonth
                        },
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

            // Get all active categories (both recurring and non-recurring)
            const activeCategories = await prisma.paymentCategory.findMany({
                where: {
                    isActive: true,
                },
            });

            if (activeCategories.length === 0) {
                return [];
            }

            // Separate recurring and non-recurring categories
            const recurringCategories = activeCategories.filter(cat => cat.isRecurring);
            const nonRecurringCategories = activeCategories.filter(cat => !cat.isRecurring);

            // Get all payments for this villa from start date onwards
            const payments = await prisma.payment.findMany({
                where: {
                    villaId: parseInt(villaId),
                    paymentYear: {
                        gte: startYear,
                    },
                },
                include: {
                    category: true,
                },
            });

            // Get standard maintenance amount (fallback for categories without payment records)
            const standardAmount = await this.getStandardMaintenanceAmount(currentMonth, currentYear);

            // Create a map to store the standard receivable for each category
            // We'll use the most recent payment for each category as the standard
            const categoryStandardAmounts = new Map();
            activeCategories.forEach(cat => {
                categoryStandardAmounts.set(cat.id, standardAmount); // Default fallback
            });

            // Update with actual amounts from recent payments
            payments.forEach(payment => {
                if (payment.category) {
                    const currentStandard = categoryStandardAmounts.get(payment.categoryId);
                    const paymentAmount = parseFloat(payment.receivableAmount);
                    // Use the most common/recent receivable amount as standard
                    if (!currentStandard || paymentAmount > 0) {
                        categoryStandardAmounts.set(payment.categoryId, paymentAmount);
                    }
                }
            });

            // Create a map of existing payments grouped by month-year-category
            // Key: "year-month-categoryId", Value: { receivable, received }
            const paymentMap = new Map();
            payments.forEach(payment => {
                const key = `${payment.paymentYear}-${payment.paymentMonth}-${payment.categoryId}`;
                
                if (!paymentMap.has(key)) {
                    paymentMap.set(key, {
                        receivable: 0,
                        received: 0,
                        categoryName: payment.category.name,
                        categoryId: payment.categoryId,
                    });
                }
                
                const paymentData = paymentMap.get(key);
                paymentData.receivable += parseFloat(payment.receivableAmount);
                paymentData.received += parseFloat(payment.receivedAmount);
            });

            // Check each month from start until current month for RECURRING categories
            const pendingPayments = [];
            let checkMonth = startMonth;
            let checkYear = startYear;

            while (
                checkYear < currentYear || 
                (checkYear === currentYear && checkMonth <= currentMonth)
            ) {
                const monthCategories = [];
                let monthTotalPending = 0;

                // Check each RECURRING category for this month
                recurringCategories.forEach(category => {
                    const categoryKey = `${checkYear}-${checkMonth}-${category.id}`;
                    const categoryPayment = paymentMap.get(categoryKey);
                    const expectedAmount = categoryStandardAmounts.get(category.id) || standardAmount;

                    if (!categoryPayment) {
                        // No payment record for this category - fully pending
                        monthCategories.push({
                            categoryId: category.id,
                            categoryName: category.name,
                            receivable: expectedAmount,
                            received: 0,
                            pending: expectedAmount,
                            status: 'unpaid',
                        });
                        monthTotalPending += expectedAmount;
                    } else {
                        // Payment record exists - calculate pending
                        const pending = categoryPayment.receivable - categoryPayment.received;
                        
                        // Always add the category to show complete breakdown
                        monthCategories.push({
                            categoryId: category.id,
                            categoryName: categoryPayment.categoryName,
                            receivable: categoryPayment.receivable,
                            received: categoryPayment.received,
                            pending: pending,
                            status: categoryPayment.received >= categoryPayment.receivable ? 'paid' : 
                                   categoryPayment.received > 0 ? 'partial' : 'unpaid',
                        });
                        
                        // Only add to total if there's actually pending
                        if (pending > 0) {
                            monthTotalPending += pending;
                        }
                    }
                });

                // Only add this month if there are pending payments
                if (monthCategories.length > 0 && monthTotalPending > 0) {
                    // Filter to only show categories with pending > 0
                    const pendingCategories = monthCategories.filter(cat => cat.pending > 0);
                    
                    if (pendingCategories.length > 0) {
                        pendingPayments.push({
                            month: checkMonth,
                            year: checkYear,
                            monthName: this.getMonthName(checkMonth),
                            pendingAmount: monthTotalPending,
                            categories: pendingCategories,
                            status: pendingCategories.every(c => c.status === 'unpaid') ? 'unpaid' : 'partial',
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

            // Handle NON-RECURRING categories separately (check only once, not per month)
            nonRecurringCategories.forEach(category => {
                // Find all payments for this non-recurring category
                const categoryPayments = payments.filter(p => p.categoryId === category.id);
                
                if (categoryPayments.length === 0) {
                    // No payment exists - this is a pending one-time fee
                    const expectedAmount = categoryStandardAmounts.get(category.id) || standardAmount;
                    
                    // Add as a separate entry (not tied to a specific month)
                    pendingPayments.push({
                        month: 0, // Use 0 to indicate non-recurring
                        year: currentYear,
                        monthName: category.name, // Use category name instead of month
                        pendingAmount: expectedAmount,
                        categories: [{
                            categoryId: category.id,
                            categoryName: category.name,
                            receivable: expectedAmount,
                            received: 0,
                            pending: expectedAmount,
                            status: 'unpaid',
                        }],
                        status: 'unpaid',
                    });
                } else {
                    // Calculate total receivable and received across all payments for this category
                    let totalReceivable = 0;
                    let totalReceived = 0;
                    
                    categoryPayments.forEach(payment => {
                        totalReceivable += parseFloat(payment.receivableAmount);
                        totalReceived += parseFloat(payment.receivedAmount);
                    });
                    
                    const pending = totalReceivable - totalReceived;
                    
                    // Only add if there's pending amount
                    if (pending > 0) {
                        pendingPayments.push({
                            month: 0, // Use 0 to indicate non-recurring
                            year: currentYear,
                            monthName: category.name, // Use category name instead of month
                            pendingAmount: pending,
                            categories: [{
                                categoryId: category.id,
                                categoryName: category.name,
                                receivable: totalReceivable,
                                received: totalReceived,
                                pending: pending,
                                status: totalReceived >= totalReceivable ? 'paid' : 
                                       totalReceived > 0 ? 'partial' : 'unpaid',
                            }],
                            status: totalReceived >= totalReceivable ? 'paid' : 
                                   totalReceived > 0 ? 'partial' : 'unpaid',
                        });
                    }
                }
            });

            return pendingPayments;
        } catch (error) {
            console.error("Error getting pending maintenance payments:", error);
            throw error;
        }
    }


}
