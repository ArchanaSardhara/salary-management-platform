import type { Role } from '../../../../common/authorization/role.enum';

export type IUser = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  emailVerified: boolean;
  role: Role;
  isActive: boolean;
};

export class User {}
