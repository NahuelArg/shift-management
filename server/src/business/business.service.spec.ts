import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended'

import { BusinessService } from './business.service';
import { PrismaService } from '../../prisma/prisma.service';

import { Business } from '@prisma/client';

import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { PublicBusinessDto } from './dto/PublicBusinessDto.dto';




describe('BusinessService', () => {
  let service: BusinessService;
  let prisma: DeepMockProxy<PrismaService>;
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [BusinessService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        }
      ],
    }).compile();
    service = module.get<DeepMockProxy<BusinessService>>(BusinessService);
    prisma = module.get<DeepMockProxy<PrismaService>>(PrismaService);
  });
  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  const mockBusinesses: Business[] = [
    { id: 'biz-1', name: 'Business 1', ownerId: 'user-id', createdAt: new Date(), updatedAt: new Date() },
    { id: 'biz-2', name: 'Business 2', ownerId: 'user-id', createdAt: new Date(), updatedAt: new Date() },
  ];
  describe('getBusinessesByUserId', () => {
    it('should throw BadRequestException if userId is not provided', async () => {
      await expect(service.getBusinessesByUserId(null as any)).rejects.toThrow(BadRequestException);
    });

    it('should return an array of businesses for the user', async () => {
      prisma.business.findMany.mockResolvedValue(mockBusinesses);
      const result = await service.getBusinessesByUserId('user-id');
      expect(result).toEqual(mockBusinesses);
    });
  })
  describe('getAllBusinessesPublic', () => {
    it('should throw NotFoundException if no businesses are found', async () => {
      prisma.business.findMany.mockResolvedValue([]);
      await expect(service.getAllBusinessesPublic()).rejects.toThrow(NotFoundException);
    });
    it('should return an array of public businesses', async () => {
      const mockPublicBusinesses: PublicBusinessDto[] = [
        {
          id: 'biz-1',
          name: 'Business 1',
          services: [
            { id: 'svc-1', name: 'Service 1', price: 100, durationMin: 60 },
            { id: 'svc-2', name: 'Service 2', price: 150, durationMin: 90 },
          ],
        },
        {
          id: 'biz-2',
          name: 'Business 2',
          services: [
            { id: 'svc-3', name: 'Service 3', price: 200, durationMin: 120 },
          ],
        },
      ];
      prisma.business.findMany.mockResolvedValue(mockPublicBusinesses as any);
      const result = await service.getAllBusinessesPublic();
      expect(result).toEqual(mockPublicBusinesses);
    });
  });
  describe('getBusinessById', () => {
    it('should throw BadRequestException if businessId is not provided', async () => {
      await expect(service.getBusinessById(null as any, 'user-id')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if userId is not provided', async () => {
      await expect(service.getBusinessById('biz-id', null as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if business is not found', async () => {
      prisma.business.findUnique.mockResolvedValue(null);
      await expect(service.getBusinessById('biz-id', 'user-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the business', async () => {
      const mockBusiness: Business = { id: 'biz-id', name: 'Business 1', ownerId: 'other-user-id', createdAt: new Date(), updatedAt: new Date() };
      prisma.business.findUnique.mockResolvedValue(mockBusiness);
      await expect(service.getBusinessById('biz-id', 'user-id')).rejects.toThrow(ForbiddenException);
    });

    it('should return the business if found', async () => {
      const mockBusiness: Business = { id: 'biz-id', name: 'Business 1', ownerId: 'user-id', createdAt: new Date(), updatedAt: new Date() };
      prisma.business.findUnique.mockResolvedValue(mockBusiness);
      const result = await service.getBusinessById('biz-id', 'user-id');
      expect(result).toEqual(mockBusiness);
      expect(prisma.business.findUnique).toHaveBeenCalledWith({
        where: { id: 'biz-id' },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });
    });

  });
  describe('create', () => {
    it('should throw ForbiddenException if user is not an ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'CLIENT' } as any);
      await expect(service.create({ name: 'Business 1', ownerId: 'user-id' } as any)).rejects.toThrow(ForbiddenException);
    });
    it('should throw NotFoundException if owner user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null as any);
      await expect(service.create({ name: 'Business 1', ownerId: 'user-id' })).rejects.toThrow(NotFoundException)
    });
    it('should create and return the business if owner is ADMIN', async () => {
      const mockBusiness: Business = { id: 'biz-id', name: 'Business 1', ownerId: 'user-id', createdAt: new Date(), updatedAt: new Date() };
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' } as any);
      prisma.business.create.mockResolvedValue(mockBusiness);
      const result = await service.create({ name: 'Business 1', ownerId: 'user-id' });
      expect(result).toEqual(mockBusiness);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        select: { role: true },
      });
      expect(prisma.business.create).toHaveBeenCalledWith({
        data: {
          name: 'Business 1',
          ownerId: 'user-id',
        },
        include: {
          owner: {
            select:
            {
              id: true,
              name: true,
              email: true,
              role: true,
            }
          }

        },
      });
    });
  });
  describe('update', () => {
    it('should throw NotFoundException if businnes is not found', async () => {
      prisma.business.findUnique.mockResolvedValue(null)
      await expect(service.update('biz-id', {} as any, 'userId')).rejects.toThrow(NotFoundException)
    })
    it('should throw Forbidden exception if ownerId != userId', async () => {
      prisma.business.findUnique.mockResolvedValue({
        id: 'biz-id',
        ownerId: 'other-user-id'
      } as any)
      await expect( service.update('biz-id', { name: 'new name' }, 'userId')).rejects.toThrow(ForbiddenException)
    })
    it('should return updated business', async () => {
    const mockBusiness = { id: 'biz-id', ownerId: 'user-id' };
    const updatedBusiness = { ...mockBusiness, name: 'new name' };
    
    prisma.business.findUnique.mockResolvedValue(mockBusiness as any);
    prisma.business.update.mockResolvedValue(updatedBusiness as any);
    const result = await service.update('biz-id', { name: 'new name' }, 'user-id');
    expect(result).toEqual(updatedBusiness);
});
  })
  describe('delete', () => {

    it('should throw NotFoundException if businnes is not found', async () => {
      prisma.business.findUnique.mockResolvedValue(null)
      await expect(service.delete('biz-id', 'userId')).rejects.toThrow(NotFoundException)
      })

    it('should throw Forbidden exception if ownerId != userId', async () => {
      prisma.business.findUnique.mockResolvedValue({
        id: 'biz-id',
        ownerId: 'other-user-id'
      } as any)
      await expect( service.delete('biz-id', 'userId')).rejects.toThrow(ForbiddenException)
      })

    it('should return deleted business', async () => {
    const mockBusiness = { id: 'biz-id', ownerId: 'user-id' };
    const deleteMock = {}
    prisma.business.findUnique.mockResolvedValue(mockBusiness as any);
    prisma.business.delete.mockResolvedValue(deleteMock as any)
    const result = await service.delete(mockBusiness.id, mockBusiness.ownerId);
    expect(result).toEqual(deleteMock as any);
      });
  })
});
