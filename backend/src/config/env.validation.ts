import { envSchema, type EnvConfig } from './env.schema';

/**
 * Passed to `ConfigModule.forRoot({ validate })` so the process fails fast,
 * with a readable message, instead of crashing later on a missing variable.
 */
export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const issues = result.error.issues
      .map(
        (issue: { path: any[]; message: any }) =>
          `${issue.path.join('.') || '(root)'}: ${issue.message}`,
      )
      .join('; ');
    throw new Error(`Invalid environment configuration — ${issues}`);
  }

  return result.data;
}
