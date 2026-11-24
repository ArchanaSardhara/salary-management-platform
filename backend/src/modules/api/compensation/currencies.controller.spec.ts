import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { CURRENCIES } from '../../../common/constants/currency-codes';
import { CurrenciesController } from './currencies.controller';

describe('CurrenciesController (HTTP)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CurrenciesController],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('GET /currencies returns 200 with every currency code and label', async () => {
    const res = await request(app.getHttpServer()).get('/currencies').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(CURRENCIES.length);

    const usd = res.body.find((c: { code: string }) => c.code === 'USD');
    expect(usd).toEqual({ code: 'USD', label: 'US Dollar' });
  });

  it('every entry has a non-empty code and label', () => {
    for (const { code, label } of CURRENCIES) {
      expect(code).toMatch(/^[A-Z]{3}$/);
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('codes are unique', () => {
    const codes = CURRENCIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
