import express, { json, text } from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import { dirname, format, join } from "path";
import { genSalt, hash, compare } from "bcrypt";
import PDFDocument from "pdfkit";
import setupDB from "./setupdb.js";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

export const app = express();
const port = process.env.PORT || 5001;

const { verbose } = sqlite3;
export const SQLite3 = verbose();
// setupDB();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
export const db = new SQLite3.Database(
    join(__dirname, "../db", "society_payments.db"),
    SQLite3.OPEN_READWRITE,
    (err) => {
        try {
            if (err) {
                console.error(err.message);
            } else {
                console.log("Connected to the society payments database.");
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }
);

app.get("/testing", async (req, res) => {
    try {
        db.all("delete from payments where id=2610", [], (err, rows) => {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.status(200).json({
                message: "success",
                data: { rows },
            });
        });

        // db.all("select * from users ", [], (err, rows) => {
        //     if (err) {
        //         res.status(400).json({ error: err.message });
        //         return;
        //     }
        //     res.status(200).json({
        //         message: "success",
        //         data: { rows },
        //     });
        // });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
// User related routes
app.get("/users", async (req, res) => {
    try {
        db.all("SELECT * FROM users", [], (err, rows) => {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.status(200).json({
                message: "success",
                data: { rows },
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post("/users", async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    try {
        const salt = await genSalt(10);
        const hashedPassword = await hash(password, salt);

        db.run(
            `INSERT INTO users (firstName,lastName,email,password) VALUES (?, ?, ?, ?)`,
            [firstName, lastName, email, hashedPassword],
            function (err) {
                if (err) {
                    res.status(400).json({ error: err.message });
                    return;
                }
                res.status(200).json({
                    message: "success",
                    data: { id: this.lastID, email: email },
                });
            }
        );
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        db.get(
            "SELECT * FROM users WHERE email=?",
            [email],
            async (err, row) => {
                if (err) {
                    res.status(400).json({ error: err.message });
                    return;
                }
                if (!row) {
                    res.status(400).json({ error: "User not found" });
                    return;
                }

                const isMatch = await compare(password, row.password);

                if (!isMatch) {
                    res.status(400).json({ error: "Invalid credentials" });
                    return;
                }

                res.status(200).json({
                    message: "success",
                    data: {
                        id: row.id,
                        email: row.email,
                        firstName: row.firstName,
                        lastName: row.lastName,
                    },
                });
            }
        );
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get("/logout", async (req, res) => {
    try {
        res.status(200).json({
            message: "success",
            data: { message: "Logged out successfully" },
        });
    } catch (error) {
        res.status(500).json({
            message: "error",
            error: error.message,
        });
    }
});

app.post("/villas", (req, res) => {
    const { villa_number, resident_name, occupancy_type } = req.body;
    try {
        db.run(
            `INSERT INTO villas (villa_number, resident_name, occupancy_type) VALUES (?, ?, ?)`,
            [villa_number, resident_name, occupancy_type],
            function (err) {
                if (err) {
                    res.status(400).json({ error: err.message });
                    return;
                }
                res.status(200).json({
                    message: "success",
                    data: { id: this.lastID },
                });
            }
        );
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
});

app.patch("/villas/:id", (req, res) => {
    const { id } = req.params;
    const { villa_number, resident_name, occupancy_type } = req.body;
    try {
        db.run(
            `UPDATE villas SET villa_number = ?, resident_name = ?, occupancy_type = ? WHERE id = ?`,
            [villa_number, resident_name, occupancy_type, id],
            function (err) {
                if (err) {
                    res.status(400).json({ error: err.message });
                    return;
                }
                res.status(200).json({
                    message: "success",
                    data: { id: id },
                });
            }
        );
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get("/villas", (req, res) => {
    try {
        db.all("SELECT * FROM villas", [], (err, rows) => {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.status(200).json({
                message: "success",
                data: rows,
            });
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get all payment heads
app.get("/payment-heads", (req, res) => {
    try {
        db.all(`SELECT * FROM payment_heads`, [], (err, rows) => {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.status(200).json({
                message: "success",
                data: rows,
            });
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
});

// Create a new payment head
app.post("/payment-heads", (req, res) => {
    const { name, description, amount, is_recurring } = req.body;
    try {
        db.run(
            `INSERT INTO payment_heads (name, description, amount, is_recurring) VALUES (?, ?, ?, ?)`,
            [name, description, amount, is_recurring],
            function (err) {
                if (err) {
                    res.status(400).json({ error: err.message });
                    return;
                }
                res.status(200).json({
                    message: "success",
                    data: { id: this.lastID },
                });
            }
        );
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
});

// Update a payment head
app.patch("/payment-heads/:id", (req, res) => {
    const { id } = req.params;
    const { name, description, amount, is_recurring } = req.body;
    try {
        db.run(
            `UPDATE payment_heads SET name = ?, description = ?, amount = ?, is_recurring = ? WHERE id = ?`,
            [name, description, amount, is_recurring, id],
            function (err) {
                if (err) {
                    res.status(400).json({ error: err.message });
                    return;
                }
                res.status(200).json({
                    message: "success",
                    data: { id: id },
                });
            }
        );
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
});

// Delete a payment head
app.delete("/payment-heads/:id", (req, res) => {
    const { id } = req.params;
    try {
        db.run(`DELETE FROM payment_heads WHERE id = ?`, id, function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.status(200).json({ message: "deleted", rows: this.changes });
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
});

// Fix for the payments query
app.get("/payments", (req, res) => {
    try {
        db.all(
            `
            SELECT
                v.id,
                v.villa_number,
                v.resident_name,
                v.occupancy_type,
                ph.is_recurring,
                ph.id AS payment_head_id,
                ph.name AS payment_head_name,
                ph.amount AS payment_head_amount,
                JSON_GROUP_ARRAY(
                    JSON_OBJECT(
                        'latest_payment', p.amount, 
                        'latest_payment_date', p.payment_date,
                        'latest_payment_month', p.payment_month, 
                        'payment_year', p.payment_year, 
                        'payment_id', p.id,
                        'payment_head_id', p.payment_head_id
                    )
                ) AS Payments
            FROM villas AS v
            CROSS JOIN payment_heads AS ph
            LEFT JOIN payments AS p ON v.id = p.villa_id AND ph.id = p.payment_head_id
            GROUP BY v.id, ph.id
            ORDER BY v.villa_number, ph.id
            `,
            [],
            (err, rows) => {
                if (err) {
                    res.status(400).json({ error: err.message });
                    return;
                }

                rows.forEach((row) => {
                    // Parse the JSON array
                    let payments = JSON.parse(row.Payments);

                    // Filter out null entries
                    payments = payments.filter((p) => p.payment_id !== null);

                    // Add payment_head_name and payment_head_amount to each payment
                    payments.forEach((p) => {
                        p.payment_head_name = row.payment_head_name;
                        p.payment_head_amount = row.payment_head_amount;
                    });

                    // Sort by date
                    payments.sort((a, b) => {
                        return (
                            new Date(b.latest_payment_date) -
                            new Date(a.latest_payment_date)
                        );
                    });

                    // If no payments, create a default entry
                    if (payments.length === 0) {
                        payments = [
                            {
                                latest_payment: null,
                                latest_payment_date: null,
                                latest_payment_month: null,
                                payment_year: null,
                                payment_id: null,
                                payment_head_id: row.payment_head_id,
                                payment_head_name: row.payment_head_name,
                                payment_head_amount: row.payment_head_amount,
                            },
                        ];
                    }

                    row.Payments = payments;

                    // Remove the extra fields we added
                    delete row.payment_head_id;
                    delete row.payment_head_name;
                    delete row.payment_head_amount;
                });

                res.status(200).json({
                    message: "success",
                    data: rows,
                });
            }
        );
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post("/payments", async (req, res) => {
    try {
        const {
            villa_id,
            payment_head_id,
            amount,
            payment_date,
            payment_month,
            payment_year,
        } = req.body;

        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            db.get(
                `SELECT * FROM payment_heads WHERE id = ?`,
                [payment_head_id],
                function (err, paymentHead) {
                    if (err) {
                        db.run("ROLLBACK");
                        return res.status(400).json({ error: err.message });
                    }

                    if (!paymentHead) {
                        db.run("ROLLBACK");
                        return res
                            .status(400)
                            .json({ error: "Invalid payment head" });
                    }

                    // Check if payment already exists for this villa, payment head, month, and year
                    db.get(
                        `SELECT * FROM payments WHERE villa_id = ? AND payment_head_id = ? AND payment_month = ? AND payment_year = ?`,
                        [
                            villa_id,
                            payment_head_id,
                            payment_month,
                            payment_year,
                        ],
                        (err, existingPayment) => {
                            if (err) {
                                db.run("ROLLBACK");
                                return res
                                    .status(400)
                                    .json({ error: err.message });
                            }

                            if (existingPayment) {
                                // Update existing payment by adding the new amount
                                db.run(
                                    `UPDATE payments SET amount = ?, payment_date = ? WHERE id = ?`,
                                    [
                                        existingPayment.amount + amount,
                                        payment_date,
                                        existingPayment.id,
                                    ],
                                    function (err) {
                                        if (err) {
                                            db.run("ROLLBACK");
                                            return res
                                                .status(400)
                                                .json({ error: err.message });
                                        }
                                        db.run("COMMIT");
                                        return res.status(200).json({
                                            message: "success",
                                            data: { id: existingPayment.id },
                                        });
                                    }
                                );
                            } else {
                                // Insert new payment with the full amount
                                db.run(
                                    `INSERT INTO payments (villa_id, payment_head_id, amount, payment_date, payment_month, payment_year) VALUES (?, ?, ?, ?, ?, ?)`,
                                    [
                                        villa_id,
                                        payment_head_id,
                                        amount,
                                        payment_date,
                                        payment_month,
                                        payment_year,
                                    ],
                                    function (err) {
                                        if (err) {
                                            db.run("ROLLBACK");
                                            return res
                                                .status(400)
                                                .json({ error: err.message });
                                        }
                                        db.run("COMMIT");
                                        return res.status(200).json({
                                            message: "success",
                                            data: { id: this.lastID },
                                        });
                                    }
                                );
                            }
                        }
                    );
                }
            );
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Date Range Payments Report API
app.get("/payments/date-range", (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({
            error: "Start date and end date are required",
        });
    }

    try {
        db.all(
            `
            SELECT 
                p.id AS payment_id, 
                p.villa_id,
                p.payment_head_id, 
                p.amount, 
                p.payment_date,
                p.payment_month,
                p.payment_year,
                v.villa_number,
                v.resident_name,
                v.occupancy_type,
                ph.name AS payment_head_name,
                ph.description AS payment_head_description,
                ph.amount AS payment_head_amount,
                ph.is_recurring
            FROM payments p
            JOIN villas v ON p.villa_id = v.id
            JOIN payment_heads ph ON p.payment_head_id = ph.id
            WHERE DATE(p.payment_date) BETWEEN DATE(?) AND DATE(?)
            ORDER BY p.payment_date DESC, p.id DESC
            `,
            [startDate, endDate],
            (err, payments) => {
                if (err) {
                    console.error("Error fetching date range payments:", err);
                    return res.status(500).json({
                        error: "An error occurred while fetching payments",
                        details: err.message,
                    });
                }

                res.status(200).json({
                    message: "success",
                    data: payments,
                    summary: {
                        totalPayments: payments.length,
                        totalAmount: payments.reduce(
                            (sum, payment) => sum + payment.amount,
                            0
                        ),
                        dateRange: { startDate, endDate },
                    },
                });
            }
        );
    } catch (error) {
        console.error("Error in date range payments:", error);
        res.status(500).json({
            error: error.message,
        });
    }
});

// Reports Export API (PDF and Excel)
app.get("/reports/date-range", async (req, res) => {
    const { startDate, endDate, villa, paymentHead, format } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({
            error: "Start date and end date are required",
        });
    }

    try {
        let query = `
            SELECT 
                p.id AS payment_id, 
                p.villa_id,
                p.payment_head_id, 
                p.amount, 
                p.payment_date,
                p.payment_month,
                p.payment_year,
                v.villa_number,
                v.resident_name,
                v.occupancy_type,
                ph.name AS payment_head_name,
                ph.description AS payment_head_description,
                ph.amount AS payment_head_amount,
                ph.is_recurring
            FROM payments p
            JOIN villas v ON p.villa_id = v.id
            JOIN payment_heads ph ON p.payment_head_id = ph.id
            WHERE DATE(p.payment_date) BETWEEN DATE(?) AND DATE(?)
        `;

        const params = [startDate, endDate];

        // Add villa filter
        if (villa && villa !== "all") {
            query += ` AND p.villa_id = ?`;
            params.push(villa);
        }

        // Add payment head filter
        if (paymentHead && paymentHead !== "all") {
            query += ` AND p.payment_head_id = ?`;
            params.push(paymentHead);
        }

        query += ` ORDER BY p.payment_date DESC, p.id DESC`;

        db.all(query, params, (err, payments) => {
            if (err) {
                console.error("Error fetching payments for export:", err);
                return res.status(500).json({
                    error: "An error occurred while fetching payments for export",
                    details: err.message,
                });
            }

            if (format === "pdf") {
                // Generate PDF
                const doc = new PDFDocument({
                    margin: 30,
                    size: "A4",
                    autoFirstPage: true,
                });

                // Set response headers for PDF download
                res.setHeader("Content-Type", "application/pdf");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename=date-range-payments-${startDate}-to-${endDate}.pdf`
                );

                // Pipe the PDF document to the response
                doc.pipe(res);

                // Add title and date range
                doc.fontSize(16).text("Date Range Payments Report", {
                    align: "center",
                });
                doc.fontSize(10).text(`Period: ${startDate} to ${endDate}`, {
                    align: "center",
                });
                doc.fontSize(8).text(
                    `Generated on: ${new Date().toLocaleDateString()}`,
                    { align: "right" }
                );
                doc.moveDown(1.5);

                // Add summary
                const totalAmount = payments.reduce(
                    (sum, payment) => sum + payment.amount,
                    0
                );
                doc.fontSize(10).text(`Total Payments: ${payments.length}`);
                doc.text(`Total Amount: PKR ${totalAmount.toLocaleString()}`);
                doc.moveDown(0.8);

                // Define table properties
                const headers = [
                    "Payment ID",
                    "Date",
                    "Villa",
                    "Resident",
                    "Payment Type",
                    "Amount",
                ];
                const columnWidth = (doc.page.width - 60) / headers.length;
                const rowHeight = 20; // Reduced from 25
                let currentY = doc.y;

                // Draw table headers
                doc.font("Helvetica-Bold");
                doc.fontSize(9); // Reduced font size
                doc.fillColor("#f0f0f0")
                    .rect(30, currentY, doc.page.width - 60, rowHeight)
                    .fill();
                doc.fillColor("#000000");

                headers.forEach((header, i) => {
                    doc.text(header, 30 + i * columnWidth, currentY + 3, {
                        width: columnWidth,
                        align: "center",
                        lineBreak: false,
                    });
                });

                currentY += rowHeight;
                doc.font("Helvetica");
                doc.fontSize(8); // Reduced font size for table content

                // Draw table rows
                payments.forEach((payment) => {
                    // Check if we need a new page
                    if (currentY > doc.page.height - 100) {
                        doc.addPage();
                        currentY = 50;

                        // Redraw headers on new page
                        doc.font("Helvetica-Bold");
                        doc.fontSize(9);
                        doc.fillColor("#f0f0f0")
                            .rect(30, currentY, doc.page.width - 60, rowHeight)
                            .fill();
                        doc.fillColor("#000000");

                        headers.forEach((header, i) => {
                            doc.text(
                                header,
                                30 + i * columnWidth,
                                currentY + 3,
                                {
                                    width: columnWidth,
                                    align: "center",
                                    lineBreak: false,
                                }
                            );
                        });
                        currentY += rowHeight;
                        doc.font("Helvetica");
                        doc.fontSize(8);
                    }

                    const rowData = [
                        `#${String(payment.payment_id).padStart(8, "0")}`,
                        new Date(payment.payment_date).toLocaleDateString(
                            "en-GB"
                        ),
                        `Villa ${payment.villa_number}`,
                        payment.resident_name,
                        payment.payment_head_name,
                        `PKR ${payment.amount.toLocaleString()}`,
                    ];

                    rowData.forEach((data, i) => {
                        doc.text(data, 30 + i * columnWidth, currentY + 3, {
                            width: columnWidth,
                            align: i === 5 ? "right" : "left",
                            lineBreak: false,
                        });
                    });

                    currentY += rowHeight;
                });

                // Finalize the PDF
                doc.end();
            } else if (format === "excel") {
                // For Excel format, we'll return CSV data that can be opened in Excel
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename=date-range-payments-${startDate}-to-${endDate}.csv`
                );

                // Create CSV content
                const headers = [
                    "Payment ID",
                    "Date",
                    "Villa",
                    "Resident",
                    "Payment Type",
                    "Amount",
                ];
                let csvContent = headers.join(",") + "\n";

                payments.forEach((payment) => {
                    const row = [
                        `"${String(payment.payment_id).padStart(8, "0")}"`,
                        `"${new Date(payment.payment_date).toLocaleDateString(
                            "en-GB"
                        )}"`,
                        `"Villa ${payment.villa_number}"`,
                        `"${payment.resident_name}"`,
                        `"${payment.payment_head_name}"`,
                        `"PKR ${payment.amount.toLocaleString()}"`,
                    ];
                    csvContent += row.join(",") + "\n";
                });

                // Add summary at the end
                csvContent += "\n";
                csvContent += `"Summary",,,,,\n`;
                csvContent += `"Total Payments","${payments.length}",,,,\n`;
                csvContent += `"Total Amount","PKR ${payments
                    .reduce((sum, payment) => sum + payment.amount, 0)
                    .toLocaleString()}",,,,\n`;
                csvContent += `"Date Range","${startDate} to ${endDate}",,,,\n`;
                csvContent += `"Generated","${new Date().toLocaleDateString()}",,,,\n`;

                res.send(csvContent);
            } else {
                res.status(400).json({
                    error: "Invalid format. Use 'pdf' or 'excel'",
                });
            }
        });
    } catch (error) {
        console.error("Error in reports export:", error);
        res.status(500).json({
            error: error.message,
        });
    }
});

// Villa-wise Summary Report API
app.get("/reports/villa-summary", (req, res) => {
    const { villaId, year, paymentType } = req.query;

    if (!villaId) {
        return res.status(400).json({
            error: "Villa ID is required",
        });
    }

    try {
        // First get villa details
        db.get(`SELECT * FROM villas WHERE id = ?`, [villaId], (err, villa) => {
            if (err) {
                console.error("Error fetching villa:", err);
                return res.status(500).json({
                    error: "An error occurred while fetching villa details",
                    details: err.message,
                });
            }

            if (!villa) {
                return res.status(404).json({
                    error: "Villa not found",
                });
            }

            // Build payment history query
            let paymentQuery = `
                    SELECT 
                        p.id AS payment_id,
                        p.payment_head_id,
                        p.amount AS amount_paid,
                        p.payment_date,
                        p.payment_month,
                        p.payment_year,
                        ph.name AS payment_head_name,
                        ph.amount AS payment_head_amount,
                        ph.is_recurring,
                        (ph.amount - COALESCE(p.amount, 0)) AS pending_amount
                    FROM payment_heads ph
                    LEFT JOIN payments p ON ph.id = p.payment_head_id AND p.villa_id = ?
                `;

            const params = [villaId];

            // Add year filter
            if (year && year !== "all") {
                paymentQuery += ` AND (p.payment_year = ? OR p.payment_year IS NULL)`;
                params.push(year);
            }

            // Add payment type filter
            if (paymentType && paymentType !== "all") {
                paymentQuery += ` AND ph.id = ?`;
                params.push(paymentType);
            }

            paymentQuery += ` ORDER BY ph.id, p.payment_year DESC, p.payment_month DESC`;

            db.all(paymentQuery, params, (err, paymentHistory) => {
                if (err) {
                    console.error("Error fetching payment history:", err);
                    return res.status(500).json({
                        error: "An error occurred while fetching payment history",
                        details: err.message,
                    });
                }

                // Calculate totals
                const totalPaid = paymentHistory.reduce(
                    (sum, payment) => sum + (payment.amount_paid || 0),
                    0
                );
                const totalPending = paymentHistory.reduce(
                    (sum, payment) => sum + payment.pending_amount,
                    0
                );

                const villaSummary = {
                    villa_id: villa.id,
                    villa_number: villa.villa_number,
                    resident_name: villa.resident_name,
                    occupancy_type: villa.occupancy_type,
                    total_paid: totalPaid,
                    total_pending: totalPending,
                    payment_history: paymentHistory,
                };

                res.status(200).json({
                    message: "success",
                    data: villaSummary,
                });
            });
        });
    } catch (error) {
        console.error("Error in villa summary:", error);
        res.status(500).json({
            error: error.message,
        });
    }
});

// Villa Export API (PDF and CSV)
app.get("/reports/villa-export", async (req, res) => {
    const { villaId, year, paymentType, format } = req.query;

    if (!villaId) {
        return res.status(400).json({
            error: "Villa ID is required",
        });
    }

    try {
        // First get villa details
        db.get(`SELECT * FROM villas WHERE id = ?`, [villaId], (err, villa) => {
            if (err) {
                console.error("Error fetching villa for export:", err);
                return res.status(500).json({
                    error: "An error occurred while fetching villa details",
                    details: err.message,
                });
            }

            if (!villa) {
                return res.status(404).json({
                    error: "Villa not found",
                });
            }

            // Build payment history query
            let paymentQuery = `
                    SELECT 
                        p.id AS payment_id,
                        p.payment_head_id,
                        p.amount AS amount_paid,
                        p.payment_date,
                        p.payment_month,
                        p.payment_year,
                        ph.name AS payment_head_name,
                        ph.amount AS payment_head_amount,
                        ph.is_recurring,
                        (ph.amount - COALESCE(p.amount, 0)) AS pending_amount
                    FROM payment_heads ph
                    LEFT JOIN payments p ON ph.id = p.payment_head_id AND p.villa_id = ?
                `;

            const params = [villaId];

            // Add filters
            if (year && year !== "all") {
                paymentQuery += ` AND (p.payment_year = ? OR p.payment_year IS NULL)`;
                params.push(year);
            }

            if (paymentType && paymentType !== "all") {
                paymentQuery += ` AND ph.id = ?`;
                params.push(paymentType);
            }

            paymentQuery += ` ORDER BY ph.id, p.payment_year DESC, p.payment_month DESC`;

            db.all(paymentQuery, params, (err, paymentHistory) => {
                if (err) {
                    console.error(
                        "Error fetching payment history for export:",
                        err
                    );
                    return res.status(500).json({
                        error: "An error occurred while fetching payment history",
                        details: err.message,
                    });
                }

                if (format === "pdf") {
                    // Generate PDF
                    const doc = new PDFDocument({
                        margin: 30,
                        size: "A4",
                        autoFirstPage: true,
                    });

                    // Set response headers for PDF download
                    res.setHeader("Content-Type", "application/pdf");
                    res.setHeader(
                        "Content-Disposition",
                        `attachment; filename=villa-${villa.villa_number}-summary.pdf`
                    );

                    // Pipe the PDF document to the response
                    doc.pipe(res);

                    // Add title and villa info
                    doc.fontSize(16).text("Villa-wise Payment Summary", {
                        align: "center",
                    });
                    doc.fontSize(12).text(
                        `Villa ${villa.villa_number} - ${villa.resident_name}`,
                        { align: "center" }
                    );
                    doc.fontSize(10).text(
                        `Occupancy: ${villa.occupancy_type}`,
                        { align: "center" }
                    );
                    doc.fontSize(8).text(
                        `Generated on: ${new Date().toLocaleDateString()}`,
                        { align: "right" }
                    );
                    doc.moveDown(1.5);

                    // Add summary
                    const totalPaid = paymentHistory.reduce(
                        (sum, payment) => sum + (payment.amount_paid || 0),
                        0
                    );
                    const totalPending = paymentHistory.reduce(
                        (sum, payment) => sum + payment.pending_amount,
                        0
                    );

                    doc.fontSize(10).text(
                        `Total Amount Paid: PKR ${totalPaid.toLocaleString()}`
                    );
                    doc.text(
                        `Total Pending Amount: PKR ${totalPending.toLocaleString()}`
                    );
                    doc.text(`Payment Records: ${paymentHistory.length}`);
                    doc.moveDown(0.8);

                    // Define table properties
                    const headers = [
                        "Payment Type",
                        "Month/Year",
                        "Required",
                        "Paid",
                        "Pending",
                        "Status",
                    ];
                    const columnWidth = (doc.page.width - 60) / headers.length;
                    const rowHeight = 20;
                    let currentY = doc.y;

                    // Draw table headers
                    doc.font("Helvetica-Bold");
                    doc.fontSize(9);
                    doc.fillColor("#f0f0f0")
                        .rect(30, currentY, doc.page.width - 60, rowHeight)
                        .fill();
                    doc.fillColor("#000000");

                    headers.forEach((header, i) => {
                        doc.text(header, 30 + i * columnWidth, currentY + 3, {
                            width: columnWidth,
                            align: "center",
                            lineBreak: false,
                        });
                    });

                    currentY += rowHeight;
                    doc.font("Helvetica");
                    doc.fontSize(8);

                    // Draw table rows
                    paymentHistory.forEach((payment) => {
                        // Check if we need a new page
                        if (currentY > doc.page.height - 100) {
                            doc.addPage();
                            currentY = 50;

                            // Redraw headers on new page
                            doc.font("Helvetica-Bold");
                            doc.fontSize(9);
                            doc.fillColor("#f0f0f0")
                                .rect(
                                    30,
                                    currentY,
                                    doc.page.width - 60,
                                    rowHeight
                                )
                                .fill();
                            doc.fillColor("#000000");

                            headers.forEach((header, i) => {
                                doc.text(
                                    header,
                                    30 + i * columnWidth,
                                    currentY + 3,
                                    {
                                        width: columnWidth,
                                        align: "center",
                                        lineBreak: false,
                                    }
                                );
                            });
                            currentY += rowHeight;
                            doc.font("Helvetica");
                            doc.fontSize(8);
                        }

                        const status =
                            payment.pending_amount <= 0
                                ? "Paid"
                                : payment.amount_paid > 0
                                ? "Partial"
                                : "Unpaid";

                        const rowData = [
                            payment.payment_head_name,
                            payment.payment_month
                                ? `${payment.payment_month}/${payment.payment_year}`
                                : "-",
                            `PKR ${payment.payment_head_amount.toLocaleString()}`,
                            `PKR ${(
                                payment.amount_paid || 0
                            ).toLocaleString()}`,
                            `PKR ${payment.pending_amount.toLocaleString()}`,
                            status,
                        ];

                        rowData.forEach((data, i) => {
                            doc.text(data, 30 + i * columnWidth, currentY + 3, {
                                width: columnWidth,
                                align: i >= 2 && i <= 4 ? "right" : "center",
                                lineBreak: false,
                            });
                        });

                        currentY += rowHeight;
                    });

                    // Finalize the PDF
                    doc.end();
                } else if (format === "csv") {
                    // Generate CSV
                    res.setHeader("Content-Type", "text/csv");
                    res.setHeader(
                        "Content-Disposition",
                        `attachment; filename=villa-${villa.villa_number}-summary.csv`
                    );

                    // Create CSV content
                    const headers = [
                        "Payment Type",
                        "Month/Year",
                        "Required Amount",
                        "Amount Paid",
                        "Pending Amount",
                        "Status",
                    ];
                    let csvContent = headers.join(",") + "\n";

                    // Add villa info
                    csvContent += `"Villa Information",,,,,\n`;
                    csvContent += `"Villa Number","${villa.villa_number}",,,,\n`;
                    csvContent += `"Resident Name","${villa.resident_name}",,,,\n`;
                    csvContent += `"Occupancy Type","${villa.occupancy_type}",,,,\n`;
                    csvContent += "\n";

                    // Add data rows
                    paymentHistory.forEach((payment) => {
                        const status =
                            payment.pending_amount <= 0
                                ? "Paid"
                                : payment.amount_paid > 0
                                ? "Partial"
                                : "Unpaid";

                        const row = [
                            `"${payment.payment_head_name}"`,
                            `"${
                                payment.payment_month
                                    ? payment.payment_month +
                                      "/" +
                                      payment.payment_year
                                    : "-"
                            }"`,
                            `"PKR ${payment.payment_head_amount.toLocaleString()}"`,
                            `"PKR ${(
                                payment.amount_paid || 0
                            ).toLocaleString()}"`,
                            `"PKR ${payment.pending_amount.toLocaleString()}"`,
                            `"${status}"`,
                        ];
                        csvContent += row.join(",") + "\n";
                    });

                    // Add summary
                    const totalPaid = paymentHistory.reduce(
                        (sum, payment) => sum + (payment.amount_paid || 0),
                        0
                    );
                    const totalPending = paymentHistory.reduce(
                        (sum, payment) => sum + payment.pending_amount,
                        0
                    );

                    csvContent += "\n";
                    csvContent += `"Summary",,,,,\n`;
                    csvContent += `"Total Paid","PKR ${totalPaid.toLocaleString()}",,,,\n`;
                    csvContent += `"Total Pending","PKR ${totalPending.toLocaleString()}",,,,\n`;
                    csvContent += `"Generated","${new Date().toLocaleDateString()}",,,,\n`;

                    res.send(csvContent);
                } else {
                    res.status(400).json({
                        error: "Invalid format. Use 'pdf' or 'csv'",
                    });
                }
            });
        });
    } catch (error) {
        console.error("Error in villa export:", error);
        res.status(500).json({
            error: error.message,
        });
    }
});

// Payment Head Analysis Report API
app.get("/reports/payment-heads", (req, res) => {
    const { startDate, endDate, paymentHead } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({
            error: "Start date and end date are required",
        });
    }

    try {
        // Build payment heads query
        let paymentHeadsQuery = `
            SELECT DISTINCT
                ph.id AS payment_head_id,
                ph.name AS payment_head_name,
                ph.description AS payment_head_description,
                ph.amount AS payment_head_amount,
                ph.is_recurring
            FROM payment_heads ph
        `;

        let params = [];

        // Add payment head filter
        if (paymentHead && paymentHead !== "all") {
            paymentHeadsQuery += ` WHERE ph.id = ?`;
            params.push(paymentHead);
        }

        paymentHeadsQuery += ` ORDER BY ph.id`;

        db.all(paymentHeadsQuery, params, (err, paymentHeads) => {
            if (err) {
                console.error("Error fetching payment heads:", err);
                return res.status(500).json({
                    error: "An error occurred while fetching payment heads",
                    details: err.message,
                });
            }

            // For each payment head, calculate statistics
            let completedQueries = 0;
            const totalQueries = paymentHeads.length;
            const analysisResults = [];

            if (totalQueries === 0) {
                return res.status(200).json({
                    message: "success",
                    data: {
                        overall_stats: {
                            total_revenue: 0,
                            total_pending: 0,
                            overall_collection_rate: 0,
                            active_payment_heads: 0,
                        },
                        payment_heads: [],
                        date_range: {
                            start_date: startDate,
                            end_date: endDate,
                        },
                    },
                });
            }

            paymentHeads.forEach((head, index) => {
                // Get statistics for this payment head
                db.all(
                    `
                    SELECT 
                        v.id AS villa_id,
                        COALESCE(SUM(p.amount), 0) AS total_paid,
                        ? AS expected_amount,
                        (? - COALESCE(SUM(p.amount), 0)) AS pending_amount,
                        CASE 
                            WHEN COALESCE(SUM(p.amount), 0) = 0 THEN 'unpaid'
                            WHEN COALESCE(SUM(p.amount), 0) >= ? THEN 'paid'
                            ELSE 'partial'
                        END AS payment_status
                    FROM villas v
                    LEFT JOIN payments p ON v.id = p.villa_id 
                        AND p.payment_head_id = ? 
                        AND DATE(p.payment_date) BETWEEN DATE(?) AND DATE(?)
                    GROUP BY v.id
                    `,
                    [
                        head.payment_head_amount,
                        head.payment_head_amount,
                        head.payment_head_amount,
                        head.payment_head_id,
                        startDate,
                        endDate,
                    ],
                    (err, villaStats) => {
                        if (err) {
                            console.error("Error fetching villa stats:", err);
                            return res.status(500).json({
                                error: "An error occurred while calculating statistics",
                                details: err.message,
                            });
                        }

                        // Calculate aggregated statistics
                        const totalCollected = villaStats.reduce(
                            (sum, villa) => sum + villa.total_paid,
                            0
                        );
                        const totalPending = villaStats.reduce(
                            (sum, villa) => sum + villa.pending_amount,
                            0
                        );
                        const totalExpected =
                            villaStats.length * head.payment_head_amount;
                        const collectionRate =
                            totalExpected > 0
                                ? (totalCollected / totalExpected) * 100
                                : 0;

                        const paidVillas = villaStats.filter(
                            (v) => v.payment_status === "paid"
                        ).length;
                        const partialVillas = villaStats.filter(
                            (v) => v.payment_status === "partial"
                        ).length;
                        const unpaidVillas = villaStats.filter(
                            (v) => v.payment_status === "unpaid"
                        ).length;

                        // Get monthly breakdown
                        db.all(
                            `
                            SELECT 
                                p.payment_month AS month,
                                p.payment_year AS year,
                                SUM(p.amount) AS amount_collected,
                                COUNT(p.id) AS transactions_count
                            FROM payments p
                            WHERE p.payment_head_id = ? 
                                AND DATE(p.payment_date) BETWEEN DATE(?) AND DATE(?)
                            GROUP BY p.payment_year, p.payment_month
                            ORDER BY p.payment_year DESC, p.payment_month DESC
                            `,
                            [head.payment_head_id, startDate, endDate],
                            (err, monthlyBreakdown) => {
                                if (err) {
                                    console.error(
                                        "Error fetching monthly breakdown:",
                                        err
                                    );
                                    return res.status(500).json({
                                        error: "An error occurred while calculating monthly breakdown",
                                        details: err.message,
                                    });
                                }

                                analysisResults[index] = {
                                    payment_head_id: head.payment_head_id,
                                    payment_head_name: head.payment_head_name,
                                    payment_head_description:
                                        head.payment_head_description,
                                    payment_head_amount:
                                        head.payment_head_amount,
                                    is_recurring: head.is_recurring,
                                    total_collected: totalCollected,
                                    total_pending: totalPending,
                                    collection_rate: collectionRate,
                                    total_villas: villaStats.length,
                                    paid_villas: paidVillas,
                                    unpaid_villas: unpaidVillas,
                                    partially_paid_villas: partialVillas,
                                    monthly_breakdown: monthlyBreakdown || [],
                                };

                                completedQueries++;

                                // Check if all queries are completed
                                if (completedQueries === totalQueries) {
                                    // Calculate overall statistics
                                    const overallRevenue =
                                        analysisResults.reduce(
                                            (sum, head) =>
                                                sum + head.total_collected,
                                            0
                                        );
                                    const overallPending =
                                        analysisResults.reduce(
                                            (sum, head) =>
                                                sum + head.total_pending,
                                            0
                                        );
                                    const overallExpected =
                                        overallRevenue + overallPending;
                                    const overallCollectionRate =
                                        overallExpected > 0
                                            ? (overallRevenue /
                                                  overallExpected) *
                                              100
                                            : 0;

                                    res.status(200).json({
                                        message: "success",
                                        data: {
                                            overall_stats: {
                                                total_revenue: overallRevenue,
                                                total_pending: overallPending,
                                                overall_collection_rate:
                                                    overallCollectionRate,
                                                active_payment_heads:
                                                    analysisResults.length,
                                            },
                                            payment_heads: analysisResults,
                                            date_range: {
                                                start_date: startDate,
                                                end_date: endDate,
                                            },
                                        },
                                    });
                                }
                            }
                        );
                    }
                );
            });
        });
    } catch (error) {
        console.error("Error in payment heads analysis:", error);
        res.status(500).json({
            error: error.message,
        });
    }
});

// Payment Head Reports Export API
app.get("/reports/payment-heads-export", async (req, res) => {
    const { startDate, endDate, paymentHead, format } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({
            error: "Start date and end date are required",
        });
    }

    try {
        // Build payment heads query (same as above)
        let paymentHeadsQuery = `
            SELECT DISTINCT
                ph.id AS payment_head_id,
                ph.name AS payment_head_name,
                ph.description AS payment_head_description,
                ph.amount AS payment_head_amount,
                ph.is_recurring
            FROM payment_heads ph
        `;

        let params = [];

        if (paymentHead && paymentHead !== "all") {
            paymentHeadsQuery += ` WHERE ph.id = ?`;
            params.push(paymentHead);
        }

        paymentHeadsQuery += ` ORDER BY ph.id`;

        db.all(paymentHeadsQuery, params, (err, paymentHeads) => {
            if (err) {
                console.error("Error fetching payment heads for export:", err);
                return res.status(500).json({
                    error: "An error occurred while fetching payment heads",
                    details: err.message,
                });
            }

            // For export, we'll use a simplified approach to get basic statistics
            const exportPromises = paymentHeads.map((head) => {
                return new Promise((resolve, reject) => {
                    db.all(
                        `
                        SELECT 
                            COUNT(v.id) AS total_villas,
                            COALESCE(SUM(p.amount), 0) AS total_collected,
                            (COUNT(v.id) * ?) AS total_expected
                        FROM villas v
                        LEFT JOIN payments p ON v.id = p.villa_id 
                            AND p.payment_head_id = ? 
                            AND DATE(p.payment_date) BETWEEN DATE(?) AND DATE(?)
                        `,
                        [
                            head.payment_head_amount,
                            head.payment_head_id,
                            startDate,
                            endDate,
                        ],
                        (err, result) => {
                            if (err) {
                                reject(err);
                            } else {
                                const stats = result[0];
                                const totalPending =
                                    stats.total_expected -
                                    stats.total_collected;
                                const collectionRate =
                                    stats.total_expected > 0
                                        ? (stats.total_collected /
                                              stats.total_expected) *
                                          100
                                        : 0;

                                resolve({
                                    ...head,
                                    total_collected: stats.total_collected,
                                    total_pending: totalPending,
                                    collection_rate: collectionRate,
                                    total_villas: stats.total_villas,
                                });
                            }
                        }
                    );
                });
            });

            Promise.all(exportPromises)
                .then((analysisResults) => {
                    if (format === "pdf") {
                        // Generate PDF
                        const doc = new PDFDocument({
                            margin: 30,
                            size: "A4",
                            autoFirstPage: true,
                        });

                        res.setHeader("Content-Type", "application/pdf");
                        res.setHeader(
                            "Content-Disposition",
                            `attachment; filename=payment-heads-analysis-${startDate}-to-${endDate}.pdf`
                        );

                        doc.pipe(res);

                        // Add title and period
                        doc.fontSize(16).text("Payment Head Analysis Report", {
                            align: "center",
                        });
                        doc.fontSize(10).text(
                            `Period: ${startDate} to ${endDate}`,
                            { align: "center" }
                        );
                        doc.fontSize(8).text(
                            `Generated on: ${new Date().toLocaleDateString()}`,
                            { align: "right" }
                        );
                        doc.moveDown(1.5);

                        // Add overall summary
                        const totalRevenue = analysisResults.reduce(
                            (sum, head) => sum + head.total_collected,
                            0
                        );
                        const totalPending = analysisResults.reduce(
                            (sum, head) => sum + head.total_pending,
                            0
                        );
                        const overallRate =
                            totalRevenue + totalPending > 0
                                ? (totalRevenue /
                                      (totalRevenue + totalPending)) *
                                  100
                                : 0;

                        doc.fontSize(10).text(
                            `Total Revenue: PKR ${totalRevenue.toLocaleString()}`
                        );
                        doc.text(
                            `Total Pending: PKR ${totalPending.toLocaleString()}`
                        );
                        doc.text(
                            `Overall Collection Rate: ${overallRate.toFixed(
                                1
                            )}%`
                        );
                        doc.moveDown(0.8);

                        // Define table properties
                        const headers = [
                            "Payment Head",
                            "Expected",
                            "Collected",
                            "Pending",
                            "Rate",
                            "Type",
                        ];
                        const columnWidth =
                            (doc.page.width - 60) / headers.length;
                        const rowHeight = 20;
                        let currentY = doc.y;

                        // Draw table headers
                        doc.font("Helvetica-Bold");
                        doc.fontSize(9);
                        doc.fillColor("#f0f0f0")
                            .rect(30, currentY, doc.page.width - 60, rowHeight)
                            .fill();
                        doc.fillColor("#000000");

                        headers.forEach((header, i) => {
                            doc.text(
                                header,
                                30 + i * columnWidth,
                                currentY + 3,
                                {
                                    width: columnWidth,
                                    align: "center",
                                    lineBreak: false,
                                }
                            );
                        });

                        currentY += rowHeight;
                        doc.font("Helvetica");
                        doc.fontSize(8);

                        // Draw table rows
                        analysisResults.forEach((head) => {
                            if (currentY > doc.page.height - 100) {
                                doc.addPage();
                                currentY = 50;
                            }

                            const rowData = [
                                head.payment_head_name,
                                `PKR ${(
                                    head.total_villas * head.payment_head_amount
                                ).toLocaleString()}`,
                                `PKR ${head.total_collected.toLocaleString()}`,
                                `PKR ${head.total_pending.toLocaleString()}`,
                                `${head.collection_rate.toFixed(1)}%`,
                                head.is_recurring ? "Recurring" : "One-time",
                            ];

                            rowData.forEach((data, i) => {
                                doc.text(
                                    data,
                                    30 + i * columnWidth,
                                    currentY + 3,
                                    {
                                        width: columnWidth,
                                        align:
                                            i >= 1 && i <= 4 ? "right" : "left",
                                        lineBreak: false,
                                    }
                                );
                            });

                            currentY += rowHeight;
                        });

                        doc.end();
                    } else if (format === "csv") {
                        // Generate CSV
                        res.setHeader("Content-Type", "text/csv");
                        res.setHeader(
                            "Content-Disposition",
                            `attachment; filename=payment-heads-analysis-${startDate}-to-${endDate}.csv`
                        );

                        const headers = [
                            "Payment Head",
                            "Description",
                            "Expected Amount",
                            "Collected Amount",
                            "Pending Amount",
                            "Collection Rate",
                            "Total Villas",
                            "Type",
                        ];
                        let csvContent = headers.join(",") + "\n";

                        analysisResults.forEach((head) => {
                            const expectedAmount =
                                head.total_villas * head.payment_head_amount;
                            const row = [
                                `"${head.payment_head_name}"`,
                                `"${head.payment_head_description || ""}"`,
                                `"PKR ${expectedAmount.toLocaleString()}"`,
                                `"PKR ${head.total_collected.toLocaleString()}"`,
                                `"PKR ${head.total_pending.toLocaleString()}"`,
                                `"${head.collection_rate.toFixed(1)}%"`,
                                `"${head.total_villas}"`,
                                `"${
                                    head.is_recurring ? "Recurring" : "One-time"
                                }"`,
                            ];
                            csvContent += row.join(",") + "\n";
                        });

                        // Add summary
                        const totalRevenue = analysisResults.reduce(
                            (sum, head) => sum + head.total_collected,
                            0
                        );
                        const totalPending = analysisResults.reduce(
                            (sum, head) => sum + head.total_pending,
                            0
                        );

                        csvContent += "\n";
                        csvContent += `"Summary",,,,,,,\n`;
                        csvContent += `"Total Revenue","PKR ${totalRevenue.toLocaleString()}",,,,,,\n`;
                        csvContent += `"Total Pending","PKR ${totalPending.toLocaleString()}",,,,,,\n`;
                        csvContent += `"Period","${startDate} to ${endDate}",,,,,,\n`;
                        csvContent += `"Generated","${new Date().toLocaleDateString()}",,,,,,\n`;

                        res.send(csvContent);
                    } else {
                        res.status(400).json({
                            error: "Invalid format. Use 'pdf' or 'csv'",
                        });
                    }
                })
                .catch((error) => {
                    console.error("Error in payment heads export:", error);
                    res.status(500).json({
                        error: error.message,
                    });
                });
        });
    } catch (error) {
        console.error("Error in payment heads export:", error);
        res.status(500).json({
            error: error.message,
        });
    }
});

app.get("/backupData", (req, res) => {
    db.all(
        `
        SELECT 
            p.id AS payment_id, 
            p.villa_id,
            p.payment_head_id, 
            p.amount, 
            p.payment_date,
            p.payment_month,
            p.payment_year,
            v.villa_number,
            v.resident_name,
            v.occupancy_type,
            ph.name AS payment_head_name,
            ph.description AS payment_head_description,
            ph.amount AS payment_head_amount,
            ph.is_recurring
        FROM payments p
        JOIN villas v ON p.villa_id = v.id
        JOIN payment_heads ph ON p.payment_head_id = ph.id
        ORDER BY p.id
    `,
        [],
        (err, payments) => {
            if (err) {
                console.error("Error fetching payments:", err);
                return res.status(500).json({
                    error: "An error occurred while fetching payments",
                    details: err.message,
                });
            }

            console.log(`Fetched ${payments.length} payments from database`);
            try {
                // Create a new PDF document
                const doc = new PDFDocument({
                    margin: 30,
                    size: "A4",
                    autoFirstPage: true,
                });

                // Set response headers for PDF download
                res.setHeader("Content-Type", "application/pdf");
                res.setHeader(
                    "Content-Disposition",
                    "attachment; filename=payments.pdf"
                );

                // Pipe the PDF document to the response
                doc.pipe(res);

                // Define table properties
                const headers = [
                    "Payment ID",
                    "Villa No",
                    "Resident",
                    "Payment Type",
                    "Amount Paid",
                    "Pending Amount",
                    "Date",
                ];

                const columnWidth = (doc.page.width - 60) / headers.length;
                const rowHeight = 30; // Increased row height for better readability
                const tableTop = 120;
                const tableLeft = 30;

                // Function to draw table headers
                function drawTableHeaders(doc, y) {
                    doc.font("Helvetica-Bold");

                    // Draw header background
                    doc.fillColor("#f0f0f0")
                        .rect(tableLeft, y, doc.page.width - 60, rowHeight)
                        .fill();

                    doc.fillColor("#000000");

                    // Draw header cells
                    headers.forEach((header, i) => {
                        doc.fontSize(10).text(
                            header,
                            tableLeft + i * columnWidth + 5,
                            y + 10,
                            { width: columnWidth - 10, align: "center" }
                        );
                    });

                    // Draw header lines
                    doc.strokeColor("#000000");

                    // Horizontal lines
                    doc.moveTo(tableLeft, y)
                        .lineTo(tableLeft + columnWidth * headers.length, y)
                        .stroke();

                    doc.moveTo(tableLeft, y + rowHeight)
                        .lineTo(
                            tableLeft + columnWidth * headers.length,
                            y + rowHeight
                        )
                        .stroke();

                    // Vertical lines
                    for (let i = 0; i <= headers.length; i++) {
                        doc.moveTo(tableLeft + i * columnWidth, y)
                            .lineTo(tableLeft + i * columnWidth, y + rowHeight)
                            .stroke();
                    }

                    doc.font("Helvetica");
                    return y + rowHeight;
                }

                // Function to draw a table row
                function drawTableRow(doc, y, rowData) {
                    // Check if we need a new page
                    if (y + rowHeight > doc.page.height - 50) {
                        doc.addPage();
                        y = tableTop - rowHeight; // Reset y position on new page
                        drawTableHeaders(doc, y); // Redraw headers on new page
                        y += rowHeight;
                    }

                    // Draw row cells
                    rowData.forEach((cell, i) => {
                        doc.fontSize(9).text(
                            cell !== null && cell !== undefined
                                ? cell.toString()
                                : "",
                            tableLeft + i * columnWidth + 5,
                            y + 10,
                            { width: columnWidth - 10, align: "center" }
                        );
                    });

                    // Draw row lines
                    doc.strokeColor("#000000");

                    // Horizontal line at bottom of row
                    doc.moveTo(tableLeft, y + rowHeight)
                        .lineTo(
                            tableLeft + columnWidth * headers.length,
                            y + rowHeight
                        )
                        .stroke();

                    // Vertical lines
                    for (let i = 0; i <= headers.length; i++) {
                        doc.moveTo(tableLeft + i * columnWidth, y)
                            .lineTo(tableLeft + i * columnWidth, y + rowHeight)
                            .stroke();
                    }

                    return y + rowHeight;
                }

                // Add title and date to the first page
                doc.fontSize(16).text("Payments Report", { align: "center" });
                doc.fontSize(10).text(
                    `Date: ${new Date().toLocaleDateString()}`,
                    { align: "right" }
                );
                doc.moveDown(2);

                // Initialize y position for the table
                let y = tableTop;

                // Draw table headers
                y = drawTableHeaders(doc, y);

                // Draw table rows
                payments.forEach((payment) => {
                    const rowData = [
                        payment.payment_id,
                        payment.villa_number,
                        payment.resident_name || "-",
                        payment.payment_head_name,
                        `PKR ${payment.amount.toLocaleString()}`,
                        `PKR ${(
                            payment.payment_head_amount - payment.amount
                        ).toLocaleString()}`,
                        `${new Date(
                            payment.payment_date
                        ).toLocaleDateString()} ${payment.payment_month} ${
                            payment.payment_year
                        }`,
                    ];

                    y = drawTableRow(doc, y, rowData);
                });

                // Add summary at the end
                doc.moveDown(2);
                doc.fontSize(12).text("Summary", { align: "left" });
                doc.fontSize(10).text(`Total Payments: ${payments.length}`);

                const totalAmount = payments.reduce(
                    (sum, payment) => sum + payment.amount,
                    0
                );
                doc.text(
                    `Total Amount Paid: PKR ${totalAmount.toLocaleString()}`
                );

                // Finalize the PDF and end the stream
                doc.end();
            } catch (error) {
                console.error("Error generating PDF:", error);
                res.status(500).json({
                    error: "An error occurred while generating the PDF",
                    details: error.message,
                    stack: error.stack,
                });
            }
        }
    );
});

app.put("/users/:id", async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, email } = req.body;

    // cosole.log(id, firstName);
    try {
        db.run(
            `UPDATE users SET firstName = ?, lastName = ?, email = ? WHERE id = ?`,
            [firstName, lastName, email, id],
            function (err) {
                if (err) {
                    res.status(400).json({ error: err.message });
                    return;
                }
                if (this.changes === 0) {
                    res.status(404).json({ error: "User not found" });
                    return;
                }
                res.status(200).json({
                    message: "User information updated successfully",
                    data: { id, firstName, lastName, email },
                });
            }
        );
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
});

// Change user password
app.put("/users/:id/password", async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    try {
        db.get(
            "SELECT password FROM users WHERE id = ?",
            [id],
            async (err, row) => {
                if (err) {
                    res.status(400).json({ error: err.message });
                    return;
                }
                if (!row) {
                    res.status(404).json({ error: "User not found" });
                    return;
                }

                const isMatch = await compare(currentPassword, row.password);

                if (!isMatch) {
                    res.status(400).json({
                        error: "Current password is incorrect",
                    });
                    return;
                }

                const salt = await genSalt(10);
                const hashedNewPassword = await hash(newPassword, salt);

                db.run(
                    `UPDATE users SET password = ? WHERE id = ?`,
                    [hashedNewPassword, id],
                    function (err) {
                        if (err) {
                            res.status(400).json({ error: err.message });
                            return;
                        }
                        res.status(200).json({
                            message: "Password updated successfully",
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

export default app;
