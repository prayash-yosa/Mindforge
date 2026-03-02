/**
 * Mindforge Backend — @Roles() Decorator
 *
 * Attach required roles to a route handler for AuthorizationGuard.
 */

import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../guards/authorization.guard';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
