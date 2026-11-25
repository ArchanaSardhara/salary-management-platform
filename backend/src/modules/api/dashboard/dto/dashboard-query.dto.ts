import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { CURRENCY_CODES } from '../../compensation/compensation.constants';

export class DashboardCurrencyQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsIn(CURRENCY_CODES, {
    message: 'currency must be a valid ISO 4217 currency code',
  })
  currency?: string;
}

export class DashboardLimitQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}
