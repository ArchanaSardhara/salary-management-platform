import { ConflictException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Role } from '../../../common/authorization/role.enum';
import type { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from './users.service';

jest.mock('argon2', () => ({
  hash: jest.fn(),
}));

describe('UsersService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  let service: UsersService;

  const dbUser = {
    id: 'user-1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    passwordHash: 'hashed-password',
    emailVerified: false,
    role: Role.HR_MANAGER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    const input = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'plain-password',
    };

    it('hashes the password, stores the user and returns it without the hash', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue(dbUser);

      const result = await service.create(input);

      expect(argon2.hash).toHaveBeenCalledWith('plain-password');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada@example.com',
          passwordHash: 'hashed-password',
          role: Role.HR_MANAGER,
        }),
      });
      const createData = prisma.user.create.mock.calls[0][0].data;
      expect(createData).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toMatchObject({ id: 'user-1', email: 'ada@example.com' });
    });

    it('throws ConflictException when the email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue(dbUser);

      await expect(service.create(input)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(argon2.hash).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('looks the user up by email', async () => {
      prisma.user.findUnique.mockResolvedValue(dbUser);

      await expect(service.findByEmail('ada@example.com')).resolves.toBe(
        dbUser,
      );
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'ada@example.com' },
      });
    });
  });

  describe('findById', () => {
    it('looks the user up by id and omits the password hash', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('user-1')).resolves.toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        omit: { passwordHash: true },
        where: { id: 'user-1' },
      });
    });
  });

  describe('findAll', () => {
    it('returns all users', async () => {
      prisma.user.findMany.mockResolvedValue([dbUser]);

      await expect(service.findAll()).resolves.toEqual([dbUser]);
    });
  });

  describe('findHrManagers', () => {
    const params = { page: 1, pageSize: 20 };

    it('returns paginated HR managers with meta', async () => {
      prisma.$transaction.mockResolvedValue([[dbUser], 1]);

      const result = await service.findHrManagers(params);

      expect(result).toEqual({
        data: [dbUser],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      });
    });

    it('calculates skip from page and pageSize', async () => {
      prisma.$transaction.mockResolvedValue([[], 15]);

      await service.findHrManagers({ page: 2, pageSize: 10 });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });

    it('applies the search filter when provided', async () => {
      prisma.$transaction.mockResolvedValue([[dbUser], 1]);

      await service.findHrManagers({ ...params, search: 'ada' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });

    it('totalPages rounds up', async () => {
      prisma.$transaction.mockResolvedValue([[], 21]);

      const result = await service.findHrManagers({ page: 1, pageSize: 20 });

      expect(result.meta.totalPages).toBe(2);
    });
  });
});
