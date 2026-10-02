import { ZodError } from 'zod';
import { IGenericErrorResponse, TErrorSources } from '../interfaces/error.interface.js';

export const handleZodError = (err: ZodError): IGenericErrorResponse => {
  const errorSources: TErrorSources[] = err.issues.map((issue) => {
    return {
      path: issue.path.join('.'),
      message: issue.message,
    };
  });

  return {
    statusCode: 400,
    message: 'Validation Error',
    errorSources,
  };
};

export default handleZodError;
