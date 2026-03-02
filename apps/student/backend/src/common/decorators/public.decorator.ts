/**
 * Mindforge Backend — @Public() Decorator
 *
 * Marks a route as public (no auth required).
 * Used on health check, auth endpoints, etc.
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a controller or route handler as public (bypasses AuthGuard).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
