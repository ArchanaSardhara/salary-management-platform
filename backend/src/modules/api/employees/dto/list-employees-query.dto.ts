import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsISO31661Alpha2,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  DEFAULT_PAGE_SIZE,
  DEPARTMENTS,
  type Department,
  MAX_PAGE_SIZE,
  SEARCH_MAX_LENGTH,
} from '../employee.constants';

export const SORT_FIELDS = [
  'employeeNumber',
  'firstName',
  'email',
  'countryCode',
  'department',
  'jobTitle',
  'startDate',
] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export const EMPLOYEE_STATUS_FILTERS = ['active', 'deleted', 'all'] as const;
export type EmployeeStatusFilter = (typeof EMPLOYEE_STATUS_FILTERS)[number];

/** Upper bounds for multi-value filters, to keep queries small. */
const MAX_COUNTRY_FILTERS = 250;
const MAX_STATUS_FILTERS = EMPLOYEE_STATUS_FILTERS.length;

/** Trims a string query value; a blank value is treated as not provided. */
const blankToUndefined = Transform(({ value }: { value: unknown }) => {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
});

/**
 * Normalises a multi-value query param. Accepts a single value
 * (`?department=Finance`) or repeated keys (`?department=A&department=B`),
 * trims values, drops blanks and duplicates. Nothing left → not provided.
 * Non-string input is passed through for the validators to reject.
 */
function toList(normalise: (value: string) => string = (value) => value) {
  return Transform(({ value }: { value: unknown }) => {
    const raw = Array.isArray(value) ? (value as unknown[]) : [value];
    if (raw.some((item) => item !== undefined && typeof item !== 'string')) {
      return value;
    }
    const items = (raw as (string | undefined)[])
      .map((item) => item?.trim() ?? '')
      .filter((item) => item !== '')
      .map(normalise);
    const unique = [...new Set(items)];
    return unique.length > 0 ? unique : undefined;
  });
}

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

  /**
   * One or more of active / deleted / all. Deleted employees are hidden unless
   * asked for, so the default is `['active']`.
   */
  @toList()
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_STATUS_FILTERS)
  @IsIn(EMPLOYEE_STATUS_FILTERS, { each: true })
  status: EmployeeStatusFilter[] = ['active'];

  /** Case-insensitive match on name or email, or an exact employee code. */
  @blankToUndefined
  @IsOptional()
  @IsString()
  @MaxLength(SEARCH_MAX_LENGTH)
  search?: string;

  /** Matches any of the given countries. */
  @toList((value) => value.toUpperCase())
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_COUNTRY_FILTERS)
  @IsISO31661Alpha2({
    each: true,
    message: 'countryCode must contain ISO 3166-1 alpha-2 country codes',
  })
  countryCode?: string[];

  /** Matches any of the given departments. */
  @toList()
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(DEPARTMENTS.length)
  @IsIn(DEPARTMENTS, {
    each: true,
    message: `department must contain only: ${DEPARTMENTS.join(', ')}`,
  })
  department?: Department[];

  @blankToUndefined
  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy?: SortField;

  @blankToUndefined
  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder?: SortOrder;
}
