import type { Employee } from '../../../../generated/prisma/client';
import { formatEmployeeCode } from '../employee.constants';

export type EmployeeStatus = 'ACTIVE' | 'DELETED';

export interface EmployeeResponse {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  countryCode: string;
  department: string;
  jobTitle: string;
  startDate: string;
  endDate: string | null;
  status: EmployeeStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface PaginatedEmployeesResponse {
  data: EmployeeResponse[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function toEmployeeResponse(employee: Employee): EmployeeResponse {
  return {
    id: employee.id,
    employeeCode: formatEmployeeCode(employee.employeeNumber),
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    countryCode: employee.countryCode,
    department: employee.department,
    jobTitle: employee.jobTitle,
    startDate: formatDate(employee.startDate),
    endDate: employee.endDate ? formatDate(employee.endDate) : null,
    status: employee.deletedAt ? 'DELETED' : 'ACTIVE',
    version: employee.version,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
    deletedAt: employee.deletedAt,
  };
}

/** Lookup values for the directory filters and the employee form. */
export interface EmployeeOptionsResponse {
  /** Every valid ISO 3166-1 alpha-2 code, for the create/edit form. */
  countryCodes: string[];
  /** Country codes that at least one employee (active or deleted) has. */
  countriesInUse: string[];
  departments: readonly string[];
  jobTitles: readonly string[];
}
