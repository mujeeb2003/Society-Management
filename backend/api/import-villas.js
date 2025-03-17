import fs from "fs";
import xlsx from "xlsx";
// const sqlite3 = require('sqlite3').verbose();
import { db } from "./app.js";
// Open the SQLite database
// const db = new sqlite3.Database('your-database.db');

// Read the Excel file
const workbook = xlsx.readFile("./Data FGP.xlsx");
const worksheet = workbook.Sheets[workbook.SheetNames[0]];

// Convert the Excel data to an array of objects
const data = xlsx.utils.sheet_to_json(worksheet);

// console.log(data[1]);
// // Insert the data into the Villas table
db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    data.forEach((row) => {
        const {
            "S.NO": sNo,
            "VILLA NUMBER": villaNumber,
            "OWNER": ownerName,
            "CURRENT OCCUPANCY": residentName
        } = row;
        console.log(sNo,villaNumber,ownerName,residentName);


        if(residentName == "N/A" || ownerName == "N/A" || villaNumber == "N/A") return;
        db.run(
            `INSERT INTO Villas (villa_number, resident_name, occupancy_type) VALUES (?, ?, ?)`,
            [
                villaNumber,
                residentName == "N/A" ? null : residentName,
                residentName == ownerName ? "owner" : "tenant"
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
