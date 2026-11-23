import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError, firstValueFrom } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

function createContext(request: { method: string; url: string }, statusCode = 200) {
  const response = { statusCode };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
}

describe('LoggingInterceptor', () => {
  const interceptor = new LoggingInterceptor();
  const request = { method: 'GET', url: '/employees' };

  it('passes through the handler result unchanged on success', async () => {
    const context = createContext(request);
    const next: CallHandler = { handle: () => of({ ok: true }) };

    const result = await firstValueFrom(
      interceptor.intercept(context, next) as any,
    );

    expect(result).toEqual({ ok: true });
  });

  it('propagates an error from the handler instead of swallowing it', async () => {
    const context = createContext(request, 500);
    const failure = new Error('downstream failure');
    const next: CallHandler = { handle: () => throwError(() => failure) };

    await expect(
      firstValueFrom(interceptor.intercept(context, next) as any),
    ).rejects.toThrow('downstream failure');
  });
});
