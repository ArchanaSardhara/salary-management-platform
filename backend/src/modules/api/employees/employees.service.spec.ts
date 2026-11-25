import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import type { CreateEmployeeDto } from './dto/create-employee.dto';
import type { ListEmployeesQueryDto } from './dto/list-employees-query.dto';
import { parseEmployeeCode } from './employee.constants';
import {
  buildListWhere,
  EMPLOYEE_MESSAGES,
  EmployeesService,
} from './employees.service';

describe('EmployeesService', () => {
  const employeeModel = {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    updateMany: jest.fn(),
  };
  const tx = { employee: employeeModel };
  const prisma = {
    ...tx,
    // Array form: run the queries; callback form: pass the model mock as tx.
    $transaction: jest.fn(
      (arg: unknown): Promise<unknown> =>
        typeof arg === 'function'
          ? (arg as (client: typeof tx) => Promise<unknown>)(tx)
          : Promise.all(arg as Promise<unknown>[]),
    ),
  };
  let service: EmployeesService;

  const now = new Date('2026-11-24T10:00:00Z');
  const dbEmployee = {
    id: 'emp-1',
    employeeNumber: 42,
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya@example.com',
    countryCode: 'IN',
    department: 'Engineering',
    jobTitle: 'Software Engineer',
    startDate: new Date('2026-01-15T00:00:00.000Z'),
    endDate: null,
    version: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  const deletedEmployee = { ...dbEmployee, deletedAt: now, version: 2 };

  const createDto: CreateEmployeeDto = {
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya@example.com',
    countryCode: 'IN',
    department: 'Engineering',
    jobTitle: 'Software Engineer',
    startDate: '2026-01-15',
  };

  const uniqueEmailError = new Prisma.PrismaClientKnownRequestError(
    'Unique constraint failed on the fields: (`email`)',
    { code: 'P2002', clientVersion: 'test' },
  );

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EmployeesService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('stores the employee and returns it with a formatted code and ACTIVE status', async () => {
      employeeModel.create.mockResolvedValue(dbEmployee);

      const result = await service.create(createDto);

      expect(employeeModel.create).toHaveBeenCalledWith({
        data: {
          firstName: createDto.firstName,
          lastName: createDto.lastName ?? null,
          email: createDto.email ?? null,
          countryCode: createDto.countryCode,
          department: createDto.department,
          jobTitle: createDto.jobTitle,
          startDate: new Date('2026-01-15T00:00:00.000Z'),
          endDate: null,
        },
      });
      expect(result).toMatchObject({
        id: 'emp-1',
        employeeCode: 'EMP-000042',
        status: 'ACTIVE',
        version: 1,
      });
      expect(result).not.toHaveProperty('employeeNumber');
    });

    it('stores a missing email as null', async () => {
      employeeModel.create.mockResolvedValue({ ...dbEmployee, email: null });
      const { email: _omit, ...withoutEmail } = createDto;

      await service.create(withoutEmail);

      expect(employeeModel.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ email: null, startDate: new Date('2026-01-15T00:00:00.000Z') }),
      });
    });

    it('stores a missing last name as null and returns it', async () => {
      employeeModel.create.mockResolvedValue({ ...dbEmployee, lastName: null });
      const { lastName: _omit, ...withoutLastName } = createDto;

      const result = await service.create(withoutLastName);

      expect(employeeModel.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ lastName: null, startDate: new Date('2026-01-15T00:00:00.000Z') }),
      });
      expect(result).toMatchObject({ firstName: 'Priya', lastName: null });
    });

    it('maps a duplicate email to 409', async () => {
      employeeModel.create.mockRejectedValue(uniqueEmailError);

      await expect(service.create(createDto)).rejects.toThrow(
        new ConflictException(EMPLOYEE_MESSAGES.emailTaken),
      );
    });

    it('rethrows other errors unchanged', async () => {
      const error = new Error('connection lost');
      employeeModel.create.mockRejectedValue(error);

      await expect(service.create(createDto)).rejects.toBe(error);
    });
  });

  describe('findAll', () => {
    const query = (
      overrides: Partial<ListEmployeesQueryDto> = {},
    ): ListEmployeesQueryDto => ({
      page: 1,
      pageSize: 20,
      status: ['active'],
      ...overrides,
    });

    it('returns a page of active employees in a stable order with metadata', async () => {
      employeeModel.findMany.mockResolvedValue([dbEmployee]);
      employeeModel.count.mockResolvedValue(45);

      const result = await service.findAll(query({ page: 3, pageSize: 20 }));

      expect(employeeModel.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { employeeNumber: 'asc' },
        skip: 40,
        take: 20,
      });
      expect(employeeModel.count).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
      expect(result.meta).toEqual({
        page: 3,
        pageSize: 20,
        total: 45,
        totalPages: 3,
      });
      expect(result.data[0].employeeCode).toBe('EMP-000042');
    });

    it.each([
      [['deleted'], { deletedAt: { not: null } }],
      [['all'], {}],
      [['active', 'deleted'], {}],
    ] as const)('filters status=%j', async (status, where) => {
      employeeModel.findMany.mockResolvedValue([]);
      employeeModel.count.mockResolvedValue(0);

      const result = await service.findAll(query({ status: [...status] }));

      expect(employeeModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where }),
      );
      expect(result).toEqual({
        data: [],
        meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      });
    });
  });

  describe('buildListWhere', () => {
    const base = { status: ['active' as const] };
    const textTerm = (term: string) => ({
      OR: [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ],
    });

    it('returns only the status condition when no filters are given', () => {
      expect(buildListWhere(base)).toEqual({ deletedAt: null });
    });

    it('matches any of several countries and departments', () => {
      expect(
        buildListWhere({
          ...base,
          countryCode: ['IN', 'US'],
          department: ['Engineering', 'Finance'],
        }),
      ).toEqual({
        AND: [
          { deletedAt: null },
          { countryCode: { in: ['IN', 'US'] } },
          { department: { in: ['Engineering', 'Finance'] } },
        ],
      });
    });

    it('has no conditions when all statuses are selected and nothing else', () => {
      expect(buildListWhere({ status: ['active', 'deleted'] })).toEqual({});
      expect(buildListWhere({ status: ['all'] })).toEqual({});
    });

    it('omits the status condition when all statuses are selected', () => {
      expect(
        buildListWhere({ status: ['all'], department: ['Finance'] }),
      ).toEqual({ department: { in: ['Finance'] } });
    });

    it('requires every search term to match a name or email', () => {
      expect(buildListWhere({ ...base, search: 'priya  sharma' })).toEqual({
        AND: [
          { deletedAt: null },
          { AND: [textTerm('priya'), textTerm('sharma')] },
        ],
      });
    });

    it.each([
      ['EMP-000042', 42],
      ['emp42', 42],
      ['42', 42],
    ])('also matches employee code %s exactly', (search, employeeNumber) => {
      expect(buildListWhere({ ...base, search })).toEqual({
        AND: [
          { deletedAt: null },
          { OR: [{ AND: [textTerm(search)] }, { employeeNumber }] },
        ],
      });
    });
  });

  describe('parseEmployeeCode', () => {
    it.each([
      ['EMP-000042', 42],
      ['emp-7', 7],
      [' 15 ', 15],
      ['priya', null],
      ['EMP-', null],
      ['1234567890', null],
    ])('parses %s as %s', (term, expected) => {
      expect(parseEmployeeCode(term)).toBe(expected);
    });
  });

  describe('getOptions', () => {
    it('returns ISO country codes, countries in use and fixed lists', async () => {
      employeeModel.findMany.mockResolvedValue([
        { countryCode: 'DE' },
        { countryCode: 'IN' },
      ]);

      const result = await service.getOptions();

      expect(employeeModel.findMany).toHaveBeenCalledWith({
        distinct: ['countryCode'],
        select: { countryCode: true },
        orderBy: { countryCode: 'asc' },
      });
      expect(result.countriesInUse).toEqual(['DE', 'IN']);
      expect(result.countryCodes).toContain('IN');
      expect(result.countryCodes).toEqual([...result.countryCodes].sort());
      expect(result.departments).toContain('Engineering');
      expect(result.jobTitles).toContain('Software Engineer');
    });
  });

  describe('findOne', () => {
    it('returns an active employee', async () => {
      employeeModel.findUnique.mockResolvedValue(dbEmployee);

      await expect(service.findOne('emp-1')).resolves.toMatchObject({
        id: 'emp-1',
        status: 'ACTIVE',
      });
    });

    it('returns a soft-deleted employee with DELETED status', async () => {
      employeeModel.findUnique.mockResolvedValue(deletedEmployee);

      await expect(service.findOne('emp-1')).resolves.toMatchObject({
        status: 'DELETED',
        deletedAt: now,
      });
    });

    it('throws 404 when the employee does not exist', async () => {
      employeeModel.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        new NotFoundException(EMPLOYEE_MESSAGES.notFound),
      );
    });
  });

  describe('update', () => {
    it('updates only the provided fields when the version matches and bumps the version', async () => {
      employeeModel.updateMany.mockResolvedValue({ count: 1 });
      employeeModel.findUniqueOrThrow.mockResolvedValue({
        ...dbEmployee,
        jobTitle: 'Senior Software Engineer',
        version: 2,
      });

      const result = await service.update('emp-1', {
        version: 1,
        jobTitle: 'Senior Software Engineer',
      });

      expect(employeeModel.updateMany).toHaveBeenCalledWith({
        where: { id: 'emp-1', version: 1, deletedAt: null },
        data: {
          jobTitle: 'Senior Software Engineer',
          version: { increment: 1 },
        },
      });
      expect(result).toMatchObject({
        jobTitle: 'Senior Software Engineer',
        version: 2,
      });
    });

    it('clears the email when email is null', async () => {
      employeeModel.updateMany.mockResolvedValue({ count: 1 });
      employeeModel.findUniqueOrThrow.mockResolvedValue({
        ...dbEmployee,
        email: null,
      });

      await service.update('emp-1', { version: 1, email: null });

      expect(employeeModel.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { email: null, version: { increment: 1 } },
        }),
      );
    });

    it('rejects an update with no fields besides version', async () => {
      await expect(service.update('emp-1', { version: 1 })).rejects.toThrow(
        new BadRequestException(EMPLOYEE_MESSAGES.noChanges),
      );
      expect(employeeModel.updateMany).not.toHaveBeenCalled();
    });

    it('throws 404 when the employee does not exist', async () => {
      employeeModel.updateMany.mockResolvedValue({ count: 0 });
      employeeModel.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { version: 1, firstName: 'X' }),
      ).rejects.toThrow(new NotFoundException(EMPLOYEE_MESSAGES.notFound));
    });

    it('throws 409 when the version is stale', async () => {
      employeeModel.updateMany.mockResolvedValue({ count: 0 });
      employeeModel.findUnique.mockResolvedValue({ ...dbEmployee, version: 3 });

      await expect(
        service.update('emp-1', { version: 1, firstName: 'X' }),
      ).rejects.toThrow(new ConflictException(EMPLOYEE_MESSAGES.staleVersion));
    });

    it('throws 409 when the employee was deleted', async () => {
      employeeModel.updateMany.mockResolvedValue({ count: 0 });
      employeeModel.findUnique.mockResolvedValue(deletedEmployee);

      await expect(
        service.update('emp-1', { version: 2, firstName: 'X' }),
      ).rejects.toThrow(new ConflictException(EMPLOYEE_MESSAGES.deleted));
    });

    it('maps a duplicate email to 409', async () => {
      employeeModel.updateMany.mockRejectedValue(uniqueEmailError);

      await expect(
        service.update('emp-1', { version: 1, email: 'taken@example.com' }),
      ).rejects.toThrow(new ConflictException(EMPLOYEE_MESSAGES.emailTaken));
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt on an active employee and bumps the version', async () => {
      employeeModel.updateMany.mockResolvedValue({ count: 1 });
      employeeModel.findUniqueOrThrow.mockResolvedValue(deletedEmployee);

      const result = await service.softDelete('emp-1');

      expect(employeeModel.updateMany).toHaveBeenCalledWith({
        where: { id: 'emp-1', deletedAt: null },
        data: { deletedAt: expect.any(Date), version: { increment: 1 } },
      });
      expect(result.status).toBe('DELETED');
    });

    it('throws 404 when the employee does not exist', async () => {
      employeeModel.updateMany.mockResolvedValue({ count: 0 });
      employeeModel.findUnique.mockResolvedValue(null);

      await expect(service.softDelete('missing')).rejects.toThrow(
        new NotFoundException(EMPLOYEE_MESSAGES.notFound),
      );
    });

    it('throws 409 when the employee is already deleted', async () => {
      employeeModel.updateMany.mockResolvedValue({ count: 0 });
      employeeModel.findUnique.mockResolvedValue(deletedEmployee);

      await expect(service.softDelete('emp-1')).rejects.toThrow(
        new ConflictException(EMPLOYEE_MESSAGES.alreadyDeleted),
      );
    });
  });

  describe('restore', () => {
    it('clears deletedAt on a deleted employee and bumps the version', async () => {
      employeeModel.updateMany.mockResolvedValue({ count: 1 });
      employeeModel.findUniqueOrThrow.mockResolvedValue({
        ...dbEmployee,
        version: 3,
      });

      const result = await service.restore('emp-1');

      expect(employeeModel.updateMany).toHaveBeenCalledWith({
        where: { id: 'emp-1', deletedAt: { not: null } },
        data: { deletedAt: null, version: { increment: 1 } },
      });
      expect(result).toMatchObject({ status: 'ACTIVE', deletedAt: null });
    });

    it('throws 404 when the employee does not exist', async () => {
      employeeModel.updateMany.mockResolvedValue({ count: 0 });
      employeeModel.findUnique.mockResolvedValue(null);

      await expect(service.restore('missing')).rejects.toThrow(
        new NotFoundException(EMPLOYEE_MESSAGES.notFound),
      );
    });

    it('throws 409 when the employee is not deleted', async () => {
      employeeModel.updateMany.mockResolvedValue({ count: 0 });
      employeeModel.findUnique.mockResolvedValue(dbEmployee);

      await expect(service.restore('emp-1')).rejects.toThrow(
        new ConflictException(EMPLOYEE_MESSAGES.notDeleted),
      );
    });
  });
});
