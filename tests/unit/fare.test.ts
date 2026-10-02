import { describe, it, expect } from 'vitest';
import { calculateFare } from '../../src/modules/fares/fares.service.js';

describe('Fare Calculation Unit Tests (PRD Section 7.4)', () => {
  it('should calculate solo fare correctly for Nusrat (3 km, 1 seat)', () => {
    const solo = calculateFare(3000, 1, false);
    expect(solo.baseFarePaisa).toBe(5000);
    expect(solo.distanceChargePaisa).toBe(5400); // 3 * 1800
    expect(solo.subtotalPaisa).toBe(10400);
    expect(solo.discountPaisa).toBe(0);
    expect(solo.totalFarePaisa).toBe(10400);
  });

  it('should calculate pooled fare with 20% discount for Nusrat (3 km, 1 seat)', () => {
    const pooled = calculateFare(3000, 1, true);
    expect(pooled.subtotalPaisa).toBe(10400);
    expect(pooled.discountPaisa).toBe(2080); // floor(10400 * 0.20)
    expect(pooled.totalFarePaisa).toBe(8320); // ৳83.20
  });

  it('should calculate solo fare correctly for Rafiq (4 km, 1 seat)', () => {
    const solo = calculateFare(4000, 1, false);
    expect(solo.baseFarePaisa).toBe(5000);
    expect(solo.distanceChargePaisa).toBe(7200); // 4 * 1800
    expect(solo.subtotalPaisa).toBe(12200);
    expect(solo.discountPaisa).toBe(0);
    expect(solo.totalFarePaisa).toBe(12200);
  });

  it('should calculate pooled fare with 20% discount for Rafiq (4 km, 1 seat)', () => {
    const pooled = calculateFare(4000, 1, true);
    expect(pooled.subtotalPaisa).toBe(12200);
    expect(pooled.discountPaisa).toBe(2440); // floor(12200 * 0.20)
    expect(pooled.totalFarePaisa).toBe(9760); // ৳97.60
  });

  it('should calculate multiple seats correctly', () => {
    const pooled2Seats = calculateFare(3000, 2, true);
    expect(pooled2Seats.farePerSeatPaisa).toBe(8320);
    expect(pooled2Seats.totalFarePaisa).toBe(16640);
  });
});
