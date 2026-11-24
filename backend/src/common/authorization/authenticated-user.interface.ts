import type { Role } from './role.enum';

/**
 * The shape RolesGuard expects on `request.user`.
 *
 * `request.user` is set only by the authentication layer on the server
 * (JwtStrategy.validate, which loads the user from the database on every
 * request). It must never be built from client-supplied data such as body,
 * query or headers.
 *
 * `role` and `isActive` are optional in the type so the guard stays
 * defensive: it denies access whenever either is missing.
 */
export interface AuthenticatedUser {
  id: string;
  role?: Role;
  isActive?: boolean;
}
