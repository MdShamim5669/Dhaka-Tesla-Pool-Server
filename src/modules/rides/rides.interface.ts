import { PaymentMethod, RideRequestStatus } from '@prisma/client';

export interface ICreateRideInput {
  pickupZoneId: number;
  destZoneId: number;
  seats: number;
  paymentMethod?: PaymentMethod;
  idempotencyKey?: string;
}

export interface ICancelRideInput {
  reason?: string;
}

export interface IRideStatusHistoryItem {
  id: string;
  fromStatus?: RideRequestStatus | null;
  toStatus: RideRequestStatus;
  changedBy: string;
  reason?: string | null;
  createdAt: Date;
}

export interface IRideDetails {
  id: string;
  passengerId: string;
  pickupZoneId: number;
  destZoneId: number;
  seats: number;
  status: RideRequestStatus;
  distanceM: number;
  estimatedFarePaisa: number;
  finalFarePaisa?: number | null;
  paymentMethod: PaymentMethod;
  createdAt: Date;
  statusHistory?: IRideStatusHistoryItem[];
}
