export interface FareCalculationInput {
  distanceMeters: number;
  seats: number;
  isPooled?: boolean;
}

export interface FareBreakdown {
  distanceKm: number;
  baseFarePaisa: number;
  distanceChargePaisa: number;
  subtotalPaisa: number;
  discountBps: number;
  discountPaisa: number;
  farePerSeatPaisa: number;
  seats: number;
  totalFarePaisa: number;
}

export interface FareEstimateResult {
  soloFarePaisa: number;
  pooledFarePaisa: number;
  breakdown: {
    solo: FareBreakdown;
    pooled: FareBreakdown;
  };
}
