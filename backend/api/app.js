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
        db.all("select * from payments", [], (err, rows) => {
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
    const { villa_number,resident_name, occupancy_type } =
        req.body;
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
    const { villa_number, resident_name, occupancy_type } =
        req.body;
    try {
        db.run(
            `UPDATE villas SET villa_number = ?, resident_name = ?, occupancy_type = ? WHERE id = ?`,
            [villa_number,resident_name, occupancy_type, id],
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
                JSON_GROUP_ARRAY(
                    JSON_OBJECT('latest_payment', p.amount, 'latest_payment_date', p.payment_date,'latest_payment_month',p.payment_month, 'payment_year', p.payment_year, 'payment_id', p.id,
                    'payment_head_id', ph.id,
                    'payment_head_name', ph.name,
                    'payment_head_amount',ph.amount
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
                    row.Payments = JSON.parse(row.Payments);
                    row.Payments.sort((a, b) => {
                        return (
                            new Date(b.latest_payment_date) -
                            new Date(a.latest_payment_date)
                        );
                    });
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

        db.get(
            `SELECT * FROM payment_heads WHERE id = ?`,
            [payment_head_id],
            function (err, paymentHead) {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }

                if (!paymentHead) {
                    return res
                        .status(400)
                        .json({ error: "Invalid payment head" });
                }

                if (amount > paymentHead.amount) {
                    res.status(400).json({
                        error: "Amount exceeds the payment head's amount",
                    });
                    return;
                }

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
                            res.status(400).json({ error: err.message });
                            return;
                        }

                        res.status(200).json({
                            message: "success",
                            data: { id: this.lastID },
                        });
                    }
                );
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/backupData", (req, res) => {
    db.all(
        `
        SELECT 
            p.id AS payment_id, 
            p.villa_id, 
            p.amount, 
            p.payment_date, 
            v.villa_number, 
            v.owner_name, 
            v.resident_name,
            v.Payable
        FROM payments p
        JOIN villas v ON p.villa_id = v.id
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
                const doc = new PDFDocument({ margin: 30, size: "A4" });

                // Set response headers for PDF download
                res.setHeader("Content-Type", "application/pdf");
                res.setHeader(
                    "Content-Disposition",
                    "attachment; filename=payments.pdf"
                );

                // Pipe the PDF document to the response
                doc.pipe(res);

                // Add content to the PDF
                doc.fontSize(16).text("Payments Report", { align: "center" });
                doc.fontSize(10).text(
                    `Date: ${new Date().toLocaleDateString()}`,
                    { align: "right" }
                );
                doc.moveDown(1);

                // Create a table
                const table = {
                    headers: [
                        "Payment ID",
                        "Villa No",
                        "Owner",
                        "Resident",
                        "Amount Paid",
                        "Pending Amount",
                        "Date",
                    ],
                    rows: payments.map((payment) => [
                        payment.payment_id,
                        payment.villa_number,
                        payment.owner_name,
                        payment.resident_name,
                        payment.amount,
                        (payment.Payable - payment.amount) | 0,
                        payment.payment_date,
                    ]),
                };

                // Draw table headers
                const columnWidth = doc.page.width / table.headers.length - 10;
                let yPosition = doc.y;
                table.headers.forEach((header, i) => {
                    doc.fontSize(12).text(
                        header,
                        30 + i * columnWidth,
                        yPosition,
                        { width: columnWidth, align: "center" }
                    );
                    doc.rect(30 + i * columnWidth, yPosition, columnWidth, 20);
                });
                doc.moveDown(1);

                // Draw table rows
                table.rows.forEach((row) => {
                    yPosition = doc.y;
                    row.forEach((cell, i) => {
                        doc.fontSize(10).text(
                            cell ? cell.toString() : "",
                            30 + i * columnWidth,
                            yPosition,
                            { width: columnWidth, align: "center" }
                        );
                        doc.rect(
                            30 + i * columnWidth,
                            yPosition,
                            columnWidth,
                            20
                        );
                    });
                    doc.moveDown(1);
                });

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
