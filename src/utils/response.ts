import { Response } from 'express';
import { ErrorCode } from './errors.js';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: ErrorCode | string;
    message: string;
    details?: any;
  };
  meta?: Record<string, any>;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, any>
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      requestId: res.locals.requestId,
      ...meta,
    },
  };
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: ErrorCode | string,
  message: string,
  details: any = null
): void {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      requestId: res.locals.requestId,
    },
  };
  res.status(statusCode).json(response);
}
