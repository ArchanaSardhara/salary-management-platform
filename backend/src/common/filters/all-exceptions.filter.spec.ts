import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

function createHost(request: { method: string; url: string }) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status };

  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();
  const request = { method: 'GET', url: '/employees/123' };

  it('maps an HttpException to its own status and message', () => {
    const { host, status, json } = createHost(request);

    filter.catch(new BadRequestException('amount must be positive'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'amount must be positive',
        path: request.url,
      }),
    );
  });

  it('joins array validation messages from class-validator-style payloads', () => {
    const { host, json } = createHost(request);

    filter.catch(
      new BadRequestException({
        message: ['amount must be positive', 'currency is required'],
        error: 'Bad Request',
      }),
      host,
    );

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'amount must be positive; currency is required',
      }),
    );
  });

  it('maps an unknown error to a generic 500 without leaking its message', () => {
    const { host, status, json } = createHost(request);

    filter.catch(new Error('connection string had a password in it'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
      }),
    );
    const body = json.mock.calls[0][0];
    expect(body.message).not.toContain('password');
  });

  it('always includes a path and an ISO timestamp', () => {
    const { host, json } = createHost(request);

    filter.catch(new BadRequestException(), host);

    const body = json.mock.calls[0][0];
    expect(body.path).toBe(request.url);
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });
});
