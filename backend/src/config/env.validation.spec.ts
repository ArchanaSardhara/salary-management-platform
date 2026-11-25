import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const validConfig = {
    DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'r'.repeat(32),
  };

  it('accepts a minimal valid config and fills in defaults', () => {
    const result = validateEnv(validConfig);

    expect(result).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
      DATABASE_URL: validConfig.DATABASE_URL,
      JWT_ACCESS_SECRET: validConfig.JWT_ACCESS_SECRET,
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_SECRET: validConfig.JWT_REFRESH_SECRET,
      JWT_REFRESH_EXPIRES_IN: '15m',
    });
  });

  it.each(['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'])(
    'throws when %s is missing',
    (key) => {
      const config: Record<string, unknown> = { ...validConfig };
      delete config[key];

      expect(() => validateEnv(config)).toThrow(new RegExp(key));
    },
  );

  it.each(['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'])(
    'throws when %s is shorter than 32 characters',
    (key) => {
      expect(() => validateEnv({ ...validConfig, [key]: 'too-short' })).toThrow(
        /at least 32 characters/,
      );
    },
  );

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
    expect(() => validateEnv({ ...validConfig, NODE_ENV: 'staging' })).toThrow(
      /NODE_ENV/,
    );
  });

  it('throws when PORT is not a positive integer', () => {
    expect(() => validateEnv({ ...validConfig, PORT: '-1' })).toThrow(/PORT/);
    expect(() => validateEnv({ ...validConfig, PORT: 'abc' })).toThrow(/PORT/);
  });
});
