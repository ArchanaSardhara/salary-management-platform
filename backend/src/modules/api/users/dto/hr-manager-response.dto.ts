import type { Role } from '../../../../common/authorization/role.enum';

export interface HrManagerResponse {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  emailVerified: boolean;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedHrManagersResponse {
  data: HrManagerResponse[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
