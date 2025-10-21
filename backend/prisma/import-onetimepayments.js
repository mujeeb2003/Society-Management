import fs from "fs";
import xlsx from "xlsx";
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

async function importOneTimePayments() {
    try {
        console.log("📊 Reading Excel file for one-time payments...");

        const workbook = xlsx.readFile("./prisma/Book1.xlsx");
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

        // console.log(`📋 Found ${data.length} rows in Excel file`);

        // Get payment categories
        const waterConnection5000Category = await prisma.paymentCategory.findFirst({
            where: { name: "Water Connection 5000/-" },
        });
        const waterConnection2000Category = await prisma.paymentCategory.findFirst({
            where: { name: "Water Connection 2000/-" },
        });

        if (!waterConnection5000Category || !waterConnection2000Category) {
            throw new Error(
                "Required payment categories not found. Run seed first."
            );
        }

        const headers = data[0];
        // console.log(`🔍 Headers found: ${headers.join(", ")}`);

        // Find column indices for one-time payments
        const waterConnection5000Index = headers.findIndex(
            (h) => h === "NEW WATER CONNECTION 5000/-"
        );
        const waterConnection2000Index = headers.findIndex(
            (h) => h === "NEW WATER CONNECTION 2000/-"
        );

        // console.log(
        //     `🔍 Column indices - Water Connection 5000: ${waterConnection5000Index}, Water Connection 2000: ${waterConnection2000Index}`
        // );

        let importedCount = 0;
        let skippedCount = 0;

        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const villaNumber = row[1];
            const owner = row[2];
            // console.log(`Processing row ${i+1} - ${JSON.stringify(row)}`);
            if (!villaNumber || !owner || villaNumber === "N/A") {
                skippedCount++;
                continue;
            }

            try {
                // Find villa in database
                const villa = await prisma.villa.findFirst({
                    where: { villaNumber: villaNumber },
                });
                // console.log(`🏠 Processing villa: ${villaNumber} - Owner: ${owner} - ${villa}. waterConnection5000Index - ${waterConnection5000Index}, waterConnection2000Index - ${waterConnection2000Index}`);
                if (!villa) {
                    console.log(`⚠️ Villa not found: ${villaNumber}`);
                    skippedCount++;
                    continue;
                }

                const payments = [];

                // Process Water Connection 5000
                if (waterConnection5000Index !== -1) {
                    const amount = row[waterConnection5000Index];
                    if (amount >= 0) {
                        payments.push({
                            villaId: villa.id,
                            categoryId: waterConnection5000Category.id,
                            receivableAmount: 5000,
                            receivedAmount: Number(amount),
                            paymentDate: new Date("2024-01-01"),
                            paymentMonth: 1,
                            paymentYear: 2024,
                            paymentMethod: "CASH",
                            notes: "Water Connection Payment - Imported from Excel",
                        });
                    }
                }

                // Process Water Connection 2000
                if (waterConnection2000Index !== -1) {
                    const amount = row[waterConnection2000Index];
                    if (amount >= 0) {
                        payments.push({
                            villaId: villa.id,
                            categoryId: waterConnection2000Category.id,
                            receivableAmount: 2000,
                            receivedAmount: Number(amount),
                            paymentDate: new Date("2024-01-01"),
                            paymentMonth: 1,
                            paymentYear: 2024,
                            paymentMethod: "CASH",
                            notes: "Water Connection Payment - Imported from Excel",
                        });
                    }
                }

                // // Process Individual Bill
                // if (individualBillIndex !== -1) {
                //   const amount = row[individualBillIndex];
                //   if (amount && amount !== "N/A" && amount !== 0) {
                //     payments.push({
                //       villaId: villa.id,
                //       categoryId: individualBillCategory.id,
                //       receivableAmount: 8000,
                //       receivedAmount: Number(amount),
                //       paymentDate: new Date('2025-01-01'),
                //       paymentMonth: 1,
                //       paymentYear: 2025,
                //       paymentMethod: 'CASH',
                //       notes: 'Individual Bill Payment - Imported from Excel'
                //     });
                //   }
                // }

                // Insert payments
                console.log(JSON.stringify(payments));
                for (const payment of payments) {
                    await prisma.payment.create({
                        data: payment,
                    });
                    console.log(
                        `✅ Added ${
                            payment.categoryId === waterConnection5000Category.id
                                ? "Water Connection 5000"
                                : "Water Connection 2000"
                        } payment for villa ${villaNumber}: ₹${
                            payment.receivedAmount
                        }`
                    );
                    importedCount++;
                }
            } catch (error) {
                console.error(
                    `❌ Error processing villa ${villaNumber}:`,
                    error.message
                );
                skippedCount++;
            }
        }

        console.log(`\n🎉 One-time payments import completed!`);
        console.log(`   • ✅ Imported: ${importedCount} payments`);
        console.log(`   • ⏭️ Skipped: ${skippedCount} entries`);
    } catch (error) {
        console.error("❌ Error during one-time payments import:", error);
        throw error;
    }
}

// Run the import
importOneTimePayments()
    .then(() => {
        console.log("🏁 One-time payments import finished successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("💥 One-time payments import failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
