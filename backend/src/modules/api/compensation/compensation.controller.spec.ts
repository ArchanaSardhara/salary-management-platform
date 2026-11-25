import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../../../app.setup';
import type { AuthenticatedUser } from '../../../common/authorization/authenticated-user.interface';
import { Role } from '../../../common/authorization/role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CompensationController } from './compensation.controller';
import { CompensationService } from './compensation.service';

describe('CompensationController (HTTP)', () => {
  let app: INestApplication<App>;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findCurrent: jest.fn(),
    findOne: jest.fn(),
    findAuditLog: jest.fn(),
  };

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

  const EID = 'emp-1';
  const RID = 'rec-1';

  const validBody = {
    amount: 5000,
    currencyCode: 'USD',
    effectiveFrom: '2026-01-01',
  };
  const record = {
    id: RID,
    employeeId: EID,
    amount: '5000.00',
    currencyCode: 'USD',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CompensationController],
      providers: [{ provide: CompensationService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(jwtGuard)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(() => app.close());

  beforeEach(() => {
    jest.clearAllMocks();
    currentUser = hrManager;
  });

  const http = () => request(app.getHttpServer());

  describe('access control', () => {
    const routes: Array<[string, () => request.Test]> = [
      ['POST /compensation', () => http().post(`/api/v1/employees/${EID}/compensation`).send(validBody)],
      ['GET /compensation', () => http().get(`/api/v1/employees/${EID}/compensation`)],
      ['GET /compensation/current', () => http().get(`/api/v1/employees/${EID}/compensation/current`)],
      ['GET /compensation/:id', () => http().get(`/api/v1/employees/${EID}/compensation/${RID}`)],
      ['GET /compensation/:id/audit', () => http().get(`/api/v1/employees/${EID}/compensation/${RID}/audit`)],
    ];

    // POST is restricted to HR_MANAGER; ADMIN may only read.
    const hrOnlyRoutes: Array<[string, () => request.Test]> = [
      ['POST /compensation', () => http().post(`/api/v1/employees/${EID}/compensation`).send(validBody)],
    ];

    it.each(routes)('%s returns 401 when unauthenticated', async (_r, send) => {
      currentUser = undefined;
      await send().expect(401);
    });

    it.each(hrOnlyRoutes)('%s returns 403 for ADMIN', async (_r, send) => {
      currentUser = { id: 'u-admin', role: Role.ADMIN, isActive: true };
      await send().expect(403);
    });

    it.each(routes)('%s returns 403 for a deactivated HR_MANAGER', async (_r, send) => {
      currentUser = { ...hrManager, isActive: false };
      await send().expect(403);
    });
  });

  describe('POST /employees/:id/compensation', () => {
    it('creates a record and returns 201', async () => {
      service.create.mockResolvedValue(record);

      const res = await http()
        .post(`/api/v1/employees/${EID}/compensation`)
        .send(validBody)
        .expect(201);

      expect(res.body.amount).toBe('5000.00');
      expect(service.create).toHaveBeenCalledWith(EID, validBody, 'u-hr');
    });

    it('uppercases the currency code', async () => {
      service.create.mockResolvedValue(record);

      await http()
        .post(`/api/v1/employees/${EID}/compensation`)
        .send({ ...validBody, currencyCode: 'usd' })
        .expect(201);

      expect(service.create).toHaveBeenCalledWith(
        EID,
        expect.objectContaining({ currencyCode: 'USD' }),
        'u-hr',
      );
    });

    it('accepts an explicit null effectiveTo', async () => {
      service.create.mockResolvedValue(record);

      await http()
        .post(`/api/v1/employees/${EID}/compensation`)
        .send({ ...validBody, effectiveTo: null })
        .expect(201);
    });

    it('accepts a non-null effectiveTo', async () => {
      service.create.mockResolvedValue(record);

      await http()
        .post(`/api/v1/employees/${EID}/compensation`)
        .send({ ...validBody, effectiveTo: '2026-12-31' })
        .expect(201);

      expect(service.create).toHaveBeenCalledWith(
        EID,
        expect.objectContaining({ effectiveTo: '2026-12-31' }),
        'u-hr',
      );
    });

    it.each([
      ['missing amount', { amount: undefined }],
      ['zero amount', { amount: 0 }],
      ['negative amount', { amount: -100 }],
      ['too many decimal places', { amount: 100.123 }],
      ['amount over max', { amount: 10_000_001 }],
      ['missing currencyCode', { currencyCode: undefined }],
      ['invalid currencyCode', { currencyCode: 'XYZ' }],
      ['missing effectiveFrom', { effectiveFrom: undefined }],
      ['invalid date', { effectiveFrom: 'not-a-date' }],
      ['unknown field', { employeeId: 'hack' }],
    ])('returns 400 for %s', async (_label, override) => {
      await http()
        .post(`/api/v1/employees/${EID}/compensation`)
        .send({ ...validBody, ...override })
        .expect(400);

      expect(service.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /employees/:id/compensation', () => {
    it('returns a paginated list', async () => {
      service.findAll.mockResolvedValue({ data: [record], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } });

      const res = await http().get(`/api/v1/employees/${EID}/compensation`).expect(200);

      expect(service.findAll).toHaveBeenCalledWith(EID, { page: 1, pageSize: 20 });
      expect(res.body.data).toHaveLength(1);
    });

    it.each([
      ['page 0', { page: '0' }],
      ['pageSize over 100', { pageSize: '101' }],
      ['non-numeric page', { page: 'abc' }],
    ])('returns 400 for %s', async (_label, query) => {
      await http().get(`/api/v1/employees/${EID}/compensation`).query(query).expect(400);
      expect(service.findAll).not.toHaveBeenCalled();
    });
  });

  describe('GET /employees/:id/compensation/current', () => {
    it('returns the current (open-ended) record', async () => {
      service.findCurrent.mockResolvedValue(record);

      const res = await http()
        .get(`/api/v1/employees/${EID}/compensation/current`)
        .expect(200);

      expect(res.body.id).toBe(RID);
      expect(service.findCurrent).toHaveBeenCalledWith(EID);
    });
  });

  describe('GET /employees/:id/compensation/:recordId', () => {
    it('returns a single record', async () => {
      service.findOne.mockResolvedValue(record);

      await http()
        .get(`/api/v1/employees/${EID}/compensation/${RID}`)
        .expect(200);

      expect(service.findOne).toHaveBeenCalledWith(EID, RID);
    });
  });

  describe('GET /employees/:id/compensation/:recordId/audit', () => {
    it('returns the audit log entry', async () => {
      const auditEntry = {
        id: 'audit-1',
        compensationRecordId: RID,
        changedById: 'u-hr',
        changedAt: new Date(),
        beforeValue: null,
        afterValue: { amount: '5000.00', currencyCode: 'USD', effectiveFrom: '2026-01-01', effectiveTo: null },
      };
      service.findAuditLog.mockResolvedValue(auditEntry);

      const res = await http()
        .get(`/api/v1/employees/${EID}/compensation/${RID}/audit`)
        .expect(200);

      expect(res.body.changedById).toBe('u-hr');
      expect(service.findAuditLog).toHaveBeenCalledWith(EID, RID);
    });
  });
});
