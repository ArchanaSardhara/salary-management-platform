import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  AMOUNT_MAX,
  AMOUNT_MIN,
  CURRENCY_CODES,
} from '../compensation.constants';

export class CreateCompensationDto {
  /** Monthly gross salary. Stored as an exact decimal; max 2 decimal places. */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(AMOUNT_MIN)
  @Max(AMOUNT_MAX)
  amount!: number;

  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsIn(CURRENCY_CODES, {
    message: `currencyCode must be a valid ISO 4217 currency code`,
  })
  currencyCode!: string;

  /** Inclusive start date of this salary period in YYYY-MM-DD format. */
  @IsDateString()
  effectiveFrom!: string;

  /**
   * Inclusive end date in YYYY-MM-DD format, or null/omitted for an
   * open-ended (currently active) record.
   */
  @IsOptional()
  @IsDateString()
  effectiveTo?: string | null;
}
