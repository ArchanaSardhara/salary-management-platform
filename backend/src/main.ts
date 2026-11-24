import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import type { EnvConfig } from './config/env.schema';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  configureApp(app);

  const configService: ConfigService<EnvConfig, true> = app.get(ConfigService);
  const port = configService.get('PORT', { infer: true });

  await app.listen(port);
  Logger.log(`Application listening on port ${port}`, 'Bootstrap');
}
void bootstrap();
