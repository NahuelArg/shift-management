import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: DeepMockProxy<PrismaService>
  let module: TestingModule

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>()
        }
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<DeepMockProxy<PrismaService>>(PrismaService)
  });
  afterEach(async () => await module.close())

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('findAll', () => {
    it('should return users from admin businesses', async () => {
      prisma.business.findMany.mockResolvedValue([{ id: 'biz-id' }] as any)
      prisma.user.findMany.mockResolvedValue([{ name: 'user1', email: 'user@email.com' }] as any)
      const result = await service.findAll('user12')
      expect(result).toEqual([{
        name: 'user1',
        email: 'user@email.com'
      }])
    })
  })

  describe('create', () => {
    it('should throw ConflictException if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ email: 'user@email.com' } as any)
      await expect(service.create({ email: 'user@email.com' } as any)).rejects.toThrow(ConflictException)
    })
    it('should throw BadRequestException if LOCAL auth without password', async () => {
      prisma.user.findUnique.mockResolvedValue(null as any)
      await expect(service.create(
        {
          email: 'user@email.com',
          password: null,
          authProvider: 'LOCAL'
        } as any)).rejects.toThrow(BadRequestException)
    })
    it('should create and return user', async () => {
      prisma.user.findUnique.mockResolvedValue(null as any)
      prisma.user.create.mockResolvedValue({ name: 'user1', email: 'user1@email.com', password: 'password-hashed', authProvider: 'LOCAL' } as any)
      const result = await service.create({ name: 'user1', email: 'user1@email.com', password: 'password-hashed', authProvider: 'LOCAL' })
      expect(result).toEqual({ name: 'user1', email: 'user1@email.com', password: 'password-hashed', authProvider: 'LOCAL' })
    })
  })

  describe('delete', () => {
    it('should throw BadRequestException if id not provided', async () => {
      await expect(service.delete(null as any, null as any)).rejects.toThrow(BadRequestException)
    })
    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null as any);
      await expect(service.delete('user1', 'admin-1')).rejects.toThrow(NotFoundException)
    })
    it('should delete and return user', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'user1', name: 'user' } as any);
      prisma.user.delete.mockResolvedValue({ id: 'user1', name: 'user' } as any);
      const result = await service.delete('user1', 'admin-1');
      expect(result).toEqual({ id: 'user1', name: 'user' });
    })
  })

  describe('update', () => {
    it('should throw BadRequestException if id not provided', async () => {
      await expect(service.update(null as any, null as any, null as any)).rejects.toThrow(BadRequestException)
    })
    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null as any);
      await expect(service.update('user1', { name: 'user-1' }, 'userId')).rejects.toThrow(NotFoundException)
    })
    it('should update and return user', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'user1', name: 'user' } as any);
      prisma.user.update.mockResolvedValue({ id: 'user1', name: 'user' } as any);
      const result = await service.update('user1', { name: 'user-1' }, 'admin-1');
      expect(result).toEqual({ id: 'user1', name: 'user' });
    })
  })

  describe('searchByEmail', () => {
    it('should throw BadRequestException if email not provided', async () => {
      await expect(service.searchByEmail(null as any, null as any)).rejects.toThrow(BadRequestException)
    })
    it('should return users matching email', async () => {
      prisma.business.findMany.mockResolvedValue([{ id: 'biz-id' }] as any);
      prisma.user.findMany.mockResolvedValue([{
            name: 'user1',
            id: 'userId',
            email: 'user@email.com',
            phone: null,
            role: 'EMPLOYEE',
            authProvider: 'LOCAL',
            businessId: 'biz-id',
          }] as any);
      const user = await service.searchByEmail('user@email.com', 'userId')
      expect(user).toEqual(
        [
          {
            name: 'user1',
            id: 'userId',
            email: 'user@email.com',
            phone: null,
            role: 'EMPLOYEE',
            authProvider: 'LOCAL',
            businessId: 'biz-id',
          }
        ]
      )

    })
  })
});
