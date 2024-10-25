import express, { json, text } from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import { dirname, format, join } from "path";
import { genSalt, hash, compare } from "bcrypt";
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

export const app = express();
const port = process.env.PORT || 5001;

const { verbose } = sqlite3;
export const SQLite3 = verbose();

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
    const { villa_number, owner_name, resident_name, occupancy_type, Payable } =
    req.body;
    try {
        db.run(
            `INSERT INTO villas (villa_number, owner_name, resident_name, occupancy_type, Payable) VALUES (?, ?, ?, ?, ?)`,
            [villa_number, owner_name, resident_name, occupancy_type, Payable],
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
    const { villa_number, owner_name, resident_name, occupancy_type, Payable } =
    req.body;
    try {
        db.run(
            `UPDATE villas SET villa_number = ?, owner_name = ?, resident_name = ?, occupancy_type = ?, Payable = ? WHERE id = ?`,
            [
                villa_number,
                owner_name,
                resident_name,
                occupancy_type,
                Payable,
                id,
            ],
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

app.get("/payments", (req, res) => {
    try {
        db.all(
            `
            SELECT
                v.id,
                v.villa_number,
                v.resident_name,
                v.occupancy_type,
                v.Payable,
                JSON_GROUP_ARRAY(
                    JSON_OBJECT('latest_payment', p.amount, 'latest_payment_date', p.payment_date, 'payment_id', p.id)
                ) AS Payments
            FROM villas AS v
            LEFT JOIN payments AS p ON v.id = p.villa_id
            GROUP BY v.villa_number, v.resident_name, v.occupancy_type, v.Payable
            ORDER BY v.villa_number
        `,
            [],
            (err, rows) => {
                if (err) {
                    res.status(400).json({ error: err.message });
                    return;
                }
                
                rows.forEach((villa) => {
                    villa.Payments = JSON.parse(villa.Payments);
                    villa.Payments.sort((a, b) => {
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
        const { villa_id, amount, payment_date, payment_month, payment_year } =
        req.body;
        
        db.all(
            `SELECT * FROM villas WHERE id = ?`,
            [villa_id],
            function (err, Villa) {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }
                
                const VillaData = Villa[0]; // Assuming you expect only one result
                
                if (amount > VillaData.Payable) {
                    res.status(400).json({
                        error: "Amount exceeds the villa's payable amount",
                    });
                    return;
                }
                
                db.run(
                    `INSERT INTO payments (villa_id, amount, payment_date, payment_month, payment_year) VALUES (?, ?, ?, ?, ?)`,
                    [
                        villa_id,
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

app.get('/backupData', (req, res) => {
    db.all(`
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
    `, [], (err, payments) => {
        if (err) {
            console.error('Error fetching payments:', err);
            return res.status(500).json({ error: 'An error occurred while fetching payments', details: err.message });
        }

        console.log(`Fetched ${payments.length} payments from database`);
        try {
            // Create a new PDF document
            const doc = new PDFDocument({ margin: 30, size: 'A4' });

            // Set response headers for PDF download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=payments.pdf');

            // Pipe the PDF document to the response
            doc.pipe(res);

            // Add content to the PDF
            doc.fontSize(16).text('Payments Report', { align: 'center' });
            doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
            doc.moveDown(1);

            // Create a table
            const table = {
                headers: ['Payment ID', 'Villa No', 'Owner', 'Resident', 'Amount Paid', 'Pending Amount', 'Date'],
                rows: payments.map(payment => [
                    payment.payment_id,
                    payment.villa_number,
                    payment.owner_name,
                    payment.resident_name,
                    payment.amount,
                    payment.Payable - payment.amount | 0,
                    payment.payment_date
                ])
            };

            // Draw table headers
            const columnWidth = doc.page.width / table.headers.length - 10;
            let yPosition = doc.y;
            table.headers.forEach((header, i) => {
                doc.fontSize(12).text(header, 30 + (i * columnWidth), yPosition, { width: columnWidth, align: 'center' });
                doc.rect(30 + (i * columnWidth), yPosition, columnWidth, 20);
            });
            doc.moveDown(1);

            // Draw table rows
            table.rows.forEach(row => {
                yPosition = doc.y;
                row.forEach((cell, i) => {
                    doc.fontSize(10).text(cell ? cell.toString() : '', 30 + (i * columnWidth), yPosition, { width: columnWidth, align: 'center' });
                    doc.rect(30 + (i * columnWidth), yPosition, columnWidth, 20);
                });
                doc.moveDown(1);
            });


            // Finalize the PDF and end the stream
            doc.end();

        } catch (error) {
            console.error('Error generating PDF:', error);
            res.status(500).json({ 
                error: 'An error occurred while generating the PDF',
                details: error.message,
                stack: error.stack
            });
        }
    });
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
        db.get("SELECT password FROM users WHERE id = ?", [id], async (err, row) => {
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
                res.status(400).json({ error: "Current password is incorrect" });
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
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
