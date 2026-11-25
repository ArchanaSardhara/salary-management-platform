import { IsDateString, IsOptional, ValidateIf } from 'class-validator';

export class UpdateCompensationDto {
  /**
   * New end date in YYYY-MM-DD format, or `null` to remove the end date
   * (making the record open-ended / ongoing). Omitting the field is treated
   * the same as passing `null`.
   */
  @IsOptional()
  @ValidateIf((o: UpdateCompensationDto) => o.effectiveTo != null)
  @IsDateString()
  effectiveTo?: string | null;
}
