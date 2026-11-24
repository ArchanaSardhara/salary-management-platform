import { Role } from '../../generated/prisma/enums';

/**
 * Application roles, from the Prisma `Role` enum (single source of truth):
 * - HR_MANAGER: employee management, compensation, directory and analytics.
 * - ADMIN: HR user management only (list, create, update, deactivate).
 */
export { Role };

const ROLE_VALUES: ReadonlySet<string> = new Set(Object.values(Role));

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && ROLE_VALUES.has(value);
}
