const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Read loads.json file
  const loadsPath = path.join(__dirname, '..', 'data', 'loads.json');
  const loadsData = JSON.parse(fs.readFileSync(loadsPath, 'utf-8'));

  // Clear existing data
  await prisma.load.deleteMany();
  console.log('✅ Cleared existing loads');

  // Insert the 25 loads
  for (const load of loadsData) {
    await prisma.load.create({
      data: {
        load_id: load.load_id,
        origin: load.origin,
        destination: load.destination,
        pickup_datetime: new Date(load.pickup_datetime),
        delivery_datetime: new Date(load.delivery_datetime),
        equipment_type: load.equipment_type,
        loadboard_rate: load.loadboard_rate,
        notes: load.notes,
        weight: load.weight,
        commodity_type: load.commodity_type,
        num_of_pieces: load.num_of_pieces,
        miles: load.miles,
        dimensions: load.dimensions,
      },
    });
  }

  console.log(`✅ Seeded ${loadsData.length} loads`);
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
