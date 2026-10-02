export type TErrorSources = {
  path: string | number;
  message: string;
};

export type TErrorResponse = {
  success: false;
  message: string;
  errorSources: TErrorSources[];
  error?: any;
  stack?: string;
  meta?: {
    requestId?: string;
    [key: string]: any;
  };
};

export type IGenericErrorResponse = {
  statusCode: number;
  message: string;
  errorSources: TErrorSources[];
};
