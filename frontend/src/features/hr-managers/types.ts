export interface HrManager {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
}
