import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';

import {
  ACCESS_TOKEN_AGE,
  DAY,
  MINUTE,
  REFRESH_TOKEN_AGE,
} from '../../../common/consts/config';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { IUser } from '../users/entities/user.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { generateToken, hashToken } from '../../../common/utils/token.util';
import type { Response } from 'express';
// import { EmailService } from '../notifications/email/email.service';

const ACCOUNT_DEACTIVATED = 'Account is deactivated';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    // private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
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
        : ACCESS_TOKEN_AGE,
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
        : REFRESH_TOKEN_AGE,
    });

    const refreshTokenHash = hashToken(refreshToken);

    const refreshTokenDays = Number(
      process.env.JWT_REFRESH_EXPIRES_IN ?? REFRESH_TOKEN_AGE,
    );

    const now = new Date();
    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + refreshTokenDays);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: refreshTokenHash,
        userId: user.id,
        createdAt: now,
        expiresAt,
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

  async register(data: RegisterDto) {
    // create user
    const user = await this.usersService.create(data);

    // access token
    return await this.generateTokens(user!, data.rememberMe);
  }

  async login(data: LoginDto) {
    const user = await this.usersService.findByEmail(data.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      data.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Checked only after a correct password, so deactivation is not revealed
    // to someone who doesn't know the password.
    if (!user.isActive) {
      throw new ForbiddenException(ACCOUNT_DEACTIVATED);
    }

    return await this.generateTokens(user, data.rememberMe);
  }

  verify(user: IUser): IUser {
    return user;
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    // Deactivated users get the same response but no reset token.
    if (!user || !user.isActive) {
      return {
        message: 'If an account exists, a password reset email has been sent.',
      };
    }

    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    const token = generateToken();
    const tokenHash = hashToken(token);

    const now = new Date();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        createdAt: now,
        expiresAt,
      },
    });

    // await this.emailService.sendPasswordResetEmail({
    //   to: user.email,
    //   firstName: user.firstName,
    //   token,
    // });

    return {
      message: 'If an account exists, a password reset email has been sent.',
    };
  }

  async resetPassword(token: string, password: string) {
    const tokenHash = hashToken(token);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: true,
      },
    });

    if (!resetToken) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (resetToken.usedAt) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (resetToken.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Same error as an invalid token, so deactivation is not revealed.
    if (!resetToken.user.isActive) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

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

    if (!storedToken.user.isActive) {
      await this.revokeAllUserTokens(storedToken.userId);

      throw new ForbiddenException(ACCOUNT_DEACTIVATED);
    }

    const newRefreshToken = generateToken();

    const newRefreshTokenHash = hashToken(newRefreshToken);

    const now = new Date();
    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() + Number(process.env.JWT_REFRESH_EXPIRES_IN ?? 30),
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
      maxAge: 30 * DAY,
    });

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
