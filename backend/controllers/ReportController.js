import MonthlyBalance from "../models/MonthlyBalance.js";
import { PaymentModel } from "../models/paymentModel.js";
import { ExpenseModel } from "../models/expensesModel.js";
import { VillaModel } from "../models/villaModel.js";
import ExcelJS from "exceljs";

export class ReportController {
    static async generateMonthlyReport(req, res) {
        try {
            const { month, year } = req.params;

            if (!month || !year) {
                return res.status(400).json({
                    success: false,
                    message: "Month and year are required",
                });
            }

            const monthInt = parseInt(month);
            const yearInt = parseInt(year);

            const monthlyBalance = await MonthlyBalance.generateMonthlyBalance(
                monthInt,
                yearInt
            );

            const villaPayments = await PaymentModel.getVillaWisePayments(
                monthInt,
                yearInt
            );

            const crossMonthPayments = await PaymentModel.getCrossMonthPayments(
                monthInt,
                yearInt
            );

            const monthlyExpenses =
                await ExpenseModel.getExpensesWithDescriptions(
                    monthInt,
                    yearInt
                );

            const standardMaintenanceAmount =
                await PaymentModel.getStandardMaintenanceAmount(
                    monthInt,
                    yearInt
                );

            const allVillas = await VillaModel.getAll({ isActive: true });

            const totalCrossMonthPayments = crossMonthPayments.reduce(
                (sum, payment) =>
                    sum + parseFloat(payment.received_amount || 0),
                0
            );

            const report = {
                month: monthInt,
                year: yearInt,
                monthName: new Date(yearInt, monthInt - 1).toLocaleString(
                    "default",
                    { month: "long" }
                ),
                summary: {
                    previousBalance: monthlyBalance.previousBalance,
                    totalReceipts: monthlyBalance.totalReceipts,
                    totalExpenses: monthlyBalance.totalExpenses,
                    currentBalance: monthlyBalance.currentBalance,
                    crossMonthPayments: totalCrossMonthPayments,
                },
                villaPayments: allVillas.map((villa) => {
                    const villaPayment = villaPayments.find(
                        (vp) => vp.villaId === villa.id
                    );

                    let receivableAmount = 0;
                    let receivedAmount = villaPayment?.totalReceived || 0;

                    if (villa.occupancyType === "VACANT") {
                        receivableAmount = 0;
                    } else if (villaPayment) {
                        receivableAmount = villaPayment.totalReceivable;
                    } else {
                        receivableAmount = standardMaintenanceAmount;
                    }

                    const pendingAmount = receivableAmount - receivedAmount;
                    const status =
                        villa.occupancyType === "VACANT"
                            ? "NOT_APPLICABLE"
                            : receivedAmount >= receivableAmount
                            ? "PAID"
                            : receivedAmount > 0
                            ? "PARTIAL"
                            : "NOT_PAID";

                    return {
                        villaNumber: villa.villaNumber,
                        residentName: villa.residentName,
                        occupancyType: villa.occupancyType,
                        receivableAmount: receivableAmount,
                        receivedAmount: receivedAmount,
                        pendingAmount: pendingAmount,
                        paymentStatus: status,
                    };
                }),
                expenses: monthlyExpenses,
                crossMonthPayments: crossMonthPayments,
                generatedAt: new Date(),
            };

            res.json({
                success: true,
                data: report,
            });
        } catch (error) {
            console.error("Generate monthly report error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to generate monthly report",
                error: error.message,
            });
        }
    }

    static async exportMonthlyReport(req, res) {
        try {
            const { month, year } = req.params;

            if (!month || !year) {
                return res.status(400).json({
                    success: false,
                    message: "Month and year are required",
                });
            }

            const monthInt = parseInt(month);
            const yearInt = parseInt(year);

            const monthlyBalance = await MonthlyBalance.generateMonthlyBalance(
                monthInt,
                yearInt
            );
            const villaPayments = await PaymentModel.getVillaWisePayments(
                monthInt,
                yearInt
            );

            const crossMonthPayments = await PaymentModel.getCrossMonthPayments(
                monthInt,
                yearInt
            );
            const monthlyExpenses =
                await ExpenseModel.getExpensesWithDescriptions(
                    monthInt,
                    yearInt
                );

            const standardMaintenanceAmount =
                await PaymentModel.getStandardMaintenanceAmount(
                    monthInt,
                    yearInt
                );
            const allVillas = await VillaModel.getAll({ isActive: true });

            const totalCrossMonthPayments = crossMonthPayments.reduce(
                (sum, payment) =>
                    sum + parseFloat(payment.received_amount || 0),
                0
            );

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Monthly Report");

            const headerStyle = {
                font: { bold: true, size: 12 },
                alignment: { horizontal: "center" },
                fill: {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFE6F3FF" },
                },
                border: {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                },
            };

            const summaryStyle = {
                font: { bold: true, size: 14 },
                alignment: { horizontal: "center" },
                fill: {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFCCFFCC" },
                },
            };

            worksheet.mergeCells("A1:H1");
            worksheet.getCell(
                "A1"
            ).value = `Monthly Financial Report - ${new Date(
                yearInt,
                monthInt - 1
            ).toLocaleString("default", { month: "long" })} ${yearInt}`;
            worksheet.getCell("A1").style = {
                font: { bold: true, size: 16 },
                alignment: { horizontal: "center" },
            };

            worksheet.mergeCells("A3:H3");
            worksheet.getCell("A3").value = "Financial Summary";
            worksheet.getCell("A3").style = summaryStyle;

            worksheet.getCell("A5").value = "Previous Month Balance:";
            worksheet.getCell("B5").value = parseFloat(
                monthlyBalance.previousBalance
            );
            worksheet.getCell("A6").value = "Total Receipts (Current Month):";
            worksheet.getCell("B6").value = parseFloat(
                monthlyBalance.totalReceipts
            );
            worksheet.getCell("A7").value = "Total Expenses:";
            worksheet.getCell("B7").value = parseFloat(
                monthlyBalance.totalExpenses
            );

            worksheet.getCell("A8").value =
                "Amount Received for Pending Months:";
            worksheet.getCell("B8").value = parseFloat(totalCrossMonthPayments);

            worksheet.getCell("A9").value = "Current Month Balance:";
            worksheet.getCell("B9").value = parseFloat(
                monthlyBalance.currentBalance
            );

            ["B5", "B6", "B7", "B8", "B9"].forEach((cell) => {
                worksheet.getCell(cell).numFmt = "#,##0.00";
            });

            let nextSectionRow = 11;
            if (crossMonthPayments.length > 0) {
                worksheet.mergeCells(`A${nextSectionRow}:H${nextSectionRow}`);
                worksheet.getCell(`A${nextSectionRow}`).value =
                    "Payments Received for Previous Months";
                worksheet.getCell(`A${nextSectionRow}`).style = summaryStyle;

                const crossMonthHeaders = [
                    "Villa#",
                    "Resident",
                    "Payment Month",
                    "Category",
                    "Amount",
                    "Payment Date",
                ];
                crossMonthHeaders.forEach((header, index) => {
                    const cell = worksheet.getCell(
                        nextSectionRow + 2,
                        index + 1
                    );
                    cell.value = header;
                    cell.style = headerStyle;
                });

                let crossMonthRow = nextSectionRow + 3;
                crossMonthPayments.forEach((payment) => {
                    worksheet.getCell(crossMonthRow, 1).value =
                        payment.villa_number || payment.villaNumber;
                    worksheet.getCell(crossMonthRow, 2).value =
                        payment.resident_name || "N/A";
                    worksheet.getCell(
                        crossMonthRow,
                        3
                    ).value = `${payment.paymentMonth} ${payment.paymentYear}`;
                    worksheet.getCell(crossMonthRow, 4).value =
                        payment.payment_category;
                    worksheet.getCell(crossMonthRow, 5).value = parseFloat(
                        payment.received_amount
                    );
                    worksheet.getCell(crossMonthRow, 6).value = new Date(
                        payment.payment_date
                    ).toLocaleDateString();

                    worksheet.getCell(crossMonthRow, 5).numFmt = "#,##0.00";
                    crossMonthRow++;
                });

                worksheet.getCell(crossMonthRow, 4).value = "TOTAL:";
                worksheet.getCell(crossMonthRow, 4).style = {
                    font: { bold: true },
                };
                worksheet.getCell(crossMonthRow, 5).value = parseFloat(
                    totalCrossMonthPayments
                );
                worksheet.getCell(crossMonthRow, 5).style = {
                    font: { bold: true },
                    fill: {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFFFE6CC" },
                    },
                };
                worksheet.getCell(crossMonthRow, 5).numFmt = "#,##0.00";

                nextSectionRow = crossMonthRow + 3;
            }

            worksheet.mergeCells(`A${nextSectionRow}:H${nextSectionRow}`);
            worksheet.getCell(`A${nextSectionRow}`).value =
                "Villa-wise Payment Details";
            worksheet.getCell(`A${nextSectionRow}`).style = summaryStyle;

            const headers = [
                "Villa#",
                "Resident Name",
                "Occupancy",
                "Receivable",
                "Received",
                "Pending",
                "Status",
            ];
            headers.forEach((header, index) => {
                const cell = worksheet.getCell(nextSectionRow + 2, index + 1);
                cell.value = header;
                cell.style = headerStyle;
            });

            let row = nextSectionRow + 3;
            allVillas.forEach((villa) => {
                const villaPayment = villaPayments.find(
                    (vp) => vp.villaId === villa.id
                );

                let receivableAmount = 0;
                let receivedAmount = villaPayment?.totalReceived || 0;

                if (villa.occupancyType === "VACANT") {
                    receivableAmount = 0;
                } else if (villaPayment) {
                    receivableAmount = villaPayment.totalReceivable;
                } else {
                    receivableAmount = standardMaintenanceAmount;
                }

                const pendingAmount = receivableAmount - receivedAmount;
                const status =
                    villa.occupancyType === "VACANT"
                        ? "NOT_APPLICABLE"
                        : receivedAmount >= receivableAmount
                        ? "PAID"
                        : receivedAmount > 0
                        ? "PARTIAL"
                        : "NOT_PAID";

                worksheet.getCell(row, 1).value = villa.villaNumber;
                worksheet.getCell(row, 2).value = villa.residentName || "N/A";
                worksheet.getCell(row, 3).value = villa.occupancyType;
                worksheet.getCell(row, 4).value = parseFloat(receivableAmount);
                worksheet.getCell(row, 5).value = parseFloat(receivedAmount);
                worksheet.getCell(row, 6).value = parseFloat(pendingAmount);
                worksheet.getCell(row, 7).value = status;

                [4, 5, 6].forEach((col) => {
                    worksheet.getCell(row, col).numFmt = "#,##0.00";
                });

                const statusCell = worksheet.getCell(row, 7);
                if (status === "PAID") {
                    statusCell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFE6FFED" },
                    };
                } else if (status === "PARTIAL") {
                    statusCell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFFFF0E6" },
                    };
                } else if (status === "NOT_PAID") {
                    statusCell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFFFE6E6" },
                    };
                } else {
                    statusCell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFF0F0F0" },
                    };
                }

                row++;
            });

            let totalReceivable = 0;
            let totalReceived = 0;
            let totalPending = 0;
            let villaStats = {
                total: allVillas.length,
                paid: 0,
                partial: 0,
                notPaid: 0,
                vacant: 0,
            };

            allVillas.forEach((villa) => {
                const villaPayment = villaPayments.find(
                    (vp) => vp.villaId === villa.id
                );

                let receivableAmount = 0;
                let receivedAmount = villaPayment?.totalReceived || 0;

                if (villa.occupancyType === "VACANT") {
                    receivableAmount = 0;
                    villaStats.vacant++;
                } else if (villaPayment) {
                    receivableAmount = villaPayment.totalReceivable;
                } else {
                    receivableAmount = standardMaintenanceAmount;
                }

                const pendingAmount = receivableAmount - receivedAmount;
                const status =
                    villa.occupancyType === "VACANT"
                        ? "NOT_APPLICABLE"
                        : receivedAmount >= receivableAmount
                        ? "PAID"
                        : receivedAmount > 0
                        ? "PARTIAL"
                        : "NOT_PAID";

                totalReceivable += receivableAmount;
                totalReceived += receivedAmount;
                totalPending += pendingAmount;

                if (status === "PAID") villaStats.paid++;
                else if (status === "PARTIAL") villaStats.partial++;
                else if (status === "NOT_PAID") villaStats.notPaid++;
            });

            const totalsRow = row;
            worksheet.getCell(totalsRow, 1).value = "TOTAL";
            worksheet.getCell(totalsRow, 1).style = {
                font: { bold: true, size: 12 },
                fill: {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFFFE6CC" },
                },
            };

            worksheet.getCell(totalsRow, 4).value = parseFloat(totalReceivable);
            worksheet.getCell(totalsRow, 5).value = parseFloat(totalReceived);
            worksheet.getCell(totalsRow, 6).value = parseFloat(totalPending);

            [1, 4, 5, 6].forEach((col) => {
                const cell = worksheet.getCell(totalsRow, col);
                cell.style = {
                    ...cell.style,
                    font: { bold: true, size: 12 },
                    fill: {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFFFE6CC" },
                    },
                    border: {
                        top: { style: "thick" },
                        bottom: { style: "thick" },
                    },
                };
                if (col > 3) {
                    cell.numFmt = "#,##0.00";
                }
            });

            const statsStartRow = totalsRow + 2;
            worksheet.mergeCells(`A${statsStartRow}:H${statsStartRow}`);
            worksheet.getCell(`A${statsStartRow}`).value = "Payment Statistics";
            worksheet.getCell(`A${statsStartRow}`).style = summaryStyle;

            worksheet.getCell(`A${statsStartRow + 2}`).value = "Total Villas:";
            worksheet.getCell(`B${statsStartRow + 2}`).value = villaStats.total;
            worksheet.getCell(`A${statsStartRow + 3}`).value = "Fully Paid:";
            worksheet.getCell(`B${statsStartRow + 3}`).value = villaStats.paid;
            worksheet.getCell(`A${statsStartRow + 4}`).value =
                "Partially Paid:";
            worksheet.getCell(`B${statsStartRow + 4}`).value =
                villaStats.partial;
            worksheet.getCell(`A${statsStartRow + 5}`).value = "Not Paid:";
            worksheet.getCell(`B${statsStartRow + 5}`).value =
                villaStats.notPaid;
            worksheet.getCell(`A${statsStartRow + 6}`).value = "Vacant:";
            worksheet.getCell(`B${statsStartRow + 6}`).value =
                villaStats.vacant;

            const expenseStartRow = statsStartRow + 8;
            worksheet.mergeCells(`A${expenseStartRow}:H${expenseStartRow}`);
            worksheet.getCell(`A${expenseStartRow}`).value = "Monthly Expenses";
            worksheet.getCell(`A${expenseStartRow}`).style = summaryStyle;

            const expenseHeaders = [
                "Category",
                "Description",
                "Amount",
                "Date",
                "Notes",
            ];
            expenseHeaders.forEach((header, index) => {
                const cell = worksheet.getCell(expenseStartRow + 2, index + 1);
                cell.value = header;
                cell.style = headerStyle;
            });

            let expenseRow = expenseStartRow + 3;
            if (monthlyExpenses && monthlyExpenses.length > 0) {
                monthlyExpenses.forEach((expense) => {
                    worksheet.getCell(expenseRow, 1).value = expense.category;
                    worksheet.getCell(expenseRow, 2).value =
                        expense.description || expense.title || "N/A";
                    worksheet.getCell(expenseRow, 3).value = parseFloat(
                        expense.amount || expense.total || 0
                    );
                    worksheet.getCell(expenseRow, 4).value =
                        expense.expense_date
                            ? new Date(
                                  expense.expense_date
                              ).toLocaleDateString()
                            : "N/A";
                    worksheet.getCell(expenseRow, 5).value =
                        expense.notes || "N/A";

                    worksheet.getCell(expenseRow, 3).numFmt = "#,##0.00";
                    expenseRow++;
                });

                const expenseTotalRow = expenseRow;
                worksheet.getCell(expenseTotalRow, 2).value = "TOTAL EXPENSES:";
                worksheet.getCell(expenseTotalRow, 2).style = {
                    font: { bold: true },
                };

                const totalExpenses = monthlyExpenses.reduce(
                    (sum, expense) =>
                        sum + parseFloat(expense.amount || expense.total || 0),
                    0
                );
                worksheet.getCell(expenseTotalRow, 3).value =
                    parseFloat(totalExpenses);
                worksheet.getCell(expenseTotalRow, 3).style = {
                    font: { bold: true },
                    fill: {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFFFE6CC" },
                    },
                };
                worksheet.getCell(expenseTotalRow, 3).numFmt = "#,##0.00";
            } else {
                worksheet.getCell(expenseRow, 1).value =
                    "No expenses recorded for this month";
                worksheet.mergeCells(`A${expenseRow}:E${expenseRow}`);
            }

            worksheet.columns.forEach((column) => {
                column.width = 18;
            });

            worksheet.getColumn(2).width = 25;
            worksheet.getColumn(5).width = 20;

            const monthName = new Date(yearInt, monthInt - 1).toLocaleString(
                "default",
                { month: "long" }
            );
            const filename = `Monthly_Report_${monthName}_${yearInt}.xlsx`;

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${filename}"`
            );

            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error("Export monthly report error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to export monthly report",
                error: error.message,
            });
        }
    }

    static async getAllMonthlyBalances(req, res) {
        try {
            const balances = await MonthlyBalance.getAllBalances();

            const formattedBalances = balances.map((balance) => ({
                ...balance,
                monthName: new Date(
                    balance.year,
                    balance.month - 1
                ).toLocaleString("default", { month: "long" }),
                previousBalance: parseFloat(balance.previousBalance),
                totalReceipts: parseFloat(balance.totalReceipts),
                totalExpenses: parseFloat(balance.totalExpenses),
                currentBalance: parseFloat(balance.currentBalance),
            }));

            res.json({
                success: true,
                data: formattedBalances,
            });
        } catch (error) {
            console.error("Get monthly balances error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get monthly balances",
                error: error.message,
            });
        }
    }

    static async getYearlySummary(req, res) {
        try {
            const { year } = req.params;
            const yearInt = parseInt(year);

            const yearlyBalances = await MonthlyBalance.findMany({
                where: { year: yearInt },
                orderBy: { month: "asc" },
            });

            const summary = {
                year: yearInt,
                totalReceipts: 0,
                totalExpenses: 0,
                startingBalance: 0,
                endingBalance: 0,
                monthlyData: [],
            };

            if (yearlyBalances.length > 0) {
                summary.startingBalance = parseFloat(
                    yearlyBalances[0].previousBalance
                );
                summary.endingBalance = parseFloat(
                    yearlyBalances[yearlyBalances.length - 1].currentBalance
                );

                summary.totalReceipts = yearlyBalances.reduce(
                    (sum, balance) => sum + parseFloat(balance.totalReceipts),
                    0
                );

                summary.totalExpenses = yearlyBalances.reduce(
                    (sum, balance) => sum + parseFloat(balance.totalExpenses),
                    0
                );

                summary.monthlyData = yearlyBalances.map((balance) => ({
                    month: balance.month,
                    monthName: new Date(
                        balance.year,
                        balance.month - 1
                    ).toLocaleString("default", { month: "long" }),
                    receipts: parseFloat(balance.totalReceipts),
                    expenses: parseFloat(balance.totalExpenses),
                    balance: parseFloat(balance.currentBalance),
                }));
            }

            res.json({
                success: true,
                data: summary,
            });
        } catch (error) {
            console.error("Get yearly summary error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to get yearly summary",
                error: error.message,
            });
        }
    }

    // Generate villa-wise annual report
    static async generateVillaReport(req, res) {
        try {
            const { villaId, year } = req.params;

            if (!villaId || !year) {
                return res.status(400).json({
                    success: false,
                    message: "Villa ID and year are required",
                });
            }

            const villaIdInt = parseInt(villaId);
            const yearInt = parseInt(year);

            // Get villa details
            const villa = await VillaModel.getById(villaIdInt);
            if (!villa) {
                return res.status(404).json({
                    success: false,
                    message: "Villa not found",
                });
            }

            // Get all payments for this villa in the specified year
            const payments = await PaymentModel.getByVilla(villaIdInt, {
                year: yearInt.toString(),
            });

            // Determine how many months to show
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1; // 1-12
            
            // If viewing current year, show up to current month; otherwise show all 12 months
            const maxMonth = yearInt === currentYear ? currentMonth : 12;

            // Get standard maintenance amount for reference (from most recent payment or category)
            let standardReceivableAmount = 0;
            if (payments.length > 0) {
                // Calculate average receivable from existing payments
                const totalReceivable = payments.reduce(
                    (sum, p) => sum + parseFloat(p.receivableAmount),
                    0
                );
                standardReceivableAmount = totalReceivable / payments.length;
            }

            // If no payments exist, try to get from payment categories (recurring ones)
            if (standardReceivableAmount === 0) {
                const recurringCategories = await prisma.paymentCategory.findMany({
                    where: { isRecurring: true, isActive: true },
                });
                standardReceivableAmount = recurringCategories.reduce(
                    (sum, cat) => sum + parseFloat(cat.defaultAmount || 0),
                    0
                );
            }

            // Group payments by month and category
            const monthlyPayments = {};
            for (let month = 1; month <= maxMonth; month++) {
                monthlyPayments[month] = {
                    month: month,
                    monthName: new Date(yearInt, month - 1).toLocaleString(
                        "default",
                        { month: "long" }
                    ),
                    payments: [],
                    totalReceivable: 0,
                    totalReceived: 0,
                    totalPending: 0,
                };
            }

            // Organize payments by month
            payments.forEach((payment) => {
                const month = payment.paymentMonth;
                if (monthlyPayments[month]) {
                    monthlyPayments[month].payments.push({
                        id: payment.id,
                        categoryName: payment.category?.name || "Unknown",
                        receivableAmount: parseFloat(payment.receivableAmount),
                        receivedAmount: parseFloat(payment.receivedAmount),
                        pendingAmount: parseFloat(payment.pendingAmount),
                        paymentDate: payment.paymentDate,
                        paymentMethod: payment.paymentMethod,
                        paymentStatus: payment.paymentStatus,
                        notes: payment.notes,
                    });
                    monthlyPayments[month].totalReceivable += parseFloat(
                        payment.receivableAmount
                    );
                    monthlyPayments[month].totalReceived += parseFloat(
                        payment.receivedAmount
                    );
                    monthlyPayments[month].totalPending += parseFloat(
                        payment.pendingAmount
                    );
                }
            });

            // For months with no payment records, infer pending amounts
            for (let month = 1; month <= maxMonth; month++) {
                if (monthlyPayments[month].payments.length === 0) {
                    // No payment record exists for this month
                    // Look for the most recent month with a payment to infer receivable amount
                    let inferredReceivable = standardReceivableAmount;
                    
                    // Try to get receivable from previous month first
                    for (let prevMonth = month - 1; prevMonth >= 1; prevMonth--) {
                        if (monthlyPayments[prevMonth] && monthlyPayments[prevMonth].totalReceivable > 0) {
                            inferredReceivable = monthlyPayments[prevMonth].totalReceivable;
                            break;
                        }
                    }

                    // If still 0, try to get from any month in the year with payments
                    if (inferredReceivable === 0) {
                        for (let anyMonth = 1; anyMonth <= 12; anyMonth++) {
                            if (monthlyPayments[anyMonth] && monthlyPayments[anyMonth].totalReceivable > 0) {
                                inferredReceivable = monthlyPayments[anyMonth].totalReceivable;
                                break;
                            }
                        }
                    }

                    // Add a pending entry for this month
                    if (inferredReceivable > 0) {
                        monthlyPayments[month].totalReceivable = inferredReceivable;
                        monthlyPayments[month].totalReceived = 0;
                        monthlyPayments[month].totalPending = inferredReceivable;
                    }
                }
            }

            // Calculate yearly totals
            const yearlyTotals = {
                totalReceivable: 0,
                totalReceived: 0,
                totalPending: 0,
                totalPayments: payments.length,
            };

            Object.values(monthlyPayments).forEach((month) => {
                yearlyTotals.totalReceivable += month.totalReceivable;
                yearlyTotals.totalReceived += month.totalReceived;
                yearlyTotals.totalPending += month.totalPending;
            });

            // Calculate payment statistics
            const paymentStats = {
                paidMonths: 0,
                partialMonths: 0,
                unpaidMonths: 0,
            };

            Object.values(monthlyPayments).forEach((month) => {
                if (month.totalReceivable === 0) {
                    // Skip months with no receivable amount
                    return;
                }
                if (month.totalPending === 0 && month.totalReceived > 0) {
                    paymentStats.paidMonths++;
                } else if (month.totalReceived > 0 && month.totalPending > 0) {
                    paymentStats.partialMonths++;
                } else if (month.totalPending > 0 && month.totalReceived === 0) {
                    paymentStats.unpaidMonths++;
                }
            });

            const report = {
                villa: {
                    id: villa.id,
                    villaNumber: villa.villaNumber,
                    residentName: villa.residentName,
                    occupancyType: villa.occupancyType,
                },
                year: yearInt,
                monthlyPayments: Object.values(monthlyPayments),
                yearlyTotals: yearlyTotals,
                paymentStats: paymentStats,
                generatedAt: new Date(),
            };

            res.json({
                success: true,
                data: report,
            });
        } catch (error) {
            console.error("Generate villa report error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to generate villa report",
                error: error.message,
            });
        }
    }

    // Export villa-wise report to Excel
    static async exportVillaReport(req, res) {
        try {
            const { villaId, year } = req.params;

            if (!villaId || !year) {
                return res.status(400).json({
                    success: false,
                    message: "Villa ID and year are required",
                });
            }

            const villaIdInt = parseInt(villaId);
            const yearInt = parseInt(year);

            // Get villa details
            const villa = await VillaModel.getById(villaIdInt);
            if (!villa) {
                return res.status(404).json({
                    success: false,
                    message: "Villa not found",
                });
            }

            // Get all payments for this villa in the specified year
            const payments = await PaymentModel.getByVilla(villaIdInt, {
                year: yearInt.toString(),
            });

            // Determine how many months to show
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1; // 1-12
            
            // If viewing current year, show up to current month; otherwise show all 12 months
            const maxMonth = yearInt === currentYear ? currentMonth : 12;

            // Get standard maintenance amount for reference
            let standardReceivableAmount = 0;
            if (payments.length > 0) {
                const totalReceivable = payments.reduce(
                    (sum, p) => sum + parseFloat(p.receivableAmount),
                    0
                );
                standardReceivableAmount = totalReceivable / payments.length;
            }

            // If no payments exist, try to get from payment categories
            if (standardReceivableAmount === 0) {
                const recurringCategories = await prisma.paymentCategory.findMany({
                    where: { isRecurring: true, isActive: true },
                });
                standardReceivableAmount = recurringCategories.reduce(
                    (sum, cat) => sum + parseFloat(cat.defaultAmount || 0),
                    0
                );
            }

            // Group payments by month
            const monthlyGroups = {};
            for (let month = 1; month <= maxMonth; month++) {
                monthlyGroups[month] = [];
            }

            payments.forEach((payment) => {
                const monthKey = payment.paymentMonth;
                if (monthlyGroups[monthKey]) {
                    monthlyGroups[monthKey].push(payment);
                }
            });

            // For months with no payment records, infer pending amounts
            for (let month = 1; month <= maxMonth; month++) {
                if (monthlyGroups[month].length === 0) {
                    // Look for the most recent month with a payment to get categories and amounts
                    let inferredPayments = [];
                    
                    // Try to get payment structure from previous month first
                    for (let prevMonth = month - 1; prevMonth >= 1; prevMonth--) {
                        if (monthlyGroups[prevMonth] && monthlyGroups[prevMonth].length > 0) {
                            // Clone the payment structure from previous month
                            inferredPayments = monthlyGroups[prevMonth].map(p => ({
                                id: 0,
                                paymentMonth: month,
                                category: p.category,
                                receivableAmount: parseFloat(p.receivableAmount),
                                receivedAmount: 0,
                                pendingAmount: parseFloat(p.receivableAmount),
                                paymentDate: new Date(yearInt, month - 1, 1),
                                paymentMethod: "N/A",
                                paymentStatus: "unpaid",
                            }));
                            break;
                        }
                    }

                    // If still no structure found, try to get from any month in the year with payments
                    if (inferredPayments.length === 0) {
                        for (let anyMonth = 1; anyMonth <= 12; anyMonth++) {
                            if (monthlyGroups[anyMonth] && monthlyGroups[anyMonth].length > 0) {
                                inferredPayments = monthlyGroups[anyMonth].map(p => ({
                                    id: 0,
                                    paymentMonth: month,
                                    category: p.category,
                                    receivableAmount: parseFloat(p.receivableAmount),
                                    receivedAmount: 0,
                                    pendingAmount: parseFloat(p.receivableAmount),
                                    paymentDate: new Date(yearInt, month - 1, 1),
                                    paymentMethod: "N/A",
                                    paymentStatus: "unpaid",
                                }));
                                break;
                            }
                        }
                    }

                    // Add the inferred pending entries for this month
                    if (inferredPayments.length > 0) {
                        monthlyGroups[month] = inferredPayments;
                    }
                }
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Villa Annual Report");

            const headerStyle = {
                font: { bold: true, size: 12 },
                alignment: { horizontal: "center" },
                fill: {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFE6F3FF" },
                },
                border: {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                },
            };

            const summaryStyle = {
                font: { bold: true, size: 14 },
                alignment: { horizontal: "center" },
                fill: {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFCCFFCC" },
                },
            };

            // Title
            worksheet.mergeCells("A1:H1");
            worksheet.getCell("A1").value = `Villa ${
                villa.villaNumber
            } - Annual Payment Report ${yearInt}`;
            worksheet.getCell("A1").style = {
                font: { bold: true, size: 16 },
                alignment: { horizontal: "center" },
            };

            // Villa Information
            worksheet.mergeCells("A3:H3");
            worksheet.getCell("A3").value = "Villa Information";
            worksheet.getCell("A3").style = summaryStyle;

            worksheet.getCell("A5").value = "Villa Number:";
            worksheet.getCell("B5").value = villa.villaNumber;
            worksheet.getCell("A6").value = "Resident Name:";
            worksheet.getCell("B6").value = villa.residentName || "N/A";
            worksheet.getCell("A7").value = "Occupancy Type:";
            worksheet.getCell("B7").value = villa.occupancyType || "N/A";

            let currentRow = 9;

            // Yearly Summary
            worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
            worksheet.getCell(`A${currentRow}`).value = "Yearly Summary";
            worksheet.getCell(`A${currentRow}`).style = summaryStyle;

            currentRow += 2;

            // Calculate yearly totals including inferred pending months
            const yearlyTotals = {
                totalReceivable: 0,
                totalReceived: 0,
                totalPending: 0,
            };

            // Use monthlyGroups which includes inferred payments
            Object.values(monthlyGroups).forEach((monthPayments) => {
                monthPayments.forEach((payment) => {
                    yearlyTotals.totalReceivable += parseFloat(
                        payment.receivableAmount
                    );
                    yearlyTotals.totalReceived += parseFloat(
                        payment.receivedAmount
                    );
                    yearlyTotals.totalPending += parseFloat(payment.pendingAmount);
                });
            });

            worksheet.getCell(`A${currentRow}`).value =
                "Total Receivable Amount:";
            worksheet.getCell(`B${currentRow}`).value = parseFloat(
                yearlyTotals.totalReceivable
            );
            worksheet.getCell(`B${currentRow}`).numFmt = "#,##0.00";

            currentRow++;
            worksheet.getCell(`A${currentRow}`).value =
                "Total Received Amount:";
            worksheet.getCell(`B${currentRow}`).value = parseFloat(
                yearlyTotals.totalReceived
            );
            worksheet.getCell(`B${currentRow}`).numFmt = "#,##0.00";

            currentRow++;
            worksheet.getCell(`A${currentRow}`).value = "Total Pending Amount:";
            worksheet.getCell(`B${currentRow}`).value = parseFloat(
                yearlyTotals.totalPending
            );
            worksheet.getCell(`B${currentRow}`).numFmt = "#,##0.00";

            currentRow++;
            worksheet.getCell(`A${currentRow}`).value = "Total Payments:";
            worksheet.getCell(`B${currentRow}`).value = payments.length;

            currentRow += 2;

            // Monthly Payment Details
            worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
            worksheet.getCell(`A${currentRow}`).value =
                "Monthly Payment Details";
            worksheet.getCell(`A${currentRow}`).style = summaryStyle;

            currentRow += 2;

            // Headers
            const detailHeaders = [
                "Month",
                "Category",
                "Receivable",
                "Received",
                "Pending",
                "Date",
                "Method",
                "Status",
            ];
            detailHeaders.forEach((header, index) => {
                const cell = worksheet.getCell(currentRow, index + 1);
                cell.value = header;
                cell.style = headerStyle;
            });

            currentRow++;

            // Sort months (use the monthlyGroups already created above)
            const sortedMonths = Object.keys(monthlyGroups)
                .map(Number)
                .sort((a, b) => a - b);

            sortedMonths.forEach((month) => {
                const monthPayments = monthlyGroups[month];
                const monthName = new Date(yearInt, month - 1).toLocaleString(
                    "default",
                    { month: "long" }
                );

                monthPayments.forEach((payment, index) => {
                    worksheet.getCell(currentRow, 1).value =
                        index === 0 ? monthName : "";
                    worksheet.getCell(currentRow, 2).value =
                        payment.category?.name || "Unknown";
                    worksheet.getCell(currentRow, 3).value = parseFloat(
                        payment.receivableAmount
                    );
                    worksheet.getCell(currentRow, 4).value = parseFloat(
                        payment.receivedAmount
                    );
                    worksheet.getCell(currentRow, 5).value = parseFloat(
                        payment.pendingAmount
                    );
                    worksheet.getCell(currentRow, 6).value = new Date(
                        payment.paymentDate
                    ).toLocaleDateString();
                    worksheet.getCell(currentRow, 7).value =
                        payment.paymentMethod;
                    worksheet.getCell(currentRow, 8).value =
                        payment.paymentStatus.toUpperCase();

                    [3, 4, 5].forEach((col) => {
                        worksheet.getCell(currentRow, col).numFmt = "#,##0.00";
                    });

                    currentRow++;
                });

                // Month subtotal
                const monthTotal = {
                    receivable: monthPayments.reduce(
                        (sum, p) => sum + parseFloat(p.receivableAmount),
                        0
                    ),
                    received: monthPayments.reduce(
                        (sum, p) => sum + parseFloat(p.receivedAmount),
                        0
                    ),
                    pending: monthPayments.reduce(
                        (sum, p) => sum + parseFloat(p.pendingAmount),
                        0
                    ),
                };

                worksheet.getCell(currentRow, 2).value = `${monthName} Total:`;
                worksheet.getCell(currentRow, 2).style = { font: { bold: true } };
                worksheet.getCell(currentRow, 3).value = monthTotal.receivable;
                worksheet.getCell(currentRow, 4).value = monthTotal.received;
                worksheet.getCell(currentRow, 5).value = monthTotal.pending;

                [3, 4, 5].forEach((col) => {
                    worksheet.getCell(currentRow, col).style = {
                        font: { bold: true },
                        fill: {
                            type: "pattern",
                            pattern: "solid",
                            fgColor: { argb: "FFFFE6CC" },
                        },
                    };
                    worksheet.getCell(currentRow, col).numFmt = "#,##0.00";
                });

                currentRow += 2;
            });

            // Set column widths
            worksheet.columns.forEach((column) => {
                column.width = 18;
            });
            worksheet.getColumn(2).width = 25;

            const filename = `Villa_${villa.villaNumber}_Report_${yearInt}.xlsx`;
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${filename}"`
            );

            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error("Export villa report error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to export villa report",
                error: error.message,
            });
        }
    }

    // Generate pending payments report
    static async generatePendingPaymentsReport(req, res) {
        try {
            const { month, year } = req.query;
            
            // Default to current month/year if not provided
            const currentDate = new Date();
            const reportMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
            const reportYear = year ? parseInt(year) : currentDate.getFullYear();

            // Get all active villas
            const allVillas = await VillaModel.getAll({ isActive: true });

            // Get payment data for the specified month/year
            const villaPayments = await PaymentModel.getVillaWisePayments(
                reportMonth,
                reportYear
            );

            // Get standard maintenance amount
            const standardMaintenanceAmount =
                await PaymentModel.getStandardMaintenanceAmount(
                    reportMonth,
                    reportYear
                );

            // Build pending payments data
            const pendingVillas = [];

            allVillas.forEach((villa) => {
                // Skip vacant villas
                if (!villa.residentName || villa.occupancyType === "Vacant") {
                    return;
                }

                const villaPaymentData = villaPayments.find(
                    (vp) => vp.villaId === villa.id
                );

                let totalReceivable = 0;
                let totalReceived = 0;
                let totalPending = 0;
                let paymentDetails = [];

                if (villaPaymentData && villaPaymentData.payments) {
                    // Group payments by category
                    const categoryMap = {};
                    
                    villaPaymentData.payments.forEach((payment) => {
                        const catName = payment.categoryName || "Unknown";
                        
                        if (!categoryMap[catName]) {
                            categoryMap[catName] = {
                                categoryName: catName,
                                receivableAmount: 0,
                                receivedAmount: 0,
                                pendingAmount: 0,
                            };
                        }
                        
                        categoryMap[catName].receivableAmount += parseFloat(payment.receivableAmount || 0);
                        categoryMap[catName].receivedAmount += parseFloat(payment.receivedAmount || 0);
                        categoryMap[catName].pendingAmount += parseFloat(payment.receivableAmount || 0) - parseFloat(payment.receivedAmount || 0);
                    });

                    // Calculate totals
                    Object.values(categoryMap).forEach((cat) => {
                        totalReceivable += cat.receivableAmount;
                        totalReceived += cat.receivedAmount;
                        totalPending += cat.pendingAmount;

                        // Only include categories with pending amounts
                        if (cat.pendingAmount > 0) {
                            paymentDetails.push({
                                categoryId: null,
                                categoryName: cat.categoryName,
                                receivableAmount: cat.receivableAmount,
                                receivedAmount: cat.receivedAmount,
                                pendingAmount: cat.pendingAmount,
                            });
                        }
                    });
                } else {
                    // No payment record - entire amount is pending
                    totalReceivable = parseFloat(standardMaintenanceAmount || 0);
                    totalPending = parseFloat(standardMaintenanceAmount || 0);
                    
                    if (totalPending > 0) {
                        paymentDetails.push({
                            categoryId: null,
                            categoryName: "Maintenance Fee",
                            receivableAmount: totalReceivable,
                            receivedAmount: 0,
                            pendingAmount: totalPending,
                        });
                    }
                }

                // Only include villas with pending amounts
                if (totalPending > 0) {
                    pendingVillas.push({
                        villaId: villa.id,
                        villaNumber: villa.villaNumber,
                        residentName: villa.residentName,
                        occupancyType: villa.occupancyType,
                        totalReceivable: totalReceivable,
                        totalReceived: totalReceived,
                        totalPending: totalPending,
                        paymentStatus: totalReceived === 0 ? "unpaid" : "partial",
                        paymentDetails: paymentDetails,
                    });
                }
            });

            // Sort by pending amount (highest first)
            pendingVillas.sort((a, b) => b.totalPending - a.totalPending);

            // Calculate summary statistics
            const summary = {
                totalVillasWithPending: pendingVillas.length,
                totalPendingAmount: pendingVillas.reduce(
                    (sum, v) => sum + v.totalPending,
                    0
                ),
                totalReceivableAmount: pendingVillas.reduce(
                    (sum, v) => sum + v.totalReceivable,
                    0
                ),
                totalReceivedAmount: pendingVillas.reduce(
                    (sum, v) => sum + v.totalReceived,
                    0
                ),
                unpaidVillas: pendingVillas.filter(v => v.paymentStatus === "unpaid").length,
                partialPaidVillas: pendingVillas.filter(v => v.paymentStatus === "partial").length,
            };

            const report = {
                month: reportMonth,
                year: reportYear,
                monthName: new Date(reportYear, reportMonth - 1).toLocaleString(
                    "default",
                    { month: "long" }
                ),
                summary: summary,
                pendingVillas: pendingVillas,
                generatedAt: new Date(),
            };

            res.json({
                success: true,
                data: report,
            });
        } catch (error) {
            console.error("Generate pending payments report error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to generate pending payments report",
                error: error.message,
            });
        }
    }

    // Export pending payments report to Excel
    static async exportPendingPaymentsReport(req, res) {
        try {
            const { month, year } = req.query;
            
            const currentDate = new Date();
            const reportMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
            const reportYear = year ? parseInt(year) : currentDate.getFullYear();

            // Get all active villas
            const allVillas = await VillaModel.getAll({ isActive: true });
            const villaPayments = await PaymentModel.getVillaWisePayments(
                reportMonth,
                reportYear
            );
            const standardMaintenanceAmount =
                await PaymentModel.getStandardMaintenanceAmount(
                    reportMonth,
                    reportYear
                );

            // Build pending payments data (same logic as generate)
            const pendingVillas = [];

            allVillas.forEach((villa) => {
                if (!villa.residentName || villa.occupancyType === "Vacant") {
                    return;
                }

                const villaPaymentData = villaPayments.find(
                    (vp) => vp.villaId === villa.id
                );

                let totalReceivable = 0;
                let totalReceived = 0;
                let totalPending = 0;
                let paymentDetails = [];

                if (villaPaymentData && villaPaymentData.payments) {
                    // Group payments by category
                    const categoryMap = {};
                    
                    villaPaymentData.payments.forEach((payment) => {
                        const catName = payment.categoryName || "Unknown";
                        
                        if (!categoryMap[catName]) {
                            categoryMap[catName] = {
                                categoryName: catName,
                                receivableAmount: 0,
                                receivedAmount: 0,
                                pendingAmount: 0,
                            };
                        }
                        
                        categoryMap[catName].receivableAmount += parseFloat(payment.receivableAmount || 0);
                        categoryMap[catName].receivedAmount += parseFloat(payment.receivedAmount || 0);
                        categoryMap[catName].pendingAmount += parseFloat(payment.receivableAmount || 0) - parseFloat(payment.receivedAmount || 0);
                    });

                    // Calculate totals
                    Object.values(categoryMap).forEach((cat) => {
                        totalReceivable += cat.receivableAmount;
                        totalReceived += cat.receivedAmount;
                        totalPending += cat.pendingAmount;

                        // Only include categories with pending amounts
                        if (cat.pendingAmount > 0) {
                            paymentDetails.push({
                                categoryName: cat.categoryName,
                                receivableAmount: cat.receivableAmount,
                                receivedAmount: cat.receivedAmount,
                                pendingAmount: cat.pendingAmount,
                            });
                        }
                    });
                } else {
                    totalReceivable = parseFloat(standardMaintenanceAmount || 0);
                    totalPending = parseFloat(standardMaintenanceAmount || 0);
                    
                    if (totalPending > 0) {
                        paymentDetails.push({
                            categoryName: "Maintenance Fee",
                            receivableAmount: totalReceivable,
                            receivedAmount: 0,
                            pendingAmount: totalPending,
                        });
                    }
                }

                if (totalPending > 0) {
                    pendingVillas.push({
                        villaNumber: villa.villaNumber,
                        residentName: villa.residentName,
                        occupancyType: villa.occupancyType,
                        totalReceivable: totalReceivable,
                        totalReceived: totalReceived,
                        totalPending: totalPending,
                        paymentStatus: totalReceived === 0 ? "UNPAID" : "PARTIAL",
                        paymentDetails: paymentDetails,
                    });
                }
            });

            pendingVillas.sort((a, b) => b.totalPending - a.totalPending);

            // Create Excel workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Pending Payments");

            const headerStyle = {
                font: { bold: true, size: 12 },
                alignment: { horizontal: "center" },
                fill: {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFE6F3FF" },
                },
                border: {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                },
            };

            const summaryStyle = {
                font: { bold: true, size: 14 },
                alignment: { horizontal: "center" },
                fill: {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFFFCCCC" },
                },
            };

            // Title
            worksheet.mergeCells("A1:G1");
            const monthName = new Date(reportYear, reportMonth - 1).toLocaleString(
                "default",
                { month: "long" }
            );
            worksheet.getCell("A1").value = `Pending Payments Report - ${monthName} ${reportYear}`;
            worksheet.getCell("A1").style = {
                font: { bold: true, size: 16 },
                alignment: { horizontal: "center" },
            };

            // Summary
            worksheet.mergeCells("A3:G3");
            worksheet.getCell("A3").value = "Summary";
            worksheet.getCell("A3").style = summaryStyle;

            const totalPending = pendingVillas.reduce(
                (sum, v) => sum + v.totalPending,
                0
            );
            const totalReceivable = pendingVillas.reduce(
                (sum, v) => sum + v.totalReceivable,
                0
            );
            const totalReceived = pendingVillas.reduce(
                (sum, v) => sum + v.totalReceived,
                0
            );

            worksheet.getCell("A5").value = "Total Villas with Pending:";
            worksheet.getCell("B5").value = pendingVillas.length;
            worksheet.getCell("A6").value = "Total Pending Amount:";
            worksheet.getCell("B6").value = parseFloat(totalPending);
            worksheet.getCell("B6").numFmt = "#,##0.00";
            worksheet.getCell("A7").value = "Total Receivable:";
            worksheet.getCell("B7").value = parseFloat(totalReceivable);
            worksheet.getCell("B7").numFmt = "#,##0.00";
            worksheet.getCell("A8").value = "Total Received:";
            worksheet.getCell("B8").value = parseFloat(totalReceived);
            worksheet.getCell("B8").numFmt = "#,##0.00";

            // Pending Villas Details
            let currentRow = 10;
            worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
            worksheet.getCell(`A${currentRow}`).value = "Villas with Pending Payments";
            worksheet.getCell(`A${currentRow}`).style = summaryStyle;

            currentRow += 2;

            // Headers
            const detailHeaders = [
                "Villa#",
                "Resident Name",
                "Occupancy",
                "Receivable",
                "Received",
                "Pending",
                "Status",
            ];
            detailHeaders.forEach((header, index) => {
                const cell = worksheet.getCell(currentRow, index + 1);
                cell.value = header;
                cell.style = headerStyle;
            });

            currentRow++;

            // Data rows
            pendingVillas.forEach((villa) => {
                worksheet.getCell(currentRow, 1).value = villa.villaNumber;
                worksheet.getCell(currentRow, 2).value = villa.residentName;
                worksheet.getCell(currentRow, 3).value = villa.occupancyType;
                worksheet.getCell(currentRow, 4).value = parseFloat(villa.totalReceivable);
                worksheet.getCell(currentRow, 5).value = parseFloat(villa.totalReceived);
                worksheet.getCell(currentRow, 6).value = parseFloat(villa.totalPending);
                worksheet.getCell(currentRow, 7).value = villa.paymentStatus;

                [4, 5, 6].forEach((col) => {
                    worksheet.getCell(currentRow, col).numFmt = "#,##0.00";
                });

                // Color code status
                const statusCell = worksheet.getCell(currentRow, 7);
                if (villa.paymentStatus === "UNPAID") {
                    statusCell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFFFCCCC" },
                    };
                } else {
                    statusCell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFFFFFCC" },
                    };
                }

                currentRow++;
            });

            // Column widths
            worksheet.columns.forEach((column) => {
                column.width = 15;
            });
            worksheet.getColumn(2).width = 25;

            // Send file
            const filename = `Pending_Payments_${monthName}_${reportYear}.xlsx`;
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error("Export pending payments report error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to export pending payments report",
                error: error.message,
            });
        }
    }
}

export default ReportController;
