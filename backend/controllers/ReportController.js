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
}

export default ReportController;
