import { DeepMockProxy, mockDeep } from 'jest-mock-extended'
import { Test, TestingModule } from '@nestjs/testing';
import { SchedulesService } from './schedules.service';
import { PrismaService } from '../../prisma/prisma.service'
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateScheduleDto } from './dto/updateSchedules.dto';

describe('SchedulesService', () => {
  let prisma: DeepMockProxy<PrismaService>;
  let service: SchedulesService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [SchedulesService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>()
        }
      ],
    }).compile();
    prisma = module.get<DeepMockProxy<PrismaService>>(PrismaService);
    service = module.get<SchedulesService>(SchedulesService);
  });
  afterEach(async () => {
    await module.close()
  })

  it('should be defined', () => {
    expect(service).toBeDefined();
  })
  describe('FindAll', () => {
    it('should throw BadRequestException if userId is not provided', async () => {
      await expect(service.findAll(null as any)).rejects.toThrow(BadRequestException);
    })
    it('should get all owner schedules', async () => {
      prisma.business.findMany.mockResolvedValue([{ id: 'biz-id' }] as any)
      prisma.schedule.findMany.mockResolvedValue([{ id: 'schedule-id', dayOfWeek: 1, from: '10:00', to: '12:30', businessId: 'biz-213' }] as any)
      const result = await service.findAll('userId-123')
      expect(result).toEqual(
        [{
          id: 'schedule-id',
          dayOfWeek: 1,
          from: '10:00',
          to: '12:30',
          businessId: 'biz-213'
        }]
      )
    })
  });
  describe('FindOne', () => {
    it('should get schedule by id', async () => {
      prisma.schedule.findUnique.mockResolvedValue({ id: 'schedule-id', dayOfWeek: 1, from: '10:00', to: '12:30', businessId: 'biz-213' } as any)
      const result = await service.findOne('schedule-id')
      expect(result).toEqual(
        {
          id: 'schedule-id',
          dayOfWeek: 1,
          from: '10:00',
          to: '12:30',
          businessId: 'biz-213'
        }
      )
    })
    it('should throw BadRequestException if id is not provided', async () => {
      await expect(service.findOne(null as any)).rejects.toThrow(BadRequestException);
    })
    it('should throw NotFoundException if schedule id is not found', async () => {
      await expect(service.findOne('schedule-123')).rejects.toThrow(NotFoundException);
    })
  });
  describe('Create', () => {
    it('should throw BadRequestException if fromMinutes > or = than toMinutes', async () => {
      await expect(service.create({ from: '10:00', to: '09:00', dayOfWeek: 1, businessId: 'biz1' })).rejects.toThrow(BadRequestException);
    })
    it('should create a schedule', async () => {
      prisma.schedule.create.mockResolvedValue({ id: 'schedule1', from: '17:00', to: '19:00', dayOfWeek: 1, businessId: 'biz1' })
      const result = await service.create({ from: '17:00', to: '19:00', dayOfWeek: 1, businessId: 'biz1' })
      expect(result).toEqual({
        id: 'schedule1',
        from: '17:00',
        to: '19:00',
        dayOfWeek: 1,
        businessId: 'biz1'
      })
    })
  });
  describe('Delete', () => {
    it('should throw BadRequestException if id is not provided', async () => {
      await expect(service.delete(null as any, 'userId')).rejects.toThrow(BadRequestException)
    })
    it('should throw BadRequestException if userId is not provided', async () => {
      await expect(service.delete('schedule-id', null as any)).rejects.toThrow(BadRequestException)
    })
    it('should throw NotFoundException  if schedule not found', async () => {
      await expect(service.delete('schedule-id2', 'user2')).rejects.toThrow(NotFoundException)
    })
    it('should throw NotFoundException  if business not found', async () => {
      prisma.schedule.findUnique.mockResolvedValue({ id: 'schedule-id', businessId: 'biz-1' } as any);
      await expect(service.delete('schedule-id2', 'user2')).rejects.toThrow(NotFoundException)
    })
    it('should throw ForbiddenException  if ownerId is not equal to businessId', async () => {
      prisma.schedule.findUnique.mockResolvedValue({ id: 'schedule-id2' } as any)
      prisma.business.findUnique.mockResolvedValue({ ownerId: 'user1' } as any)
      await expect(service.delete('schedule-id2', 'user2')).rejects.toThrow(ForbiddenException)
    })
    it('should delete schedule', async () => {
      prisma.schedule.findUnique.mockResolvedValue({ id: 'schedule-id' } as any)
      prisma.business.findUnique.mockResolvedValue({ id: 'biz-1', ownerId: 'user2' } as any)
      await service.delete('schedule-id', 'user2');
      expect(prisma.schedule.delete).toHaveBeenCalledWith({
        where: { id: 'schedule-id' }
      });
    })
  });
  describe('Update', () => {
    it('should throw BadRequestException if arg not provided', async () => {
      await expect(service.update(null as any, { from: '10:00', to: '12:00' } as any, 'userId')).rejects.toThrow(BadRequestException)
    })
    it('should throw BadRequestException if arg not provided', async () => {
      await expect(service.update('schedule1', { from: '10:00', to: '12:00' } as any, null as any)).rejects.toThrow(BadRequestException)
    })
    it('should throw NotFoundException  if schedule not found', async () => {
      prisma.schedule.findUnique.mockResolvedValue( null as any);
      await expect(service.update('schedule-id', { from: '10:00', to: '12:00' } as any, 'user2')).rejects.toThrow(NotFoundException)
    })
    it('should throw BadRequestException if fromMinutes > or = than toMinutes', async () => {
      prisma.schedule.findUnique.mockResolvedValue({ id: 'schedule-id' } as any)
      prisma.business.findUnique.mockResolvedValue({ id: 'biz-1', ownerId: 'userId' } as any)
      await expect(service.update('schedule-id1',{ from: '10:00', to: '09:00', dayOfWeek: 1, }, 'userId')).rejects.toThrow(BadRequestException);
    })
    it('should throw NotFoundException  if business not found', async () => {
      prisma.schedule.findUnique.mockResolvedValue({ id: 'schedule-id2' } as any);
      prisma.business.findUnique.mockResolvedValue(null as any);
      await expect(service.update('schedule-id2', { from: '10:00', to: '12:00' } as any, 'user2')).rejects.toThrow(NotFoundException)
    })
    it('should throw ForbiddenException  if ownerId is not equal to businessId', async () => {
      prisma.schedule.findUnique.mockResolvedValue({ id: 'schedule-id2' } as any)
      prisma.business.findUnique.mockResolvedValue({ ownerId: 'user1' } as any)
      await expect(service.update('schedule-id2', { from: '10:00', to: '12:00' } as any, 'user2')).rejects.toThrow(ForbiddenException)
    })
    it('should update schedule', async () => {
      prisma.schedule.findUnique.mockResolvedValue({ id: 'schedule-id' } as any)
      prisma.business.findUnique.mockResolvedValue({ id: 'biz-1', ownerId: 'user2' } as any)
      await service.update('schedule-id', {  from: '10:00', to: '12:00' } as any, 'user2');
      expect(prisma.schedule.update).toHaveBeenCalledWith({
        where: { id: 'schedule-id' },
        data: { from: '10:00', to: '12:00' }
      });
    })
  });
})
