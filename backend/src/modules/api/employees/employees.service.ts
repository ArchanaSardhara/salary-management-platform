import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';

function parseDate(dateStr: string): Date {
  return new Date(`${dateStr.split('T')[0]}T00:00:00.000Z`);
}
import { CountryCodes } from 'validator/lib/isISO31661Alpha2';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import {
  EmployeeOptionsResponse,
  EmployeeResponse,
  PaginatedEmployeesResponse,
  toEmployeeResponse,
} from './dto/employee-response.dto';
import {
  EmployeeStatusFilter,
  ListEmployeesQueryDto,
} from './dto/list-employees-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import {
  DEPARTMENTS,
  JOB_TITLES,
  parseEmployeeCode,
} from './employee.constants';

export const EMPLOYEE_MESSAGES = {
  notFound: 'Employee not found',
  emailTaken: 'An employee with this email already exists',
  staleVersion:
    'This employee was changed by someone else; reload to see the latest version',
  deleted: 'Employee has been deleted; restore it before editing',
  alreadyDeleted: 'Employee is already deleted',
  notDeleted: 'Employee is not deleted',
  noChanges: 'No fields to update',
} as const;

/**
 * Status filter → where clause. "all", or both active and deleted, means no
 * status condition; otherwise the single selected status applies.
 */
function statusWhere(
  statuses: readonly EmployeeStatusFilter[],
): Prisma.EmployeeWhereInput {
  const wantsActive = statuses.includes('active');
  const wantsDeleted = statuses.includes('deleted');
  if (statuses.includes('all') || (wantsActive && wantsDeleted)) {
    return {};
  }
  return wantsDeleted ? { deletedAt: { not: null } } : { deletedAt: null };
}

/**
 * Builds the directory filter. Country and department match any of the
 * selected values. The search is split on whitespace and every term must
 * match the first name, last name or email (case-insensitive), so
 * "priya sharma" finds Priya Sharma. A search that looks like an employee
 * code ("EMP-000042" or "42") also matches that employee number exactly.
 */
export function buildListWhere(
  query: Pick<
    ListEmployeesQueryDto,
    'status' | 'search' | 'countryCode' | 'department'
  >,
): Prisma.EmployeeWhereInput {
  const conditions: Prisma.EmployeeWhereInput[] = [];

  const status = statusWhere(query.status);
  if (Object.keys(status).length > 0) {
    conditions.push(status);
  }
  if (query.countryCode?.length) {
    conditions.push({ countryCode: { in: query.countryCode } });
  }
  if (query.department?.length) {
    conditions.push({ department: { in: query.department } });
  }
  if (query.search) {
    const terms = query.search.split(/\s+/).filter(Boolean);
    const textMatch: Prisma.EmployeeWhereInput = {
      AND: terms.map((term) => ({
        OR: [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
        ],
      })),
    };
    const employeeNumber = parseEmployeeCode(query.search);
    conditions.push(
      employeeNumber === null
        ? textMatch
        : { OR: [textMatch, { employeeNumber }] },
    );
  }

  if (conditions.length === 0) {
    return {};
  }
  return conditions.length === 1 ? conditions[0] : { AND: conditions };
}

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto): Promise<EmployeeResponse> {
    try {
      const employee = await this.prisma.employee.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName ?? null,
          email: dto.email ?? null,
          countryCode: dto.countryCode,
          department: dto.department,
          jobTitle: dto.jobTitle,
          startDate: parseDate(dto.startDate),
          endDate: dto.endDate ? parseDate(dto.endDate) : null,
        },
      });
      return toEmployeeResponse(employee);
    } catch (error) {
      throw this.mapUniqueEmailError(error);
    }
  }

  async findAll(
    query: ListEmployeesQueryDto,
  ): Promise<PaginatedEmployeesResponse> {
    const { page, pageSize } = query;
    const where = buildListWhere(query);

    const [employees, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        // employeeNumber is unique, so the order is stable across pages.
        orderBy: { employeeNumber: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      data: employees.map(toEmployeeResponse),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getOptions(): Promise<EmployeeOptionsResponse> {
    const countries = await this.prisma.employee.findMany({
      distinct: ['countryCode'],
      select: { countryCode: true },
      orderBy: { countryCode: 'asc' },
    });

    return {
      countryCodes: [...CountryCodes].sort(),
      countriesInUse: countries.map(({ countryCode }) => countryCode),
      departments: DEPARTMENTS,
      jobTitles: JOB_TITLES,
    };
  }

  /** Returns active and soft-deleted employees (status tells them apart). */
  async findOne(id: string): Promise<EmployeeResponse> {
    const employee = await this.prisma.employee.findUnique({ where: { id } });

    if (!employee) {
      throw new NotFoundException(EMPLOYEE_MESSAGES.notFound);
    }

    return toEmployeeResponse(employee);
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<EmployeeResponse> {
    const { version, startDate, endDate, ...rest } = dto;
    const dateFields: { startDate?: Date; endDate?: Date | null } = {};
    if (startDate !== undefined) dateFields.startDate = parseDate(startDate);
    if (endDate !== undefined) dateFields.endDate = endDate ? parseDate(endDate) : null;

    const data = {
      ...Object.fromEntries(
        Object.entries(rest).filter(([, value]) => value !== undefined),
      ),
      ...dateFields,
    } as Omit<UpdateEmployeeDto, 'version' | 'startDate' | 'endDate'>;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(EMPLOYEE_MESSAGES.noChanges);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const { count } = await tx.employee.updateMany({
          where: { id, version, deletedAt: null },
          data: { ...data, version: { increment: 1 } },
        });

        if (count === 0) {
          const current = await tx.employee.findUnique({ where: { id } });
          if (!current) {
            throw new NotFoundException(EMPLOYEE_MESSAGES.notFound);
          }
          throw new ConflictException(
            current.deletedAt
              ? EMPLOYEE_MESSAGES.deleted
              : EMPLOYEE_MESSAGES.staleVersion,
          );
        }

        const updated = await tx.employee.findUniqueOrThrow({
          where: { id },
        });
        return toEmployeeResponse(updated);
      });
    } catch (error) {
      throw this.mapUniqueEmailError(error);
    }
  }

  async softDelete(id: string): Promise<EmployeeResponse> {
    return this.changeDeletedState(id, {
      where: { deletedAt: null },
      deletedAt: new Date(),
      conflictMessage: EMPLOYEE_MESSAGES.alreadyDeleted,
    });
  }

  async restore(id: string): Promise<EmployeeResponse> {
    return this.changeDeletedState(id, {
      where: { deletedAt: { not: null } },
      deletedAt: null,
      conflictMessage: EMPLOYEE_MESSAGES.notDeleted,
    });
  }

  /**
   * Soft delete and restore both bump `version`, so an edit based on a copy
   * read before the delete/restore is rejected as stale.
   */
  private async changeDeletedState(
    id: string,
    change: {
      where: Prisma.EmployeeWhereInput;
      deletedAt: Date | null;
      conflictMessage: string;
    },
  ): Promise<EmployeeResponse> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.employee.updateMany({
        where: { id, ...change.where },
        data: { deletedAt: change.deletedAt, version: { increment: 1 } },
      });

      if (count === 0) {
        const exists = await tx.employee.findUnique({ where: { id } });
        if (!exists) {
          throw new NotFoundException(EMPLOYEE_MESSAGES.notFound);
        }
        throw new ConflictException(change.conflictMessage);
      }

      const updated = await tx.employee.findUniqueOrThrow({ where: { id } });
      return toEmployeeResponse(updated);
    });
  }

  private mapUniqueEmailError(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException(EMPLOYEE_MESSAGES.emailTaken);
    }
    return error;
  }
}
