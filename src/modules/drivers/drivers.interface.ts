export interface IDriverAvailabilityInput {
  isOnline: boolean;
}

export interface ITeslaInfo {
  id: string;
  model: string;
  licensePlate: string;
  capacity: number;
  driverId: string;
}

export interface IDriverProfile {
  id: string;
  userId: string;
  isOnline: boolean;
  tesla?: ITeslaInfo | null;
}
