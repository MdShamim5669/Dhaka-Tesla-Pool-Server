export interface IWelcomeEmailData {
  name: string;
  email: string;
  role: 'PASSENGER' | 'DRIVER';
}

export interface IRideReceiptEmailData {
  passengerName: string;
  rideId: string;
  pickupZone: string;
  destZone: string;
  seats: number;
  isPooled: boolean;
  distanceKm: number;
  baseFare: number;
  discountAmount?: number;
  finalFare: number;
  paymentMethod: string;
  date: string;
}

export interface IPasswordResetEmailData {
  name: string;
  resetLink: string;
  expiresInMinutes?: number;
}

export interface IRideCancelledEmailData {
  name: string;
  rideId: string;
  reason: string;
  pickupZone: string;
  destZone: string;
}

export interface IDriverOnboardingEmailData {
  driverName: string;
  teslaModel: string;
  licensePlate: string;
  capacity: number;
}
