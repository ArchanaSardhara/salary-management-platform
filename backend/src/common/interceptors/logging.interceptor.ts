import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

/**
 * Logs one line per request: method, path, status and duration.
 * Deliberately never logs request/response bodies or query params —
 * those can carry salary or other personal data (CLAUDE.md security rules).
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(request, response.statusCode, start),
        error: () => this.log(request, response.statusCode || 500, start),
      }),
    );
  }

  private log(request: Request, statusCode: number, start: number): void {
    const duration = Date.now() - start;
    this.logger.log(`${request.method} ${request.url} ${statusCode} ${duration}ms`);
  }
}
