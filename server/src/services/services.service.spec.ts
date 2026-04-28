import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { ServicesService } from './services.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException
} from '@nestjs/common';



describe('ServicesService', () => {
  let service: ServicesService;
  let prisma: DeepMockProxy<PrismaService>;
  let module: TestingModule
  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>()
        }
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    prisma = module.get<DeepMockProxy<PrismaService>>(PrismaService)
  });
  afterEach(async () => await module.close())

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('getServicesByBusinessId', () => {
    it('should throw BadRequestException if req not provided', async () => {
      await expect(service.getServicesByBusinessId(null as any, null as any)).rejects.toThrow(BadRequestException)
    })
    it('should throw ForbiddenException if business is null', async () => {
      prisma.business.findFirst.mockResolvedValue(null)
      await expect(service.getServicesByBusinessId('biz-1', 'user2')).rejects.toThrow(ForbiddenException)
    })
    it('should return services by businessId', async () => {
      prisma.business.findFirst.mockResolvedValue(
        {
          id: 'biz1',
          ownerId: 'user1',
          services: [
            { id: 'svc-1', name: 'Corte', price: 5000, durationMin: 30, businessId: 'biz1' },
          ],
        } as any)
      const result = await service.getServicesByBusinessId('biz1', 'user1')
      expect(result).toEqual([
        { id: 'svc-1', name: 'Corte', price: 5000, durationMin: 30, businessId: 'biz1' },
      ])

    })
  })
  describe('findAll', () => {
    it('should throw BadRequestException if req not provided', async () => {
      await expect(service.findAll(null as any)).rejects.toThrow(BadRequestException)
    })
    it('should return all services by userId', async () => {
      prisma.business.findMany.mockResolvedValue(
        [{
          name: 'biz',
          services: [
            { id: 'svc-1', name: 'Corte', price: 5000, durationMin: 30, businessId: 'biz1' },
          ],
        }] as any)
      const result = await service.findAll('user1')
      expect(result).toEqual([{
        name: 'biz',
        services: [{ id: 'svc-1', name: 'Corte', price: 5000, durationMin: 30, businessId: 'biz1' }],
      }])

    })
  })
  describe('create', () => {
    it('should throw ForbiddenException if business is null', async () => {
      prisma.business.findFirst.mockResolvedValue(null)
      await expect(service.create({ name: 'biz', durationMin: 10, price: 1500, businessId: 'biz-1' }, 'user2')).rejects.toThrow(ForbiddenException)
    })
    it('should return new service', async () => {
      prisma.business.findFirst.mockResolvedValue(
        {
          id: 'biz1',
          ownerId: 'user1',
        } as any)
      prisma.service.create.mockResolvedValue({ name: 'biz', durationMin: 10, price: 1500, businessId: 'biz-1' } as any)
      const result = await service.create({ name: 'biz', durationMin: 10, price: 1500, businessId: 'biz-1' }, 'user2')
      expect(result).toEqual({ name: 'biz', durationMin: 10, price: 1500, businessId: 'biz-1' })
    })
    it('should throw ConflictException', async () => {
      prisma.business.findFirst.mockResolvedValue(
        {
          id: 'biz1',
          ownerId: 'user1',
        } as any)
      prisma.service.create.mockRejectedValue(
        new PrismaClientKnownRequestError('message', { code: 'P2002', clientVersion: '5.0.0' })
      );
      await expect(service.create(
        {
          name: 'biz',
          durationMin: 10,
          price: 1500,
          businessId: 'biz-1'
        },
        'user2')).rejects.toThrow(ConflictException)
    })
    it('should throw InternalServerError', async () => {
      prisma.business.findFirst.mockResolvedValue(
        {
          id: 'biz1',
          ownerId: 'user1',
        } as any)
      prisma.service.create.mockRejectedValue(new Error('Database crashed'))
      await expect(service.create(
        {
          name: 'biz',
          durationMin: 10,
          price: 1500,
          businessId: 'biz-1'
        },
        'user2')).rejects.toThrow(InternalServerErrorException)
    })
  })
  describe('delete', () => {
    it('should throw BadRequestException if req not provided', async () => {
      await expect(service.delete(null as any, null as any, null as any)).rejects.toThrow(BadRequestException)
    })
    it('should throw ForbiddenException if business is null', async () => {
      prisma.business.findFirst.mockResolvedValue(null)
      await expect(service.delete('srv-id', 'user2', 'biz-1')).rejects.toThrow(ForbiddenException)
    })
    it('should delete a service', async () => {
      prisma.business.findFirst.mockResolvedValue(
        {
          id: 'biz-1',
          ownerId: 'user1',
        } as any)
      prisma.service.delete.mockResolvedValue({ id: 'srv-id', name: 'biz', durationMin: 10, price: 1500, businessId: 'biz-1' } as any);
      const result = await service.delete('srv-id', 'user2', 'biz-1')
      expect(result).toEqual({ id: 'srv-id', name: 'biz', durationMin: 10, price: 1500, businessId: 'biz-1' })
    })
    it('should throw NotFoundException', async () => {
      prisma.business.findFirst.mockResolvedValue(
        {
          id: 'biz1',
          ownerId: 'user1',
        } as any)
      prisma.service.delete.mockRejectedValue(
        new PrismaClientKnownRequestError('message', { code: 'P2025', clientVersion: '5.0.0' })
      );
      await expect(service.delete('srv-id', 'user2', 'biz-1')).rejects.toThrow(NotFoundException)
    })
    it('should throw InternalServerError', async () => {
      prisma.business.findFirst.mockResolvedValue(
        {
          id: 'biz1',
          ownerId: 'user1',
        } as any)
      prisma.service.delete.mockRejectedValue(new Error('Database crashed'))
      await expect(service.delete('srv-id', 'user2', 'biz-1')).rejects.toThrow(InternalServerErrorException)
    })
  })
  describe('update', () => {
    it('should throw BadRequestException if req not provided', async () => {
      await expect(service.update(null as any, null as any, null as any,null as any )).rejects.toThrow(BadRequestException)
    })
    it('should throw ForbiddenException if business is null', async () => {
      prisma.business.findFirst.mockResolvedValue(null)
      await expect(service.update('srv-id', { name: 'biz-New' }, 'user2', 'biz-1')).rejects.toThrow(ForbiddenException)
    })
    it('should update a service', async () => {
      prisma.business.findFirst.mockResolvedValue(
        {
          id: 'biz-1',
          ownerId: 'user1',
        } as any)
      prisma.service.update.mockResolvedValue({ id: 'srv-id', name: 'biz', durationMin: 10, price: 1500, businessId: 'biz-1' } as any);
      const result = await service.update('srv-id', { name: 'biz-New' }, 'user2', 'biz-1')
      expect(result).toEqual({ id: 'srv-id', name: 'biz', durationMin: 10, price: 1500, businessId: 'biz-1' })
    })
    it('should throw NotFoundException', async () => {
      prisma.business.findFirst.mockResolvedValue(
        {
          id: 'biz1',
          ownerId: 'user1',
        } as any)
      prisma.service.update.mockRejectedValue(
        new PrismaClientKnownRequestError('message', { code: 'P2025', clientVersion: '5.0.0' })
      );
      await expect(service.update('srv-id', { name: 'biz-New' }, 'user2', 'biz-1')).rejects.toThrow(NotFoundException)
    })
    it('should throw InternalServerError', async () => {
      prisma.business.findFirst.mockResolvedValue(
        {
          id: 'biz1',
          ownerId: 'user1',
        } as any)
      prisma.service.update.mockRejectedValue(new Error('Database crashed'))
      await expect(service.update('srv-id', { name: 'biz-New' }, 'user2', 'biz-1')).rejects.toThrow(InternalServerErrorException)
    })
  })
  describe('getServicesByEmployee', () => {
    it('should throw BadRequestException if req not provided', async () => {
      await expect(service.getServicesByEmployee(null as any)).rejects.toThrow(BadRequestException)
    })
    it('should throw NotFoundException if business is null', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      await expect(service.getServicesByEmployee('employee-id')).rejects.toThrow(NotFoundException)
    })
    it('should throw UnprocessableEntityException if business is null', async () => {
      prisma.user.findUnique.mockResolvedValue({businessId:null} as any)
      await expect(service.getServicesByEmployee('employee-id')).rejects.toThrow(UnprocessableEntityException)
    })
    it('should return services by businessId', async () => {
      prisma.user.findUnique.mockResolvedValue({businessId:'biz-id'} as any)
      prisma.service.findMany.mockResolvedValue([{ id: 'srv-id', name: 'biz', durationMin: 10, price: 1500, businessId: 'biz-id' }] as any)
      const result = await service.getServicesByEmployee('employee-id')
      expect(result).toEqual([{ id: 'srv-id', name: 'biz', durationMin: 10, price: 1500, businessId: 'biz-id' }])
    })
  })

});
