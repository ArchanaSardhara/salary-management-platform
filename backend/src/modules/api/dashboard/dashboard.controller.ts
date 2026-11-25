import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '../../../common/authorization/role.enum';
import { Roles } from '../../../common/authorization/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/authorization/roles.guard';
import { DashboardService } from './dashboard.service';
import {
  DashboardCurrencyQueryDto,
  DashboardLimitQueryDto,
  HeadcountTrendQueryDto,
} from './dto/dashboard-query.dto';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.HR_MANAGER)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('payroll-by-department')
  getPayrollByDepartment(@Query() query: DashboardCurrencyQueryDto) {
    return this.dashboardService.getPayrollByDepartment(
      query.currency ?? 'USD',
    );
  }

  @Get('payroll-by-country')
  getPayrollByCountry(@Query() query: DashboardCurrencyQueryDto) {
    return this.dashboardService.getPayrollByCountry(query.currency ?? 'USD');
  }

  @Get('compensation-type-breakdown')
  getCompensationTypeBreakdown() {
    return this.dashboardService.getCompensationTypeBreakdown();
  }

  @Get('headcount-trend')
  getHeadcountTrend(@Query() query: HeadcountTrendQueryDto) {
    return this.dashboardService.getHeadcountTrend(query.startDate, query.endDate);
  }

  @Get('recent-changes')
  getRecentChanges(@Query() query: DashboardLimitQueryDto) {
    return this.dashboardService.getRecentChanges(query.limit);
  }

  @Get('employees-without-compensation')
  getEmployeesWithoutCompensation(@Query() query: DashboardLimitQueryDto) {
    return this.dashboardService.getEmployeesWithoutCompensation(query.limit);
  }

  @Get('payroll-by-currency')
  getPayrollByCurrency() {
    return this.dashboardService.getPayrollByCurrency();
  }
}
