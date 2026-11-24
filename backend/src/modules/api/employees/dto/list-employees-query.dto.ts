import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../employee.constants';

export const EMPLOYEE_STATUS_FILTERS = ['active', 'deleted', 'all'] as const;
export type EmployeeStatusFilter = (typeof EMPLOYEE_STATUS_FILTERS)[number];

export class ListEmployeesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize: number = DEFAULT_PAGE_SIZE;

  /** Deleted employees are hidden unless asked for. */
  @IsOptional()
  @IsIn(EMPLOYEE_STATUS_FILTERS)
  status: EmployeeStatusFilter = 'active';
}
