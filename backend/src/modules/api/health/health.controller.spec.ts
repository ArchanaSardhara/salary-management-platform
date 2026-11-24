import { Test, TestingModule } from '@nestjs/testing';
import {
  DiskHealthIndicator,
  FetchHealthIndicator,
  HealthCheckService,
} from '@nestjs/terminus';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  const healthCheckService = {
    check: jest.fn(
      async (indicators: Array<() => Promise<Record<string, unknown>>>) => {
        const results = await Promise.all(indicators.map((fn) => fn()));
        return { status: 'ok', details: Object.assign({}, ...results) };
      },
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: healthCheckService },
        { provide: FetchHealthIndicator, useValue: {} },
        { provide: DiskHealthIndicator, useValue: {} },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('live runs a check with no indicators', async () => {
    await expect(controller.live()).resolves.toEqual({
      status: 'ok',
      details: {},
    });
    expect(healthCheckService.check).toHaveBeenCalledWith([]);
  });

  it('ready reports the application as up', async () => {
    const result = await controller.ready();

    expect(result.details).toEqual({
      application: expect.objectContaining({ status: 'up' }),
    });
  });
});
