import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthProvider, BookingStatus, PaymentMethod, PaymentStatus, Prisma, Role } from '@prisma/client';

describe('BookingsService', () => {
  const mockBooking = {
    id: '1',
    userId: "user1",
    timezone: "Europe/Madrid",
    serviceId: "string",
    businessId: "123",
    employeeId: "Employee1",
    date: new Date(),
    endTime: new Date(),
    finalPrice: 100,
    status: "PENDING" as BookingStatus,
    paymentStatus: "PENDING" as PaymentStatus,
    paymentMethod: "CASH" as PaymentMethod,
    createdAt: new Date(),
  }
  const userMock = {
    name: "name",
    id: "user1",
    businessId: "123",
    createdAt: new Date,
    updatedAt: new Date,
    password: "password",
    email: "email@email.com",
    phone: "123",
    role: "EMPLOYEE" as Role,
    authProvider: "LOCAL" as AuthProvider,
  }
  let prisma: DeepMockProxy<PrismaService>;
  let service: BookingsService;
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [BookingsService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        }],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    prisma = module.get<DeepMockProxy<PrismaService>>(PrismaService);
  })

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of bookings', async () => {

      prisma.booking.findMany.mockResolvedValue([mockBooking]);

      const result = await service.findAll();
      expect(result).toEqual([mockBooking]);
    });
  })
  describe('remove', () => {
    it('should throw NotFoundException if booking not found', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(() => service.remove('1', { userId: 'user1', role: 'CLIENT' })).rejects.toThrow(NotFoundException);
    });
    it('should throw ForbiddenException if client is not owner', async () => {
      prisma.booking.findUnique.mockResolvedValue({ ...mockBooking, userId: 'otherUser' });
      prisma.user.findUnique.mockResolvedValue(userMock as any);
      await expect(() => service.remove('1', { userId: 'user1', role: 'CLIENT' })).rejects.toThrow(ForbiddenException);
    });
    it('should throw ForbiddenException if employee tries to delete booking from another business', async () => {
      prisma.booking.findUnique.mockResolvedValue({ ...mockBooking, userId: '123' });
      prisma.user.findUnique.mockResolvedValue({ ...userMock, businessId: 'otherBusiness' } as any);
      await expect(() => service.remove('1', { userId: 'user1', role: 'EMPLOYEE' })).rejects.toThrow(ForbiddenException);
    });
    it('should throw ForbiddenException if ADMIN tries to delete booking from another business', async () => {
      prisma.booking.findUnique.mockResolvedValue({ ...mockBooking, userId: '123' });
      prisma.user.findUnique.mockResolvedValue({ ...userMock, businessId: 'otherBusiness' } as any);
      await expect(() => service.remove('1', { userId: 'user1', role: 'ADMIN' })).rejects.toThrow(ForbiddenException);
    });
    it('should delete the booking if user is EMPLOYEE', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.user.findUnique.mockResolvedValue(userMock as any);
      prisma.booking.delete.mockResolvedValue(mockBooking);
      const result = await service.remove('1', { userId: 'user1', role: 'EMPLOYEE' });
      expect(result).toBeDefined();
    });

    it('should delete the booking if user is ADMIN', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.user.findUnique.mockResolvedValue(userMock as any);
      prisma.booking.delete.mockResolvedValue(mockBooking);
      const result = await service.remove('1', { userId: 'user1', role: 'ADMIN' });
      expect(result).toBeDefined();
    });
  })
  describe('findOne', () => {
    it('should return a booking if found', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      const result = await service.findOne('1');
      expect(result).toEqual(mockBooking);
    });
    it('should throw NotFoundException if booking not found', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);
      await expect(() => service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  })
  describe('update', () => {
    it('should update and return the booking', async () => {
      const updateData = { status: 'CONFIRMED' as BookingStatus };
      prisma.booking.update.mockResolvedValue({ ...mockBooking, ...updateData });
      const result = await service.update('1', updateData);
      expect(result).toEqual({ ...mockBooking, ...updateData });
    });
    it('should throw NotFoundException if booking not found', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0'
        }
      );
      prisma.booking.update.mockRejectedValue(prismaError);
      await expect(() => service.update('1', { status: 'CONFIRMED' as BookingStatus })).rejects.toThrow(NotFoundException);
    });
  })
  describe('updateStatus', () => {
    it('should update the booking status', async () => {
      const updateData = { status: 'CONFIRMED' as BookingStatus };
      prisma.booking.update.mockResolvedValue({ ...mockBooking, ...updateData });
      const result = await service.updateStatus('1', 'CONFIRMED' as BookingStatus);
      expect(result).toEqual({ ...mockBooking, ...updateData });
    });
  })
  describe('getBookingsByEmployee', () => {
    it('should return an array of bookings for the employee', async () => {
      prisma.booking.findMany.mockResolvedValue([mockBooking]);
      const result = await service.getBookingsByEmployee('Employee1');
      expect(result).toEqual([mockBooking]);
    });
  })
  describe('getBookingsByUser', () => {
    it('should return an array of bookings for the user', async () => {
      prisma.booking.findMany.mockResolvedValue([mockBooking]);
      const result = await service.getBookingsByUser('user1');
      expect(result).toEqual([mockBooking]);
    });
  })
  describe('getBookingByQuery', () => {
    it('should filter by date range', async () => {
      const filters = { date: '2025-01-01' };
      prisma.booking.findMany.mockResolvedValue([mockBooking]);

      await service.getBookingByQuery(filters);

      const startOfDay = new Date('2025-01-01');
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date('2025-01-01');
      endOfDay.setHours(23, 59, 59, 999);
      expect(prisma.booking.findMany).toHaveBeenCalledWith({
        where: {
          date: { gte: startOfDay, lte: endOfDay }
        }
      });
    });

    it('should return an array of bookings matching the userId query', async () => {
      const filters = { userId: 'user1' };
      prisma.booking.findMany.mockResolvedValue([mockBooking]);
      const result = await service.getBookingByQuery(filters);
      expect(result).toEqual([mockBooking]);
    });
    it('should return an array of bookings matching multiple queries', async () => {
      const filters = { status: 'PENDING' as BookingStatus, date: new Date().toISOString(), userId: 'user1' };
      prisma.booking.findMany.mockResolvedValue([mockBooking]);
      const result = await service.getBookingByQuery(filters);
      expect(result).toEqual([mockBooking]);
    });
    it('should return an array of bookings matching no queries', async () => {
      const filters = {};
      prisma.booking.findMany.mockResolvedValue([mockBooking]);
      const result = await service.getBookingByQuery(filters);
      expect(result).toEqual([mockBooking]);
    });
    it('should return an array of booking matching the status query', async () => {
      const filters = { status: 'PENDING' as BookingStatus };
      prisma.booking.findMany.mockResolvedValue([mockBooking]);
      const result = await service.getBookingByQuery(filters);
      expect(result).toEqual([mockBooking]);
    });
  })
  describe('findAvailableEmployee', () => {
    it('should return an array of available employees', async () => {
      const businessId = '123';
      const startTime = new Date('2025-01-01T10:00:00Z');
      const endTime = new Date('2025-01-01T11:00:00Z');
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue([{ ...userMock, id: 'employee1', name: 'Employee 1' } as any]);
      const result = await service.findAvailableEmployee(businessId, startTime, endTime);
      expect(result).toEqual([{ ...userMock, id: 'employee1', name: 'Employee 1' }]);
    });
     it('should return an empty array if no employees are available', async () => {
      const businessId = '123';
      const startTime = new Date('2025-01-01T10:00:00Z');
      const endTime = new Date('2025-01-01T11:00:00Z');
      prisma.booking.findMany.mockResolvedValue([{ ...mockBooking, employeeId: 'employee1' }]);
      prisma.user.findMany.mockResolvedValue([{ ...userMock, id: 'employee1', name: 'Employee 1' } as any]);
      const result = await service.findAvailableEmployee(businessId, startTime, endTime);
      expect(result).toEqual([]);
     });
     it('should return an empty array if no employees are found for the business', async () => {
      const businessId = '123';
      const startTime = new Date('2025-01-01T10:00:00Z');
      const endTime = new Date('2025-01-01T11:00:00Z');
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue([]);
      const result = await service.findAvailableEmployee(businessId, startTime, endTime);
      expect(result).toEqual([]);
     });
     it('should return only available employees when some are booked', async () => {
      const businessId = '123';
      const startTime = new Date('2025-01-01T10:00:00Z');
      const endTime = new Date('2025-01-01T11:00:00Z');
      prisma.booking.findMany.mockResolvedValue([{ ...mockBooking, employeeId: 'employee1' }]);
      prisma.user.findMany.mockResolvedValue([{ ...userMock, id: 'employee1', name: 'Employee 1' }, { ...userMock, id: 'employee2', name: 'Employee 2' }]);
      const result = await service.findAvailableEmployee(businessId, startTime, endTime);
      expect(result).toEqual([{ ...userMock, id: 'employee2', name: 'Employee 2' }]);
     });
  })
  describe('create', () => {
      const data = {
        userId: 'user1',
        serviceId: 'service1',
        businessId: '123',
        date: new Date('2025-01-01T10:00:00Z'),
        timezone: 'Europe/Madrid',
        employeeId: 'employee1',
        finalPrice: 100,
      };
      it('should throw BadRequestException if businessId is not provided', async () => {
        await expect(() => service.create({ ...data, businessId: null as any })).rejects.toThrow(BadRequestException);
      });
      it('should throw BadRequestException if serviceId is not provided', async () => {
        await expect(() => service.create({ ...data, serviceId: null as any })).rejects.toThrow(BadRequestException);
      });
      it('should throw BadRequestException if date is not provided', async () => {
        await expect(() => service.create({ ...data, date: null as any })).rejects.toThrow(BadRequestException);
      });
      it('should throw BadRequestException if service does not exist in database', async () => {
        prisma.service.findUnique.mockResolvedValue(null);
        await expect(() => service.create(data)).rejects.toThrow(BadRequestException);
      });
     it('should throw BadRequestException if service duration is invalid', async () => {
        prisma.service.findUnique.mockResolvedValue({ durationMin: 0 } as any);
        await expect(() => service.create(data)).rejects.toThrow(BadRequestException);
      });
       it('should throw BadRequestException if service duration is negative', async () => {
        prisma.service.findUnique.mockResolvedValue({ durationMin: -30 } as any);
        await expect(() => service.create(data)).rejects.toThrow(BadRequestException);
      });
       it('should throw BadRequestException if service duration is null', async () => {
        prisma.service.findUnique.mockResolvedValue({ durationMin: null } as any);
        await expect(() => service.create(data)).rejects.toThrow(BadRequestException);
      });
      // isNan(parsedDate) bad requestException
      it('should throw BadRequestException if date format is invalid', async () => {
        prisma.service.findUnique.mockResolvedValue({ durationMin: 60 } as any);
          const invalidData = { ...data, date: 'invalid-date' };
          await expect(() => service.create(invalidData)).rejects.toThrow(BadRequestException);
      });
      it('should throw BadRequestException if there is no schedule for the booking time', async () => {
        prisma.service.findUnique.mockResolvedValue({ durationMin: 60 } as any);
        prisma.schedule.findFirst.mockResolvedValue(null);
        await expect(() => service.create(data)).rejects.toThrow(BadRequestException);
      });
      // endMinutes > closeMinutes bad requestException
      it('should throw BadRequestException if booking time is outside schedule', async () => {
        prisma.service.findUnique.mockResolvedValue({ durationMin: 60 } as any);
        prisma.schedule.findFirst.mockResolvedValue({ from: '09:00', to: '10:30' } as any);
        await expect(() => service.create(data)).rejects.toThrow(BadRequestException);
      });
      it('should throw BadRequestException if there are no available employees for the booking time', async () => {
        const dataWithoutEmployee = { ...data, employeeId: undefined as any };
        prisma.service.findUnique.mockResolvedValue({ durationMin: 60 } as any);
        prisma.schedule.findFirst.mockResolvedValue({ from: '09:00', to: '18:00' } as any);
        prisma.user.findMany.mockResolvedValue([])
        await expect(() => service.create(dataWithoutEmployee)).rejects.toThrow(BadRequestException);
      });
      it('should throw BadRequestException if the employee does not exist in the specified business', async () => {
        prisma.booking.findFirst.mockResolvedValue(null);
        prisma.user.findFirst.mockResolvedValue(null);
        await expect(() => service.create(data)).rejects.toThrow(BadRequestException);
      });
      it('should throw BadRequestException if the employee has another booking at the same time', async () => {
        prisma.user.findFirst.mockResolvedValue({ ...userMock, businessId: '123' } as any);
        prisma.booking.findFirst.mockResolvedValue({ ...mockBooking, employeeId: 'employee1' });
      await expect(() => service.create(data)).rejects.toThrow(BadRequestException);
      })
      // Success
      it('should create and return the booking', async () => {
        prisma.service.findUnique.mockResolvedValue({ durationMin: 60 } as any);
        prisma.schedule.findFirst.mockResolvedValue({ from: '09:00', to: '18:00' } as any);
        prisma.booking.findFirst.mockResolvedValue(null);
        prisma.user.findFirst.mockResolvedValue({ ...userMock, businessId: '123' } as any);
        prisma.booking.create.mockResolvedValue(mockBooking);
        const result = await service.create(data);
        expect(result).toEqual(mockBooking);
      });   

    
  })
})
