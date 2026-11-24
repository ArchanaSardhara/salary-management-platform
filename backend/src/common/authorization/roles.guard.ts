import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedUser } from './authenticated-user.interface';
import { isRole, type Role } from './role.enum';
import { ROLES_KEY } from './roles.decorator';

const FORBIDDEN_MESSAGE = 'You do not have permission to access this resource';

/**
 * Enforces `@Roles()` metadata against the server-side `request.user`.
 *
 * - No `@Roles()` on the route or controller → allowed (public route).
 * - No authenticated user → 401.
 * - Deactivated user → 403 "Account is deactivated".
 * - Active status not provided, missing/unknown role, or a role not listed
 *   in `@Roles()` → 403 (fails closed).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser | null }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (user.isActive === false) {
      throw new ForbiddenException('Account is deactivated');
    }

    if (
      user.isActive !== true ||
      !isRole(user.role) ||
      !requiredRoles.includes(user.role)
    ) {
      throw new ForbiddenException(FORBIDDEN_MESSAGE);
    }

    return true;
  }
}
