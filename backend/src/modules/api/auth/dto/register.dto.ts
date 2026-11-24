import { IsBoolean, IsOptional } from 'class-validator';
import { UserDto } from '../../users/dto/user.dto';

export class RegisterDto extends UserDto {
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
