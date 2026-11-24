import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../../../app.setup';
import type { AuthenticatedUser } from '../../../common/authorization/authenticated-user.interface';
import { Role } from '../../../common/authorization/role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

/**
 * HTTP tests for EmployeesController: routing, status codes, validation and
 * role enforcement (real RolesGuard). EmployeesService is mocked; its logic is
 * covered by employees.service.spec.ts.
 */
describe('EmployeesController (HTTP)', () => {
  let app: INestApplication<App>;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
  };

  /** Stands in for JwtAuthGuard: sets request.user from test state. */
  let currentUser: AuthenticatedUser | undefined;
  const jwtGuard = {
    canActivate: (context: ExecutionContext) => {
      context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>().user =
        currentUser;
      return true;
    },
  };
  const hrManager: AuthenticatedUser = {
    id: 'u-hr',
    role: Role.HR_MANAGER,
    isActive: true,
  };

  const validBody = {
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya@example.com',
    countryCode: 'IN',
    department: 'Engineering',
    jobTitle: 'Software Engineer',
    startDate: '2026-01-15',
  };
  const employee = { id: 'emp-1', employeeCode: 'EMP-000001', ...validBody };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [{ provide: EmployeesService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(jwtGuard)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    currentUser = hrManager;
  });

  const http = () => request(app.getHttpServer());

  describe('access control', () => {
    const routes: Array<[string, () => request.Test]> = [
      ['POST /employees', () => http().post('/employees').send(validBody)],
      ['GET /employees', () => http().get('/employees')],
      ['GET /employees/:id', () => http().get('/employees/emp-1')],
      [
        'PATCH /employees/:id',
        () =>
          http()
            .patch('/employees/emp-1')
            .send({ version: 1, firstName: 'X' }),
      ],
      ['DELETE /employees/:id', () => http().delete('/employees/emp-1')],
      [
        'POST /employees/:id/restore',
        () => http().post('/employees/emp-1/restore'),
      ],
    ];

    it.each(routes)('%s returns 401 when unauthenticated', async (_r, send) => {
      currentUser = undefined;

      await send().expect(401);
    });

    it.each(routes)('%s returns 403 for ADMIN', async (_r, send) => {
      currentUser = { id: 'u-admin', role: Role.ADMIN, isActive: true };

      await send().expect(403);
    });

    it.each(routes)(
      '%s returns 403 for a deactivated HR_MANAGER',
      async (_r, send) => {
        currentUser = { ...hrManager, isActive: false };

        await send().expect(403);
      },
    );

    it('never reaches the service when access is denied', async () => {
      currentUser = { id: 'u-admin', role: Role.ADMIN, isActive: true };

      await http().get('/employees').expect(403);
      expect(service.findAll).not.toHaveBeenCalled();
    });
  });

  describe('POST /employees', () => {
    it('creates an employee and returns 201', async () => {
      service.create.mockResolvedValue(employee);

      const res = await http().post('/employees').send(validBody).expect(201);

      expect(res.body).toEqual(employee);
      expect(service.create).toHaveBeenCalledWith(validBody);
    });

    it('normalises input: trims, lowercases email, uppercases country', async () => {
      service.create.mockResolvedValue(employee);

      await http()
        .post('/employees')
        .send({
          ...validBody,
          firstName: '  Priya  ',
          lastName: ' Sharma ',
          email: '  Priya@Example.COM ',
          countryCode: 'in',
        })
        .expect(201);

      expect(service.create).toHaveBeenCalledWith(validBody);
    });

    it('accepts a missing email', async () => {
      service.create.mockResolvedValue(employee);
      const { email: _omit, ...withoutEmail } = validBody;

      await http().post('/employees').send(withoutEmail).expect(201);
    });

    it('accepts a missing last name (single-name employees)', async () => {
      service.create.mockResolvedValue(employee);
      const { lastName: _omit, ...withoutLastName } = validBody;

      await http().post('/employees').send(withoutLastName).expect(201);

      expect(service.create).toHaveBeenCalledWith(withoutLastName);
    });

    it('stores a blank last name as null', async () => {
      service.create.mockResolvedValue(employee);

      await http()
        .post('/employees')
        .send({ ...validBody, lastName: '   ' })
        .expect(201);

      expect(service.create).toHaveBeenCalledWith({
        ...validBody,
        lastName: null,
      });
    });

    it.each([
      ['missing firstName', { firstName: undefined }],
      ['blank firstName', { firstName: '   ' }],
      ['too long firstName', { firstName: 'x'.repeat(101) }],
      ['too long lastName', { lastName: 'x'.repeat(101) }],
      ['non-string lastName', { lastName: 42 }],
      ['legacy fullName field', { fullName: 'Priya Sharma' }],
      ['invalid email', { email: 'not-an-email' }],
      ['invalid country code', { countryCode: 'XX' }],
      ['3-letter country code', { countryCode: 'IND' }],
      ['department not in list', { department: 'Space Program' }],
      ['job title not in list', { jobTitle: 'Astronaut' }],
      ['client-supplied employeeCode', { employeeCode: 'EMP-999999' }],
    ])('returns 400 for %s', async (_label, override) => {
      await http()
        .post('/employees')
        .send({ ...validBody, ...override })
        .expect(400);

      expect(service.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /employees', () => {
    it('applies default pagination and status', async () => {
      service.findAll.mockResolvedValue({ data: [], meta: {} });

      await http().get('/employees').expect(200);

      expect(service.findAll).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        status: 'active',
      });
    });

    it('converts query strings to numbers', async () => {
      service.findAll.mockResolvedValue({ data: [], meta: {} });

      await http()
        .get('/employees')
        .query({ page: '2', pageSize: '50', status: 'deleted' })
        .expect(200);

      expect(service.findAll).toHaveBeenCalledWith({
        page: 2,
        pageSize: 50,
        status: 'deleted',
      });
    });

    it.each([
      ['page 0', { page: '0' }],
      ['pageSize over 100', { pageSize: '101' }],
      ['non-numeric page', { page: 'abc' }],
      ['unknown status', { status: 'archived' }],
    ])('returns 400 for %s', async (_label, query) => {
      await http().get('/employees').query(query).expect(400);
      expect(service.findAll).not.toHaveBeenCalled();
    });
  });

  describe('GET /employees/:id', () => {
    it('returns the employee', async () => {
      service.findOne.mockResolvedValue(employee);

      const res = await http().get('/employees/emp-1').expect(200);

      expect(res.body).toEqual(employee);
      expect(service.findOne).toHaveBeenCalledWith('emp-1');
    });
  });

  describe('PATCH /employees/:id', () => {
    it('passes the version and changed fields to the service', async () => {
      service.update.mockResolvedValue(employee);

      await http()
        .patch('/employees/emp-1')
        .send({ version: 3, jobTitle: 'Engineering Manager' })
        .expect(200);

      expect(service.update).toHaveBeenCalledWith('emp-1', {
        version: 3,
        jobTitle: 'Engineering Manager',
      });
    });

    it('allows clearing the email with null', async () => {
      service.update.mockResolvedValue(employee);

      await http()
        .patch('/employees/emp-1')
        .send({ version: 1, email: null })
        .expect(200);

      expect(service.update).toHaveBeenCalledWith('emp-1', {
        version: 1,
        email: null,
      });
    });

    it('allows clearing the last name with null', async () => {
      service.update.mockResolvedValue(employee);

      await http()
        .patch('/employees/emp-1')
        .send({ version: 1, lastName: null })
        .expect(200);

      expect(service.update).toHaveBeenCalledWith('emp-1', {
        version: 1,
        lastName: null,
      });
    });

    it.each([
      ['missing version', { firstName: 'X' }],
      ['non-integer version', { version: 1.5, firstName: 'X' }],
      ['null firstName', { version: 1, firstName: null }],
      ['null department', { version: 1, department: null }],
      ['invalid job title', { version: 1, jobTitle: 'Astronaut' }],
      ['client-supplied employeeCode', { version: 1, employeeCode: 'EMP-1' }],
    ])('returns 400 for %s', async (_label, body) => {
      await http().patch('/employees/emp-1').send(body).expect(400);
      expect(service.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /employees/:id', () => {
    it('soft deletes and returns 200 with the deleted employee', async () => {
      service.softDelete.mockResolvedValue({ ...employee, status: 'DELETED' });

      const res = await http().delete('/employees/emp-1').expect(200);

      expect(res.body.status).toBe('DELETED');
      expect(service.softDelete).toHaveBeenCalledWith('emp-1');
    });
  });

  describe('POST /employees/:id/restore', () => {
    it('restores and returns 200', async () => {
      service.restore.mockResolvedValue({ ...employee, status: 'ACTIVE' });

      const res = await http().post('/employees/emp-1/restore').expect(200);

      expect(res.body.status).toBe('ACTIVE');
      expect(service.restore).toHaveBeenCalledWith('emp-1');
    });
  });
});
