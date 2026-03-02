import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthenticatedUser, DEFAULT_ROUTE_RBAC } from '@mindforge/shared';

@Injectable()
export class RbacGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'No authenticated user' });
    }

    const path: string = request.path;

    const rule = DEFAULT_ROUTE_RBAC.find((r) => path.startsWith(r.pathPrefix));
    if (rule && !rule.allowedRoles.includes(user.role)) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: `Role '${user.role}' cannot access ${rule.pathPrefix}`,
      });
    }

    return true;
  }
}
