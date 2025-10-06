import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

export async function autoSeedDatabase(): Promise<void> {
  try {
    // Check if database already has loads
    const loadCount = await prisma.load.count();

    if (loadCount > 0) {
      console.log(`ℹ️  Database already contains ${loadCount} loads, skipping auto-seed`);
      return;
    }

    console.log('🌱 Database is empty, auto-seeding...');

    // Read loads.json file
    const loadsPath = path.join(__dirname, '..', '..', 'data', 'loads.json');
    const loadsData = JSON.parse(fs.readFileSync(loadsPath, 'utf-8'));

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

    console.log(`✅ Auto-seeded ${loadsData.length} loads successfully`);
  } catch (error) {
    console.error('❌ Auto-seed failed:', error);
    console.error('⚠️  Application will continue, but database may be empty');
    // Don't throw - we don't want to crash the app if seed fails
  } finally {
    await prisma.$disconnect();
  }
}
