import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import type { Response } from 'express';
import { Role } from '../../../common/authorization/role.enum';
import { hashToken } from '../../../common/utils/token.util';
import type { EmailService } from '../notifications/email/email.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { UsersService } from '../users/users.service';
import type { AuthAttemptService } from './auth-attempt.service';
import { AuthService } from './auth.service';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

const DAY_MS = 24 * 60 * 60 * 1000;

describe('AuthService', () => {
  const usersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(),
  };
  const emailService = {
    sendPasswordResetEmail: jest.fn(),
  };
  const authAttemptService = {
    checkLockout: jest.fn(),
    recordAttempt: jest.fn(),
    clearAttempts: jest.fn(),
  };
  const prisma = {
    $transaction: jest.fn(),
    user: { update: jest.fn() },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  let service: AuthService;

  const user = {
    id: 'user-1',
    firstName: 'Ada',
    lastName: null,
    email: 'ada@example.com',
    passwordHash: 'stored-hash',
    emailVerified: false,
    role: Role.HR_MANAGER,
    isActive: true,
  };
  const deactivatedUser = { ...user, isActive: false };

  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      JWT_ACCESS_SECRET: 'a'.repeat(32),
      JWT_REFRESH_SECRET: 'r'.repeat(32),
      JWT_ACCESS_EXPIRES_IN: '1',
      JWT_REFRESH_EXPIRES_IN: '7',
    };
    jwtService.signAsync.mockImplementation(
      (_payload: object, options: { secret: string }) =>
        Promise.resolve(
          options.secret === process.env.JWT_REFRESH_SECRET
            ? 'signed-refresh-token'
            : 'signed-access-token',
        ),
    );
    prisma.$transaction.mockResolvedValue([]);
    emailService.sendPasswordResetEmail.mockResolvedValue(undefined);
    authAttemptService.checkLockout.mockResolvedValue(undefined);
    authAttemptService.recordAttempt.mockResolvedValue(undefined);
    authAttemptService.clearAttempts.mockResolvedValue(undefined);
    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      emailService as unknown as EmailService,
      prisma as unknown as PrismaService,
      authAttemptService as unknown as AuthAttemptService,
    );
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('register', () => {
    const dto = {
      firstName: 'Ada',
      email: 'ada@example.com',
      password: 'password123',
    };

    it('creates the user and returns only an access token without rememberMe', async () => {
      usersService.create.mockResolvedValue(user);

      const result = await service.register(dto);

      expect(usersService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        accessToken: 'signed-access-token',
        refreshToken: null,
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 'user-1', email: 'ada@example.com' },
        expect.objectContaining({ secret: process.env.JWT_ACCESS_SECRET }),
      );
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it('also issues and stores a hashed refresh token with rememberMe', async () => {
      usersService.create.mockResolvedValue(user);

      const result = await service.register({ ...dto, rememberMe: true });

      expect(result).toEqual({
        accessToken: 'signed-access-token',
        refreshToken: 'signed-refresh-token',
      });
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
      const { data } = prisma.refreshToken.create.mock.calls[0][0];
      expect(data.tokenHash).toBe(hashToken('signed-refresh-token'));
      expect(data.tokenHash).not.toBe('signed-refresh-token');
      expect(data.userId).toBe('user-1');
      const days =
        (data.expiresAt.getTime() - data.createdAt.getTime()) / DAY_MS;
      expect(days).toBeCloseTo(7, 0);
    });

    it('propagates errors from user creation', async () => {
      const error = new Error('Email already registered');
      usersService.create.mockRejectedValue(error);

      await expect(service.register(dto)).rejects.toBe(error);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const dto = { email: 'ada@example.com', password: 'password123' };

    it('returns tokens when the password matches', async () => {
      usersService.findByEmail.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ ...dto, rememberMe: true });

      expect(argon2.verify).toHaveBeenCalledWith('stored-hash', 'password123');
      expect(result).toEqual({
        accessToken: 'signed-access-token',
        refreshToken: 'signed-refresh-token',
      });
    });

    it('throws UnauthorizedException when the user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(argon2.verify).not.toHaveBeenCalled();
    });

    it('throws the same UnauthorizedException when the password is wrong', async () => {
      usersService.findByEmail.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('throws 403 for a deactivated user with the correct password', async () => {
      usersService.findByEmail.mockResolvedValue(deactivatedUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      await expect(service.login(dto)).rejects.toThrow(
        new ForbiddenException('Account is deactivated'),
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it('does not reveal deactivation when the password is wrong', async () => {
      usersService.findByEmail.mockResolvedValue(deactivatedUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });
  });

  describe('verify', () => {
    it('returns the authenticated user it is given', () => {
      const { passwordHash: _omit, ...authenticated } = user;

      expect(service.verify(authenticated)).toBe(authenticated);
    });
  });

  describe('forgotPassword', () => {
    const message =
      'If an account exists, a password reset email has been sent.';

    it('returns the message without creating a token for an unknown email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.forgotPassword('nobody@example.com'),
      ).resolves.toEqual({ message });
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    });

    it('invalidates earlier tokens, stores a hashed token, and returns resetUrl in non-production', async () => {
      process.env.APP_URL = 'http://localhost:3000';
      usersService.findByEmail.mockResolvedValue(user);

      const result = await service.forgotPassword(user.email);

      expect(result.message).toBe(message);
      expect(result.resetUrl).toMatch(
        /^http:\/\/localhost:3000\/reset-password\?token=/,
      );
      expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
      const { data } = prisma.passwordResetToken.create.mock.calls[0][0];
      expect(data.userId).toBe('user-1');
      expect(data.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      const minutes =
        (data.expiresAt.getTime() - data.createdAt.getTime()) / 60_000;
      expect(minutes).toBeCloseTo(15, 0);
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('sends email and returns only the message in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.RESEND_API_KEY = 'test-key';
      usersService.findByEmail.mockResolvedValue(user);

      const result = await service.forgotPassword(user.email);

      expect(result.message).toBe(message);
      expect(result.resetUrl).toBeUndefined();
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith({
        to: user.email,
        firstName: user.firstName,
        token: expect.any(String),
      });
    });

    it('still returns the message when the email service throws', async () => {
      process.env.NODE_ENV = 'production';
      process.env.RESEND_API_KEY = 'test-key';
      usersService.findByEmail.mockResolvedValue(user);
      emailService.sendPasswordResetEmail.mockRejectedValue(
        new Error('Resend error'),
      );

      const result = await service.forgotPassword(user.email);

      expect(result.message).toBe(message);
      expect(result.resetUrl).toBeUndefined();
      expect(prisma.passwordResetToken.create).toHaveBeenCalledTimes(1);
    });

    it('returns a deactivated message without creating a token for a deactivated user', async () => {
      usersService.findByEmail.mockResolvedValue(deactivatedUser);

      await expect(service.forgotPassword(user.email)).resolves.toEqual({
        message:
          'Your account has been deactivated. Please contact your administrator.',
      });
      expect(prisma.passwordResetToken.updateMany).not.toHaveBeenCalled();
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const validToken = {
      id: 'reset-1',
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user,
    };

    it('looks the token up by its hash, updates the password and revokes sessions', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(validToken);
      (argon2.hash as jest.Mock).mockResolvedValue('new-hash');

      await expect(
        service.resetPassword('raw-token', 'newPassword1', '127.0.0.1'),
      ).resolves.toEqual({ message: 'Password reset successfully' });

      expect(prisma.passwordResetToken.findUnique).toHaveBeenCalledWith({
        where: { tokenHash: hashToken('raw-token') },
        include: { user: true },
      });
      expect(argon2.hash).toHaveBeenCalledWith('newPassword1');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: 'new-hash', updatedAt: expect.any(Date) },
      });
      expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
        where: { id: 'reset-1' },
        data: { usedAt: expect.any(Date) },
      });
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['does not exist', null],
      ['was already used', { ...validToken, usedAt: new Date() }],
      [
        'has expired',
        { ...validToken, expiresAt: new Date(Date.now() - 1000) },
      ],
      [
        'belongs to a deactivated user',
        { ...validToken, user: deactivatedUser },
      ],
    ])('rejects a token that %s', async (_label, stored) => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(stored);

      await expect(
        service.resetPassword('raw-token', 'newPassword1', '127.0.0.1'),
      ).rejects.toThrow(
        new UnauthorizedException('Invalid or expired reset token'),
      );
      expect(argon2.hash).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    const res = { cookie: jest.fn() };
    const storedToken = {
      id: 'rt-1',
      userId: 'user-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + DAY_MS),
      user,
    };

    it('throws when no refresh token is provided', async () => {
      await expect(
        service.refresh('', res as unknown as Response),
      ).rejects.toThrow(new UnauthorizedException('Refresh token missing'));
    });

    it('throws when the token is unknown', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        service.refresh('raw-refresh', res as unknown as Response),
      ).rejects.toThrow(new UnauthorizedException('Invalid refresh token'));
    });

    it('revokes every session of the user when a revoked token is reused', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        ...storedToken,
        revokedAt: new Date(),
      });

      await expect(
        service.refresh('raw-refresh', res as unknown as Response),
      ).rejects.toThrow(
        new UnauthorizedException('Refresh token reuse detected'),
      );
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('throws when the token has expired', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        ...storedToken,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.refresh('raw-refresh', res as unknown as Response),
      ).rejects.toThrow(new UnauthorizedException('Refresh token expired'));
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('revokes every session and throws 403 for a deactivated user', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        ...storedToken,
        user: deactivatedUser,
      });

      await expect(
        service.refresh('raw-refresh', res as unknown as Response),
      ).rejects.toThrow(new ForbiddenException('Account is deactivated'));
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('rotates the refresh token and sets new httpOnly cookies', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(storedToken);

      await expect(
        service.refresh('raw-refresh', res as unknown as Response),
      ).resolves.toEqual({ message: 'Token refreshed' });

      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { tokenHash: hashToken('raw-refresh') },
        include: { user: true },
      });
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
        data: { revokedAt: expect.any(Date) },
      });
      const { data } = prisma.refreshToken.create.mock.calls[0][0];
      expect(data.userId).toBe('user-1');
      expect(data.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);

      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        'signed-access-token',
        expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
      );
      const refreshCookie = res.cookie.mock.calls.find(
        ([name]) => name === 'refresh_token',
      );
      expect(refreshCookie).toBeDefined();
      expect(hashToken(refreshCookie![1])).toBe(data.tokenHash);
      expect(refreshCookie![2]).toEqual(
        expect.objectContaining({ httpOnly: true }),
      );
    });
  });

  describe('logout', () => {
    it('does nothing when no refresh token is provided', async () => {
      await service.logout('');

      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });

    it('revokes the matching refresh token by its hash', async () => {
      await service.logout('raw-refresh');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { tokenHash: hashToken('raw-refresh'), revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});
