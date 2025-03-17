import fs from "fs";
import xlsx from "xlsx";
import { db } from "./app.js";

console.log("Reading Excel file...");
const workbook = xlsx.readFile("./Data FGP.xlsx");
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

const MAINTENANCE_PAYMENT_HEAD_ID = 1;

function getMonthNumber(monthName) {
    const months = {
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
        jan: 1,
    };
    return months[monthName.toLowerCase()];
}

function processVilla(villaNumber, row, villaId, monthColumns) {
    return new Promise((resolve, reject) => {
        let paymentsProcessed = 0;
        const totalPayments = monthColumns.length;
        console.log(
            `Processing payments for villa ${villaNumber}...`,
            row,
            villaId,
            monthColumns
        );
        monthColumns.forEach(({ month, year, receivedIndex }) => {
            const amount = row[receivedIndex - 1];
            console.log(amount);
            if (amount && amount !== "N/A" && amount !== 0 && year == "2025") {
                const paymentMonth = month;
                const paymentYear = parseInt(year);
                const monthNumber = getMonthNumber(paymentMonth);

                // Fix for January 2025 - don't add an extra year
                let adjustedYear = paymentYear;

                if (month === "Jan" && year === "2025") {
                    adjustedYear = 2025;
                }

                const paymentDate = `${adjustedYear}-${monthNumber
                    ?.toString()
                    ?.padStart(2, "0")}-01`;

                db.run(
                    `INSERT INTO payments (villa_id, amount, payment_date, payment_month, payment_year, payment_head_id) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        villaId,
                        amount,
                        paymentDate,
                        paymentMonth,
                        adjustedYear?.toString(),
                        MAINTENANCE_PAYMENT_HEAD_ID,
                    ],
                    (err) => {
                        if (err) {
                            console.error(
                                `Error inserting payment for villa ${villaNumber}:`,
                                err
                            );
                        }
                        paymentsProcessed++;
                        if (paymentsProcessed === totalPayments) {
                            resolve();
                        }
                    }
                );
            } else {
                paymentsProcessed++;
                if (paymentsProcessed === totalPayments) {
                    resolve();
                }
            }
        });

        if (totalPayments === 0) {
            resolve();
        }
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

                monthsToFind.forEach((monthHeader) => {
                    const receivedIndex = headers.findIndex(
                        (h) => h === monthHeader
                    );
                    if (receivedIndex !== -1) {
                        const [month, year] = monthHeader.split("-");
                        monthColumns.push({
                            month,
                            year: `20${year}`,
                            receivedIndex: receivedIndex + 1, // +1 to get the "PAYMENT RECEIVED" column
                        });
                    }
                });

                console.log("Found month columns:", monthColumns);

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
                                    console.log(villa, villaNumber, row);
                                    // if (villaNumber == "R-03") {
                                        await processVilla(
                                            villaNumber,
                                            row,
                                            villa.id,
                                            monthColumns
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
