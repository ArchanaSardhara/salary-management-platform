import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  FetchHealthIndicator,
  DiskHealthIndicator,
  HealthCheck,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: FetchHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      async () => ({
        application: {
          status: 'up',
          message: 'Server is running',
          responseTime: new Date().toISOString(),
        },
      }),
    ]);
  }
}
