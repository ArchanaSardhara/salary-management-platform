import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../../../app.setup';
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
  };
  const guard = { canActivate: jest.fn() };

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
  });

  function cookiesOf(res: request.Response): string[] {
    const header = res.headers['set-cookie'] as unknown as string[] | undefined;
    return header ?? [];
  }

  describe('POST /auth/register', () => {
    it('sets the access and refresh cookies as httpOnly and returns success', async () => {
      authService.register.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const res = await request(app.getHttpServer())
        .post('/auth/register')
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
        .post('/auth/register')
        .send(registerBody)
        .expect(200);

      const cookies = cookiesOf(res);
      expect(cookies).toHaveLength(1);
      expect(cookies[0]).toMatch(/^access_token=access;/);
    });
  });

  describe('POST /auth/login', () => {
    it('returns success and sets cookies on valid credentials', async () => {
      authService.login.mockResolvedValue({
        accessToken: 'access',
        refreshToken: null,
      });

      const res = await request(app.getHttpServer())
        .post('/auth/login')
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
        .post('/auth/login')
        .send({ email: 'ada@example.com', password: 'wrong-password' })
        .expect(401);

      expect(cookiesOf(res)).toHaveLength(0);
    });

    it('rejects an invalid request body with 400', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email' })
        .expect(400);

      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  describe('GET /auth/verify', () => {
    it('returns the authenticated user when the guard allows the request', async () => {
      guard.canActivate.mockReturnValue(true);
      authService.verify.mockResolvedValue({ id: 'user-1' });

      const res = await request(app.getHttpServer())
        .get('/auth/verify')
        .expect(200);

      expect(res.body).toEqual({ id: 'user-1' });
    });

    it('returns 403 when the guard rejects the request', async () => {
      guard.canActivate.mockReturnValue(false);

      await request(app.getHttpServer()).get('/auth/verify').expect(403);
      expect(authService.verify).not.toHaveBeenCalled();
    });
  });

  describe('POST /auth/refresh', () => {
    it('passes the refresh_token cookie to the service', async () => {
      authService.refresh.mockResolvedValue({ message: 'Token refreshed' });

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', 'refresh_token=raw-refresh')
        .expect(201);

      expect(authService.refresh).toHaveBeenCalledWith(
        'raw-refresh',
        expect.anything(),
      );
    });
  });

  describe('POST /auth/logout', () => {
    it('revokes the refresh token and clears both cookies', async () => {
      authService.logout.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post('/auth/logout')
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

  describe('POST /auth/forgot-password', () => {
    it('returns the service message', async () => {
      const message = {
        message: 'If an account exists, a password reset email has been sent.',
      };
      authService.forgotPassword.mockResolvedValue(message);

      const res = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'ada@example.com' })
        .expect(201);

      expect(res.body).toEqual(message);
      expect(authService.forgotPassword).toHaveBeenCalledWith(
        'ada@example.com',
      );
    });
  });

  describe('POST /auth/reset-password', () => {
    it('passes token and password to the service', async () => {
      authService.resetPassword.mockResolvedValue({
        message: 'Password reset successfully',
      });

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'raw-token', password: 'newPassword1' })
        .expect(201);

      expect(authService.resetPassword).toHaveBeenCalledWith(
        'raw-token',
        'newPassword1',
      );
    });

    it('returns 401 for an invalid or expired token', async () => {
      authService.resetPassword.mockRejectedValue(
        new UnauthorizedException('Invalid or expired reset token'),
      );

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'bad', password: 'newPassword1' })
        .expect(401);
    });
  });
});
