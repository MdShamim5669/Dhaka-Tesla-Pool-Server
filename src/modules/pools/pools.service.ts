import { prisma } from '../../db/prisma.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { calculateFare } from '../fares/fares.service.js';

export class PoolsService {
  async getDriverTesla(driverUserId: string) {
    const tesla = await prisma.tesla.findUnique({
      where: { driverId: driverUserId },
      include: { driver: true },
    });

    if (!tesla) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'No Tesla assigned to this driver');
    }
    return tesla;
  }

  async getCompatibleRequests(driverUserId: string) {
    const tesla = await this.getDriverTesla(driverUserId);
    if (!tesla.driver.isOnline) {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'Driver must be online to view requests');
    }

    // Check if driver has an active pool
    const activePool = await prisma.pool.findFirst({
      where: {
        teslaId: tesla.id,
        status: { in: ['ACCEPTED', 'DRIVER_ARRIVED', 'STARTED'] },
      },
      include: {
        members: { where: { leftAt: null } },
      },
    });

    if (activePool && activePool.status === 'STARTED') {
      // Driver cannot take new requests while mid-trip
      return [];
    }

    if (activePool && activePool.status === 'ACCEPTED') {
      const remainingSeats = tesla.capacity - activePool.seatsOccupied;
      if (remainingSeats <= 0) {
        return [];
      }

      // Filter by pool anchor: same pickup and same corridor
      return prisma.rideRequest.findMany({
        where: {
          status: 'REQUESTED',
          pickupZoneId: activePool.pickupZoneId,
          destZone: { corridor: activePool.corridor },
          seats: { lte: remainingSeats },
        },
        include: {
          passenger: { select: { id: true, name: true, phone: true } },
          pickupZone: true,
          destZone: true,
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    // If no active pool, driver can see all REQUESTED rides whose seats <= tesla capacity
    return prisma.rideRequest.findMany({
      where: {
        status: 'REQUESTED',
        seats: { lte: tesla.capacity },
      },
      include: {
        passenger: { select: { id: true, name: true, phone: true } },
        pickupZone: true,
        destZone: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async acceptRequest(driverUserId: string, rideRequestId: string) {
    const tesla = await this.getDriverTesla(driverUserId);
    if (!tesla.driver.isOnline) {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'Driver is offline');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Fetch ride request
      const ride = await tx.rideRequest.findUnique({
        where: { id: rideRequestId },
        include: { destZone: true },
      });

      if (!ride) {
        throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Ride request not found');
      }

      if (ride.status !== 'REQUESTED') {
        throw new AppError(409, ERROR_CODES.INVALID_STATE_TRANSITION, 'Ride is no longer available');
      }

      if (ride.seats > tesla.capacity) {
        throw new AppError(400, ERROR_CODES.SEAT_UNAVAILABLE, 'Ride requests more seats than vehicle capacity');
      }

      // 2. Check active pool
      const activePool = await tx.pool.findFirst({
        where: {
          teslaId: tesla.id,
          status: { in: ['ACCEPTED', 'DRIVER_ARRIVED', 'STARTED'] },
        },
      });

      if (activePool && activePool.status !== 'ACCEPTED') {
        throw new AppError(409, ERROR_CODES.INVALID_STATE_TRANSITION, 'Cannot join pool after driver arrival or trip start');
      }

      let poolId: string;

      if (!activePool) {
        // Create new pool
        const newPool = await tx.pool.create({
          data: {
            teslaId: tesla.id,
            status: 'ACCEPTED',
            pickupZoneId: ride.pickupZoneId,
            corridor: ride.destZone.corridor,
            seatsOccupied: ride.seats,
            capacity: tesla.capacity,
          },
        });
        poolId = newPool.id;
      } else {
        // Compatibility check
        if (
          activePool.pickupZoneId !== ride.pickupZoneId ||
          activePool.corridor !== ride.destZone.corridor
        ) {
          throw new AppError(409, ERROR_CODES.NOT_COMPATIBLE, 'Ride request is not compatible with current pool');
        }

        // Concurrency-safe atomic UPDATE with capacity check
        const updateResult = await tx.$executeRaw`
          UPDATE pools
          SET seats_occupied = seats_occupied + ${ride.seats}
          WHERE id = ${activePool.id}::uuid
            AND status = 'ACCEPTED'
            AND seats_occupied + ${ride.seats} <= capacity
        `;

        if (updateResult === 0) {
          throw new AppError(409, ERROR_CODES.SEAT_UNAVAILABLE, 'No free seats available in this pool');
        }
        poolId = activePool.id;
      }

      // Add pool member
      await tx.poolMember.create({
        data: {
          poolId,
          rideRequestId: ride.id,
          seats: ride.seats,
        },
      });

      // Update ride request to MATCHED
      const updatedRide = await tx.rideRequest.update({
        where: { id: ride.id },
        data: { status: 'MATCHED' },
      });

      // Record audit history
      await tx.rideStatusHistory.create({
        data: {
          rideRequestId: ride.id,
          poolId,
          fromStatus: 'REQUESTED',
          toStatus: 'MATCHED',
          actorUserId: driverUserId,
          reason: 'Accepted by driver',
        },
      });

      return { poolId, ride: updatedRide };
    });
  }

  async getCurrentPool(driverUserId: string) {
    const tesla = await this.getDriverTesla(driverUserId);
    const pool = await prisma.pool.findFirst({
      where: {
        teslaId: tesla.id,
        status: { in: ['ACCEPTED', 'DRIVER_ARRIVED', 'STARTED'] },
      },
      include: {
        pickupZone: true,
        members: {
          where: { leftAt: null },
          include: {
            rideRequest: {
              include: {
                passenger: { select: { id: true, name: true, phone: true } },
                destZone: true,
              },
            },
          },
        },
      },
    });

    return pool;
  }

  async markDriverArrived(driverUserId: string, poolId: string) {
    const tesla = await this.getDriverTesla(driverUserId);
    return prisma.$transaction(async (tx) => {
      const pool = await tx.pool.findUnique({
        where: { id: poolId },
        include: { members: { where: { leftAt: null } } },
      });

      if (!pool || pool.teslaId !== tesla.id) {
        throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Pool not found');
      }

      if (pool.status !== 'ACCEPTED') {
        throw new AppError(409, ERROR_CODES.INVALID_STATE_TRANSITION, `Cannot transition pool from ${pool.status} to DRIVER_ARRIVED`);
      }

      const updatedPool = await tx.pool.update({
        where: { id: poolId },
        data: { status: 'DRIVER_ARRIVED' },
      });

      for (const member of pool.members) {
        await tx.rideRequest.update({
          where: { id: member.rideRequestId },
          data: { status: 'DRIVER_ARRIVED' },
        });

        await tx.rideStatusHistory.create({
          data: {
            rideRequestId: member.rideRequestId,
            poolId,
            fromStatus: 'MATCHED',
            toStatus: 'DRIVER_ARRIVED',
            actorUserId: driverUserId,
            reason: 'Driver arrived at pickup location',
          },
        });
      }

      return updatedPool;
    });
  }

  async startTrip(driverUserId: string, poolId: string) {
    const tesla = await this.getDriverTesla(driverUserId);
    return prisma.$transaction(async (tx) => {
      const pool = await tx.pool.findUnique({
        where: { id: poolId },
        include: {
          members: {
            where: { leftAt: null },
            include: { rideRequest: true },
          },
        },
      });

      if (!pool || pool.teslaId !== tesla.id) {
        throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Pool not found');
      }

      if (pool.status !== 'DRIVER_ARRIVED') {
        throw new AppError(409, ERROR_CODES.INVALID_STATE_TRANSITION, `Cannot start trip with status ${pool.status}`);
      }

      const activeMembers = pool.members;
      const isPooled = activeMembers.length >= 2;

      // Lock fares for each active passenger
      for (const member of activeMembers) {
        const ride = member.rideRequest;
        const fare = calculateFare(ride.distanceM, ride.seats, isPooled);

        await tx.rideRequest.update({
          where: { id: ride.id },
          data: {
            status: 'STARTED',
            finalFarePaisa: fare.totalFarePaisa,
            fareBreakdown: fare as any,
          },
        });

        await tx.rideStatusHistory.create({
          data: {
            rideRequestId: ride.id,
            poolId,
            fromStatus: 'DRIVER_ARRIVED',
            toStatus: 'STARTED',
            actorUserId: driverUserId,
            reason: `Trip started (Fare locked: ${fare.totalFarePaisa} paisa, pooled: ${isPooled})`,
          },
        });
      }

      const updatedPool = await tx.pool.update({
        where: { id: poolId },
        data: {
          status: 'STARTED',
          startedAt: new Date(),
        },
      });

      return updatedPool;
    });
  }

  async completeTrip(driverUserId: string, poolId: string) {
    const tesla = await this.getDriverTesla(driverUserId);
    return prisma.$transaction(async (tx) => {
      const pool = await tx.pool.findUnique({
        where: { id: poolId },
        include: {
          members: {
            where: { leftAt: null },
            include: {
              rideRequest: {
                include: { passenger: { include: { wallet: true } } },
              },
            },
          },
        },
      });

      if (!pool || pool.teslaId !== tesla.id) {
        throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Pool not found');
      }

      if (pool.status !== 'STARTED') {
        throw new AppError(409, ERROR_CODES.INVALID_STATE_TRANSITION, `Cannot complete trip with status ${pool.status}`);
      }

      // Settle payments and complete ride requests
      for (const member of pool.members) {
        const ride = member.rideRequest;
        const farePaisa = ride.finalFarePaisa || ride.estimatedFarePaisa;

        if (ride.paymentMethod === 'TESLAPAY') {
          const wallet = ride.passenger.wallet;
          if (!wallet || wallet.balancePaisa < farePaisa) {
            throw new AppError(
              402,
              ERROR_CODES.INSUFFICIENT_FUNDS,
              `Passenger ${ride.passenger.name} has insufficient TeslaPay balance.`
            );
          }

          // Debit wallet atomically
          await tx.wallet.update({
            where: { userId: ride.passengerId },
            data: { balancePaisa: { decrement: farePaisa } },
          });

          await tx.payment.create({
            data: {
              rideRequestId: ride.id,
              method: 'TESLAPAY',
              amountPaisa: farePaisa,
              status: 'PAID',
            },
          });
        } else {
          // Cash payment marked paid
          await tx.payment.create({
            data: {
              rideRequestId: ride.id,
              method: 'CASH',
              amountPaisa: farePaisa,
              status: 'PAID',
            },
          });
        }

        await tx.rideRequest.update({
          where: { id: ride.id },
          data: { status: 'COMPLETED' },
        });

        await tx.rideStatusHistory.create({
          data: {
            rideRequestId: ride.id,
            poolId,
            fromStatus: 'STARTED',
            toStatus: 'COMPLETED',
            actorUserId: driverUserId,
            reason: 'Trip completed successfully',
          },
        });
      }

      const updatedPool = await tx.pool.update({
        where: { id: poolId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      return updatedPool;
    });
  }

  async cancelPool(driverUserId: string, poolId: string, reason?: string) {
    const tesla = await this.getDriverTesla(driverUserId);
    return prisma.$transaction(async (tx) => {
      const pool = await tx.pool.findUnique({
        where: { id: poolId },
        include: { members: { where: { leftAt: null } } },
      });

      if (!pool || pool.teslaId !== tesla.id) {
        throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Pool not found');
      }

      if (pool.status === 'STARTED' || pool.status === 'COMPLETED' || pool.status === 'CANCELLED') {
        throw new AppError(409, ERROR_CODES.INVALID_STATE_TRANSITION, `Cannot cancel pool with status ${pool.status}`);
      }

      // Revert members back to REQUESTED so they can be re-matched
      for (const member of pool.members) {
        await tx.rideRequest.update({
          where: { id: member.rideRequestId },
          data: { status: 'REQUESTED' },
        });

        await tx.poolMember.update({
          where: { id: member.id },
          data: { leftAt: new Date() },
        });

        await tx.rideStatusHistory.create({
          data: {
            rideRequestId: member.rideRequestId,
            poolId,
            fromStatus: pool.status === 'ACCEPTED' ? 'MATCHED' : 'DRIVER_ARRIVED',
            toStatus: 'REQUESTED',
            actorUserId: driverUserId,
            reason: reason || 'Pool cancelled by driver; returned to queue',
          },
        });
      }

      const updatedPool = await tx.pool.update({
        where: { id: poolId },
        data: { status: 'CANCELLED' },
      });

      return updatedPool;
    });
  }

  async getPoolHistory(driverUserId: string) {
    const tesla = await this.getDriverTesla(driverUserId);
    return prisma.pool.findMany({
      where: { teslaId: tesla.id },
      orderBy: { createdAt: 'desc' },
      include: {
        pickupZone: true,
        members: {
          include: {
            rideRequest: {
              include: {
                passenger: { select: { name: true } },
                destZone: true,
                payment: true,
              },
            },
          },
        },
      },
    });
  }
}

export const poolsService = new PoolsService();
