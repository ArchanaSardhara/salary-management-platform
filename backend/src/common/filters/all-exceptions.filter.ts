import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
}

interface ResolvedError {
  statusCode: number;
  error: string;
  message: string;
}

/**
 * Catches everything (HttpException and anything else) so every response
 * the API ever sends has the same shape, per CLAUDE.md's "return consistent
 * API response structures". Unexpected errors are logged with their stack
 * but never leak their raw message to the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const resolved = this.resolve(exception);
    const body: ErrorResponseBody = {
      ...resolved,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    // Request bodies are never logged here — they may carry salary data.
    if (resolved.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${resolved.statusCode} ${resolved.error}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} -> ${resolved.statusCode} ${resolved.error}`,
      );
    }

    response.status(resolved.statusCode).json(body);
  }

  private resolve(exception: unknown): ResolvedError {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        return { statusCode, error: exception.name, message: payload };
      }

      const payloadObj = payload as Record<string, unknown>;
      const message = Array.isArray(payloadObj.message)
        ? payloadObj.message.join('; ')
        : ((payloadObj.message as string | undefined) ?? exception.message);

      return {
        statusCode,
        error: (payloadObj.error as string | undefined) ?? exception.name,
        message,
      };
    }

    // Unknown errors: a generic message only. The real detail went to the
    // log above, not the response.
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'InternalServerError',
      message: 'An unexpected error occurred',
    };
  }
}
