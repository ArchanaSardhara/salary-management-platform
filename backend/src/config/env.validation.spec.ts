import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const validConfig = {
    DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
  };

  it('accepts a minimal valid config and fills in defaults', () => {
    const result = validateEnv(validConfig);

    expect(result).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
      DATABASE_URL: validConfig.DATABASE_URL,
    });
  });

  it('accepts an explicit NODE_ENV and PORT', () => {
    const result = validateEnv({
      ...validConfig,
      NODE_ENV: 'production',
      PORT: '8080',
    });

    expect(result.NODE_ENV).toBe('production');
    expect(result.PORT).toBe(8080);
  });

  it('throws a descriptive error when DATABASE_URL is missing', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL/);
  });

  it('throws when DATABASE_URL is not a valid connection string', () => {
    expect(() => validateEnv({ DATABASE_URL: 'not-a-url' })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('throws when NODE_ENV is not one of the allowed values', () => {
    expect(() =>
      validateEnv({ ...validConfig, NODE_ENV: 'staging' }),
    ).toThrow(/NODE_ENV/);
  });

  it('throws when PORT is not a positive integer', () => {
    expect(() => validateEnv({ ...validConfig, PORT: '-1' })).toThrow(
      /PORT/,
    );
    expect(() => validateEnv({ ...validConfig, PORT: 'abc' })).toThrow(
      /PORT/,
    );
  });
});
