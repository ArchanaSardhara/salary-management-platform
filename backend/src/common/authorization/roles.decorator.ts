import { SetMetadata } from '@nestjs/common';
import type { Role } from './role.enum';

export const ROLES_KEY = 'roles';

/**
 * Restricts a controller or route handler to the given roles. A handler-level
 * `@Roles` overrides a controller-level one. Use together with
 * `@UseGuards(JwtAuthGuard, RolesGuard)` — JwtAuthGuard must come first so
 * `request.user` is set before RolesGuard runs.
 *
 * At least one role is required, so an empty `@Roles()` does not compile.
 */
export const Roles = (role: Role, ...roles: Role[]) =>
  SetMetadata(ROLES_KEY, [role, ...roles]);
