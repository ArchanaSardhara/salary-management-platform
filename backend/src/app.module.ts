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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
