import { PoolStatus, RideRequestStatus } from '@prisma/client';

export interface IAcceptRideInput {
  requestId: string;
}

export interface IPoolMemberDetail {
  id: string;
  poolId: string;
  requestId: string;
  seats: number;
  pickupOrder: number;
  dropoffOrder: number;
  lockedFarePaisa?: number | null;
  joinedAt: Date;
}

export interface IPoolDetail {
  id: string;
  teslaId: string;
  status: PoolStatus;
  capacity: number;
  seatsOccupied: number;
  pickupZoneId: number;
  destZoneId: number;
  createdAt: Date;
  updatedAt: Date;
  members: IPoolMemberDetail[];
}

export interface ICompatibleRideRequest {
  id: string;
  passengerId: string;
  pickupZoneId: number;
  destZoneId: number;
  seats: number;
  status: RideRequestStatus;
  distanceM: number;
  estimatedFarePaisa: number;
  createdAt: Date;
}
