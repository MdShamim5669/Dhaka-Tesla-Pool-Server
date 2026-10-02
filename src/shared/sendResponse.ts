import { Response } from 'express';

export interface IApiResponse<T> {
  statusCode: number;
  success: boolean;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: any;
  };
  data?: T | null;
}

export const sendResponse = <T>(res: Response, responseData: IApiResponse<T>): void => {
  res.status(responseData.statusCode).json({
    success: responseData.success,
    message: responseData.message,
    meta: {
      requestId: res.locals?.requestId,
      ...responseData.meta,
    },
    data: responseData.data !== undefined ? responseData.data : null,
  });
};

export default sendResponse;
