import { UserRole } from './roles.enum';

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export type RolePermissionMap = Record<UserRole, Permission[]>;

/**
 * Route-level RBAC: maps URL path prefixes to allowed roles.
 * Used by the API gateway to enforce access before proxying.
 */
export interface RouteRbacRule {
  pathPrefix: string;
  allowedRoles: UserRole[];
}

export const DEFAULT_ROUTE_RBAC: RouteRbacRule[] = [
  { pathPrefix: '/api/student', allowedRoles: [UserRole.STUDENT] },
  { pathPrefix: '/api/parent', allowedRoles: [UserRole.PARENT] },
  { pathPrefix: '/api/teacher', allowedRoles: [UserRole.TEACHER, UserRole.ADMIN] },
  { pathPrefix: '/api/admin', allowedRoles: [UserRole.ADMIN] },
];
