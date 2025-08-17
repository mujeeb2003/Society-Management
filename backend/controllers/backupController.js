import { PrismaClient } from "../generated/prisma/index.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

const prisma = new PrismaClient();

export class BackupController {
    // Generate comprehensive data backup in Excel format
    static async generateBackup(req, res) {
        try {
            const { format = "excel" } = req.query;

            // Get all data for backup
            const [villas, payments, expenses, paymentCategories, users] =
                await Promise.all([
                    prisma.villa.findMany({
                        orderBy: { villaNumber: "asc" },
                    }),
                    prisma.payment.findMany({
                        include: {
                            villa: true,
                            category: true,
                        },
                        orderBy: [
                            { paymentYear: "desc" },
                            { paymentMonth: "desc" },
                            { paymentDate: "desc" },
                        ],
                    }),
                    prisma.expense.findMany({
                        orderBy: [
                            { expenseYear: "desc" },
                            { expenseMonth: "desc" },
                            { expenseDate: "desc" },
                        ],
                    }),
                    prisma.paymentCategory.findMany({
                        orderBy: { name: "asc" },
                    }),
                    prisma.user.findMany({
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            createdAt: true,
                        },
                        orderBy: { createdAt: "asc" },
                    }),
                ]);

            if (format === "excel") {
                await BackupController.generateExcelBackup(res, {
                    villas,
                    payments,
                    expenses,
                    paymentCategories,
                    users,
                });
            } else if (format === "pdf") {
                await BackupController.generatePDFBackup(res, {
                    villas,
                    payments,
                    expenses,
                    paymentCategories,
                    users,
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Invalid format. Use "excel" or "pdf"',
                });
            }
        } catch (error) {
            console.error("Backup generation error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to generate backup",
                error: error.message,
            });
        }
    }

    // Generate Excel backup
    static async generateExcelBackup(res, data) {
        const { villas, payments, expenses, paymentCategories, users } = data;

        const workbook = new ExcelJS.Workbook();

        // Set workbook properties
        workbook.creator = "Society Management System";
        workbook.created = new Date();
        workbook.modified = new Date();

        // Header style
        const headerStyle = {
            font: { bold: true, size: 12, color: { argb: "FFFFFF" } },
            alignment: { horizontal: "center", vertical: "middle" },
            fill: {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "366092" },
            },
            border: {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            },
        };

        const dataStyle = {
            border: {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            },
            alignment: { vertical: "middle" },
        };

        // 1. Villas Sheet
        const villasSheet = workbook.addWorksheet("Villas");
        villasSheet.columns = [
            { header: "ID", key: "id", width: 10 },
            { header: "Villa Number", key: "villaNumber", width: 15 },
            { header: "Resident Name", key: "residentName", width: 25 },
            { header: "Occupancy Type", key: "occupancyType", width: 15 },
            { header: "Created At", key: "createdAt", width: 20 },
            { header: "Updated At", key: "updatedAt", width: 20 },
        ];

        // Style headers
        villasSheet.getRow(1).eachCell((cell) => (cell.style = headerStyle));

        // Add villa data
        villas.forEach((villa) => {
            const row = villasSheet.addRow({
                id: villa.id,
                villaNumber: villa.villaNumber,
                residentName: villa.residentName || "N/A",
                occupancyType: villa.occupancyType,
                createdAt: villa.createdAt.toLocaleString(),
                updatedAt: villa.updatedAt.toLocaleString(),
            });
            row.eachCell((cell) => (cell.style = dataStyle));
        });

        // 2. Payments Sheet
        const paymentsSheet = workbook.addWorksheet("Payments");
        paymentsSheet.columns = [
            { header: "Payment ID", key: "id", width: 12 },
            { header: "Villa Number", key: "villaNumber", width: 15 },
            { header: "Resident Name", key: "residentName", width: 25 },
            { header: "Category", key: "category", width: 20 },
            { header: "Receivable Amount", key: "receivableAmount", width: 18 },
            { header: "Received Amount", key: "receivedAmount", width: 18 },
            { header: "Pending Amount", key: "pendingAmount", width: 18 },
            { header: "Payment Date", key: "paymentDate", width: 15 },
            { header: "Month", key: "paymentMonth", width: 10 },
            { header: "Year", key: "paymentYear", width: 10 },
            { header: "Payment Method", key: "paymentMethod", width: 15 },
            { header: "Notes", key: "notes", width: 30 },
        ];

        paymentsSheet.getRow(1).eachCell((cell) => (cell.style = headerStyle));

        payments.forEach((payment) => {
            const receivableAmount = parseFloat(payment.receivableAmount);
            const receivedAmount = parseFloat(payment.receivedAmount);
            const pendingAmount = receivableAmount - receivedAmount;

            const row = paymentsSheet.addRow({
                id: payment.id,
                villaNumber: payment.villa.villaNumber,
                residentName: payment.villa.residentName || "N/A",
                category: payment.category.name,
                receivableAmount: receivableAmount,
                receivedAmount: receivedAmount,
                pendingAmount: pendingAmount,
                paymentDate: payment.paymentDate.toLocaleDateString(),
                paymentMonth: payment.paymentMonth,
                paymentYear: payment.paymentYear,
                paymentMethod: payment.paymentMethod,
                notes: payment.notes || "",
            });
            row.eachCell((cell, colNumber) => {
                cell.style = dataStyle;
                // Format currency columns
                if ([5, 6, 7].includes(colNumber)) {
                    cell.numFmt = "#,##0.00";
                }
            });
        });

        // 3. Expenses Sheet
        const expensesSheet = workbook.addWorksheet("Expenses");
        expensesSheet.columns = [
            { header: "Expense ID", key: "id", width: 12 },
            { header: "Category", key: "category", width: 20 },
            { header: "Description", key: "description", width: 40 },
            { header: "Amount", key: "amount", width: 15 },
            { header: "Expense Date", key: "expenseDate", width: 15 },
            { header: "Month", key: "expenseMonth", width: 10 },
            { header: "Year", key: "expenseYear", width: 10 },
            { header: "Payment Method", key: "paymentMethod", width: 15 },
        ];

        expensesSheet.getRow(1).eachCell((cell) => (cell.style = headerStyle));

        expenses.forEach((expense) => {
            const row = expensesSheet.addRow({
                id: expense.id,
                category: expense.category,
                description: expense.description,
                amount: parseFloat(expense.amount),
                expenseDate: expense.expenseDate.toLocaleDateString(),
                expenseMonth: expense.expenseMonth,
                expenseYear: expense.expenseYear,
                paymentMethod: expense.paymentMethod,
            });
            row.eachCell((cell, colNumber) => {
                cell.style = dataStyle;
                if (colNumber === 4) {
                    // Amount column
                    cell.numFmt = "#,##0.00";
                }
            });
        });

        // 4. Payment Categories Sheet
        const categoriesSheet = workbook.addWorksheet("Payment Categories");
        categoriesSheet.columns = [
            { header: "Category ID", key: "id", width: 12 },
            { header: "Name", key: "name", width: 25 },
            { header: "Description", key: "description", width: 40 },
            { header: "Is Recurring", key: "isRecurring", width: 15 },
            { header: "Created At", key: "createdAt", width: 20 },
        ];

        categoriesSheet
            .getRow(1)
            .eachCell((cell) => (cell.style = headerStyle));

        paymentCategories.forEach((category) => {
            const row = categoriesSheet.addRow({
                id: category.id,
                name: category.name,
                description: category.description || "",
                isRecurring: category.isRecurring ? "Yes" : "No",
                createdAt: category.createdAt.toLocaleString(),
            });
            row.eachCell((cell) => (cell.style = dataStyle));
        });

        // 5. Summary Sheet
        const summarySheet = workbook.addWorksheet("Summary");

        // Calculate summary statistics
        const totalPayments = payments.length;
        const totalExpenses = expenses.length;
        const totalReceived = payments.reduce(
            (sum, p) => sum + parseFloat(p.receivedAmount),
            0
        );
        const totalReceivable = payments.reduce(
            (sum, p) => sum + parseFloat(p.receivableAmount),
            0
        );
        const totalExpenseAmount = expenses.reduce(
            (sum, e) => sum + parseFloat(e.amount),
            0
        );
        const totalPending = totalReceivable - totalReceived;

        summarySheet.mergeCells("A1:D1");
        summarySheet.getCell("A1").value =
            "Society Management System - Data Backup Summary";
        summarySheet.getCell("A1").style = {
            font: { bold: true, size: 16 },
            alignment: { horizontal: "center" },
        };

        const summaryData = [
            ["Generated On:", new Date().toLocaleString()],
            ["Total Villas:", villas.length],
            ["Total Payment Records:", totalPayments],
            ["Total Expense Records:", totalExpenses],
            ["Total Payment Categories:", paymentCategories.length],
            ["Total Users:", users.length],
            ["", ""],
            ["Financial Summary:", ""],
            ["Total Received:", `PKR ${totalReceived.toLocaleString()}`],
            ["Total Receivable:", `PKR ${totalReceivable.toLocaleString()}`],
            ["Total Pending:", `PKR ${totalPending.toLocaleString()}`],
            ["Total Expenses:", `PKR ${totalExpenseAmount.toLocaleString()}`],
            [
                "Net Balance:",
                `PKR ${(totalReceived - totalExpenseAmount).toLocaleString()}`,
            ],
        ];

        summaryData.forEach((rowData, index) => {
            const row = summarySheet.addRow(rowData);
            if (index === 0 || index === 7) {
                row.getCell(1).style = { font: { bold: true } };
            }
        });

        // Set response headers
        const fileName = `society_backup_${
            new Date().toISOString().split("T")[0]
        }.xlsx`;
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
        );

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    }

    // Generate PDF backup (summary format)
    static async generatePDFBackup(res, data) {
        const { villas, payments, expenses, paymentCategories } = data;

        const doc = new PDFDocument({ margin: 40, size: "A4" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="society_backup_${
                new Date().toISOString().split("T")[0]
            }.pdf"`
        );

        doc.pipe(res);

        // Title
        doc.fontSize(18).text("Society Management System - Data Backup", {
            align: "center",
        });
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, {
            align: "center",
        });
        doc.moveDown(2);

        // Summary Statistics
        doc.fontSize(14).text("Summary Statistics", { underline: true });
        doc.moveDown(0.5);

        const totalReceived = payments.reduce(
            (sum, p) => sum + parseFloat(p.receivedAmount),
            0
        );
        const totalReceivable = payments.reduce(
            (sum, p) => sum + parseFloat(p.receivableAmount),
            0
        );
        const totalExpenseAmount = expenses.reduce(
            (sum, e) => sum + parseFloat(e.amount),
            0
        );

        const summaryStats = [
            `Total Villas: ${villas.length}`,
            `Total Payment Records: ${payments.length}`,
            `Total Expense Records: ${expenses.length}`,
            `Total Payment Categories: ${paymentCategories.length}`,
            "",
            "Financial Overview:",
            `Total Received: PKR ${totalReceived.toLocaleString()}`,
            `Total Receivable: PKR ${totalReceivable.toLocaleString()}`,
            `Total Pending: PKR ${(
                totalReceivable - totalReceived
            ).toLocaleString()}`,
            `Total Expenses: PKR ${totalExpenseAmount.toLocaleString()}`,
            `Net Balance: PKR ${(
                totalReceived - totalExpenseAmount
            ).toLocaleString()}`,
        ];

        doc.fontSize(11);
        summaryStats.forEach((stat) => {
            if (stat === "" || stat === "Financial Overview:") {
                doc.moveDown(0.5);
                if (stat === "Financial Overview:") {
                    doc.font("Helvetica-Bold").text(stat);
                    doc.font("Helvetica");
                }
            } else {
                doc.text(stat);
            }
        });

        doc.moveDown(2);

        // Recent Payments Summary
        doc.fontSize(14).text("Recent Payments (Last 10)", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);

        const recentPayments = payments
            .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
            .slice(0, 10);

        recentPayments.forEach((payment) => {
            doc.text(
                `${payment.villa.villaNumber} - ${
                    payment.villa.residentName || "N/A"
                } - ${payment.category.name} - PKR ${parseFloat(
                    payment.receivedAmount
                ).toLocaleString()} (${payment.paymentDate.toLocaleDateString()})`
            );
        });

        doc.moveDown(2);

        // Villa Summary
        doc.fontSize(14).text("Villa Summary", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);

        const occupancyStats = villas.reduce((acc, villa) => {
            acc[villa.occupancyType] = (acc[villa.occupancyType] || 0) + 1;
            return acc;
        }, {});

        Object.entries(occupancyStats).forEach(([type, count]) => {
            doc.text(`${type}: ${count} villas`);
        });

        // Footer
        doc.moveDown(3);
        doc.fontSize(8).text(
            "This backup was generated automatically by the Society Management System.",
            { align: "center" }
        );

        doc.end();
    }

    // Get backup metadata
    static async getBackupInfo(req, res) {
        try {
            const [villaCount, paymentCount, expenseCount, categoryCount] =
                await Promise.all([
                    prisma.villa.count(),
                    prisma.payment.count(),
                    prisma.expense.count(),
                    prisma.paymentCategory.count(),
                ]);

            const latestPayment = await prisma.payment.findFirst({
                orderBy: { createdAt: "desc" },
                include: { villa: true },
            });

            const latestExpense = await prisma.expense.findFirst({
                orderBy: { createdAt: "desc" },
            });

            res.json({
                success: true,
                data: {
                    dataStats: {
                        villas: villaCount,
                        payments: paymentCount,
                        expenses: expenseCount,
                        categories: categoryCount,
                    },
                    lastActivity: {
                        latestPayment: latestPayment
                            ? {
                                  date: latestPayment.createdAt,
                                  villa: latestPayment.villa.villaNumber,
                                  amount: parseFloat(
                                      latestPayment.receivedAmount
                                  ),
                              }
                            : null,
                        latestExpense: latestExpense
                            ? {
                                  date: latestExpense.createdAt,
                                  category: latestExpense.category,
                                  amount: parseFloat(latestExpense.amount),
                              }
                            : null,
                    },
                    availableFormats: ["excel", "pdf"],
                },
            });
        } catch (error) {
            console.error("Backup info error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to retrieve backup information",
                error: error.message,
            });
        }
    }
}
