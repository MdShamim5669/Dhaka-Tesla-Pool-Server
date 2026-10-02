import { Role } from '@prisma/client';

export interface IAuthUser {
  id: string;
  role: Role;
  email?: string;
  userId?: string;
}

export interface ITokenPayload {
  sub: string;
  role: Role;
  email?: string;
  iat?: number;
  exp?: number;
}
