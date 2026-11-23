import { z } from 'zod';

/**
 * Schema for every environment variable the application reads.
 * Add a new variable here (not scattered `process.env` reads) so it is
 * validated once, at startup, with a clear error if it's missing or malformed.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .url('DATABASE_URL must be a valid connection string'),
});

export type EnvConfig = z.infer<typeof envSchema>;
