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
    // timeToExpire and timeToBlockExpire are already in seconds (the storage
    // service divides by 1000 before returning them). Use timeToBlockExpire
    // when available — it reflects when the oldest hit clears, giving the user
    // the shortest accurate wait time.
    const retryAfter =
      detail.timeToBlockExpire > 0
        ? detail.timeToBlockExpire
        : detail.timeToExpire;
    const res = context.switchToHttp().getResponse<Response>();
    res.setHeader('Retry-After', String(retryAfter));
    throw new ThrottlerException(
      `Too many requests. Please try again in ${retryAfter} second${retryAfter === 1 ? '' : 's'}.`,
    );
  }
}
