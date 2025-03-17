import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { verbose } = sqlite3;
const SQLite3 = verbose();

export default function setupDB() {
    // Open database connection
    const db = new SQLite3.Database(
        join(__dirname, "../db", "society_payments.db"),
        (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log("Connected to the society payments database.");
            }
        }
    );

    // Create tables
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        password TEXT NOT NULL
    )`);

        db.run(`CREATE TABLE IF NOT EXISTS payment_heads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        is_recurring BOOLEAN NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

        db.run(`CREATE TABLE IF NOT EXISTS villas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        villa_number TEXT NOT NULL UNIQUE,
        resident_name TEXT,
        occupancy_type TEXT CHECK(occupancy_type IN ('owner', 'tenant'))
    )`);

        db.run(`CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        villa_id INTEGER,
        amount REAL NOT NULL,
        payment_date TEXT NOT NULL,
        payment_month TEXT NOT NULL,
        payment_year INTEGER NOT NULL,
        payment_head_id INTEGER,
        FOREIGN KEY (payment_head_id) REFERENCES payment_heads (id)
        FOREIGN KEY (villa_id) REFERENCES villas (id)
    )`);

        // db.run(`ALTER TABLE payments ADD COLUMN payment_head_id INTEGER`)
        // db.run(`ALTER TABLE payments ADD FOREIGN KEY (payment_head_id) REFERENCES payment_heads (id)`)

        //                 db.run(`INSERT INTO villas (villa_number, owner_name, resident_name, occupancy_type, Payable) VALUES
        //     ('A-101', 'John Doe', 'John Doe', 'owner', 5000),
        //     ('B-202', 'Jane Smith', 'Alice Johnson', 'tenant', 5000),
        //     ('C-303', 'Bob Brown', 'Bob Brown', 'owner', 5000)
        // `);

        //                     db.run(`INSERT INTO payments (villa_id, amount, payment_date, payment_month, payment_year) VALUES
        //     (1, 5000, '2024-10-05', 'October', 2024),
        //     (1, 5000, '2024-11-01', 'November', 2024),
        //     (2, 4500, '2024-10-03', 'October', 2024),
        //     (2, 4500, '2024-11-01', 'November', 2024),
        //     (3, 5500, '2024-10-10', 'October', 2024),
        //     (3, 5500, '2024-11-01', 'November', 2024)
        // `);

        console.log("Database schema created successfully");
    });

    // Close the database connection
    db.close((err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log("Closed the database connection.");
        }
    });
}

// setupDB();