import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsISO31661Alpha2,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import {
  DEPARTMENTS,
  EMAIL_MAX_LENGTH,
  JOB_TITLES,
  NAME_MAX_LENGTH,
} from '../employee.constants';

/**
 * Field validation shared by the create and update DTOs, so the rules live in
 * one place. In update DTOs `partial` is true: the field may be omitted, but
 * not set to null (except lastName and email, which are nullable).
 */

const trim = Transform(({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value,
);

const optionalNotNull = ValidateIf(
  (_object: object, value: unknown) => value !== undefined,
);

function required(partial: boolean): PropertyDecorator[] {
  return partial ? [optionalNotNull] : [];
}

export const FirstNameField = (partial = false) =>
  applyDecorators(
    trim,
    ...required(partial),
    IsString(),
    IsNotEmpty(),
    MaxLength(NAME_MAX_LENGTH),
  );

/** Optional and nullable; a blank value is stored as null. */
export const LastNameField = () =>
  applyDecorators(
    Transform(({ value }: { value: unknown }) => {
      if (typeof value !== 'string') {
        return value;
      }
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    }),
    IsOptional(),
    IsString(),
    MaxLength(NAME_MAX_LENGTH),
  );

export const EmailField = () =>
  applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim().toLowerCase() : value,
    ),
    IsOptional(),
    IsEmail(),
    MaxLength(EMAIL_MAX_LENGTH),
  );

export const CountryCodeField = (partial = false) =>
  applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim().toUpperCase() : value,
    ),
    ...required(partial),
    IsISO31661Alpha2({
      message: 'countryCode must be an ISO 3166-1 alpha-2 country code',
    }),
  );

export const DepartmentField = (partial = false) =>
  applyDecorators(
    trim,
    ...required(partial),
    IsIn(DEPARTMENTS, {
      message: `department must be one of: ${DEPARTMENTS.join(', ')}`,
    }),
  );

export const JobTitleField = (partial = false) =>
  applyDecorators(
    trim,
    ...required(partial),
    IsIn(JOB_TITLES, {
      message: `jobTitle must be one of: ${JOB_TITLES.join(', ')}`,
    }),
  );
