import { ExecutionContext, Injectable } from '@nestjs/common';
import {
  ThrottlerException,
  ThrottlerGuard,
  ThrottlerLimitDetail,
} from '@nestjs/throttler';
import type { Response } from 'express';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const retryAfter = Math.ceil(detail.timeToExpire / 1000);
    const res = context.switchToHttp().getResponse<Response>();
    res.setHeader('Retry-After', String(retryAfter));
    throw new ThrottlerException(
      `Too many requests. Please try again in ${retryAfter} second${retryAfter === 1 ? '' : 's'}.`,
    );
  }
}
