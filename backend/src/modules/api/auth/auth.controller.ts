import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  ACCESS_TOKEN_AGE,
  PRODUCTION_ENV,
  REFRESH_TOKEN_AGE,
} from '../../../common/consts/config';

import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setResponseCookies(
    res: Response,
    values: Record<string, string | boolean | null>,
  ) {
    for (const [key, value] of Object.entries(values)) {
      const isRefreshToken = key === 'refresh_token';
      if (value !== null) {
        res.cookie(key, value, {
          httpOnly: true,
          secure: process.env.NODE_ENV === PRODUCTION_ENV,
          sameSite: 'lax',
          maxAge: isRefreshToken ? REFRESH_TOKEN_AGE : ACCESS_TOKEN_AGE,
        });
      }
    }
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.register(dto);

    this.setResponseCookies(res, {
      access_token: data.accessToken,
      refresh_token: data.refreshToken,
    });

    return {
      success: true,
      message: 'Registration successful',
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.login(dto);

    this.setResponseCookies(res, {
      access_token: data.accessToken,
      refresh_token: data.refreshToken,
    });

    return {
      success: true,
      message: 'Login successful',
    };
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  verify(@Req() req: Request) {
    return this.authService.verify(req);
  }

  @Post('refresh')
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refresh(req.cookies.refresh_token, res);
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.cookies.refresh_token);
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return {
      message: 'Logged out successfully',
    };
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }
}
