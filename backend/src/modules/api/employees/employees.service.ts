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
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import {
  EmployeeResponse,
  PaginatedEmployeesResponse,
  toEmployeeResponse,
} from './dto/employee-response.dto';
import {
  EmployeeStatusFilter,
  ListEmployeesQueryDto,
} from './dto/list-employees-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

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

const STATUS_WHERE: Record<EmployeeStatusFilter, Prisma.EmployeeWhereInput> =
  {
    active: { deletedAt: null },
    deleted: { deletedAt: { not: null } },
    all: {},
  };

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
    const { page, pageSize, status } = query;
    const where = STATUS_WHERE[status];

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
