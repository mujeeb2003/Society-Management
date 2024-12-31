import fs from "fs";
import xlsx from "xlsx";
// const sqlite3 = require('sqlite3').verbose();
import { db } from "./app.js";
// Open the SQLite database
// const db = new sqlite3.Database('your-database.db');

// Read the Excel file
const workbook = xlsx.readFile("../maintenance.xlsx");
const worksheet = workbook.Sheets[workbook.SheetNames[0]];

// Convert the Excel data to an array of objects
const data = xlsx.utils.sheet_to_json(worksheet);

// Insert the data into the Villas table
db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    data.forEach((row) => {
        const {
            "S.NO": sNo,
            "VILLA NUMBER": villaNumber,
            "NAME OF RESIDENTS": residentName,
            "OWNER / TENANT": occupancyType,
        } = row;
        console.log(row);

        db.run(
            `INSERT INTO Villas (villa_number, resident_name, occupancy_type, Payable) VALUES (?, ?, ?, ?)`,
            [
                villaNumber,
                residentName == "N/A" ? null : residentName,
                occupancyType == "N/A"
                    ? null
                    : String(occupancyType).toLowerCase(),
                residentName == "N/A" ? null : 5000,
            ],
            (err) => {
                if (err) {
                    console.error("Error inserting data:", err);
                }
            }
        );
    });

    db.run("COMMIT");
});

db.close();
console.log("Data imported successfully!");
