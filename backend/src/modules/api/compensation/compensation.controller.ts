import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Role } from '../../../common/authorization/role.enum';
import { Roles } from '../../../common/authorization/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/authorization/roles.guard';
import type { AuthenticatedUser } from '../../../common/authorization/authenticated-user.interface';
import { CompensationService } from './compensation.service';
import { CreateCompensationDto } from './dto/create-compensation.dto';
import { ListCompensationQueryDto } from './dto/list-compensation-query.dto';
import { UpdateCompensationDto } from './dto/update-compensation.dto';

@Controller('employees/:employeeId/compensation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.HR_MANAGER)
export class CompensationController {
  constructor(private readonly compensationService: CompensationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateCompensationDto,
    @Request() req: { user: AuthenticatedUser },
  ) {
    return this.compensationService.create(employeeId, dto, req.user.id);
  }

  @Get()
  findAll(
    @Param('employeeId') employeeId: string,
    @Query() query: ListCompensationQueryDto,
  ) {
    return this.compensationService.findAll(employeeId, query);
  }

  @Patch(':recordId')
  updateEndDate(
    @Param('employeeId') employeeId: string,
    @Param('recordId') recordId: string,
    @Body() dto: UpdateCompensationDto,
    @Request() req: { user: AuthenticatedUser },
  ) {
    return this.compensationService.update(employeeId, recordId, dto, req.user.id);
  }

  /** Must be registered before :recordId so NestJS matches 'current' first. */
  @Get('current')
  findCurrent(@Param('employeeId') employeeId: string) {
    return this.compensationService.findCurrent(employeeId);
  }

  @Get(':recordId')
  findOne(
    @Param('employeeId') employeeId: string,
    @Param('recordId') recordId: string,
  ) {
    return this.compensationService.findOne(employeeId, recordId);
  }

  @Get(':recordId/audit')
  findAuditLog(
    @Param('employeeId') employeeId: string,
    @Param('recordId') recordId: string,
  ) {
    return this.compensationService.findAuditLog(employeeId, recordId);
  }
}
