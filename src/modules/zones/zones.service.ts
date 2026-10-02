import { prisma } from '../../db/prisma.js';

export class ZonesService {
  async getAllZones() {
    return prisma.zone.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getDistanceBetweenZones(fromZoneId: number, toZoneId: number) {
    return prisma.zoneDistance.findUnique({
      where: {
        fromZoneId_toZoneId: {
          fromZoneId,
          toZoneId,
        },
      },
    });
  }
}

export const zonesService = new ZonesService();
