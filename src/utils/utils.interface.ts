import { CookieOptions } from 'express';

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

export interface ICookieOptions extends CookieOptions {
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: boolean | 'lax' | 'strict' | 'none';
}

export interface IJwtVerifyResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface IEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface IEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
