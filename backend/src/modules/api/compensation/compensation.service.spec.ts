import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { CompensationService } from './compensation.service';
import { COMPENSATION_MESSAGES } from './compensation.constants';
import type { CreateCompensationDto } from './dto/create-compensation.dto';

describe('CompensationService', () => {
  const employeeModel = {
    findUnique: jest.fn(),
  };
  const compensationModel = {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  };
  const auditLogModel = {
    create: jest.fn(),
  };
  const tx = {
    compensationRecord: compensationModel,
    auditLog: auditLogModel,
    employee: employeeModel,
  };
  const prisma = {
    employee: employeeModel,
    compensationRecord: compensationModel,
    auditLog: auditLogModel,
    $transaction: jest.fn(
      (arg: unknown): Promise<unknown> =>
        typeof arg === 'function'
          ? (arg as (client: typeof tx) => Promise<unknown>)(tx)
          : Promise.all(arg as Promise<unknown>[]),
    ),
  };

  let service: CompensationService;

  const now = new Date('2026-01-01T00:00:00.000Z');
  const activeEmployee = {
    id: 'emp-1',
    employeeNumber: 1,
    firstName: 'Priya',
    lastName: 'Sharma',
    email: null,
    countryCode: 'IN',
    department: 'Engineering',
    jobTitle: 'Software Engineer',
    version: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  const deletedEmployee = { ...activeEmployee, deletedAt: now };

  const dbRecord = {
    id: 'rec-1',
    employeeId: 'emp-1',
    amount: new Prisma.Decimal('5000.00'),
    currencyCode: 'USD',
    effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
    effectiveTo: null,
    createdAt: now,
    updatedAt: now,
  };

  const createDto: CreateCompensationDto = {
    amount: 5000,
    currencyCode: 'USD',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CompensationService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates the record and audit log and returns the response', async () => {
      employeeModel.findUnique.mockResolvedValue(activeEmployee);
      compensationModel.findFirst
        .mockResolvedValueOnce(null)   // overlap check
        .mockResolvedValueOnce(null);  // previous record (tx) — no prior record
      compensationModel.create.mockResolvedValue(dbRecord);
      auditLogModel.create.mockResolvedValue({});

      const result = await service.create('emp-1', createDto, 'user-1');

      expect(compensationModel.create).toHaveBeenCalledWith({
        data: {
          employeeId: 'emp-1',
          amount: 5000,
          currencyCode: 'USD',
          effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
          effectiveTo: null,
        },
      });
      expect(auditLogModel.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          compensationRecordId: 'rec-1',
          changedBy: 'user-1',
          beforeValue: Prisma.JsonNull,
        }),
      });
      expect(result.amount).toBe('5000.00');
      expect(result.effectiveFrom).toBe('2026-01-01');
    });

    it('sets beforeValue when a previous record exists', async () => {
      const prevRecord = { ...dbRecord, id: 'rec-0', amount: new Prisma.Decimal('4000.00') };
      employeeModel.findUnique.mockResolvedValue(activeEmployee);
      compensationModel.findFirst
        .mockResolvedValueOnce(null)      // overlap check
        .mockResolvedValueOnce(prevRecord); // previous (tx)
      compensationModel.create.mockResolvedValue(dbRecord);
      auditLogModel.create.mockResolvedValue({});

      await service.create('emp-1', createDto, 'user-1');

      expect(auditLogModel.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          beforeValue: expect.objectContaining({ amount: '4000.00' }),
          afterValue: expect.objectContaining({ amount: '5000.00' }),
        }),
      });
    });

    it('throws 404 when the employee does not exist', async () => {
      employeeModel.findUnique.mockResolvedValue(null);

      await expect(service.create('missing', createDto, 'u')).rejects.toThrow(
        new NotFoundException(COMPENSATION_MESSAGES.employeeNotFound),
      );
    });

    it('throws 409 when the employee is deleted', async () => {
      employeeModel.findUnique.mockResolvedValue(deletedEmployee);

      await expect(service.create('emp-1', createDto, 'u')).rejects.toThrow(
        new ConflictException(COMPENSATION_MESSAGES.employeeDeleted),
      );
    });

    it('throws 400 when effectiveTo is before effectiveFrom', async () => {
      employeeModel.findUnique.mockResolvedValue(activeEmployee);

      await expect(
        service.create('emp-1', { ...createDto, effectiveFrom: '2026-06-01', effectiveTo: '2026-01-01' }, 'u'),
      ).rejects.toThrow(new BadRequestException(COMPENSATION_MESSAGES.endBeforeStart));
    });

    it('throws 409 when the new period overlaps an existing record', async () => {
      employeeModel.findUnique.mockResolvedValue(activeEmployee);
      compensationModel.findFirst.mockResolvedValue(dbRecord); // overlap found

      await expect(service.create('emp-1', createDto, 'u')).rejects.toThrow(
        new ConflictException(COMPENSATION_MESSAGES.overlap),
      );
    });

    it('passes the overlap check without an end-date filter when effectiveTo is null', async () => {
      employeeModel.findUnique.mockResolvedValue(activeEmployee);
      compensationModel.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      compensationModel.create.mockResolvedValue(dbRecord);
      auditLogModel.create.mockResolvedValue({});

      await service.create('emp-1', { ...createDto, effectiveTo: null }, 'u');

      const overlapWhere = compensationModel.findFirst.mock.calls[0][0].where;
      // When effectiveTo is null the AND array should have exactly one element
      // (the OR for the existing-record end check); no effectiveFrom lte filter.
      expect(overlapWhere.AND).toHaveLength(1);
    });
  });

  describe('findAll', () => {
    it('returns a paginated list ordered by effectiveFrom descending', async () => {
      employeeModel.findUnique.mockResolvedValue(activeEmployee);
      compensationModel.findMany.mockResolvedValue([dbRecord]);
      compensationModel.count.mockResolvedValue(1);

      const result = await service.findAll('emp-1', { page: 1, pageSize: 20 });

      expect(compensationModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { effectiveFrom: 'desc' } }),
      );
      expect(result.data[0].amount).toBe('5000.00');
      expect(result.meta.total).toBe(1);
    });

    it('throws 404 when the employee does not exist', async () => {
      employeeModel.findUnique.mockResolvedValue(null);

      await expect(
        service.findAll('missing', { page: 1, pageSize: 20 }),
      ).rejects.toThrow(new NotFoundException(COMPENSATION_MESSAGES.employeeNotFound));
    });
  });

  describe('findCurrent', () => {
    it('returns the open-ended record', async () => {
      employeeModel.findUnique.mockResolvedValue(activeEmployee);
      compensationModel.findFirst.mockResolvedValue(dbRecord);

      const result = await service.findCurrent('emp-1');

      expect(compensationModel.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { employeeId: 'emp-1', effectiveTo: null } }),
      );
      expect(result.effectiveTo).toBeNull();
    });

    it('throws 404 when no current record exists', async () => {
      employeeModel.findUnique.mockResolvedValue(activeEmployee);
      compensationModel.findFirst.mockResolvedValue(null);

      await expect(service.findCurrent('emp-1')).rejects.toThrow(
        new NotFoundException(COMPENSATION_MESSAGES.noCurrent),
      );
    });
  });

  describe('findOne', () => {
    it('returns the record by id and employeeId', async () => {
      employeeModel.findUnique.mockResolvedValue(activeEmployee);
      compensationModel.findFirst.mockResolvedValue(dbRecord);

      const result = await service.findOne('emp-1', 'rec-1');

      expect(compensationModel.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rec-1', employeeId: 'emp-1' } }),
      );
      expect(result.id).toBe('rec-1');
    });

    it('throws 404 when the record is not found', async () => {
      employeeModel.findUnique.mockResolvedValue(activeEmployee);
      compensationModel.findFirst.mockResolvedValue(null);

      await expect(service.findOne('emp-1', 'missing')).rejects.toThrow(
        new NotFoundException(COMPENSATION_MESSAGES.notFound),
      );
    });
  });

  describe('findAuditLog', () => {
    it('returns the audit log for a compensation record', async () => {
      const auditLog = {
        id: 'audit-1',
        compensationRecordId: 'rec-1',
        changedBy: 'user-1',
        changedAt: now,
        beforeValue: null,
        afterValue: { amount: '5000.00', currencyCode: 'USD', effectiveFrom: '2026-01-01', effectiveTo: null },
      };
      employeeModel.findUnique.mockResolvedValue(activeEmployee);
      compensationModel.findFirst.mockResolvedValue({ ...dbRecord, auditLog });

      const result = await service.findAuditLog('emp-1', 'rec-1');

      expect(result.changedBy).toBe('user-1');
      expect(result.beforeValue).toBeNull();
    });

    it('throws 404 when the compensation record is not found', async () => {
      employeeModel.findUnique.mockResolvedValue(activeEmployee);
      compensationModel.findFirst.mockResolvedValue(null);

      await expect(service.findAuditLog('emp-1', 'missing')).rejects.toThrow(
        new NotFoundException(COMPENSATION_MESSAGES.notFound),
      );
    });
  });
});
