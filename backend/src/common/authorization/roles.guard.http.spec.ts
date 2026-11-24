import {
  CanActivate,
  Controller,
  ExecutionContext,
  Get,
  INestApplication,
  Injectable,
  UseGuards,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../../app.setup';
import type { AuthenticatedUser } from './authenticated-user.interface';
import { Role } from './role.enum';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

/**
 * Stands in for JwtAuthGuard: sets request.user from a value the test controls
 * (never from the request), like the real authentication layer will.
 */
let currentUser: AuthenticatedUser | undefined;

@Injectable()
class FakeAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>().user =
      currentUser;
    return true;
  }
}

@Controller('hr')
@UseGuards(FakeAuthGuard, RolesGuard)
@Roles(Role.HR_MANAGER)
class HrTestController {
  @Get()
  get() {
    return { ok: 'hr' };
  }
}

@Controller('admin')
@UseGuards(FakeAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
class AdminTestController {
  @Get()
  get() {
    return { ok: 'admin' };
  }
}

@Controller('public')
@UseGuards(FakeAuthGuard, RolesGuard)
class PublicTestController {
  @Get()
  get() {
    return { ok: 'public' };
  }
}

describe('RolesGuard (HTTP)', () => {
  let app: INestApplication<App>;

  const hrManager: AuthenticatedUser = {
    id: 'u-hr',
    role: Role.HR_MANAGER,
    isActive: true,
  };
  const admin: AuthenticatedUser = {
    id: 'u-admin',
    role: Role.ADMIN,
    isActive: true,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HrTestController, AdminTestController, PublicTestController],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    currentUser = undefined;
  });

  it('returns 401 for an unauthenticated request to a protected route', async () => {
    await request(app.getHttpServer()).get('/hr').expect(401);
    await request(app.getHttpServer()).get('/admin').expect(401);
  });

  it('lets HR_MANAGER reach HR routes but returns 403 on admin routes', async () => {
    currentUser = hrManager;

    await request(app.getHttpServer())
      .get('/hr')
      .expect(200, { ok: 'hr' });
    await request(app.getHttpServer()).get('/admin').expect(403);
  });

  it('lets ADMIN reach admin routes but returns 403 on HR routes', async () => {
    currentUser = admin;

    await request(app.getHttpServer())
      .get('/admin')
      .expect(200, { ok: 'admin' });
    await request(app.getHttpServer()).get('/hr').expect(403);
  });

  it('returns 403 for a deactivated user with the right role', async () => {
    currentUser = { ...hrManager, isActive: false };

    const res = await request(app.getHttpServer()).get('/hr').expect(403);
    expect(JSON.stringify(res.body)).toContain('Account is deactivated');
  });

  it('returns 403 when authentication did not provide a role', async () => {
    currentUser = { id: 'u', isActive: true };

    await request(app.getHttpServer()).get('/hr').expect(403);
  });

  it('does not restrict routes without @Roles', async () => {
    await request(app.getHttpServer())
      .get('/public')
      .expect(200, { ok: 'public' });
  });
});
