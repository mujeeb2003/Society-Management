import fs from "fs";
import xlsx from "xlsx";
import { db } from "./app.js";

console.log("Reading Excel file...");
const workbook = xlsx.readFile("./Data FGP.xlsx");
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

// Payment head IDs
// const MAINTENANCE_PAYMENT_HEAD_ID = 1;
const WATER_CONNECTION_PAYMENT_HEAD_ID = 2;
const INDIVIDUAL_BILL_PAYMENT_HEAD_ID = 3;

// function getMonthNumber(monthName) {
//     const months = {
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
//         jan: 1,
//     };
//     return months[monthName.toLowerCase()];
// }

// Process monthly payments
// function processMonthlyPayments(villaNumber, row, villaId, monthColumns) {
//     return new Promise((resolve, reject) => {
//         let paymentsProcessed = 0;
//         const totalPayments = monthColumns.length;

//         monthColumns.forEach(({ month, year, receivedIndex }) => {
//             const amount = row[receivedIndex];

//             if (amount && amount !== "N/A" && amount !== 0) {
//                 const paymentMonth = month;
//                 const paymentYear = parseInt(year);
//                 const monthNumber = getMonthNumber(paymentMonth);

//                 // Fix for January 2025 - don't add an extra year
//                 let adjustedYear = paymentYear;
//                 if (month === "Jan" && year === "2025") {
//                     adjustedYear = 2025;
//                 }

//                 const paymentDate = `${adjustedYear}-${monthNumber
//                     .toString()
//                     .padStart(2, "0")}-01`;

//                 db.run(
//                     `INSERT INTO payments (villa_id, amount, payment_date, payment_month, payment_year, payment_head_id)
//                      VALUES (?, ?, ?, ?, ?, ?)`,
//                     [
//                         villaId,
//                         amount,
//                         paymentDate,
//                         paymentMonth,
//                         adjustedYear.toString(),
//                         MAINTENANCE_PAYMENT_HEAD_ID,
//                     ],
//                     (err) => {
//                         if (err) {
//                             console.error(
//                                 `Error inserting monthly payment for villa ${villaNumber}:`,
//                                 err
//                             );
//                         }
//                         paymentsProcessed++;
//                         if (paymentsProcessed === totalPayments) {
//                             resolve();
//                         }
//                     }
//                 );
//             } else {
//                 paymentsProcessed++;
//                 if (paymentsProcessed === totalPayments) {
//                     resolve();
//                 }
//             }
//         });

//         if (totalPayments === 0) {
//             resolve();
//         }
//     });
// }

// Process one-time payments
function processOneTimePayments(villaNumber, row, villaId, headers) {
    return new Promise((resolve, reject) => {
        // Find column indices for one-time payments
        const waterConnection5000Index = headers.findIndex(
            (h) => h === "NEW WATER CONNECTION 5000/-"
        );
        // const waterConnection2000Index = headers.findIndex(h => h === "NEW WATER CONNECTION 2000/-");
        const individualBillIndex = headers.findIndex(
            (h) => h === "INDIVIDUAL BILL 8000/-"
        );

        let promises = [];

        console.log(villaNumber,row,villaId,headers,waterConnection5000Index,individualBillIndex);
        // Process Water Connection 5000
        if (waterConnection5000Index !== -1) {
            const amount = row[waterConnection5000Index]; // +1 to get the "PAYMENT RECEIVED" column
            if (amount && amount !== "N/A" && amount !== 0) {
                promises.push(
                    new Promise((resolve) => {
                        const paymentDate = `2025-01-01`; // Default date for one-time payments

                        db.run(
                            `INSERT INTO payments (villa_id, amount, payment_date, payment_month, payment_year, payment_head_id) 
                         VALUES (?, ?, ?, ?, ?, ?)`,
                            [
                                villaId,
                                amount,
                                paymentDate,
                                "Jan",
                                "2025",
                                WATER_CONNECTION_PAYMENT_HEAD_ID,
                            ],
                            (err) => {
                                if (err) {
                                    console.error(
                                        `Error inserting water connection 5000 payment for villa ${villaNumber}:`,
                                        err
                                    );
                                }
                                resolve();
                            }
                        );
                    })
                );
            }
        }

        // Process Water Connection 2000
        // if (waterConnection2000Index !== -1) {
        //     const amount = row[waterConnection2000Index + 1]; // +1 to get the "PAYMENT RECEIVED" column
        //     if (amount && amount !== "N/A" && amount !== 0) {
        //         promises.push(new Promise((resolve) => {
        //             const paymentDate = `2024-01-01`; // Default date for one-time payments

        //             db.run(
        //                 `INSERT INTO payments (villa_id, amount, payment_date, payment_month, payment_year, payment_head_id)
        //                  VALUES (?, ?, ?, ?, ?, ?)`,
        //                 [
        //                     villaId,
        //                     amount,
        //                     paymentDate,
        //                     "Jan",
        //                     "2024",
        //                     WATER_CONNECTION_PAYMENT_HEAD_ID,
        //                 ],
        //                 (err) => {
        //                     if (err) {
        //                         console.error(
        //                             `Error inserting water connection 2000 payment for villa ${villaNumber}:`,
        //                             err
        //                         );
        //                     }
        //                     resolve();
        //                 }
        //             );
        //         }));
        //     }
        // }

        // Process Individual Bill
        if (individualBillIndex !== -1) {
            const amount = row[individualBillIndex]; // +1 to get the "PAYMENT RECEIVED" column
            if (amount && amount !== "N/A" && amount !== 0) {
                promises.push(
                    new Promise((resolve) => {
                        const paymentDate = `2025-01-01`; // Default date for one-time payments

                        db.run(
                            `INSERT INTO payments (villa_id, amount, payment_date, payment_month, payment_year, payment_head_id) 
                         VALUES (?, ?, ?, ?, ?, ?)`,
                            [
                                villaId,
                                amount,
                                paymentDate,
                                "Jan",
                                "2025",
                                INDIVIDUAL_BILL_PAYMENT_HEAD_ID,
                            ],
                            (err) => {
                                if (err) {
                                    console.error(
                                        `Error inserting individual bill payment for villa ${villaNumber}:`,
                                        err
                                    );
                                }
                                resolve();
                            }
                        );
                    })
                );
            }
        }

        // Resolve when all one-time payments are processed
        Promise.all(promises).then(() => resolve());
    });
}

async function importPayments() {
    return new Promise((resolve, reject) => {
        db.serialize(async () => {
            db.run("BEGIN TRANSACTION");

            try {
                const monthColumns = [];
                const headers = data[0];

                const monthsToFind = [
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
                    "Jan-25",
                ];

                // monthsToFind.forEach((monthHeader) => {
                //     const receivedIndex = headers.findIndex(
                //         (h) => h === monthHeader
                //     );
                //     if (receivedIndex !== -1) {
                //         const [month, year] = monthHeader.split("-");
                //         monthColumns.push({
                //             month,
                //             year: `20${year}`,
                //             receivedIndex: receivedIndex + 1, // +1 to get the "PAYMENT RECEIVED" column
                //         });
                //     }
                // });

                // console.log("Found month columns:", monthColumns);

                for (let i = 1; i < data.length; i++) {
                    const row = data[i];
                    const villaNumber = row[1];
                    const owner = row[2];

                    if (!villaNumber || !owner || villaNumber === "N/A")
                        continue;

                    await new Promise((resolve, reject) => {
                        db.get(
                            "SELECT id FROM Villas WHERE villa_number = ?",
                            [villaNumber],
                            async (err, villa) => {
                                if (err) {
                                    console.error(
                                        `Error finding villa ${villaNumber}:`,
                                        err
                                    );
                                    resolve();
                                } else if (!villa) {
                                    console.log(
                                        `Villa not found: ${villaNumber}`
                                    );
                                    resolve();
                                } else {
                                    // Process monthly payments
                                    // await processMonthlyPayments(
                                    //     villaNumber,
                                    //     row,
                                    //     villa.id,
                                    //     monthColumns
                                    // );

                                    // Process one-time payments
                                    // if (villaNumber !== "R-03") {
                                        await processOneTimePayments(
                                            villaNumber,
                                            row,
                                            villa.id,
                                            headers
                                        );
                                    // }
                                    resolve();
                                }
                            }
                        );
                    });
                }

                db.run("COMMIT", (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log("Payment data imported successfully!");
                        resolve();
                    }
                });
            } catch (error) {
                db.run("ROLLBACK", () => {
                    reject(error);
                });
            }
        });
    });
}

importPayments()
    .then(() => {
        console.log("Import completed successfully.");
        db.close((err) => {
            if (err) {
                console.error("Error closing database:", err);
            } else {
                console.log("Database closed.");
            }
        });
    })
    .catch((error) => {
        console.error("Error during import:", error);
        db.close((err) => {
            if (err) {
                console.error("Error closing database:", err);
            } else {
                console.log("Database closed.");
            }
        });
    });
