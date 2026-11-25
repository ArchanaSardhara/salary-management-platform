import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthAction } from '../../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';

interface LockoutConfig {
  maxAttempts: number;
  initialLockoutMs: number;
  escalatedLockoutMs: number;
}

const TEN_MINUTES = 10 * 60 * 1000;
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

const CONFIGS: Record<AuthAction, LockoutConfig> = {
  [AuthAction.LOGIN]: {
    maxAttempts: 5,
    initialLockoutMs: TEN_MINUTES,
    escalatedLockoutMs: TWENTY_FOUR_HOURS,
  },
  [AuthAction.FORGOT_PASSWORD]: {
    maxAttempts: 3,
    initialLockoutMs: TEN_MINUTES,
    escalatedLockoutMs: TWENTY_FOUR_HOURS,
  },
  [AuthAction.RESET_PASSWORD]: {
    maxAttempts: 3,
    initialLockoutMs: TEN_MINUTES,
    escalatedLockoutMs: TWENTY_FOUR_HOURS,
  },
};

function formatWait(ms: number): string {
  const hours = Math.ceil(ms / (60 * 60 * 1000));
  if (hours >= 1) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  const minutes = Math.ceil(ms / 60_000);
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

@Injectable()
export class AuthAttemptService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Throws 429 if the identifier is currently locked out.
   * Any attempt while locked escalates the lockout to 24 hours.
   */
  async checkLockout(identifier: string, action: AuthAction): Promise<void> {
    const record = await this.prisma.authAttempt.findUnique({
      where: { identifier_action: { identifier, action } },
    });

    if (!record?.lockedUntil) return;

    const now = new Date();
    if (record.lockedUntil <= now) return;

    const config = CONFIGS[action];
    const escalatedUntil = new Date(now.getTime() + config.escalatedLockoutMs);

    await this.prisma.authAttempt.update({
      where: { identifier_action: { identifier, action } },
      data: {
        attempts: { increment: 1 },
        lockedUntil: escalatedUntil,
      },
    });

    throw new HttpException(
      `Too many failed attempts. Try again in ${formatWait(config.escalatedLockoutMs)}.`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  /**
   * Records one failed attempt. Applies a 10-minute lockout once the
   * threshold is first reached, and re-locks after any subsequent failure
   * when the previous lockout has already expired.
   */
  async recordAttempt(identifier: string, action: AuthAction): Promise<void> {
    const config = CONFIGS[action];
    const now = new Date();

    const updated = await this.prisma.authAttempt.upsert({
      where: { identifier_action: { identifier, action } },
      create: { identifier, action, attempts: 1 },
      update: { attempts: { increment: 1 } },
    });

    const shouldLock =
      updated.attempts >= config.maxAttempts &&
      (!updated.lockedUntil || updated.lockedUntil <= now);

    if (shouldLock) {
      await this.prisma.authAttempt.update({
        where: { identifier_action: { identifier, action } },
        data: { lockedUntil: new Date(now.getTime() + config.initialLockoutMs) },
      });
    }
  }

  /** Clears all attempt history for an identifier+action on successful auth. */
  async clearAttempts(identifier: string, action: AuthAction): Promise<void> {
    await this.prisma.authAttempt.deleteMany({
      where: { identifier, action },
    });
  }
}
