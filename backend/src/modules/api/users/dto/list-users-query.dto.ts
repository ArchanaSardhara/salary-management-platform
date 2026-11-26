import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const HR_MANAGER_DEFAULT_PAGE_SIZE = 20;
export const HR_MANAGER_MAX_PAGE_SIZE = 100;

export class ListUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(HR_MANAGER_MAX_PAGE_SIZE)
  pageSize: number = HR_MANAGER_DEFAULT_PAGE_SIZE;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(100)
  search?: string;
}
