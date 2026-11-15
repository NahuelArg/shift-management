import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: DeepMockProxy<PrismaService>;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<DeepMockProxy<PrismaService>>(PrismaService);
  });
  afterEach(async () => await module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('findAll', () => {
    it('should return users from admin businesses', async () => {
      prisma.business.findMany.mockResolvedValue([{ id: 'biz-id' }] as any);
      prisma.user.findMany.mockResolvedValue([
        { name: 'user1', email: 'user@email.com' },
      ] as any);
      const result = await service.findAll('user12');
      expect(result).toEqual([
        {
          name: 'user1',
          email: 'user@email.com',
        },
      ]);
    });
  });

  describe('create', () => {
    it('should throw ConflictException if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({
        email: 'user@email.com',
      } as any);
      await expect(
        service.create({ email: 'user@email.com' } as any),
      ).rejects.toThrow(ConflictException);
    });
    it('should throw BadRequestException if LOCAL auth without password', async () => {
      prisma.user.findUnique.mockResolvedValue(null as any);
      await expect(
        service.create({
          email: 'user@email.com',
          password: null,
          authProvider: 'LOCAL',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
    it('should create and return user', async () => {
      prisma.user.findUnique.mockResolvedValue(null as any);
      prisma.user.create.mockResolvedValue({
        name: 'user1',
        email: 'user1@email.com',
        password: 'password-hashed',
        authProvider: 'LOCAL',
      } as any);
      const result = await service.create({
        name: 'user1',
        email: 'user1@email.com',
        password: 'password-hashed',
        authProvider: 'LOCAL',
      });
      expect(result).toEqual({
        name: 'user1',
        email: 'user1@email.com',
        password: 'password-hashed',
        authProvider: 'LOCAL',
      });
    });
  });

  describe('delete', () => {
    it('should throw BadRequestException if id not provided', async () => {
      await expect(service.delete(null as any, null as any)).rejects.toThrow(
        BadRequestException,
      );
    });
    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null as any);
      await expect(service.delete('user1', 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });
    it('should delete and return user', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'user1',
        name: 'user',
      } as any);
      prisma.user.delete.mockResolvedValue({
        id: 'user1',
        name: 'user',
      } as any);
      const result = await service.delete('user1', 'admin-1');
      expect(result).toEqual({ id: 'user1', name: 'user' });
    });
  });

  describe('update', () => {
    it('hashes the password instead of storing it in plain text', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'user1' } as any);
      prisma.user.update.mockResolvedValue({ id: 'user1' } as any);
      await service.update('user1', { password: 'secret123' }, 'admin-1');
      const saved = prisma.user.update.mock.calls[0][0].data as {
        password: string;
      };
      expect(saved.password).not.toBe('secret123');
      expect(await bcrypt.compare('secret123', saved.password)).toBe(true);
    });
    it('should throw BadRequestException if id not provided', async () => {
      await expect(
        service.update(null as any, null as any, null as any),
      ).rejects.toThrow(BadRequestException);
    });
    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null as any);
      await expect(
        service.update('user1', { name: 'user-1' }, 'userId'),
      ).rejects.toThrow(NotFoundException);
    });
    it('should update and return user', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'user1',
        name: 'user',
      } as any);
      prisma.user.update.mockResolvedValue({
        id: 'user1',
        name: 'user',
      } as any);
      const result = await service.update(
        'user1',
        { name: 'user-1' },
        'admin-1',
      );
      expect(result).toEqual({ id: 'user1', name: 'user' });
    });
  });

  describe('searchByEmail', () => {
    it('rejects queries shorter than 3 characters', async () => {
      await expect(
        service.searchByEmail('ab', { userId: 'a', role: 'ADMIN' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('searches clients of the admin businesses (partial) or by exact email', async () => {
      prisma.business.findMany.mockResolvedValue([
        { id: 'biz-1' },
        { id: 'biz-2' },
      ] as any);
      prisma.user.findMany.mockResolvedValue([
        { id: 'c1', name: 'Ana', email: 'ana@x.com', phone: null },
      ] as any);
      const result = await service.searchByEmail('  ANA ', {
        userId: 'admin1',
        role: 'ADMIN',
      });
      expect(result).toEqual([
        { id: 'c1', name: 'Ana', email: 'ana@x.com', phone: null },
      ]);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            role: 'CLIENT',
            OR: [
              { email: { equals: 'ana', mode: 'insensitive' } },
              {
                email: { contains: 'ana', mode: 'insensitive' },
                bookings: { some: { businessId: { in: ['biz-1', 'biz-2'] } } },
              },
            ],
          },
          select: { id: true, name: true, email: true, phone: true },
        }),
      );
    });

    it('uses the employee business for employees', async () => {
      prisma.user.findUnique.mockResolvedValue({ businessId: 'biz-9' } as any);
      prisma.user.findMany.mockResolvedValue([]);
      await service.searchByEmail('ana@x.com', {
        userId: 'emp1',
        role: 'EMPLOYEE',
      });
      const where = prisma.user.findMany.mock.calls[0][0]!.where as any;
      expect(where.OR[1].bookings.some.businessId.in).toEqual(['biz-9']);
    });
  });
});
