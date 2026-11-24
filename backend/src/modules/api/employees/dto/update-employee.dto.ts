import { IsInt, Min } from 'class-validator';
import type { Department, JobTitle } from '../employee.constants';
import {
  CountryCodeField,
  DepartmentField,
  EmailField,
  FirstNameField,
  JobTitleField,
  LastNameField,
} from './employee-fields';

/**
 * Partial update. `version` is required: it must match the version the client
 * last read, otherwise the update is rejected with 409 (no silent overwrite).
 * `lastName: null` and `email: null` clear those fields; other fields cannot
 * be null.
 */
export class UpdateEmployeeDto {
  @IsInt()
  @Min(1)
  version!: number;

  @FirstNameField(true)
  firstName?: string;

  @LastNameField()
  lastName?: string | null;

  @EmailField()
  email?: string | null;

  @CountryCodeField(true)
  countryCode?: string;

  @DepartmentField(true)
  department?: Department;

  @JobTitleField(true)
  jobTitle?: JobTitle;
}
