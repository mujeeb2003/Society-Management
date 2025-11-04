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

            const allVillas = await VillaModel.getAll({
                isActive: true,
                orderBy: { id: "asc" },
            });

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
            worksheet.getCell("B9").value =
                parseFloat(monthlyBalance.currentBalance) +
                parseFloat(totalCrossMonthPayments);

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

    // Generate villa-wise report (complete history)
    static async generateVillaReport(req, res) {
        try {
            const { villaId } = req.params;
            const { status: statusFilter } = req.query; // 'all', 'paid', 'partial', 'unpaid'

            if (!villaId) {
                return res.status(400).json({
                    success: false,
                    message: "Villa ID is required",
                });
            }

            const villaIdInt = parseInt(villaId);

            const villa = await VillaModel.getById(villaIdInt);
            if (!villa) {
                return res.status(404).json({
                    success: false,
                    message: "Villa not found",
                });
            }

            const payments = await PaymentModel.getByVilla(villaIdInt, {
                // I do not want to select the payment_method column here
                paymentMethod: statusFilter == "unpaid" ? false : true
            });

            const monthlyPayments = {};

            if (payments.length > 0) {
                const firstPaymentDate = payments.reduce(
                    (earliest, p) =>
                        new Date(p.paymentDate) < earliest
                            ? new Date(p.paymentDate)
                            : earliest,
                    new Date(payments[0].paymentDate)
                );

                const startDate = new Date(
                    firstPaymentDate.getFullYear(),
                    firstPaymentDate.getMonth(),
                    1
                );
                const endDate = new Date();

                for (
                    let d = startDate;
                    d <= endDate;
                    d.setMonth(d.getMonth() + 1)
                ) {
                    const year = d.getFullYear();
                    const month = d.getMonth() + 1;
                    const monthKey = `${year}-${String(month).padStart(
                        2,
                        "0"
                    )}`;

                    monthlyPayments[monthKey] = {
                        month: monthKey,
                        monthName: `${d.toLocaleString("default", {
                            month: "long",
                        })} ${year}`,
                        payments: [],
                        totalReceivable: 0,
                        totalReceived: 0,
                        totalPending: 0,
                    };
                }
            }

            let standardReceivableAmount = 0;
            if (payments.length > 0) {
                const recurringPayments = payments.filter(
                    (p) => p.category?.isRecurring
                );
                if (recurringPayments.length > 0) {
                    standardReceivableAmount = parseFloat(
                        recurringPayments[0].receivableAmount
                    );
                }
            }

            payments.forEach((payment) => {
                const monthKey = `${payment.paymentYear}-${String(
                    payment.paymentMonth
                ).padStart(2, "0")}`;
                if (monthlyPayments[monthKey]) {
                    monthlyPayments[monthKey].payments.push({
                        id: payment.id,
                        categoryName: payment.category?.name || "Unknown",
                        receivableAmount: parseFloat(payment.receivableAmount),
                        receivedAmount: parseFloat(payment.receivedAmount),
                        pendingAmount: parseFloat(payment.pendingAmount),
                        paymentDate: payment.paymentDate,
                        paymentMethod: payment?.paymentMethod || "N/A",
                        paymentStatus: payment.paymentStatus,
                        notes: payment.notes,
                    });
                }
            });

            Object.keys(monthlyPayments).forEach((monthKey) => {
                const monthData = monthlyPayments[monthKey];
                if (monthData.payments.length === 0) {
                    if (standardReceivableAmount > 0) {
                        monthData.totalReceivable = standardReceivableAmount;
                        monthData.totalPending = standardReceivableAmount;
                    }
                } else {
                    monthData.totalReceivable = monthData.payments.reduce(
                        (sum, p) => sum + p.receivableAmount,
                        0
                    );
                    monthData.totalReceived = monthData.payments.reduce(
                        (sum, p) => sum + p.receivedAmount,
                        0
                    );
                    monthData.totalPending = monthData.payments.reduce(
                        (sum, p) => sum + p.pendingAmount,
                        0
                    );
                }
            });

            let finalMonthlyPayments = Object.values(monthlyPayments);

            // Apply status filter if provided
            if (statusFilter && statusFilter !== "all") {
                finalMonthlyPayments = finalMonthlyPayments
                    .map((monthData) => {
                        const filteredPayments = monthData.payments.filter(
                            (p) => p.paymentStatus === statusFilter
                        );

                        // If filtering for 'unpaid', also include months with no payment records but with a receivable amount
                        if (
                            statusFilter === "unpaid" &&
                            monthData.payments.length === 0 &&
                            monthData.totalReceivable > 0
                        ) {
                            return monthData;
                        }

                        return {
                            ...monthData,
                            payments: filteredPayments,
                        };
                    })
                    .filter(
                        (monthData) =>
                            monthData.payments.length > 0 ||
                            (statusFilter === "unpaid" &&
                                monthData.totalPending > 0 &&
                                monthData.payments.length === 0)
                    );
            }

            const overallTotals = {
                totalReceivable: 0,
                totalReceived: 0,
                totalPending: 0,
                totalPayments: 0,
            };

            finalMonthlyPayments.forEach((month) => {
                if (statusFilter && statusFilter !== "all") {
                    const monthReceivable = month.payments.reduce(
                        (sum, p) => sum + p.receivableAmount,
                        0
                    );
                    const monthReceived = month.payments.reduce(
                        (sum, p) => sum + p.receivedAmount,
                        0
                    );

                    overallTotals.totalReceivable += monthReceivable;
                    overallTotals.totalReceived += monthReceived;
                    overallTotals.totalPayments += month.payments.length;

                    if (
                        statusFilter === "unpaid" &&
                        month.payments.length === 0
                    ) {
                        overallTotals.totalReceivable += month.totalReceivable;
                    }
                } else {
                    overallTotals.totalReceivable += month.totalReceivable;
                    overallTotals.totalReceived += month.totalReceived;
                    overallTotals.totalPayments +=
                        month.payments.length > 0
                            ? month.payments.length
                            : month.totalReceivable > 0
                            ? 1
                            : 0;
                }
            });
            overallTotals.totalPending =
                overallTotals.totalReceivable - overallTotals.totalReceived;

            const paymentStats = {
                paidMonths: 0,
                partialMonths: 0,
                unpaidMonths: 0,
            };

            Object.values(monthlyPayments).forEach((month) => {
                if (month.totalReceivable > 0) {
                    if (month.totalPending <= 0) {
                        paymentStats.paidMonths++;
                    } else if (month.totalReceived > 0) {
                        paymentStats.partialMonths++;
                    } else {
                        paymentStats.unpaidMonths++;
                    }
                }
            });

            const report = {
                villa: {
                    id: villa.id,
                    villaNumber: villa.villaNumber,
                    residentName: villa.residentName,
                    occupancyType: villa.occupancyType,
                },
                monthlyPayments: finalMonthlyPayments.sort((a, b) =>
                    a.month.localeCompare(b.month)
                ),
                yearlyTotals: overallTotals,
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
            const { villaId } = req.params;
            const { status: statusFilter } = req.query;

            if (!villaId) {
                return res.status(400).json({
                    success: false,
                    message: "Villa ID is required",
                });
            }

            const villaIdInt = parseInt(villaId);
            const villa = await VillaModel.getById(villaIdInt);
            if (!villa) {
                return res.status(404).json({
                    success: false,
                    message: "Villa not found",
                });
            }

            const payments = await PaymentModel.getByVilla(villaIdInt, {});

            const monthlyGroups = {};

            if (payments.length > 0) {
                const firstPaymentDate = payments.reduce(
                    (earliest, p) =>
                        new Date(p.paymentDate) < earliest
                            ? new Date(p.paymentDate)
                            : earliest,
                    new Date(payments[0].paymentDate)
                );

                const startDate = new Date(
                    firstPaymentDate.getFullYear(),
                    firstPaymentDate.getMonth(),
                    1
                );
                const endDate = new Date();

                for (
                    let d = startDate;
                    d <= endDate;
                    d.setMonth(d.getMonth() + 1)
                ) {
                    const year = d.getFullYear();
                    const month = d.getMonth() + 1;
                    const monthKey = `${year}-${String(month).padStart(
                        2,
                        "0"
                    )}`;
                    monthlyGroups[monthKey] = [];
                }
            }

            payments.forEach((payment) => {
                const monthKey = `${payment.paymentYear}-${String(
                    payment.paymentMonth
                ).padStart(2, "0")}`;
                if (monthlyGroups[monthKey]) {
                    monthlyGroups[monthKey].push(payment);
                }
            });

            let standardReceivableAmount = 0;
            if (payments.length > 0) {
                const recurringPayments = payments.filter(
                    (p) => p.category?.isRecurring
                );
                if (recurringPayments.length > 0) {
                    standardReceivableAmount = parseFloat(
                        recurringPayments[0].receivableAmount
                    );
                }
            }
            if (standardReceivableAmount === 0) {
                const recurringCategories =
                    await prisma.paymentCategory.findMany({
                        where: { isRecurring: true, isActive: true },
                    });
                standardReceivableAmount = recurringCategories.reduce(
                    (sum, cat) => sum + parseFloat(cat.defaultAmount || 0),
                    0
                );
            }

            Object.keys(monthlyGroups).forEach((monthKey) => {
                if (
                    monthlyGroups[monthKey].length === 0 &&
                    standardReceivableAmount > 0
                ) {
                    const [year, month] = monthKey.split("-").map(Number);
                    monthlyGroups[monthKey].push({
                        id: 0,
                        paymentMonth: month,
                        paymentYear: year,
                        category: { name: "Maintenance Fee" },
                        receivableAmount: standardReceivableAmount,
                        receivedAmount: 0,
                        pendingAmount: standardReceivableAmount,
                        paymentDate: new Date(year, month - 1, 1),
                        paymentMethod: "N/A",
                        paymentStatus: "unpaid",
                    });
                }
            });

            let finalMonthlyGroups = monthlyGroups;
            if (statusFilter && statusFilter !== "all") {
                finalMonthlyGroups = {};
                for (const monthKey in monthlyGroups) {
                    const filteredPayments = monthlyGroups[monthKey].filter(
                        (p) => p.paymentStatus === statusFilter
                    );
                    if (filteredPayments.length > 0) {
                        finalMonthlyGroups[monthKey] = filteredPayments;
                    } else if (
                        statusFilter === "unpaid" &&
                        monthlyGroups[monthKey].every(
                            (p) => p.receivedAmount === 0
                        )
                    ) {
                        finalMonthlyGroups[monthKey] = monthlyGroups[monthKey];
                    }
                }
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Villa Report");

            // Styles
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
            } - Complete Payment Report (${statusFilter || "All"})`;
            worksheet.getCell("A1").style = {
                font: { bold: true, size: 16 },
                alignment: { horizontal: "center" },
            };

            // Villa Info
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

            // Overall Summary
            worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
            worksheet.getCell(`A${currentRow}`).value = "Overall Summary";
            worksheet.getCell(`A${currentRow}`).style = summaryStyle;
            currentRow += 2;

            const overallTotals = {
                totalReceivable: 0,
                totalReceived: 0,
                totalPending: 0,
            };
            Object.values(finalMonthlyGroups)
                .flat()
                .forEach((p) => {
                    overallTotals.totalReceivable += parseFloat(
                        p.receivableAmount
                    );
                    overallTotals.totalReceived += parseFloat(p.receivedAmount);
                    overallTotals.totalPending += parseFloat(p.pendingAmount);
                });

            worksheet.getCell(`A${currentRow}`).value = "Total Receivable:";
            worksheet.getCell(`B${currentRow}`).value =
                overallTotals.totalReceivable;
            worksheet.getCell(`A${currentRow + 1}`).value = "Total Received:";
            worksheet.getCell(`B${currentRow + 1}`).value =
                overallTotals.totalReceived;
            worksheet.getCell(`A${currentRow + 2}`).value = "Total Pending:";
            worksheet.getCell(`B${currentRow + 2}`).value =
                overallTotals.totalPending;
            [...Array(3).keys()].forEach(
                (i) =>
                    (worksheet.getCell(`B${currentRow + i}`).numFmt =
                        "#,##0.00")
            );

            currentRow += 4;

            // Monthly Details
            worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
            worksheet.getCell(`A${currentRow}`).value =
                "Monthly Payment Details";
            worksheet.getCell(`A${currentRow}`).style = summaryStyle;
            currentRow += 1;

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
            const headerRow = worksheet.getRow(currentRow);
            detailHeaders.forEach((header, index) => {
                const cell = headerRow.getCell(index + 1);
                cell.value = header;
                cell.style = headerStyle;
            });
            currentRow++;

            const sortedMonths = Object.keys(finalMonthlyGroups).sort();

            sortedMonths.forEach((monthKey) => {
                const monthPayments = finalMonthlyGroups[monthKey];
                const [year, month] = monthKey.split("-").map(Number);
                const monthName =
                    new Date(year, month - 1).toLocaleString("default", {
                        month: "long",
                    }) + ` ${year}`;

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
                    [3, 4, 5].forEach(
                        (col) =>
                            (worksheet.getCell(currentRow, col).numFmt =
                                "#,##0.00")
                    );
                    currentRow++;
                });

                const monthTotal = {
                    receivable: monthPayments.reduce(
                        (s, p) => s + parseFloat(p.receivableAmount),
                        0
                    ),
                    received: monthPayments.reduce(
                        (s, p) => s + parseFloat(p.receivedAmount),
                        0
                    ),
                    pending: monthPayments.reduce(
                        (s, p) => s + parseFloat(p.pendingAmount),
                        0
                    ),
                };

                worksheet.getCell(currentRow, 2).value = `Total:`;
                worksheet.getCell(currentRow, 2).style = {
                    font: { bold: true },
                };
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

            worksheet.columns.forEach((c) => {
                c.width = 18;
            });
            worksheet.getColumn(2).width = 25;

            const filename = `Villa_${villa.villaNumber}_Complete_Report.xlsx`;
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

            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1;
            const currentYear = currentDate.getFullYear();

            // Determine if this is "All Time" or specific month/year report
            const isAllTime = !month || !year;

            // Get all active villas
            const allVillas = await VillaModel.getAll({
                isActive: true,
                orderBy: { id: "asc" },
            });

            let pendingVillas = [];
            let reportMonth, reportYear, monthName;

            if (isAllTime) {
                // ALL TIME REPORT: From first payment to current month

                // Get the earliest payment date across all payments
                const allPayments = await PaymentModel.getAll({});

                if (allPayments.length === 0) {
                    return res.json({
                        success: true,
                        data: {
                            month: null,
                            year: null,
                            monthName: "All Time",
                            summary: {
                                totalVillasWithPending: 0,
                                totalPendingAmount: 0,
                                totalReceivableAmount: 0,
                                totalReceivedAmount: 0,
                                unpaidVillas: 0,
                                partialPaidVillas: 0,
                            },
                            pendingVillas: [],
                            generatedAt: new Date(),
                        },
                    });
                }

                // Find earliest payment
                const earliestPayment = allPayments.reduce(
                    (earliest, payment) => {
                        if (!earliest) return payment;
                        const earliestDate = new Date(
                            earliest.paymentYear,
                            earliest.paymentMonth - 1
                        );
                        const currentPaymentDate = new Date(
                            payment.paymentYear,
                            payment.paymentMonth - 1
                        );
                        return currentPaymentDate < earliestDate
                            ? payment
                            : earliest;
                    },
                    null
                );

                const startMonth = earliestPayment.paymentMonth;
                const startYear = earliestPayment.paymentYear;

                reportMonth = null;
                reportYear = null;
                monthName = "All Time";

                // Build a map of villa pending amounts across all months
                const villaMap = {};

                // Initialize villa map
                allVillas.forEach((villa) => {
                    if (
                        villa.residentName &&
                        villa.occupancyType !== "Vacant"
                    ) {
                        villaMap[villa.id] = {
                            villaId: villa.id,
                            villaNumber: villa.villaNumber,
                            residentName: villa.residentName,
                            occupancyType: villa.occupancyType,
                            totalReceivable: 0,
                            totalReceived: 0,
                            totalPending: 0,
                            paymentDetails: {},
                            monthlyBreakdown: {}, // Track month-by-month
                        };
                    }
                });

                // Iterate through each month from start to current
                let checkMonth = startMonth;
                let checkYear = startYear;

                while (
                    checkYear < currentYear ||
                    (checkYear === currentYear && checkMonth <= currentMonth)
                ) {
                    // Get payments for this month
                    const monthPayments =
                        await PaymentModel.getVillaWisePayments(
                            checkMonth,
                            checkYear
                        );

                    // Get standard maintenance amount for this month
                    const standardAmount =
                        await PaymentModel.getStandardMaintenanceAmount(
                            checkMonth,
                            checkYear
                        );

                    // Process each villa
                    for (const villaId in villaMap) {
                        const villa = villaMap[villaId];
                        const villaPaymentData = monthPayments.find(
                            (vp) => vp.villaId === parseInt(villaId)
                        );

                        // Create month key for breakdown
                        const monthKey = `${checkYear}-${String(
                            checkMonth
                        ).padStart(2, "0")}`;

                        if (villaPaymentData && villaPaymentData.payments) {
                            // Villa has payment records for this month
                            const monthData = {
                                month: checkMonth,
                                year: checkYear,
                                monthName: new Date(
                                    checkYear,
                                    checkMonth - 1
                                ).toLocaleString("default", { month: "long" }),
                                totalReceivable: 0,
                                totalReceived: 0,
                                totalPending: 0,
                                categories: {},
                            };

                            villaPaymentData.payments.forEach((payment) => {
                                const catName =
                                    payment.categoryName || "Maintenance Fee";

                                if (!villa.paymentDetails[catName]) {
                                    villa.paymentDetails[catName] = {
                                        categoryName: catName,
                                        receivableAmount: 0,
                                        receivedAmount: 0,
                                        pendingAmount: 0,
                                    };
                                }

                                const receivable = parseFloat(
                                    payment.receivableAmount || 0
                                );
                                const received = parseFloat(
                                    payment.receivedAmount || 0
                                );
                                const pending = receivable - received;

                                villa.paymentDetails[
                                    catName
                                ].receivableAmount += receivable;
                                villa.paymentDetails[catName].receivedAmount +=
                                    received;
                                villa.paymentDetails[catName].pendingAmount +=
                                    pending;

                                villa.totalReceivable += receivable;
                                villa.totalReceived += received;
                                villa.totalPending += pending;

                                // Track monthly breakdown
                                monthData.totalReceivable += receivable;
                                monthData.totalReceived += received;
                                monthData.totalPending += pending;

                                if (!monthData.categories[catName]) {
                                    monthData.categories[catName] = {
                                        categoryName: catName,
                                        receivableAmount: 0,
                                        receivedAmount: 0,
                                        pendingAmount: 0,
                                    };
                                }
                                monthData.categories[
                                    catName
                                ].receivableAmount += receivable;
                                monthData.categories[catName].receivedAmount +=
                                    received;
                                monthData.categories[catName].pendingAmount +=
                                    pending;
                            });

                            // Only add month if there's pending
                            if (monthData.totalPending > 0) {
                                villa.monthlyBreakdown[monthKey] = monthData;
                            }
                        } else {
                            // No payment record - infer pending from standard amount
                            const inferredAmount = parseFloat(
                                standardAmount || 0
                            );

                            if (inferredAmount > 0) {
                                const catName = "Maintenance Fee";

                                if (!villa.paymentDetails[catName]) {
                                    villa.paymentDetails[catName] = {
                                        categoryName: catName,
                                        receivableAmount: 0,
                                        receivedAmount: 0,
                                        pendingAmount: 0,
                                    };
                                }

                                villa.paymentDetails[
                                    catName
                                ].receivableAmount += inferredAmount;
                                villa.paymentDetails[catName].pendingAmount +=
                                    inferredAmount;

                                villa.totalReceivable += inferredAmount;
                                villa.totalPending += inferredAmount;

                                // Track monthly breakdown for inferred payments
                                const monthKey = `${checkYear}-${String(
                                    checkMonth
                                ).padStart(2, "0")}`;
                                villa.monthlyBreakdown[monthKey] = {
                                    month: checkMonth,
                                    year: checkYear,
                                    monthName: new Date(
                                        checkYear,
                                        checkMonth - 1
                                    ).toLocaleString("default", {
                                        month: "long",
                                    }),
                                    totalReceivable: inferredAmount,
                                    totalReceived: 0,
                                    totalPending: inferredAmount,
                                    categories: {
                                        [catName]: {
                                            categoryName: catName,
                                            receivableAmount: inferredAmount,
                                            receivedAmount: 0,
                                            pendingAmount: inferredAmount,
                                        },
                                    },
                                };
                            }
                        }
                    }

                    // Move to next month
                    checkMonth++;
                    if (checkMonth > 12) {
                        checkMonth = 1;
                        checkYear++;
                    }
                }

                // Convert villaMap to array and filter only villas with pending amounts
                pendingVillas = Object.values(villaMap)
                    .filter((villa) => villa.totalPending > 0)
                    .map((villa) => ({
                        villaId: villa.villaId,
                        villaNumber: villa.villaNumber,
                        residentName: villa.residentName,
                        occupancyType: villa.occupancyType,
                        totalReceivable: villa.totalReceivable,
                        totalReceived: villa.totalReceived,
                        totalPending: villa.totalPending,
                        paymentStatus:
                            villa.totalReceived === 0 ? "unpaid" : "partial",
                        paymentDetails: Object.values(villa.paymentDetails)
                            .filter((detail) => detail.pendingAmount > 0)
                            .map((detail) => ({
                                categoryId: null,
                                categoryName: detail.categoryName,
                                receivableAmount: detail.receivableAmount,
                                receivedAmount: detail.receivedAmount,
                                pendingAmount: detail.pendingAmount,
                            })),
                        monthlyBreakdown: Object.values(villa.monthlyBreakdown)
                            .sort((a, b) => {
                                // Sort by year, then month
                                if (a.year !== b.year) return a.year - b.year;
                                return a.month - b.month;
                            })
                            .map((month) => ({
                                month: month.month,
                                year: month.year,
                                monthName: month.monthName,
                                totalReceivable: month.totalReceivable,
                                totalReceived: month.totalReceived,
                                totalPending: month.totalPending,
                                categories: Object.values(month.categories),
                            })),
                    }));
            } else {
                // SPECIFIC MONTH/YEAR REPORT (existing logic)
                reportMonth = parseInt(month);
                reportYear = parseInt(year);
                monthName = new Date(
                    reportYear,
                    reportMonth - 1
                ).toLocaleString("default", { month: "long" });

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
                pendingVillas = [];

                allVillas.forEach((villa) => {
                    // Skip vacant villas
                    if (
                        !villa.residentName ||
                        villa.occupancyType === "Vacant"
                    ) {
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

                            categoryMap[catName].receivableAmount += parseFloat(
                                payment.receivableAmount || 0
                            );
                            categoryMap[catName].receivedAmount += parseFloat(
                                payment.receivedAmount || 0
                            );
                            categoryMap[catName].pendingAmount +=
                                parseFloat(payment.receivableAmount || 0) -
                                parseFloat(payment.receivedAmount || 0);
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
                        totalReceivable = parseFloat(
                            standardMaintenanceAmount || 0
                        );
                        totalPending = parseFloat(
                            standardMaintenanceAmount || 0
                        );

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
                            paymentStatus:
                                totalReceived === 0 ? "unpaid" : "partial",
                            paymentDetails: paymentDetails,
                        });
                    }
                });
            }

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
                unpaidVillas: pendingVillas.filter(
                    (v) => v.paymentStatus === "unpaid"
                ).length,
                partialPaidVillas: pendingVillas.filter(
                    (v) => v.paymentStatus === "partial"
                ).length,
            };

            const report = {
                month: reportMonth,
                year: reportYear,
                monthName: monthName,
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
            const currentMonth = currentDate.getMonth() + 1;
            const currentYear = currentDate.getFullYear();

            // Determine if this is "All Time" or specific month/year report
            const isAllTime = !month || !year;

            // Get all active villas
            const allVillas = await VillaModel.getAll({ isActive: true });

            let pendingVillas = [];
            let reportMonth, reportYear, monthName;

            if (isAllTime) {
                // ALL TIME EXPORT

                const allPayments = await PaymentModel.getAll({});

                if (allPayments.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "No payment records found",
                    });
                }

                // Find earliest payment
                const earliestPayment = allPayments.reduce(
                    (earliest, payment) => {
                        if (!earliest) return payment;
                        const earliestDate = new Date(
                            earliest.paymentYear,
                            earliest.paymentMonth - 1
                        );
                        const currentPaymentDate = new Date(
                            payment.paymentYear,
                            payment.paymentMonth - 1
                        );
                        return currentPaymentDate < earliestDate
                            ? payment
                            : earliest;
                    },
                    null
                );

                const startMonth = earliestPayment.paymentMonth;
                const startYear = earliestPayment.paymentYear;

                reportMonth = null;
                reportYear = null;
                monthName = "All Time";

                // Build a map of villa pending amounts across all months
                const villaMap = {};

                // Initialize villa map
                allVillas.forEach((villa) => {
                    if (
                        villa.residentName &&
                        villa.occupancyType !== "Vacant"
                    ) {
                        villaMap[villa.id] = {
                            villaNumber: villa.villaNumber,
                            residentName: villa.residentName,
                            occupancyType: villa.occupancyType,
                            totalReceivable: 0,
                            totalReceived: 0,
                            totalPending: 0,
                            paymentDetails: {},
                            monthlyBreakdown: {}, // Track month-by-month for Excel
                        };
                    }
                });

                // Iterate through each month from start to current
                let checkMonth = startMonth;
                let checkYear = startYear;

                while (
                    checkYear < currentYear ||
                    (checkYear === currentYear && checkMonth <= currentMonth)
                ) {
                    const monthPayments =
                        await PaymentModel.getVillaWisePayments(
                            checkMonth,
                            checkYear
                        );

                    const standardAmount =
                        await PaymentModel.getStandardMaintenanceAmount(
                            checkMonth,
                            checkYear
                        );

                    for (const villaId in villaMap) {
                        const villa = villaMap[villaId];
                        const villaPaymentData = monthPayments.find(
                            (vp) => vp.villaId === parseInt(villaId)
                        );

                        const monthKey = `${checkYear}-${String(
                            checkMonth
                        ).padStart(2, "0")}`;

                        if (villaPaymentData && villaPaymentData.payments) {
                            const monthData = {
                                month: checkMonth,
                                year: checkYear,
                                monthName: new Date(
                                    checkYear,
                                    checkMonth - 1
                                ).toLocaleString("default", { month: "long" }),
                                totalReceivable: 0,
                                totalReceived: 0,
                                totalPending: 0,
                                categories: {},
                            };

                            villaPaymentData.payments.forEach((payment) => {
                                const catName =
                                    payment.categoryName || "Maintenance Fee";

                                if (!villa.paymentDetails[catName]) {
                                    villa.paymentDetails[catName] = {
                                        categoryName: catName,
                                        receivableAmount: 0,
                                        receivedAmount: 0,
                                        pendingAmount: 0,
                                    };
                                }

                                const receivable = parseFloat(
                                    payment.receivableAmount || 0
                                );
                                const received = parseFloat(
                                    payment.receivedAmount || 0
                                );
                                const pending = receivable - received;

                                villa.paymentDetails[
                                    catName
                                ].receivableAmount += receivable;
                                villa.paymentDetails[catName].receivedAmount +=
                                    received;
                                villa.paymentDetails[catName].pendingAmount +=
                                    pending;

                                villa.totalReceivable += receivable;
                                villa.totalReceived += received;
                                villa.totalPending += pending;

                                // Track monthly
                                monthData.totalReceivable += receivable;
                                monthData.totalReceived += received;
                                monthData.totalPending += pending;

                                if (!monthData.categories[catName]) {
                                    monthData.categories[catName] = {
                                        categoryName: catName,
                                        receivableAmount: 0,
                                        receivedAmount: 0,
                                        pendingAmount: 0,
                                    };
                                }
                                monthData.categories[
                                    catName
                                ].receivableAmount += receivable;
                                monthData.categories[catName].receivedAmount +=
                                    received;
                                monthData.categories[catName].pendingAmount +=
                                    pending;
                            });

                            if (monthData.totalPending > 0) {
                                villa.monthlyBreakdown[monthKey] = monthData;
                            }
                        } else {
                            const inferredAmount = parseFloat(
                                standardAmount || 0
                            );

                            if (inferredAmount > 0) {
                                const catName = "Maintenance Fee";

                                if (!villa.paymentDetails[catName]) {
                                    villa.paymentDetails[catName] = {
                                        categoryName: catName,
                                        receivableAmount: 0,
                                        receivedAmount: 0,
                                        pendingAmount: 0,
                                    };
                                }

                                villa.paymentDetails[
                                    catName
                                ].receivableAmount += inferredAmount;
                                villa.paymentDetails[catName].pendingAmount +=
                                    inferredAmount;

                                villa.totalReceivable += inferredAmount;
                                villa.totalPending += inferredAmount;

                                // Track monthly breakdown
                                const monthKey = `${checkYear}-${String(
                                    checkMonth
                                ).padStart(2, "0")}`;
                                villa.monthlyBreakdown[monthKey] = {
                                    month: checkMonth,
                                    year: checkYear,
                                    monthName: new Date(
                                        checkYear,
                                        checkMonth - 1
                                    ).toLocaleString("default", {
                                        month: "long",
                                    }),
                                    totalReceivable: inferredAmount,
                                    totalReceived: 0,
                                    totalPending: inferredAmount,
                                    categories: {
                                        [catName]: {
                                            categoryName: catName,
                                            receivableAmount: inferredAmount,
                                            receivedAmount: 0,
                                            pendingAmount: inferredAmount,
                                        },
                                    },
                                };
                            }
                        }
                    }

                    checkMonth++;
                    if (checkMonth > 12) {
                        checkMonth = 1;
                        checkYear++;
                    }
                }

                // Convert to array format for Excel
                pendingVillas = Object.values(villaMap)
                    .filter((villa) => villa.totalPending > 0)
                    .map((villa) => ({
                        villaNumber: villa.villaNumber,
                        residentName: villa.residentName,
                        occupancyType: villa.occupancyType,
                        totalReceivable: villa.totalReceivable,
                        totalReceived: villa.totalReceived,
                        totalPending: villa.totalPending,
                        paymentStatus:
                            villa.totalReceived === 0 ? "UNPAID" : "PARTIAL",
                        paymentDetails: Object.values(
                            villa.paymentDetails
                        ).filter((detail) => detail.pendingAmount > 0),
                        monthlyBreakdown: Object.values(
                            villa.monthlyBreakdown
                        ).sort((a, b) => {
                            if (a.year !== b.year) return a.year - b.year;
                            return a.month - b.month;
                        }),
                    }));
            } else {
                // SPECIFIC MONTH/YEAR EXPORT
                reportMonth = parseInt(month);
                reportYear = parseInt(year);
                monthName = new Date(
                    reportYear,
                    reportMonth - 1
                ).toLocaleString("default", { month: "long" });

                const villaPayments = await PaymentModel.getVillaWisePayments(
                    reportMonth,
                    reportYear
                );
                const standardMaintenanceAmount =
                    await PaymentModel.getStandardMaintenanceAmount(
                        reportMonth,
                        reportYear
                    );

                // Build pending payments data
                pendingVillas = [];

                allVillas.forEach((villa) => {
                    if (
                        !villa.residentName ||
                        villa.occupancyType === "Vacant"
                    ) {
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

                            categoryMap[catName].receivableAmount += parseFloat(
                                payment.receivableAmount || 0
                            );
                            categoryMap[catName].receivedAmount += parseFloat(
                                payment.receivedAmount || 0
                            );
                            categoryMap[catName].pendingAmount +=
                                parseFloat(payment.receivableAmount || 0) -
                                parseFloat(payment.receivedAmount || 0);
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
                        totalReceivable = parseFloat(
                            standardMaintenanceAmount || 0
                        );
                        totalPending = parseFloat(
                            standardMaintenanceAmount || 0
                        );

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
                            paymentStatus:
                                totalReceived === 0 ? "UNPAID" : "PARTIAL",
                            paymentDetails: paymentDetails,
                        });
                    }
                });
            }

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
            worksheet.getCell(
                "A1"
            ).value = `Pending Payments Report - ${monthName}`;
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
            worksheet.getCell(`A${currentRow}`).value =
                "Villas with Pending Payments";
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
                worksheet.getCell(currentRow, 4).value = parseFloat(
                    villa.totalReceivable
                );
                worksheet.getCell(currentRow, 5).value = parseFloat(
                    villa.totalReceived
                );
                worksheet.getCell(currentRow, 6).value = parseFloat(
                    villa.totalPending
                );
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

            // Add monthly breakdown section for All Time report
            if (
                !reportMonth &&
                !reportYear &&
                pendingVillas.some(
                    (v) => v.monthlyBreakdown && v.monthlyBreakdown.length > 0
                )
            ) {
                currentRow += 2;
                worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
                worksheet.getCell(`A${currentRow}`).value = "Monthly Breakdown";
                worksheet.getCell(`A${currentRow}`).style = summaryStyle;
                currentRow += 2;

                pendingVillas.forEach((villa) => {
                    if (
                        villa.monthlyBreakdown &&
                        villa.monthlyBreakdown.length > 0
                    ) {
                        // Villa header
                        worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
                        worksheet.getCell(
                            `A${currentRow}`
                        ).value = `Villa ${villa.villaNumber} - ${villa.residentName}`;
                        worksheet.getCell(`A${currentRow}`).style = {
                            font: { bold: true, size: 11 },
                            fill: {
                                type: "pattern",
                                pattern: "solid",
                                fgColor: { argb: "FFE6E6FA" },
                            },
                        };
                        currentRow++;

                        // Month headers
                        const monthHeaders = [
                            "Month",
                            "Year",
                            "Category",
                            "Receivable",
                            "Received",
                            "Pending",
                        ];
                        monthHeaders.forEach((header, index) => {
                            const cell = worksheet.getCell(
                                currentRow,
                                index + 1
                            );
                            cell.value = header;
                            cell.style = {
                                font: { bold: true, size: 10 },
                                alignment: { horizontal: "center" },
                                fill: {
                                    type: "pattern",
                                    pattern: "solid",
                                    fgColor: { argb: "FFF0F0F0" },
                                },
                                border: {
                                    top: { style: "thin" },
                                    left: { style: "thin" },
                                    bottom: { style: "thin" },
                                    right: { style: "thin" },
                                },
                            };
                        });
                        currentRow++;

                        // Monthly data
                        villa.monthlyBreakdown.forEach((month) => {
                            // Convert categories object to array if needed
                            const categoriesArray = Array.isArray(
                                month.categories
                            )
                                ? month.categories
                                : Object.values(month.categories);

                            categoriesArray.forEach((category, catIndex) => {
                                if (catIndex === 0) {
                                    worksheet.getCell(currentRow, 1).value =
                                        month.monthName;
                                    worksheet.getCell(currentRow, 2).value =
                                        month.year;
                                }
                                worksheet.getCell(currentRow, 3).value =
                                    category.categoryName;
                                worksheet.getCell(currentRow, 4).value =
                                    parseFloat(category.receivableAmount);
                                worksheet.getCell(currentRow, 5).value =
                                    parseFloat(category.receivedAmount);
                                worksheet.getCell(currentRow, 6).value =
                                    parseFloat(category.pendingAmount);

                                [4, 5, 6].forEach((col) => {
                                    worksheet.getCell(currentRow, col).numFmt =
                                        "#,##0.00";
                                });

                                currentRow++;
                            });
                        });

                        currentRow++; // Extra space between villas
                    }
                });
            }

            // Column widths
            worksheet.columns.forEach((column) => {
                column.width = 15;
            });
            worksheet.getColumn(2).width = 25;

            // Send file
            const filename =
                reportMonth && reportYear
                    ? `Pending_Payments_${monthName}_${reportYear}.xlsx`
                    : `Pending_Payments_All_Time.xlsx`;
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=${filename}`
            );

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
