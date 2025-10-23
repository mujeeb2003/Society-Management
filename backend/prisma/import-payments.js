// import fs from "fs";
// import xlsx from "xlsx";
// import { PrismaClient } from "../generated/prisma/index.js";

// const prisma = new PrismaClient();

// function getMonthNumber(monthName) {
//     const months = {
//         jan: 1,
//         feb: 2,
//         mar: 3,
//         apr: 4,
//         may: 5,
//         jun: 6,
//         jul: 7,
//         aug: 8,
//         sep: 9,
//         oct: 10,
//         nov: 11,
//         dec: 12,
//     };
//     return months[monthName.toLowerCase()];
// }

// async function importMonthlyPayments() {
//     try {
//         console.log("📊 Reading Excel file for monthly payments...");

//         const workbook = xlsx.readFile("./prisma/2025.xlsx");
//         const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//         const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

//         console.log(`📋 Found ${data.length} rows in Excel file`);

//         // Get maintenance payment category
//         const maintenanceCategory = await prisma.paymentCategory.findFirst({
//             where: { name: "Maintenance Fee" },
//         });

//         if (!maintenanceCategory) {
//             throw new Error(
//                 "Maintenance Fee category not found. Run seed first."
//             );
//         }

//         const headers = data[0];

//         // Define months to find in the Excel
//         const monthsToFind = [
//             "Jan-25",
//             "Feb-25",
//             "Mar-25",
//             "Apr-25",
//             "May-25",
//             "Jun-25",
//             // "Jul-25",
//             // "Aug-25",
//             // "Sep-25",
//             // "Oct-25",
//             // "Nov-25",
//             // "Dec-25",
//         ];

//         // Find month columns
//         const monthColumns = [];
//         monthsToFind.forEach((monthHeader) => {
//             const receivedIndex = headers.findIndex((h) => h === monthHeader);
//             if (receivedIndex !== -1) {
//                 const [month, year] = monthHeader.split("-");
//                 monthColumns.push({
//                     month,
//                     year: `20${year}`,
//                     receivedIndex: receivedIndex,
//                     monthNumber: getMonthNumber(month),
//                 });
//             }
//         });

//         console.log(
//             `🔍 Found ${monthColumns.length} month columns:`,
//             monthColumns.map((m) => `${m.month}-${m.year}`).join(", ")
//         );

//         let importedCount = 0;
//         let skippedCount = 0;

//         for (let i = 1; i < data.length; i++) {
//             const row = data[i];
//             const villaNumber = row[1];
//             const owner = row[2];

//             if (!villaNumber || !owner || villaNumber === "N/A") {
//                 skippedCount++;
//                 continue;
//             }

//             try {
//                 // Find villa in database
//                 const villa = await prisma.villa.findFirst({
//                     where: { villaNumber: villaNumber },
//                 });

//                 if (!villa) {
//                     console.log(`⚠️ Villa not found: ${villaNumber}`);
//                     skippedCount++;
//                     continue;
//                 }

//                 console.log(`🏠 Processing villa ${villaNumber}...`);

//                 // Process each month
//                 for (const {
//                     month,
//                     year,
//                     receivedIndex,
//                     monthNumber,
//                 } of monthColumns) {
//                     const amount = row[receivedIndex];

//                     if (amount && amount !== "N/A") {
//                         const paymentYear = parseInt(year);
//                         const paymentDate = new Date(
//                             Date.UTC(paymentYear, monthNumber - 1, 1)
//                         );

//                         try {
//                             await prisma.payment.create({
//                                 data: {
//                                     villaId: villa.id,
//                                     categoryId: maintenanceCategory.id,
//                                     receivableAmount: 4000,
//                                     receivedAmount: Number(amount),
//                                     paymentDate: paymentDate,
//                                     paymentMonth: monthNumber,
//                                     paymentYear: paymentYear,
//                                     paymentMethod: "CASH",
//                                     notes: `Maintenance payment for ${month}-${year} - Imported from Excel`,
//                                 },
//                             });

//                             console.log(
//                                 `✅ Added maintenance payment for villa ${villaNumber}, ${month}-${year}: ₹${amount}`
//                             );
//                             importedCount++;
//                         } catch (paymentError) {
//                             console.error(
//                                 `❌ Error inserting payment for villa ${villaNumber}, ${month}-${year}:`,
//                                 paymentError.message
//                             );
//                         }
//                     }
//                 }
//             } catch (error) {
//                 console.error(
//                     `❌ Error processing villa ${villaNumber}:`,
//                     error.message
//                 );
//                 skippedCount++;
//             }
//         }

//         console.log(`\n🎉 Monthly payments import completed!`);
//         console.log(`   • ✅ Imported: ${importedCount} payments`);
//         console.log(`   • ⏭️ Skipped: ${skippedCount} entries`);
//     } catch (error) {
//         console.error("❌ Error during monthly payments import:", error);
//         throw error;
//     }
// }

// // Run the import
// importMonthlyPayments()
//     .then(() => {
//         console.log("🏁 Monthly payments import finished successfully!");
//         process.exit(0);
//     })
//     .catch((error) => {
//         console.error("💥 Monthly payments import failed:", error);
//         process.exit(1);
//     })
//     .finally(async () => {
//         await prisma.$disconnect();
//     });



import fs from "fs";
import xlsx from "xlsx";
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

function getMonthNumber(monthName) {
    const months = {
        jan: 1,
        feb: 2,
        mar: 3,
        apr: 4,
        may: 5,
        jun: 6,
        jul: 7,
        aug: 8,
        sep: 9,
        oct: 10,
        nov: 11,
        dec: 12,
    };
    return months[monthName.toLowerCase()];
}

async function importMonthlyPayments() {
    try {
        console.log("📊 Reading Excel file for monthly payments...");

        const workbook = xlsx.readFile("./prisma/Book1-2024.xlsx");
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

        console.log(`📋 Found ${data.length} rows in Excel file`);

        // Get maintenance payment category
        const maintenanceCategory = await prisma.paymentCategory.findFirst({
            where: { name: "Maintenance Fee" },
        });

        if (!maintenanceCategory) {
            throw new Error(
                "Maintenance Fee category not found. Run seed first."
            );
        }

        const headers = data[0];

        console.log("📋 Excel Headers:", headers);

        // Define months to find in the Excel
        const monthsToFind = [
            // "Jan-24",
            // "Feb-24",
            "Mar-24",
            "Apr-24",
            "May-24",
            "Jun-24",
            "Jul-24",
            "Aug-24",
            "Sep-24",
            "Oct-24",
            "Nov-24",
            "Dec-24",
        ];

        // ✅ Find both received and pending columns for each month
        const monthColumns = [];
        monthsToFind.forEach((monthHeader) => {
            const receivedIndex = headers.findIndex((h) => h === monthHeader);
            
            if (receivedIndex !== -1) {
                // ✅ Look for the pending column (should be right after the received column)
                const pendingIndex = receivedIndex + 1;
                const pendingHeader = headers[pendingIndex];
                // console.log(pendingHeader, pendingIndex);
                // // Verify this is actually a pending column
                // if (pendingHeader && (
                //     pendingHeader.toLowerCase().includes('PAYMENT PENDING') ||
                //     pendingHeader.toLowerCase().includes('due') ||
                //     pendingHeader === '' // Sometimes pending columns have empty headers
                // )) {
                  
                //   console.log(`🔍 Found columns for ${month}-${year}: Received=${receivedIndex}, Pending=${pendingIndex}`);
                // } else {
                //   console.log(`⚠️ Could not find pending column for ${monthHeader}. Expected at index ${pendingIndex}, found: ${pendingHeader}`);
                // }
                const [month, year] = monthHeader.split("-");
                monthColumns.push({
                    month,
                    year: `20${year}`,
                    receivedIndex: receivedIndex,
                    pendingIndex: pendingIndex, // ✅ Add pending index
                    monthNumber: getMonthNumber(month),
                });
            }
        });

        console.log(`🔍 Found ${monthColumns.length} month column pairs`);

        let importedCount = 0;
        let skippedCount = 0;

        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const villaNumber = row[1];
            const owner = row[2];

            // ✅ Skip vacant houses (N/A owner) and empty rows
            if (!villaNumber || !owner || villaNumber === "N/A" || owner === "N/A") {
                console.log(`⏭️ Skipping villa ${villaNumber} - Vacant or N/A`);
                skippedCount++;
                continue;
            }

            try {
                // Find villa in database
                const villa = await prisma.villa.findFirst({
                    where: { villaNumber: villaNumber },
                });

                if (!villa) {
                    console.log(`⚠️ Villa not found in database: ${villaNumber}`);
                    skippedCount++;
                    continue;
                }

                console.log(`🏠 Processing villa ${villaNumber} (${owner})...`);

                // Process each month
                for (const {
                    month,
                    year,
                    receivedIndex,
                    pendingIndex,
                    monthNumber,
                } of monthColumns) {
                    const receivedAmount = row[receivedIndex];
                    const pendingAmount = row[pendingIndex];

                    // ✅ Convert to numbers, treating "N/A", empty, or non-numeric as 0
                    const received = isNaN(Number(receivedAmount)) || receivedAmount === "N/A" || receivedAmount === "" 
                        ? 0 
                        : Number(receivedAmount);
                    
                    const pending = isNaN(Number(pendingAmount)) || pendingAmount === "N/A" || pendingAmount === ""
                        ? 0 
                        : Number(pendingAmount);

                    // ✅ Calculate receivable amount based on your logic
                    let receivable = 0;
                    
                    if (pending === 0 && received === 0) {
                        // Both are 0 - house might be vacant for this month or waived off
                        receivable = 0;
                        console.log(`   💡 ${month}-${year}: Waived off (received: ${received}, pending: ${pending})`);
                    } else if (pending === 0 && received !== 0) {
                        // Fully paid - receivable equals received
                        receivable = received;
                        console.log(`   ✅ ${month}-${year}: Fully paid (received: ${received}, pending: ${pending})`);
                    } else if (pending !== 0) {
                        // Has pending amount - receivable is sum of received + pending
                        receivable = received + pending;
                        console.log(`   ⚠️ ${month}-${year}: Partial payment (received: ${received}, pending: ${pending}, total: ${receivable})`);
                    }

                    // ✅ Only create payment record if there's any activity (receivable > 0)
                    if (receivable >= 0) {
                        const paymentYear = parseInt(year);
                        const paymentDate = new Date(
                            Date.UTC(paymentYear, monthNumber - 1, 1)
                        );

                        try {
                            // ✅ Check if payment already exists for this villa/category/month/year
                            const existingPayment = await prisma.payment.findFirst({
                                where: {
                                    villaId: villa.id,
                                    categoryId: maintenanceCategory.id,
                                    paymentMonth: monthNumber,
                                    paymentYear: paymentYear,
                                },
                            });

                            if (existingPayment) {
                                console.log(`   ⏭️ ${month}-${year}: Payment already exists, skipping`);
                                continue;
                            }

                            await prisma.payment.create({
                                data: {
                                    villaId: villa.id,
                                    categoryId: maintenanceCategory.id,
                                    receivableAmount: receivable, // ✅ Dynamic receivable
                                    receivedAmount: received,     // ✅ Actual received
                                    paymentDate: paymentDate,
                                    paymentMonth: monthNumber,
                                    paymentYear: paymentYear,
                                    paymentMethod: "CASH",
                                    notes: `Maintenance payment for ${month}-${year} - Imported from Excel (Receivable: ${receivable}, Received: ${received}, Pending: ${pending})`,
                                },
                            });

                            console.log(`   ✅ Imported ${month}-${year}: Receivable=${receivable}, Received=${received}, Pending=${pending}`);
                            importedCount++;
                        } catch (paymentError) {
                            console.error(`   ❌ Error inserting payment for villa ${villaNumber}, ${month}-${year}:`, paymentError.message);
                        }
                    } else {
                        console.log(`   ⏭️ ${month}-${year}: No payment needed (receivable: 0)`);
                    }
                }
            } catch (error) {
                console.error(`❌ Error processing villa ${villaNumber}:`, error.message);
                skippedCount++;
            }
        }

        console.log(`\n🎉 Monthly payments import completed!`);
        console.log(`   • ✅ Imported: ${importedCount} payment records`);
        console.log(`   • ⏭️ Skipped: ${skippedCount} villa entries`);
        
        // ✅ Show summary statistics
        const totalPayments = await prisma.payment.count({
            where: {
                categoryId: maintenanceCategory.id,
            },
        });
        
        const paymentSummary = await prisma.payment.aggregate({
            where: {
                categoryId: maintenanceCategory.id,
            },
            _sum: {
                receivableAmount: true,
                receivedAmount: true,
            },
        });

        console.log(`\n📊 Final Statistics:`);
        console.log(`   • Total maintenance payments in DB: ${totalPayments}`);
        console.log(`   • Total receivable: PKR ${paymentSummary._sum.receivableAmount?.toLocaleString() || 0}`);
        console.log(`   • Total received: PKR ${paymentSummary._sum.receivedAmount?.toLocaleString() || 0}`);
        console.log(`   • Total pending: PKR ${((paymentSummary._sum.receivableAmount || 0) - (paymentSummary._sum.receivedAmount || 0)).toLocaleString()}`);

    } catch (error) {
        console.error("❌ Error during monthly payments import:", error);
        throw error;
    }
}

// Run the import
importMonthlyPayments()
    .then(() => {
        console.log("🏁 Monthly payments import finished successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("💥 Monthly payments import failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });