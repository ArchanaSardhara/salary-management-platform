import { ConflictException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

import { Role } from '../../../common/authorization/role.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUser } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureEmailAvailable(email: string) {
    const user = await this.findByEmail(email);

    if (user) {
      throw new ConflictException('Email already registered');
    }
  }

  private async hashPassword(password: string) {
    return argon2.hash(password);
  }

  async create(data: CreateUserDto): Promise<IUser> {
    const now = new Date();

    // check if email is available
    await this.ensureEmailAvailable(data.email);

    // hash password
    const passwordHash = await this.hashPassword(data.password);

    // create user
    const { passwordHash: _, ...user } = await this.prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash,
        // Always set server-side; never taken from the request.
        role: Role.HR_MANAGER,
        createdAt: now,
        updatedAt: now,
      },
    });
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({});
  }

  async findById(id: string): Promise<IUser | null> {
    return this.prisma.user.findUnique({
      omit: {
        passwordHash: true,
      },
      where: {
        id,
      },
    });
  }
}
