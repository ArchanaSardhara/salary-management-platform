import { EmailService } from './email.service';

const sendMock = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: sendMock },
  })),
}));

describe('EmailService', () => {
  const originalEnv = process.env;
  let service: EmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: 're_test_key',
      EMAIL_FROM: 'App <no-reply@example.com>',
      APP_URL: 'https://app.example.com',
    };
    service = new EmailService();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('sendEmail', () => {
    it('sends through Resend and returns the result data', async () => {
      sendMock.mockResolvedValue({ data: { id: 'email-1' }, error: null });

      await expect(
        service.sendEmail({
          to: 'ada@example.com',
          subject: 'Hello',
          html: '<p>Hi</p>',
        }),
      ).resolves.toEqual({ id: 'email-1' });
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'App <no-reply@example.com>',
          to: ['ada@example.com'],
          subject: 'Hello',
          html: '<p>Hi</p>',
        }),
      );
    });

    it('throws the Resend error when sending fails', async () => {
      const error = { name: 'validation_error', message: 'bad request' };
      sendMock.mockResolvedValue({ data: null, error });

      await expect(
        service.sendEmail({ to: 'ada@example.com', subject: 'x', html: 'x' }),
      ).rejects.toBe(error);
    });
  });

  describe('sendVerificationEmail', () => {
    it('renders the verification link with the URL-encoded token', async () => {
      sendMock.mockResolvedValue({ data: { id: 'email-1' }, error: null });

      await service.sendVerificationEmail({
        to: 'ada@example.com',
        firstName: 'Ada',
        token: 'a+b/c',
      });

      const sent = sendMock.mock.calls[0][0];
      expect(sent.subject).toBe('Verify your email address');
      expect(sent.to).toEqual(['ada@example.com']);
      expect(sent.html).toContain(
        'https://app.example.com/verify-email?token=a%2Bb%2Fc',
      );
      expect(sent.html).toContain('Ada');
      expect(sent.html).not.toMatch(/\{\{\s*\$(firstName|verificationUrl)\s*\}\}/);
    });

    it('throws when APP_URL is not configured', async () => {
      delete process.env.APP_URL;

      await expect(
        service.sendVerificationEmail({
          to: 'ada@example.com',
          firstName: 'Ada',
          token: 'abc',
        }),
      ).rejects.toThrow('APP_URL is not configured');
      expect(sendMock).not.toHaveBeenCalled();
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('renders the reset link with the URL-encoded token', async () => {
      sendMock.mockResolvedValue({ data: { id: 'email-1' }, error: null });

      await service.sendPasswordResetEmail({
        to: 'ada@example.com',
        firstName: 'Ada',
        token: 'a+b/c',
      });

      const sent = sendMock.mock.calls[0][0];
      expect(sent.subject).toBe('Reset your password');
      expect(sent.html).toContain(
        'https://app.example.com/reset-password?token=a%2Bb%2Fc',
      );
      expect(sent.html).toContain('Ada');
      expect(sent.html).not.toMatch(/\{\{\s*\$(firstName|resetUrl)\s*\}\}/);
    });

    it('throws when APP_URL is not configured', async () => {
      delete process.env.APP_URL;

      await expect(
        service.sendPasswordResetEmail({
          to: 'ada@example.com',
          firstName: 'Ada',
          token: 'abc',
        }),
      ).rejects.toThrow('APP_URL is not configured');
      expect(sendMock).not.toHaveBeenCalled();
    });
  });

  describe('sendEmail without RESEND_API_KEY', () => {
    it('logs a warning and returns without calling Resend', async () => {
      delete process.env.RESEND_API_KEY;
      const noKeyService = new EmailService();

      const result = await noKeyService.sendEmail({
        to: 'ada@example.com',
        subject: 'Test',
        html: '<p>Hi</p>',
      });

      expect(result).toBeUndefined();
      expect(sendMock).not.toHaveBeenCalled();
    });
  });
});
