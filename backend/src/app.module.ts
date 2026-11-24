import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from './config/env.validation';
import { HealthModule } from './modules/api/health/health.module';
import { PrismaModule } from './modules/prisma/prisma.module';
// import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/api/auth/auth.module';
import { UsersModule } from './modules/api/users/users.module';
import { EmployeesModule } from './modules/api/employees/employees.module';
import { CompensationModule } from './modules/api/compensation/compensation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    EmployeesModule,
    CompensationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
