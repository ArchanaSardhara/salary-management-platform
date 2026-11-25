import { Injectable } from '@nestjs/common';
import { formatEmployeeCode } from '../employees/employee.constants';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CompensationTypeBreakdownResponse,
  DashboardStatsResponse,
  EmployeeWithoutCompensationItem,
  HeadcountTrendResponse,
  PayrollGroupItem,
  RecentChangeItem,
} from './dto/dashboard-response.dto';

interface CompensationSnapshot {
  amount: string;
  currencyCode: string;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<DashboardStatsResponse> {
    const now = new Date();
    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );

    const [activeCount, newHiresCount, recordsThisMonth] =
      await this.prisma.$transaction([
        this.prisma.employee.count({ where: { deletedAt: null } }),
        this.prisma.employee.count({
          where: { deletedAt: null, startDate: { gte: startOfMonth } },
        }),
        this.prisma.compensationRecord.count({
          where: { createdAt: { gte: startOfMonth } },
        }),
      ]);

    type CountRow = { count: bigint };
    const [noCompRow] = await this.prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*)::bigint AS count
      FROM employees e
      WHERE e.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM compensation_records cr
          WHERE cr.employee_id = e.id AND cr.effective_to IS NULL
        )
    `;

    return {
      activeEmployees: activeCount,
      newHiresThisMonth: newHiresCount,
      employeesWithoutCompensation: Number(noCompRow.count),
      compensationRecordsThisMonth: recordsThisMonth,
    };
  }

  async getPayrollByDepartment(currency: string): Promise<PayrollGroupItem[]> {
    type Row = {
      department: string;
      count: bigint;
      min: string;
      max: string;
      avg: string;
      total: string;
    };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT
        e.department,
        COUNT(*)::bigint           AS count,
        MIN(cr.amount)::text       AS min,
        MAX(cr.amount)::text       AS max,
        AVG(cr.amount)::text       AS avg,
        SUM(cr.amount)::text       AS total
      FROM compensation_records cr
      JOIN employees e ON e.id = cr.employee_id
      WHERE cr.effective_to IS NULL
        AND cr.currency_code = ${currency}
        AND e.deleted_at IS NULL
      GROUP BY e.department
      ORDER BY SUM(cr.amount) DESC
    `;
    return rows.map((r) => ({
      name: r.department,
      currency,
      count: Number(r.count),
      min: r.min,
      max: r.max,
      avg: r.avg,
      total: r.total,
    }));
  }

  async getPayrollByCountry(currency: string): Promise<PayrollGroupItem[]> {
    type Row = {
      country_code: string;
      count: bigint;
      min: string;
      max: string;
      avg: string;
      total: string;
    };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT
        e.country_code,
        COUNT(*)::bigint           AS count,
        MIN(cr.amount)::text       AS min,
        MAX(cr.amount)::text       AS max,
        AVG(cr.amount)::text       AS avg,
        SUM(cr.amount)::text       AS total
      FROM compensation_records cr
      JOIN employees e ON e.id = cr.employee_id
      WHERE cr.effective_to IS NULL
        AND cr.currency_code = ${currency}
        AND e.deleted_at IS NULL
      GROUP BY e.country_code
      ORDER BY SUM(cr.amount) DESC
    `;
    return rows.map((r) => ({
      name: r.country_code,
      currency,
      count: Number(r.count),
      min: r.min,
      max: r.max,
      avg: r.avg,
      total: r.total,
    }));
  }

  async getCompensationTypeBreakdown(): Promise<CompensationTypeBreakdownResponse> {
    const rows = await this.prisma.compensationRecord.groupBy({
      by: ['type'],
      where: { effectiveTo: null },
      _count: { _all: true },
      orderBy: { _count: { type: 'desc' } },
    });
    const total = rows.reduce((sum, r) => sum + r._count._all, 0);
    return {
      breakdown: rows.map((r) => ({ type: r.type, count: r._count._all })),
      total,
    };
  }

  async getHeadcountTrend(): Promise<HeadcountTrendResponse> {
    type Row = { month: string; active: bigint; new_hires: bigint };
    const rows = await this.prisma.$queryRaw<Row[]>`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', now() AT TIME ZONE 'UTC') - INTERVAL '11 months',
          date_trunc('month', now() AT TIME ZONE 'UTC'),
          INTERVAL '1 month'
        )::date AS month_start
      )
      SELECT
        to_char(m.month_start, 'YYYY-MM') AS month,
        COUNT(e.id) FILTER (
          WHERE e.start_date <= (m.month_start + INTERVAL '1 month' - INTERVAL '1 day')::date
            AND (e.deleted_at IS NULL OR e.deleted_at > m.month_start)
        )::bigint AS active,
        COUNT(e.id) FILTER (
          WHERE e.start_date >= m.month_start
            AND e.start_date < (m.month_start + INTERVAL '1 month')::date
        )::bigint AS new_hires
      FROM months m
      CROSS JOIN employees e
      GROUP BY m.month_start
      ORDER BY m.month_start
    `;
    return {
      months: rows.map((r) => ({
        month: r.month,
        active: Number(r.active),
        newHires: Number(r.new_hires),
      })),
    };
  }

  async getRecentChanges(limit: number): Promise<RecentChangeItem[]> {
    type Row = {
      id: string;
      compensation_record_id: string;
      changed_by_id: string | null;
      changed_at: Date;
      before_value: CompensationSnapshot | null;
      after_value: CompensationSnapshot;
      employee_id: string;
      employee_number: number;
      first_name: string;
      last_name: string | null;
    };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT
        al.id,
        al.compensation_record_id,
        al.changed_by_id,
        al.changed_at,
        al.before_value,
        al.after_value,
        cr.employee_id,
        e.employee_number,
        e.first_name,
        e.last_name
      FROM audit_logs al
      JOIN compensation_records cr ON cr.id = al.compensation_record_id
      JOIN employees e ON e.id = cr.employee_id
      ORDER BY al.changed_at DESC
      LIMIT ${limit}
    `;
    return rows.map((r) => ({
      id: r.id,
      compensationRecordId: r.compensation_record_id,
      employeeId: r.employee_id,
      employeeCode: formatEmployeeCode(r.employee_number),
      employeeName: [r.first_name, r.last_name].filter(Boolean).join(' '),
      changedById: r.changed_by_id,
      changedAt: r.changed_at.toISOString(),
      beforeAmount: r.before_value?.amount ?? null,
      beforeCurrency: r.before_value?.currencyCode ?? null,
      afterAmount: r.after_value.amount,
      afterCurrency: r.after_value.currencyCode,
    }));
  }

  async getEmployeesWithoutCompensation(
    limit: number,
  ): Promise<EmployeeWithoutCompensationItem[]> {
    type Row = {
      id: string;
      employee_number: number;
      first_name: string;
      last_name: string | null;
      department: string;
      country_code: string;
      start_date: Date;
    };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT
        e.id,
        e.employee_number,
        e.first_name,
        e.last_name,
        e.department,
        e.country_code,
        e.start_date
      FROM employees e
      WHERE e.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM compensation_records cr
          WHERE cr.employee_id = e.id AND cr.effective_to IS NULL
        )
      ORDER BY e.start_date DESC
      LIMIT ${limit}
    `;
    return rows.map((r) => ({
      id: r.id,
      employeeCode: formatEmployeeCode(r.employee_number),
      firstName: r.first_name,
      lastName: r.last_name,
      department: r.department,
      countryCode: r.country_code,
      startDate: r.start_date.toISOString().split('T')[0],
    }));
  }
}
