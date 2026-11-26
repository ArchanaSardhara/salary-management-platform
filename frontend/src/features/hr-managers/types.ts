export interface HrManager {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface PaginatedHrManagersResponse {
  data: HrManager[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
