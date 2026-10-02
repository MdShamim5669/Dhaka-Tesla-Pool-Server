export const FARE_CONFIG = {
  BASE_FARE_PAISA: 5000,       // ৳50
  PER_KM_RATE_PAISA: 1800,     // ৳18/km
  DISCOUNT_BPS: 2000,          // 20% discount if pooled (>= 2 members)
  BPS_DIVISOR: 10000,
} as const;

export const ROLES = {
  PASSENGER: 'PASSENGER',
  DRIVER: 'DRIVER',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
