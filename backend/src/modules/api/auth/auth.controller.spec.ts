import {
  ExecutionContext,
  ForbiddenException,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../../../app.setup';
import { Role } from '../../../common/authorization/role.enum';
import type { IUser } from '../users/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * HTTP-level tests for AuthController using Supertest. AuthService is mocked,
 * so these cover routing, cookies, status codes and error mapping — not the
 * token/DB logic, which auth.service.spec.ts covers.
 */
describe('AuthController (HTTP)', () => {
  let app: INestApplication<App>;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    verify: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    verifyEmail: jest.fn(),
  };
  /**
   * Stands in for JwtAuthGuard: sets request.user from test state (like the
   * real JwtStrategy does from the database), so the real RolesGuard runs.
   */
  let currentUser: IUser | undefined;
  const guard = {
    canActivate: jest.fn((context: ExecutionContext) => {
      context.switchToHttp().getRequest<{ user?: IUser }>().user = currentUser;
      return true;
    }),
  };
  const activeUser = (role: Role): IUser => ({
    id: 'user-1',
    firstName: 'Ada',
    lastName: null,
    email: 'ada@example.com',
    emailVerified: false,
    role,
    isActive: true,
  });

  const registerBody = {
    firstName: 'Ada',
    email: 'ada@example.com',
    password: 'password123',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(guard)
      .compile();

    app = moduleRef.createNestApplication();
    // Same global setup as src/main.ts (cookies, validation, filter, logging).
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    currentUser = undefined;
  });

  function cookiesOf(res: request.Response): string[] {
    const header = res.headers['set-cookie'] as unknown as string[] | undefined;
    return header ?? [];
  }

  describe('POST /api/v1/auth/register', () => {
    it('sets the access and refresh cookies as httpOnly and returns success', async () => {
      authService.register.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...registerBody, rememberMe: true })
        .expect(200);

      expect(res.body).toEqual({
        success: true,
        message: 'Registration successful',
      });
      expect(authService.register).toHaveBeenCalledWith(
        expect.objectContaining(registerBody),
      );
      const cookies = cookiesOf(res);
      expect(cookies).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/^access_token=access;.*HttpOnly/),
          expect.stringMatching(/^refresh_token=refresh;.*HttpOnly/),
        ]),
      );
    });

    it('sets only the access cookie when no refresh token is issued', async () => {
      authService.register.mockResolvedValue({
        accessToken: 'access',
        refreshToken: null,
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerBody)
        .expect(200);

      const cookies = cookiesOf(res);
      expect(cookies).toHaveLength(1);
      expect(cookies[0]).toMatch(/^access_token=access;/);
    });

    it('rejects a client-supplied role with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...registerBody, role: Role.ADMIN })
        .expect(400);

      expect(authService.register).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('returns success and sets cookies on valid credentials', async () => {
      authService.login.mockResolvedValue({
        accessToken: 'access',
        refreshToken: null,
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'ada@example.com', password: 'password123' })
        .expect(200);

      expect(res.body).toEqual({ success: true, message: 'Login successful' });
      expect(cookiesOf(res)[0]).toMatch(/^access_token=access;/);
    });

    it('returns 401 without cookies on invalid credentials', async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'ada@example.com', password: 'wrong-password' })
        .expect(401);

      expect(cookiesOf(res)).toHaveLength(0);
    });

    it('returns 403 without cookies for a deactivated account', async () => {
      authService.login.mockRejectedValue(
        new ForbiddenException('Account is deactivated'),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'ada@example.com', password: 'password123' })
        .expect(403);

      expect(cookiesOf(res)).toHaveLength(0);
    });

    it('rejects an invalid request body with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'not-an-email' })
        .expect(400);

      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/auth/verify', () => {
    it.each([Role.HR_MANAGER, Role.ADMIN])(
      'returns the authenticated %s user from request.user',
      async (role) => {
        currentUser = activeUser(role);
        authService.verify.mockImplementation((user: IUser) => user);

        const res = await request(app.getHttpServer())
          .get('/api/v1/auth/verify')
          .expect(200);

        expect(authService.verify).toHaveBeenCalledWith(currentUser);
        expect(res.body).toEqual(currentUser);
      },
    );

    it('returns 401 when no user is authenticated', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/verify').expect(401);
      expect(authService.verify).not.toHaveBeenCalled();
    });

    it('returns 403 for a deactivated user', async () => {
      currentUser = { ...activeUser(Role.HR_MANAGER), isActive: false };

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/verify')
        .expect(403);

      expect(JSON.stringify(res.body)).toContain('Account is deactivated');
      expect(authService.verify).not.toHaveBeenCalled();
    });

    it('returns 403 when the JWT guard rejects the request', async () => {
      guard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer()).get('/api/v1/auth/verify').expect(403);
      expect(authService.verify).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('passes the refresh_token cookie to the service', async () => {
      authService.refresh.mockResolvedValue({ message: 'Token refreshed' });

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', 'refresh_token=raw-refresh')
        .expect(201);

      expect(authService.refresh).toHaveBeenCalledWith(
        'raw-refresh',
        expect.anything(),
      );
    });

    it('returns 403 when the account is deactivated', async () => {
      authService.refresh.mockRejectedValue(
        new ForbiddenException('Account is deactivated'),
      );

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', 'refresh_token=raw-refresh')
        .expect(403);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('revokes the refresh token and clears both cookies', async () => {
      authService.logout.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Cookie', 'refresh_token=raw-refresh')
        .expect(201);

      expect(res.body).toEqual({ message: 'Logged out successfully' });
      expect(authService.logout).toHaveBeenCalledWith('raw-refresh');
      const cookies = cookiesOf(res);
      expect(cookies).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/^access_token=;/),
          expect.stringMatching(/^refresh_token=;/),
        ]),
      );
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('returns the service message', async () => {
      const message = {
        message: 'If an account exists, a password reset email has been sent.',
      };
      authService.forgotPassword.mockResolvedValue(message);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'ada@example.com' })
        .expect(201);

      expect(res.body).toEqual(message);
      expect(authService.forgotPassword).toHaveBeenCalledWith(
        'ada@example.com',
      );
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('passes token and password to the service', async () => {
      authService.resetPassword.mockResolvedValue({
        message: 'Password reset successfully',
      });

      await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token: 'raw-token', password: 'newPassword1' })
        .expect(201);

      expect(authService.resetPassword).toHaveBeenCalledWith(
        'raw-token',
        'newPassword1',
        expect.any(String),
      );
    });

    it('returns 401 for an invalid or expired token', async () => {
      authService.resetPassword.mockRejectedValue(
        new UnauthorizedException('Invalid or expired reset token'),
      );

      await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token: 'bad', password: 'newPassword1' })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/verify-email', () => {
    it('returns 200 and a success message for a valid token', async () => {
      authService.verifyEmail.mockResolvedValue({
        message: 'Email verified successfully',
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token: 'raw-token' })
        .expect(200);

      expect(res.body).toEqual({ message: 'Email verified successfully' });
      expect(authService.verifyEmail).toHaveBeenCalledWith('raw-token');
    });

    it('returns 400 when token is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({})
        .expect(400);

      expect(authService.verifyEmail).not.toHaveBeenCalled();
    });

    it('returns 401 for an invalid or expired token', async () => {
      authService.verifyEmail.mockRejectedValue(
        new UnauthorizedException('Invalid or expired verification link'),
      );

      await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token: 'bad-token' })
        .expect(401);
    });
  });
});
