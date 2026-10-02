import { prisma } from '../../db/prisma.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { zonesService } from '../zones/zones.service.js';
import { calculateFare } from '../fares/fares.service.js';
import { CreateRideInput } from './rides.schema.js';
import { RideRequestStatus, Prisma } from '@prisma/client';

export class RidesService {
  async createRide(passengerId: string, data: CreateRideInput, idempotencyKey?: string) {
    if (idempotencyKey) {
      const existing = await prisma.rideRequest.findUnique({
        where: {
          passengerId_idempotencyKey: {
            passengerId,
            idempotencyKey,
          },
        },
      });
      if (existing) {
        return existing;
      }
    }

    const distanceRecord = await zonesService.getDistanceBetweenZones(data.pickupZoneId, data.destZoneId);
    if (!distanceRecord) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Distance between selected zones not found');
    }

    const fare = calculateFare(distanceRecord.distanceM, data.seats, false);

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const ride = await tx.rideRequest.create({
        data: {
          passengerId,
          pickupZoneId: data.pickupZoneId,
          destZoneId: data.destZoneId,
          seats: data.seats,
          status: 'REQUESTED',
          distanceM: distanceRecord.distanceM,
          estimatedFarePaisa: fare.totalFarePaisa,
          fareBreakdown: fare as any,
          paymentMethod: data.paymentMethod,
          idempotencyKey,
        },
        include: {
          pickupZone: true,
          destZone: true,
        },
      });

      await tx.rideStatusHistory.create({
        data: {
          rideRequestId: ride.id,
          fromStatus: 'REQUESTED',
          toStatus: 'REQUESTED',
          actorUserId: passengerId,
          reason: 'Ride requested by passenger',
        },
      });

      return ride;
    });
  }

  async getPassengerRides(passengerId: string, page = 1, limit = 20, status?: RideRequestStatus) {
    const skip = (page - 1) * limit;
    const where: any = { passengerId };
    if (status) where.status = status;

    const [total, rides] = await Promise.all([
      prisma.rideRequest.count({ where }),
      prisma.rideRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          pickupZone: true,
          destZone: true,
        },
      }),
    ]);

    return { rides, total, page, limit };
  }

  async getRideDetails(passengerId: string, rideId: string) {
    const ride = await prisma.rideRequest.findUnique({
      where: { id: rideId },
      include: {
        pickupZone: true,
        destZone: true,
        poolMember: {
          include: {
            pool: {
              include: {
                tesla: {
                  include: {
                    driver: {
                      include: {
                        user: { select: { name: true, phone: true } },
                      },
                    },
                  },
                },
                _count: {
                  select: { members: { where: { leftAt: null } } },
                },
              },
            },
          },
        },
        payment: true,
      },
    });

    if (!ride || ride.passengerId !== passengerId) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Ride not found');
    }

    // Per PRD: passenger sees only co-passenger count, not other passenger details
    const coPassengerCount = ride.poolMember?.pool?._count?.members
      ? Math.max(0, ride.poolMember.pool._count.members - 1)
      : 0;

    return {
      ...ride,
      coPassengerCount,
    };
  }

  async cancelRide(passengerId: string, rideId: string, reason?: string) {
    const ride = await prisma.rideRequest.findUnique({
      where: { id: rideId },
      include: { poolMember: true },
    });

    if (!ride || ride.passengerId !== passengerId) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Ride not found');
    }

    if (ride.status === 'STARTED' || ride.status === 'COMPLETED' || ride.status === 'CANCELLED') {
      throw new AppError(
        409,
        ERROR_CODES.INVALID_STATE_TRANSITION,
        `Cannot cancel ride with status '${ride.status}'`
      );
    }

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.rideRequest.update({
        where: { id: rideId },
        data: {
          status: 'CANCELLED',
          cancelledBy: passengerId,
          cancelReason: reason || 'Cancelled by passenger',
        },
      });

      // If matched into a pool, release seats and mark member left
      if (ride.poolMember && !ride.poolMember.leftAt) {
        await tx.poolMember.update({
          where: { id: ride.poolMember.id },
          data: { leftAt: new Date() },
        });

        await tx.$executeRaw`
          UPDATE pools
          SET seats_occupied = GREATEST(0, seats_occupied - ${ride.seats})
          WHERE id = ${ride.poolMember.poolId}::uuid
        `;
      }

      await tx.rideStatusHistory.create({
        data: {
          rideRequestId: ride.id,
          poolId: ride.poolMember?.poolId,
          fromStatus: ride.status,
          toStatus: 'CANCELLED',
          actorUserId: passengerId,
          reason: reason || 'Cancelled by passenger',
        },
      });

      return updated;
    });
  }

  async getRideLiveTracking(passengerId: string, rideId: string) {
    const ride = await prisma.rideRequest.findUnique({
      where: { id: rideId },
      include: {
        pickupZone: true,
        destZone: true,
        poolMember: {
          include: {
            pool: {
              include: {
                driver: {
                  include: {
                    user: { select: { name: true, phone: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!ride || ride.passengerId !== passengerId) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Ride not found');
    }

    const driver = ride.poolMember?.pool?.driver;

    return {
      rideId: ride.id,
      status: ride.status,
      pickupZone: ride.pickupZone,
      destZone: ride.destZone,
      driver: driver
        ? {
            id: driver.userId,
            name: driver.user.name,
            phone: driver.user.phone,
            isOnline: driver.isOnline,
            currentLocation: {
              lat: driver.currentLat,
              lng: driver.currentLng,
              heading: driver.heading,
              lastUpdated: driver.lastLocationUpdate,
            },
          }
        : null,
    };
  }
}

export const ridesService = new RidesService();
