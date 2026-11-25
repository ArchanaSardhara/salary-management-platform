/** Mirrors the backend Prisma `Role` enum. */
export const ROLES = ["HR_MANAGER", "ADMIN"] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  HR_MANAGER: "HR Manager",
  ADMIN: "Administrator",
};

/** The narrow user shape exposed to the UI after server-side verification. */
export interface SessionUser {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  role: Role;
}

export interface MessageResponse {
  success?: boolean;
  message: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetUrl?: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}
