import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

/**
 * Global app configuration shared by `main.ts` and HTTP tests, so tests run
 * against the same middleware, pipes, filters and interceptors as production.
 */
export function configureApp(app: INestApplication): void {
  const appOrigins = ['http://localhost:3000', process.env.FRONTEND_URL].filter(
    (origin): origin is string => Boolean(origin),
  );

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: '1',
  });

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

  app.useSecurityHeaders({
    contentSecurityPolicy: {
      reportOnly: true,
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        formAction: ["'self'"],
      },
    },
  });

  app.enableCsrfProtection({ trustedOrigins: appOrigins });
  app.enableCors({
    origin: appOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
}
