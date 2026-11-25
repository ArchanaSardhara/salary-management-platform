import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { COMPENSATION_MESSAGES } from './compensation.constants';
import {
  AuditLogResponse,
  CompensationResponse,
  PaginatedCompensationResponse,
  toAuditLogResponse,
  toCompensationResponse,
  toCompensationSnapshot,
} from './dto/compensation-response.dto';
import { CreateCompensationDto } from './dto/create-compensation.dto';
import { ListCompensationQueryDto } from './dto/list-compensation-query.dto';
import { UpdateCompensationDto } from './dto/update-compensation.dto';

/** Parses a YYYY-MM-DD (or ISO 8601) string to a Date at midnight UTC. */
function parseDate(dateStr: string): Date {
  const datePart = dateStr.split('T')[0];
  return new Date(`${datePart}T00:00:00.000Z`);
}

@Injectable()
export class CompensationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    employeeId: string,
    dto: CreateCompensationDto,
    changedBy: string,
  ): Promise<CompensationResponse> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new NotFoundException(COMPENSATION_MESSAGES.employeeNotFound);
    }
    if (employee.deletedAt) {
      throw new ConflictException(COMPENSATION_MESSAGES.employeeDeleted);
    }

    const effectiveFrom = parseDate(dto.effectiveFrom);
    const effectiveTo = dto.effectiveTo ? parseDate(dto.effectiveTo) : null;

    if (effectiveTo && effectiveTo < effectiveFrom) {
      throw new BadRequestException(COMPENSATION_MESSAGES.endBeforeStart);
    }

    const overlap = await this.prisma.compensationRecord.findFirst({
      where: {
        employeeId,
        AND: [
          // existing record ends on or after new record starts (or is open-ended)
          {
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: effectiveFrom } },
            ],
          },
          // only add start-of-existing check when new record has an end date
          ...(effectiveTo ? [{ effectiveFrom: { lte: effectiveTo } }] : []),
        ],
      },
    });
    if (overlap) {
      throw new ConflictException(COMPENSATION_MESSAGES.overlap);
    }

    return this.prisma.$transaction(async (tx) => {
      const previous = await tx.compensationRecord.findFirst({
        where: { employeeId },
        orderBy: { createdAt: 'desc' },
      });

      const record = await tx.compensationRecord.create({
        data: {
          employeeId,
          amount: dto.amount,
          currencyCode: dto.currencyCode,
          ...(dto.payFrequency !== undefined && {
            payFrequency: dto.payFrequency,
          }),
          ...(dto.type !== undefined && { type: dto.type }),
          changeReason: dto.changeReason ?? null,
          effectiveFrom,
          effectiveTo,
        },
      });

      await tx.auditLog.create({
        data: {
          compensationRecordId: record.id,
          changedById: changedBy,
          beforeValue: previous
            ? (toCompensationSnapshot(
                previous,
              ) as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          afterValue: toCompensationSnapshot(
            record,
          ) as unknown as Prisma.InputJsonValue,
        },
      });

      return toCompensationResponse(record);
    });
  }

  async findAll(
    employeeId: string,
    query: ListCompensationQueryDto,
  ): Promise<PaginatedCompensationResponse> {
    await this.requireEmployee(employeeId);

    const { page, pageSize } = query;
    const where = { employeeId };

    const [records, total] = await this.prisma.$transaction([
      this.prisma.compensationRecord.findMany({
        where,
        orderBy: { effectiveFrom: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.compensationRecord.count({ where }),
    ]);

    return {
      data: records.map(toCompensationResponse),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async update(
    employeeId: string,
    recordId: string,
    dto: UpdateCompensationDto,
    changedBy: string,
  ): Promise<CompensationResponse> {
    await this.requireEmployee(employeeId);

    const record = await this.prisma.compensationRecord.findFirst({
      where: { id: recordId, employeeId },
    });
    if (!record) {
      throw new NotFoundException(COMPENSATION_MESSAGES.notFound);
    }

    const effectiveTo =
      dto.effectiveTo != null ? parseDate(dto.effectiveTo) : null;

    if (effectiveTo && effectiveTo < record.effectiveFrom) {
      throw new BadRequestException(COMPENSATION_MESSAGES.endBeforeStart);
    }

    // Check no other record overlaps with the updated [effectiveFrom, effectiveTo].
    const overlap = await this.prisma.compensationRecord.findFirst({
      where: {
        employeeId,
        id: { not: recordId },
        AND: [
          {
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: record.effectiveFrom } },
            ],
          },
          ...(effectiveTo ? [{ effectiveFrom: { lte: effectiveTo } }] : []),
        ],
      },
    });
    if (overlap) {
      throw new ConflictException(COMPENSATION_MESSAGES.overlap);
    }

    return this.prisma.$transaction(async (tx) => {
      const before = toCompensationSnapshot(record);
      const updated = await tx.compensationRecord.update({
        where: { id: recordId },
        data: { effectiveTo },
      });
      await tx.auditLog.create({
        data: {
          compensationRecordId: recordId,
          changedById: changedBy,
          beforeValue: before as unknown as Prisma.InputJsonValue,
          afterValue: toCompensationSnapshot(
            updated,
          ) as unknown as Prisma.InputJsonValue,
        },
      });
      return toCompensationResponse(updated);
    });
  }

  async findCurrent(employeeId: string): Promise<CompensationResponse> {
    await this.requireEmployee(employeeId);

    const record = await this.prisma.compensationRecord.findFirst({
      where: { employeeId, effectiveTo: null },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (!record) {
      throw new NotFoundException(COMPENSATION_MESSAGES.noCurrent);
    }

    return toCompensationResponse(record);
  }

  async findOne(
    employeeId: string,
    recordId: string,
  ): Promise<CompensationResponse> {
    await this.requireEmployee(employeeId);
    const record = await this.prisma.compensationRecord.findFirst({
      where: { id: recordId, employeeId },
    });
    if (!record) {
      throw new NotFoundException(COMPENSATION_MESSAGES.notFound);
    }
    return toCompensationResponse(record);
  }

  async findAuditLog(
    employeeId: string,
    recordId: string,
  ): Promise<AuditLogResponse> {
    await this.requireEmployee(employeeId);

    const exists = await this.prisma.compensationRecord.findFirst({
      where: { id: recordId, employeeId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(COMPENSATION_MESSAGES.notFound);
    }

    const log = await this.prisma.auditLog.findFirst({
      where: { compensationRecordId: recordId },
      orderBy: { changedAt: 'desc' },
    });
    if (!log) {
      throw new NotFoundException(COMPENSATION_MESSAGES.auditNotFound);
    }

    return toAuditLogResponse(log);
  }

  /** Throws 404 if the employee does not exist (active or deleted). */
  private async requireEmployee(employeeId: string): Promise<void> {
    const exists = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(COMPENSATION_MESSAGES.employeeNotFound);
    }
  }
}
