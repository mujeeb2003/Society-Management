import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  // Create payment categories
  console.log('🗂️ Creating payment categories...');
  
  const categories = await Promise.all([
    prisma.paymentCategory.upsert({
      where: { name: 'Maintenance Fee' },
      update: {},
      create: {
        name: 'Maintenance Fee',
        description: 'Monthly maintenance charges for common areas and services',
        isRecurring: true
      }
    }),
    prisma.paymentCategory.upsert({
      where: { name: 'Water Connection 5000/-' },
      update: {},
      create: {
        name: 'Water Connection 5000/-',
        description: 'New water connection charges 5000/-',
        isRecurring: false
      }
    }),
    prisma.paymentCategory.upsert({
      where: { name: 'Water Connection 2000/-' },
      update: {},
      create: {
        name: 'Water Connection 2000/-',
        description: 'New water connection charges 2000/-',
        isRecurring: false
      }
    }),
    
  ]);

  console.log('✅ Basic seed data created successfully!');
  console.log(`📊 Created:`);
  console.log(`   • ${categories.length} payment categories`);
  console.log('\n🔄 Run the import scripts to add villas and payments:');
  console.log('   • npm run import:villas');
  console.log('   • npm run import:onetime');
  console.log('   • npm run import:payments');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });