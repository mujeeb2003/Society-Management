import fs from "fs";
import xlsx from "xlsx";
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function importVillas() {
  try {
    console.log('📊 Reading Excel file...');
    
    // Read the Excel file
    const workbook = xlsx.readFile("./prisma/Book1.xlsx");
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log(`📋 Found ${data.length} rows in Excel file`);

    let importedCount = 0;
    let skippedCount = 0;

    for (const row of data) {
      const {
        "S.NO": sNo,
        "VILLA NUMBER": villaNumber,
        "OWNER": ownerName,
        "CURRENT OCCUPANCY": residentName
      } = row;

      // Skip invalid rows
      if (!villaNumber || villaNumber === "N/A") {
        console.log(`⏭️ Skipping row ${sNo}: Invalid villa number`);
        skippedCount++;
        continue;
      }

      try {
        // Determine occupancy type
        let occupancyType = 'VACANT';
        let finalResidentName = null;

        if (residentName && residentName !== "N/A") {
          finalResidentName = residentName;
          occupancyType = (residentName === ownerName) ? 'OWNER' : 'TENANT';
        } else if (ownerName && ownerName !== "N/A") {
          finalResidentName = ownerName;
          occupancyType = 'OWNER';
        }

        // Insert villa using Prisma
        await prisma.villa.upsert({
          where: { villaNumber: villaNumber },
          update: {
            residentName: finalResidentName,
            occupancyType: occupancyType
          },
          create: {
            villaNumber: villaNumber,
            residentName: finalResidentName,
            occupancyType: occupancyType
          }
        });

        console.log(`✅ Imported villa ${villaNumber} (${occupancyType})`);
        importedCount++;

      } catch (error) {
        console.error(`❌ Error importing villa ${villaNumber}:`, error.message);
        skippedCount++;
      }
    }

    console.log(`\n🎉 Villa import completed!`);
    console.log(`   • ✅ Imported: ${importedCount} villas`);
    console.log(`   • ⏭️ Skipped: ${skippedCount} villas`);

  } catch (error) {
    console.error('❌ Error during villa import:', error);
    throw error;
  }
}

// Run the import
importVillas()
  .then(() => {
    console.log('🏁 Villa import finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Villa import failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });