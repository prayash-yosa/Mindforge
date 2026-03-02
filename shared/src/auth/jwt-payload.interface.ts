import { UserRole } from './roles.enum';

export interface JwtPayload {
  /** Subject — unique user identifier */
  sub: string;
  /** User role for RBAC enforcement */
  role: UserRole;
  /** Optional display name */
  name?: string;
  /** Issued-at timestamp (epoch seconds) */
  iat?: number;
  /** Expiration timestamp (epoch seconds) */
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  name?: string;
}
