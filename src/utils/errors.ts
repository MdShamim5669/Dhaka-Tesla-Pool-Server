export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  SEAT_UNAVAILABLE: 'SEAT_UNAVAILABLE',
  NOT_COMPATIBLE: 'NOT_COMPATIBLE',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details: any;

  constructor(statusCode: number, code: ErrorCode, message: string, details: any = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
