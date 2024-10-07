import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { verbose } = sqlite3;
const SQLite3 = verbose();

// Open database connection
const db = new SQLite3.Database(join(__dirname, 'db', 'society_payments.db'), (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the society payments database.');
    }
});

// Create tables
db.serialize(() => {
    // Villas table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        password TEXT NOT NULL
    )`);
        
    db.run(`CREATE TABLE IF NOT EXISTS villas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        villa_number TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        tenant_type TEXT NOT NULL CHECK(tenant_type IN ('owner', 'tenant')),
        created_at TEXT NOT NULL
    )`);

    //     // Payments table
    db.run(`CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        villa_id INTEGER,
        payable REAL NOT NULL,
        amount_paid REAL NOT NULL,
        payment_date TEXT NOT NULL,
        month TEXT NOT NULL,
        payment_type TEXT NOT NULL CHECK(payment_type IN ('received', 'pending')),
        FOREIGN KEY (villa_id) REFERENCES villas (id)
    )`);
                
    console.log('Database schema created successfully');
});
        
        // Close the database connection
db.close((err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Closed the database connection.');
    }
});


