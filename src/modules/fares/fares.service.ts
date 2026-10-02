import { FARE_CONFIG } from '../../config/constants.js';
import { FareBreakdown, FareEstimateResult } from './fares.types.js';

/**
 * Pure function to calculate fare breakdown and total amount in integer paisa.
 */
export function calculateFare(
  distanceMeters: number,
  seats: number,
  isPooled: boolean = false
): FareBreakdown {
  const distanceKm = Math.round(distanceMeters / 1000);
  const baseFarePaisa = FARE_CONFIG.BASE_FARE_PAISA;
  const distanceChargePaisa = distanceKm * FARE_CONFIG.PER_KM_RATE_PAISA;
  const subtotalPaisa = baseFarePaisa + distanceChargePaisa;

  const discountBps = isPooled ? FARE_CONFIG.DISCOUNT_BPS : 0;
  const discountPaisa = isPooled
    ? Math.floor((subtotalPaisa * discountBps) / FARE_CONFIG.BPS_DIVISOR)
    : 0;

  const farePerSeatPaisa = subtotalPaisa - discountPaisa;
  const totalFarePaisa = farePerSeatPaisa * seats;

  return {
    distanceKm,
    baseFarePaisa,
    distanceChargePaisa,
    subtotalPaisa,
    discountBps,
    discountPaisa,
    farePerSeatPaisa,
    seats,
    totalFarePaisa,
  };
}

export function estimateFare(distanceMeters: number, seats: number): FareEstimateResult {
  const solo = calculateFare(distanceMeters, seats, false);
  const pooled = calculateFare(distanceMeters, seats, true);

  return {
    soloFarePaisa: solo.totalFarePaisa,
    pooledFarePaisa: pooled.totalFarePaisa,
    breakdown: {
      solo,
      pooled,
    },
  };
}
