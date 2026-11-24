import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../config/env.schema';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  const configService = {
    get: jest.fn().mockReturnValue('postgresql://user:pass@localhost:5432/db'),
  } as unknown as ConfigService<EnvConfig, true>;

  it('constructs without opening a database connection', () => {
    expect(() => new PrismaService(configService)).not.toThrow();
  });

  it('connects on module init and disconnects on module destroy', async () => {
    const service = new PrismaService(configService);
    const connectSpy = jest
      .spyOn(service, '$connect')
      .mockResolvedValue(undefined);
    const disconnectSpy = jest
      .spyOn(service, '$disconnect')
      .mockResolvedValue(undefined);

    await service.onModuleInit();
    expect(connectSpy).toHaveBeenCalledTimes(1);

    await service.onModuleDestroy();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });
});
