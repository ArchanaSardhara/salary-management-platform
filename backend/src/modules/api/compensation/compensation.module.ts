import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CompensationController } from './compensation.controller';
import { CompensationService } from './compensation.service';
import { CurrenciesController } from './currencies.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CompensationController, CurrenciesController],
  providers: [CompensationService],
})
export class CompensationModule {}
