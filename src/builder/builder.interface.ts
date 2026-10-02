export interface IQueryParams {
  searchTerm?: string;
  search?: string;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

export interface IPaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IQueryResult<T> {
  data: T[];
  meta: IPaginationMeta;
}

export interface IExecuteOptions {
  include?: any;
  select?: any;
}
