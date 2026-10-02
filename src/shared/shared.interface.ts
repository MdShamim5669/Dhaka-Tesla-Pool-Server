export interface IPaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  requestId?: string;
  [key: string]: any;
}

export interface IApiResponse<T = any> {
  statusCode: number;
  success: boolean;
  message?: string;
  meta?: IPaginationMeta;
  data?: T | null;
}
