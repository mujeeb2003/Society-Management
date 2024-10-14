import express, { json } from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import { dirname, join, parse } from "path";
import { genSalt, hash, compare } from "bcrypt";
import { all } from "axios";
const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

export const app = express();
const port = process.env.PORT || 5000;

const { verbose } = sqlite3;
export const SQLite3 = verbose();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
export const db = new SQLite3.Database(
    join(__dirname, "db", "society_payments.db"),
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

app.delete("/users/:id", (req, res) => {
    const { id } = req.params;
    try {
        db.run("DELETE FROM users WHERE id=?", [id], function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.status(200).json({
                message: "success",
                data: { id: id },
            });
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post("/villas", (req, res) => {
    const { villa_number, owner_name, tenant_type } = req.body;
    try {
        db.run(
            `INSERT INTO villas (villa_number, owner_name, tenant_type) VALUES (?, ?, ?)`,
            [villa_number, owner_name, tenant_type],
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
                        return new Date(b.latest_payment_date) - new Date(a.latest_payment_date);
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
        const { villa_id, amount, payment_date, payment_month, payment_year } = req.body;
        
        db.all(`SELECT * FROM villas WHERE id = ?`, [villa_id], function (err, Villa) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            
            const VillaData = Villa[0]; // Assuming you expect only one result
            
            if (amount > VillaData.Payable) {
                res.status(400).json({ error: "Amount exceeds the villa's payable amount" });
                return; 
            }
            
            db.run(
                `INSERT INTO payments (villa_id, amount, payment_date, payment_month, payment_year) VALUES (?, ?, ?, ?, ?)`,
                [villa_id, amount, payment_date, payment_month, payment_year],
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
        });
        
    } catch (error) {
        res.status(500).json({error:error.message});
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
