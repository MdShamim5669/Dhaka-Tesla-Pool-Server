import { prisma } from '../../db/prisma.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';

export class DriversService {
  async setAvailability(driverUserId: string, isOnline: boolean) {
    const driver = await prisma.driver.findUnique({
      where: { userId: driverUserId },
      include: { tesla: true },
    });

    if (!driver) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Driver record not found');
    }

    if (!driver.tesla && isOnline) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Cannot go online without an assigned Tesla');
    }

    return prisma.driver.update({
      where: { userId: driverUserId },
      data: { isOnline },
      include: { tesla: true },
    });
  }

  async getMyTesla(driverUserId: string) {
    const tesla = await prisma.tesla.findUnique({
      where: { driverId: driverUserId },
    });

    if (!tesla) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'No Tesla assigned to this driver');
    }

    return tesla;
  }

  async updateLocation(driverUserId: string, data: { lat: number; lng: number; heading?: number }) {
    const driver = await prisma.driver.findUnique({
      where: { userId: driverUserId },
    });

    if (!driver) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Driver record not found');
    }

    return prisma.driver.update({
      where: { userId: driverUserId },
      data: {
        currentLat: data.lat,
        currentLng: data.lng,
        heading: data.heading ?? driver.heading,
        lastLocationUpdate: new Date(),
      },
      select: {
        userId: true,
        currentLat: true,
        currentLng: true,
        heading: true,
        lastLocationUpdate: true,
      },
    });
  }

  async getLiveDriversMap() {
    const drivers = await prisma.driver.findMany({
      where: { isOnline: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        tesla: true,
      },
    });

    return drivers.map((d) => ({
      driverId: d.userId,
      driverName: d.user.name,
      phone: d.user.phone,
      isOnline: d.isOnline,
      currentLocation: {
        lat: d.currentLat,
        lng: d.currentLng,
        heading: d.heading,
        lastUpdated: d.lastLocationUpdate,
      },
      tesla: d.tesla
        ? {
            name: d.tesla.name,
            plateNo: d.tesla.plateNo,
            capacity: d.tesla.capacity,
          }
        : null,
    }));
  }
}

export const driversService = new DriversService();
