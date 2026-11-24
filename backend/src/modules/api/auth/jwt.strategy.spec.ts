import type { UsersService } from '../users/users.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const usersService = { findById: jest.fn() };
  let strategy: JwtStrategy;
  const originalSecret = process.env.JWT_ACCESS_SECRET;

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'a'.repeat(32);
  });

  afterAll(() => {
    process.env.JWT_ACCESS_SECRET = originalSecret;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtStrategy(usersService as unknown as UsersService);
  });

  it('returns the user for the token subject', async () => {
    const user = { id: 'user-1', email: 'ada@example.com' };
    usersService.findById.mockResolvedValue(user);

    await expect(
      strategy.validate({ sub: 'user-1', email: 'ada@example.com' }),
    ).resolves.toBe(user);
    expect(usersService.findById).toHaveBeenCalledWith('user-1');
  });

  it('returns null when the user no longer exists', async () => {
    usersService.findById.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: 'gone', email: 'gone@example.com' }),
    ).resolves.toBeNull();
  });
});
