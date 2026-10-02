/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { handleZodError } from '../errorHelpers/handleZodError.js';
import { TErrorResponse, TErrorSources } from '../interfaces/error.interface.js';
import { logger } from '../utils/logger.js';
import { deleteFileFromCloudinary } from '../config/cloudinary.config.js';

export const globalErrorHandler = async (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  if (env.NODE_ENV === 'development') {
    logger.error({ err }, 'Error from Global Error Handler');
  }

  // Cleanup uploaded file from Cloudinary if request failed
  if (req.file) {
    await deleteFileFromCloudinary((req.file as any).path || (req.file as any).secure_url);
  }

  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const imageUrls = req.files.map((file: any) => file.path || file.secure_url);
    await Promise.all(imageUrls.map((url) => deleteFileFromCloudinary(url)));
  }

  let errorSources: TErrorSources[] = [];
  let statusCode = 500;
  let message = 'Internal Server Error';
  let stack: string | undefined = undefined;

  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    stack = err.stack;
    errorSources = [
      {
        path: '',
        message: err.message,
      },
    ];
  } else if (err instanceof Error) {
    statusCode = 500;
    message = err.message;
    stack = err.stack;
    errorSources = [
      {
        path: '',
        message: err.message,
      },
    ];
  }

  const errorResponse: TErrorResponse = {
    success: false,
    message,
    errorSources,
    error: env.NODE_ENV === 'development' ? err : undefined,
    stack: env.NODE_ENV === 'development' ? stack : undefined,
    meta: {
      requestId: res.locals?.requestId,
    },
  };

  res.status(statusCode).json(errorResponse);
};

export const errorHandler = globalErrorHandler;
export default globalErrorHandler;
