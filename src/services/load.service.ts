import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface LoadSearchParams {
  origin?: string;
  destination?: string;
  equipment_type?: string;
}

export class LoadService {
  async searchLoads(params: LoadSearchParams) {
    const { origin, destination, equipment_type } = params;

    console.log('🔍 Searching loads with params:', params);

    // Build dynamic where clause
    const where: any = {};

    if (origin) {
      where.origin = {
        contains: origin,
        mode: 'insensitive', // Case-insensitive search
      };
    }

    if (destination) {
      where.destination = {
        contains: destination,
        mode: 'insensitive',
      };
    }

    if (equipment_type) {
      where.equipment_type = {
        equals: equipment_type,
        mode: 'insensitive',
      };
    }

    const loads = await prisma.load.findMany({
      where,
      orderBy: {
        pickup_datetime: 'asc', // Order by pickup date
      },
    });

    console.log(`✅ Found ${loads.length} loads`);

    return loads;
  }

  async getLoadById(loadId: string) {
    console.log(`🔍 Fetching load: ${loadId}`);

    const load = await prisma.load.findUnique({
      where: { load_id: loadId },
    });

    if (!load) {
      console.log(`❌ Load not found: ${loadId}`);
      return null;
    }

    console.log(`✅ Load found: ${load.load_id}`);
    return load;
  }
}

export const loadService = new LoadService();
