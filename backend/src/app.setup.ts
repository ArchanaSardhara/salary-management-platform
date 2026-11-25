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
  const appOrigins = ['http://localhost:3000', process.env.APP_URL].filter(
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
      // Report-only in development so violations surface in the console without
      // breaking anything. Enforcing in production blocks actual violations.
      reportOnly: process.env.NODE_ENV !== 'production',
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        formAction: ["'self'"],
      },
    },
  });

  // NestJS 12 CSRF protection is origin-based (Sec-Fetch-Site + Origin header
  // comparison), not token-based. The frontend does not need to send any CSRF
  // token; the browser's Origin header and trustedOrigins list are sufficient.
  app.enableCsrfProtection({ trustedOrigins: appOrigins });
  app.enableCors({
    origin: appOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
}
