import { PickType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { UserDto } from '../../users/dto/user.dto';

export class LoginDto extends PickType(UserDto, ['email', 'password']) {
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
