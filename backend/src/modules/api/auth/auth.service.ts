import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';

import {
  MAX_SESSION_DAYS,
  MINUTE,
} from '../../../common/consts/config';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { IUser } from '../users/entities/user.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { generateToken, hashToken } from '../../../common/utils/token.util';
import type { Response } from 'express';
import { EmailService } from '../notifications/email/email.service';
import { AuthAttemptService } from './auth-attempt.service';
import { AuthAction } from '../../../generated/prisma/enums';

const ACCOUNT_DEACTIVATED = 'Account is deactivated';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    private readonly authAttemptService: AuthAttemptService,
  ) {}

  private async generateTokens(
    user: Pick<IUser, 'id' | 'email'>,
    rememberMe = false,
  ) {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,

      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN
        ? `${Number(process.env.JWT_ACCESS_EXPIRES_IN)}d`
        : '1d',
    });

    if (!rememberMe) {
      return {
        accessToken,
        refreshToken: null,
      };
    }

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,

      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
        ? `${Number(process.env.JWT_REFRESH_EXPIRES_IN)}d`
        : '15d',
    });

    const refreshTokenHash = hashToken(refreshToken);

    const refreshTokenDays = Number(
      process.env.JWT_REFRESH_EXPIRES_IN ?? 15,
    );

    const now = new Date();
    const expiresAt = new Date();
    const absoluteExpiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + refreshTokenDays);
    absoluteExpiresAt.setDate(absoluteExpiresAt.getDate() + MAX_SESSION_DAYS);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: refreshTokenHash,
        userId: user.id,
        createdAt: now,
        expiresAt,
        absoluteExpiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private async revokeAllUserTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private pruneOldRefreshTokens(userId: string): void {
    // Delete tokens whose absolute session ceiling has passed — they can never
    // be used or replayed again, so there is no value in keeping them.
    this.prisma.refreshToken
      .deleteMany({
        where: {
          userId,
          absoluteExpiresAt: { lt: new Date() },
        },
      })
      .catch((err: Error) =>
        this.logger.error('Failed to prune refresh tokens', err),
      );
  }

  async register(data: RegisterDto) {
    // create user
    const user = await this.usersService.create(data);

    // access token
    return await this.generateTokens(user!, data.rememberMe);
  }

  async login(data: LoginDto) {
    await this.authAttemptService.checkLockout(data.email, AuthAction.LOGIN);

    const user = await this.usersService.findByEmail(data.email);

    if (!user) {
      await this.authAttemptService.recordAttempt(data.email, AuthAction.LOGIN);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      data.password,
    );

    if (!isPasswordValid) {
      await this.authAttemptService.recordAttempt(data.email, AuthAction.LOGIN);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Checked only after a correct password, so deactivation is not revealed
    // to someone who doesn't know the password.
    if (!user.isActive) {
      throw new ForbiddenException(ACCOUNT_DEACTIVATED);
    }

    await this.authAttemptService.clearAttempts(data.email, AuthAction.LOGIN);
    return await this.generateTokens(user, data.rememberMe);
  }

  verify(user: IUser): IUser {
    return user;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    await this.authAttemptService.checkLockout(
      email,
      AuthAction.FORGOT_PASSWORD,
    );

    const message =
      'If an account exists, a password reset email has been sent.';
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      await this.authAttemptService.recordAttempt(
        email,
        AuthAction.FORGOT_PASSWORD,
      );
      return { message };
    }

    if (!user.isActive) {
      await this.authAttemptService.recordAttempt(
        email,
        AuthAction.FORGOT_PASSWORD,
      );
      return {
        message:
          'Your account has been deactivated. Please contact your administrator.',
      };
    }

    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = generateToken();
    const tokenHash = hashToken(token);

    const now = new Date();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    try {
      await this.prisma.passwordResetToken.create({
        data: { tokenHash, userId: user.id, createdAt: now, expiresAt },
      });

      await this.emailService.sendPasswordResetEmail({
        to: user.email,
        firstName: user.firstName,
        token,
      });
    } catch (err) {
      this.logger.error('Failed to send password reset email', err);
    }

    return { message };
  }

  async resetPassword(token: string, password: string, ip: string) {
    await this.authAttemptService.checkLockout(ip, AuthAction.RESET_PASSWORD);

    const tokenHash = hashToken(token);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: true,
      },
    });

    const invalidToken = async () => {
      await this.authAttemptService.recordAttempt(ip, AuthAction.RESET_PASSWORD);
      throw new UnauthorizedException('Invalid or expired reset token');
    };

    if (!resetToken) return invalidToken();
    if (resetToken.usedAt) return invalidToken();
    if (resetToken.expiresAt <= new Date()) return invalidToken();
    // Same error as an invalid token, so deactivation is not revealed.
    if (!resetToken.user.isActive) return invalidToken();

    const passwordHash = await argon2.hash(password);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          passwordHash,
          updatedAt: new Date(),
        },
      }),

      this.prisma.passwordResetToken.update({
        where: {
          id: resetToken.id,
        },
        data: {
          usedAt: new Date(),
        },
      }),

      this.prisma.refreshToken.updateMany({
        where: {
          userId: resetToken.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
    ]);

    await Promise.all([
      this.authAttemptService.clearAttempts(ip, AuthAction.RESET_PASSWORD),
      this.authAttemptService.clearAttempts(
        resetToken.user.email,
        AuthAction.LOGIN,
      ),
      this.authAttemptService.clearAttempts(
        resetToken.user.email,
        AuthAction.FORGOT_PASSWORD,
      ),
    ]);

    return {
      message: 'Password reset successfully',
    };
  }

  async refresh(refreshToken: string, res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const tokenHash = hashToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: true,
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revokedAt) {
      await this.revokeAllUserTokens(storedToken.userId);

      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (storedToken.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (storedToken.absoluteExpiresAt <= new Date()) {
      throw new UnauthorizedException('Session expired, please log in again');
    }

    if (!storedToken.user.isActive) {
      await this.revokeAllUserTokens(storedToken.userId);

      throw new ForbiddenException(ACCOUNT_DEACTIVATED);
    }

    const newRefreshToken = generateToken();

    const newRefreshTokenHash = hashToken(newRefreshToken);

    const now = new Date();
    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() + Number(process.env.JWT_REFRESH_EXPIRES_IN ?? 15),
    );

    const accessToken = await this.jwtService.signAsync(
      {
        sub: storedToken.user.id,
        email: storedToken.user.email,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m',
      },
    );

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: {
          id: storedToken.id,
        },
        data: {
          revokedAt: new Date(),
        },
      }),

      this.prisma.refreshToken.create({
        data: {
          tokenHash: newRefreshTokenHash,
          userId: storedToken.user.id,
          createdAt: now,
          expiresAt,
          absoluteExpiresAt: storedToken.absoluteExpiresAt,
        },
      }),
    ]);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * MINUTE,
    });

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresAt.getTime() - now.getTime(),
    });

    this.pruneOldRefreshTokens(storedToken.userId);

    return {
      message: 'Token refreshed',
    };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) {
      return;
    }

    const tokenHash = hashToken(refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
