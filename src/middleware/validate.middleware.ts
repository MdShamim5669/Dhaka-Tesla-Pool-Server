import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, type ZodIssue } from 'zod';
import { AppError, ERROR_CODES } from '../utils/errors.js';

export function validate(schema: AnyZodObject) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
      });
      req.body = parsed.body ?? req.body;
      req.query = parsed.query ?? req.query;
      req.params = parsed.params ?? req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err: ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        next(new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Validation failed', details));
      } else {
        next(error);
      }
    }
  };
}
