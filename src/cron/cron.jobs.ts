import cron from 'node-cron';
import { RideRequestStatus } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { logger } from '../utils/logger.js';

/**
 * Dhaka Tesla Pool Cron Jobs
 */

// 1. Auto-cancel stale unaccepted ride requests older than 30 minutes (Runs every 10 minutes)
export const cancelStaleRideRequests = () => {
  cron.schedule('*/10 * * * *', async () => {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      const cancelledCount = await prisma.$transaction(async (tx) => {
        const staleRequests = await tx.rideRequest.findMany({
          where: {
            status: RideRequestStatus.REQUESTED,
            createdAt: { lt: thirtyMinutesAgo },
          },
          select: { id: true, passengerId: true },
        });

        if (staleRequests.length === 0) return 0;

        const ids = staleRequests.map((r) => r.id);

        await tx.rideRequest.updateMany({
          where: { id: { in: ids } },
          data: {
            status: RideRequestStatus.CANCELLED,
            cancelledBy: 'SYSTEM_CRON',
            cancelReason: 'Expired: No Tesla driver accepted request within 30 minutes',
          },
        });

        await tx.rideStatusHistory.createMany({
          data: staleRequests.map((r) => ({
            rideRequestId: r.id,
            fromStatus: RideRequestStatus.REQUESTED,
            toStatus: RideRequestStatus.CANCELLED,
            actorUserId: r.passengerId,
            reason: 'Expired: No Tesla driver accepted request within 30 minutes',
          })),
        });

        return ids.length;
      });

      if (cancelledCount > 0) {
        console.log(`Cron: Auto-cancelled ${cancelledCount} stale ride requests older than 30 minutes`);
        logger.info(`Cron: Auto-cancelled ${cancelledCount} stale ride requests older than 30 minutes`);
      }
    } catch (error) {
      console.log('Cron: Failed to auto-cancel stale ride requests', error);
      logger.error({ error }, 'Cron: Failed to auto-cancel stale ride requests');
    }

    console.log('Stale ride requests cleanup cron scheduled (every 10 minutes)');
  });
};

// 2. Delete expired or revoked refresh tokens (Runs every hour)
export const deleteExpiredRefreshTokens = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const deletedTokens = await prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            {
              revokedAt: { not: null },
              createdAt: { lt: sevenDaysAgo },
            },
          ],
        },
      });

      if (deletedTokens.count > 0) {
        console.log(`Cron: Purged ${deletedTokens.count} expired/revoked refresh tokens`);
        logger.info(`Cron: Purged ${deletedTokens.count} expired/revoked refresh tokens`);
      }
    } catch (error) {
      console.log('Cron: Failed to delete expired refresh tokens', error);
      logger.error({ error }, 'Cron: Failed to delete expired refresh tokens');
    }

    console.log('Expired refresh tokens purge cron scheduled (every hour)');
  });
};

// Initialize all crons
export const initCronJobs = () => {
  cancelStaleRideRequests();
  deleteExpiredRefreshTokens();
  console.log('Dhaka Tesla Pool: Cron jobs initialized');
  logger.info('Dhaka Tesla Pool: Cron jobs initialized');
};
