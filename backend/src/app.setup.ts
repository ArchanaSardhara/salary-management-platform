import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

/**
 * Global app configuration shared by `main.ts` and HTTP tests, so tests run
 * against the same middleware, pipes, filters and interceptors as production.
 */
export function configureApp(app: INestApplication): void {
  // Parse cookies from incoming requests
  app.use(cookieParser());

  // Enable DTO validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
}
