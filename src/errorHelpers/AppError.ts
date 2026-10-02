import { AppError as BaseAppError, ERROR_CODES, ErrorCode } from '../utils/errors.js';

export class AppError extends BaseAppError {
  constructor(
    statusCode: number,
    codeOrMessage: ErrorCode | string,
    message?: string,
    details: any = null
  ) {
    if (message !== undefined) {
      super(statusCode, codeOrMessage as ErrorCode, message, details);
    } else {
      super(statusCode, ERROR_CODES.INTERNAL_SERVER_ERROR, codeOrMessage, details);
    }
  }
}

export default AppError;
