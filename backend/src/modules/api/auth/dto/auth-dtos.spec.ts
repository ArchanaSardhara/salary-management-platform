import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ForgotPasswordDto } from './forgot-password.dto';
import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';
import { ResetPasswordDto } from './reset-password.dto';

async function errorFields<T extends object>(
  cls: new () => T,
  plain: Record<string, unknown>,
): Promise<string[]> {
  const errors = await validate(plainToInstance(cls, plain));
  return errors.map((e) => e.property).sort();
}

describe('auth DTO validation', () => {
  const validRegister = {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    password: 'password123',
  };

  describe('RegisterDto', () => {
    it('accepts a valid payload with and without rememberMe', async () => {
      await expect(errorFields(RegisterDto, validRegister)).resolves.toEqual(
        [],
      );
      await expect(
        errorFields(RegisterDto, { ...validRegister, rememberMe: true }),
      ).resolves.toEqual([]);
    });

    it('accepts a missing lastName', async () => {
      const { lastName: _omit, ...withoutLastName } = validRegister;

      await expect(errorFields(RegisterDto, withoutLastName)).resolves.toEqual(
        [],
      );
    });

    it('rejects missing required fields', async () => {
      await expect(errorFields(RegisterDto, {})).resolves.toEqual([
        'email',
        'firstName',
        'password',
      ]);
    });

    it('rejects an invalid email', async () => {
      await expect(
        errorFields(RegisterDto, { ...validRegister, email: 'not-an-email' }),
      ).resolves.toEqual(['email']);
    });

    it('rejects passwords shorter than 8 or longer than 20 characters', async () => {
      await expect(
        errorFields(RegisterDto, { ...validRegister, password: 'short' }),
      ).resolves.toEqual(['password']);
      await expect(
        errorFields(RegisterDto, { ...validRegister, password: 'x'.repeat(21) }),
      ).resolves.toEqual(['password']);
    });

    it('rejects names longer than 100 characters', async () => {
      await expect(
        errorFields(RegisterDto, {
          ...validRegister,
          firstName: 'x'.repeat(101),
          lastName: 'x'.repeat(101),
        }),
      ).resolves.toEqual(['firstName', 'lastName']);
    });

    it('rejects a non-boolean rememberMe', async () => {
      await expect(
        errorFields(RegisterDto, { ...validRegister, rememberMe: 'yes' }),
      ).resolves.toEqual(['rememberMe']);
    });
  });

  describe('LoginDto', () => {
    it('accepts email and password only', async () => {
      await expect(
        errorFields(LoginDto, {
          email: 'ada@example.com',
          password: 'password123',
        }),
      ).resolves.toEqual([]);
    });

    it('rejects an invalid email and short password', async () => {
      await expect(
        errorFields(LoginDto, { email: 'nope', password: 'short' }),
      ).resolves.toEqual(['email', 'password']);
    });
  });

  describe('ForgotPasswordDto', () => {
    it('requires a valid email', async () => {
      await expect(
        errorFields(ForgotPasswordDto, { email: 'ada@example.com' }),
      ).resolves.toEqual([]);
      await expect(
        errorFields(ForgotPasswordDto, { email: 'nope' }),
      ).resolves.toEqual(['email']);
    });
  });

  describe('ResetPasswordDto', () => {
    it('requires a token and a password of at least 8 characters', async () => {
      await expect(
        errorFields(ResetPasswordDto, {
          token: 'abc',
          password: 'password123',
        }),
      ).resolves.toEqual([]);
      await expect(
        errorFields(ResetPasswordDto, { password: 'short' }),
      ).resolves.toEqual(['password', 'token']);
    });
  });
});
