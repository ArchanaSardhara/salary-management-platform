import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '../../../common/authorization/role.enum';
import { Roles } from '../../../common/authorization/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/authorization/roles.guard';
import { UsersService } from './users.service';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UserController {
  constructor(private readonly userService: UsersService) {}

  @Get()
  listHrManagers(@Query() query: ListUsersQueryDto) {
    return this.userService.findHrManagers({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
    });
  }
}
