import { Role } from '@prisma/client';

export interface IRegisterInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: Role;
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface IAuthTokens {
  accessToken: string;
  rawRefreshToken: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface IAuthUserResponse {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
}

export interface IAuthResponse {
  user: IAuthUserResponse;
  accessToken: string;
}

export interface IJwtPayload {
  sub: string;
  role: Role;
  iat?: number;
  exp?: number;
}
