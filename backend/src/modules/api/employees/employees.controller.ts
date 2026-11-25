import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '../../../common/authorization/role.enum';
import { Roles } from '../../../common/authorization/roles.decorator';
import { RolesGuard } from '../../../common/authorization/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import type {
  EmployeeOptionsResponse,
  EmployeeResponse,
  PaginatedEmployeesResponse,
} from './dto/employee-response.dto';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.HR_MANAGER)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  create(@Body() dto: CreateEmployeeDto): Promise<EmployeeResponse> {
    return this.employeesService.create(dto);
  }

  @Get()
  findAll(
    @Query() query: ListEmployeesQueryDto,
  ): Promise<PaginatedEmployeesResponse> {
    return this.employeesService.findAll(query);
  }

  /** Lookup values for directory filters and the employee form. Declared before `:id`. */
  @Get('options')
  getOptions(): Promise<EmployeeOptionsResponse> {
    return this.employeesService.getOptions();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<EmployeeResponse> {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<EmployeeResponse> {
    return this.employeesService.update(id, dto);
  }

  /** Soft delete: the record is kept and can be restored. */
  @Delete(':id')
  softDelete(@Param('id') id: string): Promise<EmployeeResponse> {
    return this.employeesService.softDelete(id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  restore(@Param('id') id: string): Promise<EmployeeResponse> {
    return this.employeesService.restore(id);
  }
}
