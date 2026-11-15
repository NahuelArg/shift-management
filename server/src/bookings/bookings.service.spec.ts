import { Test, TestingModule } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  AuthProvider,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  Role,
} from '@prisma/client';

describe('BookingsService', () => {
  const mockBooking = {
    id: '1',
    userId: 'user1',
    timezone: 'Europe/Madrid',
    serviceId: 'string',
    businessId: '123',
    employeeId: 'Employee1',
    date: new Date(),
    endTime: new Date(),
    finalPrice: new Prisma.Decimal(100),
    status: 'PENDING' as BookingStatus,
    paymentStatus: 'PENDING' as PaymentStatus,
    paymentMethod: 'CASH' as PaymentMethod,
    createdAt: new Date(),
  };
  const userMock = {
    name: 'name',
    id: 'user1',
    businessId: '123',
    createdAt: new Date(),
    updatedAt: new Date(),
    password: 'password',
    email: 'email@email.com',
    phone: '123',
    role: 'EMPLOYEE' as Role,
    authProvider: 'LOCAL' as AuthProvider,
  };
  let prisma: DeepMockProxy<PrismaService>;
  let service: BookingsService;
  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    prisma = module.get<DeepMockProxy<PrismaService>>(PrismaService);
  });
  afterEach(async () => await module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of bookings', async () => {
      prisma.booking.findMany.mockResolvedValue([mockBooking]);

      const result = await service.findAll();
      expect(result).toEqual([mockBooking]);
    });
  });
  describe('delete', () => {
    const withOwner = (over: object = {}) =>
      ({ ...mockBooking, business: { ownerId: 'admin1' }, ...over }) as any;

    it('throws NotFound when the booking does not exist', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);
      await expect(
        service.delete('1', { userId: 'user1', role: 'CLIENT' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lets an admin delete bookings of their own business', async () => {
      prisma.booking.findUnique.mockResolvedValue(withOwner());
      prisma.booking.delete.mockResolvedValue(mockBooking);
      await expect(
        service.delete('1', { userId: 'admin1', role: 'ADMIN' }),
      ).resolves.toBeDefined();
    });

    it('forbids an admin from deleting bookings of another business', async () => {
      prisma.booking.findUnique.mockResolvedValue(
        withOwner({ business: { ownerId: 'other' } }),
      );
      await expect(
        service.delete('1', { userId: 'admin1', role: 'ADMIN' }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.booking.delete).not.toHaveBeenCalled();
    });

    it('lets a client delete their own pending booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(
        withOwner({ userId: 'client1', status: 'PENDING' }),
      );
      prisma.booking.delete.mockResolvedValue(mockBooking);
      await expect(
        service.delete('1', { userId: 'client1', role: 'CLIENT' }),
      ).resolves.toBeDefined();
    });

    it("forbids a client from deleting someone else's booking", async () => {
      prisma.booking.findUnique.mockResolvedValue(
        withOwner({ userId: 'other' }),
      );
      await expect(
        service.delete('1', { userId: 'client1', role: 'CLIENT' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('does not let a client delete a completed booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(
        withOwner({ userId: 'client1', status: 'COMPLETED' }),
      );
      await expect(
        service.delete('1', { userId: 'client1', role: 'CLIENT' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('forbids employees (not allowed by the endpoint either)', async () => {
      prisma.booking.findUnique.mockResolvedValue(withOwner());
      await expect(
        service.delete('1', { userId: 'emp1', role: 'EMPLOYEE' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
  describe('findOne', () => {
    it('should return a booking if found', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      const result = await service.findOne('1');
      expect(result).toEqual(mockBooking);
    });
    it('should throw NotFoundException if booking not found', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);
      await expect(() => service.findOne('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
  describe('update (ADMIN)', () => {
    const owned = {
      businessId: 'b1',
      date: new Date('2030-01-01T10:00:00Z'),
      endTime: new Date('2030-01-01T11:00:00Z'),
      business: { ownerId: 'admin1' },
    };

    it('throws NotFound when the booking does not exist', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);
      await expect(
        service.update('1', { finalPrice: 10 }, 'admin1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('forbids admins from editing bookings of another business', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...owned,
        business: { ownerId: 'other' },
      } as any);
      await expect(
        service.update('1', { finalPrice: 10 }, 'admin1'),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('updates only the allowed fields', async () => {
      prisma.booking.findUnique.mockResolvedValue(owned as any);
      prisma.booking.update.mockResolvedValue(mockBooking);
      await service.update('1', { finalPrice: 50 }, 'admin1');
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { finalPrice: 50 },
      });
    });

    it('rejects reassigning to an employee of another business', async () => {
      prisma.booking.findUnique.mockResolvedValue(owned as any);
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(
        service.update('1', { employeeId: 'emp9' }, 'admin1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects reassigning to a busy employee', async () => {
      prisma.booking.findUnique.mockResolvedValue(owned as any);
      prisma.user.findFirst.mockResolvedValue(userMock as any);
      prisma.booking.findFirst.mockResolvedValue(mockBooking);
      await expect(
        service.update('1', { employeeId: 'emp2' }, 'admin1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
  describe('updateStatus', () => {
    it('should update the booking status', async () => {
      const updateData = { status: 'CONFIRMED' as BookingStatus };
      prisma.booking.update.mockResolvedValue({
        ...mockBooking,
        ...updateData,
      });
      const result = await service.updateStatus(
        '1',
        'CONFIRMED' as BookingStatus,
      );
      expect(result).toEqual({ ...mockBooking, ...updateData });
    });
  });
  describe('changeStatus (reglas por rol)', () => {
    const booking = (
      over: Partial<{
        userId: string;
        employeeId: string;
        status: BookingStatus;
        ownerId: string;
      }> = {},
    ) => ({
      userId: over.userId ?? 'client1',
      employeeId: over.employeeId ?? 'emp1',
      status: over.status ?? BookingStatus.PENDING,
      business: { ownerId: over.ownerId ?? 'admin1' },
    });
    const updated = { ...mockBooking, status: BookingStatus.CANCELLED };

    beforeEach(() => prisma.booking.update.mockResolvedValue(updated as any));

    it('throws NotFound when the booking does not exist', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);
      await expect(
        service.changeStatus(
          { userId: 'admin1', role: 'ADMIN' },
          'x',
          BookingStatus.CONFIRMED,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('ADMIN can update bookings of a business they own', async () => {
      prisma.booking.findUnique.mockResolvedValue(booking() as any);
      await service.changeStatus(
        { userId: 'admin1', role: 'ADMIN' },
        'b1',
        BookingStatus.CONFIRMED,
      );
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: { status: BookingStatus.CONFIRMED },
      });
    });

    it('ADMIN cannot update bookings of another business', async () => {
      prisma.booking.findUnique.mockResolvedValue(
        booking({ ownerId: 'otherAdmin' }) as any,
      );
      await expect(
        service.changeStatus(
          { userId: 'admin1', role: 'ADMIN' },
          'b1',
          BookingStatus.CONFIRMED,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('EMPLOYEE can only update bookings assigned to them', async () => {
      prisma.booking.findUnique.mockResolvedValue(
        booking({ employeeId: 'emp2' }) as any,
      );
      await expect(
        service.changeStatus(
          { userId: 'emp1', role: 'EMPLOYEE' },
          'b1',
          BookingStatus.COMPLETED,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('CLIENT can cancel their own pending booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(booking() as any);
      await service.changeStatus(
        { userId: 'client1', role: 'CLIENT' },
        'b1',
        BookingStatus.CANCELLED,
      );
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: { status: BookingStatus.CANCELLED },
      });
    });

    it('CLIENT cannot confirm a booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(booking() as any);
      await expect(
        service.changeStatus(
          { userId: 'client1', role: 'CLIENT' },
          'b1',
          BookingStatus.CONFIRMED,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it("CLIENT cannot cancel someone else's booking", async () => {
      prisma.booking.findUnique.mockResolvedValue(
        booking({ userId: 'client2' }) as any,
      );
      await expect(
        service.changeStatus(
          { userId: 'client1', role: 'CLIENT' },
          'b1',
          BookingStatus.CANCELLED,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('CLIENT cannot cancel a completed booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(
        booking({ status: BookingStatus.COMPLETED }) as any,
      );
      await expect(
        service.changeStatus(
          { userId: 'client1', role: 'CLIENT' },
          'b1',
          BookingStatus.CANCELLED,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });
  });
  describe('getBookingsByEmployee', () => {
    it('should return an array of bookings for the employee', async () => {
      prisma.booking.findMany.mockResolvedValue([mockBooking]);
      const result = await service.getBookingsByEmployee('Employee1');
      expect(result).toEqual([mockBooking]);
    });
  });
  describe('getBookingsByUser', () => {
    it('should return an array of bookings for the user', async () => {
      prisma.booking.findMany.mockResolvedValue([mockBooking]);
      const result = await service.getBookingsByUser('user1');
      expect(result).toEqual([mockBooking]);
    });
  });
  describe('getBookingByQuery', () => {
    const ownerId = 'admin1';

    it('should filter by date range and owner', async () => {
      const filters = { ownerId, date: '2025-01-01' };
      prisma.booking.findMany.mockResolvedValue([mockBooking]);

      await service.getBookingByQuery(filters);

      const startOfDay = new Date('2025-01-01');
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date('2025-01-01');
      endOfDay.setHours(23, 59, 59, 999);
      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            business: { ownerId },
            date: { gte: startOfDay, lte: endOfDay },
          },
        }),
      );
    });

    it('should only return bookings from businesses owned by the admin', async () => {
      prisma.booking.findMany.mockResolvedValue([mockBooking]);
      await service.getBookingByQuery({ ownerId });
      const args = prisma.booking.findMany.mock.calls[0][0] as any;
      expect(args.where.business).toEqual({ ownerId });
      expect(args.take).toBeUndefined();
    });

    it('should return the most recent N bookings when limit is provided', async () => {
      prisma.booking.findMany.mockResolvedValue([mockBooking]);
      await service.getBookingByQuery({ ownerId, businessId: 'b1', limit: 5 });
      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { business: { ownerId }, businessId: 'b1' },
          orderBy: { date: 'desc' },
          take: 5,
        }),
      );
    });

    it('should return an array of bookings matching the userId query', async () => {
      const filters = { ownerId, userId: 'user1' };
      prisma.booking.findMany.mockResolvedValue([mockBooking]);
      const result = await service.getBookingByQuery(filters);
      expect(result).toEqual([mockBooking]);
    });
    it('should return an array of bookings matching multiple queries', async () => {
      const filters = {
        ownerId,
        status: 'PENDING' as BookingStatus,
        date: new Date().toISOString(),
        userId: 'user1',
      };
      prisma.booking.findMany.mockResolvedValue([mockBooking]);
      const result = await service.getBookingByQuery(filters);
      expect(result).toEqual([mockBooking]);
    });
    it('should return an array of booking matching the status query', async () => {
      const filters = { ownerId, status: 'PENDING' as BookingStatus };
      prisma.booking.findMany.mockResolvedValue([mockBooking]);
      const result = await service.getBookingByQuery(filters);
      expect(result).toEqual([mockBooking]);
    });
  });
  describe('findAvailableEmployee', () => {
    it('should return an array of available employees', async () => {
      const businessId = '123';
      const startTime = new Date('2025-01-01T10:00:00Z');
      const endTime = new Date('2025-01-01T11:00:00Z');
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue([
        { ...userMock, id: 'employee1', name: 'Employee 1' } as any,
      ]);
      const result = await service.findAvailableEmployee(
        businessId,
        startTime,
        endTime,
      );
      expect(result).toEqual([
        { ...userMock, id: 'employee1', name: 'Employee 1' },
      ]);
    });
    it('should return an empty array if no employees are available', async () => {
      const businessId = '123';
      const startTime = new Date('2025-01-01T10:00:00Z');
      const endTime = new Date('2025-01-01T11:00:00Z');
      prisma.booking.findMany.mockResolvedValue([
        { ...mockBooking, employeeId: 'employee1' },
      ]);
      prisma.user.findMany.mockResolvedValue([
        { ...userMock, id: 'employee1', name: 'Employee 1' } as any,
      ]);
      const result = await service.findAvailableEmployee(
        businessId,
        startTime,
        endTime,
      );
      expect(result).toEqual([]);
    });
    it('should return an empty array if no employees are found for the business', async () => {
      const businessId = '123';
      const startTime = new Date('2025-01-01T10:00:00Z');
      const endTime = new Date('2025-01-01T11:00:00Z');
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue([]);
      const result = await service.findAvailableEmployee(
        businessId,
        startTime,
        endTime,
      );
      expect(result).toEqual([]);
    });
    it('should return only available employees when some are booked', async () => {
      const businessId = '123';
      const startTime = new Date('2025-01-01T10:00:00Z');
      const endTime = new Date('2025-01-01T11:00:00Z');
      prisma.booking.findMany.mockResolvedValue([
        { ...mockBooking, employeeId: 'employee1' },
      ]);
      prisma.user.findMany.mockResolvedValue([
        { ...userMock, id: 'employee1', name: 'Employee 1' },
        { ...userMock, id: 'employee2', name: 'Employee 2' },
      ]);
      const result = await service.findAvailableEmployee(
        businessId,
        startTime,
        endTime,
      );
      expect(result).toEqual([
        { ...userMock, id: 'employee2', name: 'Employee 2' },
      ]);
    });
  });
  describe('create', () => {
    // Fecha futura (en 7 días, 10:00 UTC = 11:00 o 12:00 en Madrid)
    const future = new Date(Date.now() + 7 * 24 * 3600e3);
    future.setUTCHours(10, 0, 0, 0);
    const data = {
      serviceId: 'service1',
      businessId: 'b1',
      date: future.toISOString(),
      employeeId: 'employee1',
      finalPrice: 1, // debe ignorarse
      timezone: 'Pacific/Kiritimati', // debe ignorarse
    };
    const client = { userId: 'client1', role: 'CLIENT' };
    const admin = { userId: 'admin1', role: 'ADMIN' };

    // Camino feliz: cada test sobrescribe solo lo que necesita
    const happyPath = () => {
      // La transacción ejecuta el callback con el mismo cliente mockeado
      prisma.$transaction.mockImplementation((cb: any) => cb(prisma));
      prisma.$executeRaw.mockResolvedValue(1 as any);
      prisma.business.findUnique.mockResolvedValue({
        id: 'b1',
        ownerId: 'admin1',
        timezone: 'Europe/Madrid',
      } as any);
      prisma.service.findUnique.mockResolvedValue({
        id: 'service1',
        businessId: 'b1',
        durationMin: 60,
        price: new Prisma.Decimal(2500),
        active: true,
      } as any);
      prisma.schedule.findFirst.mockResolvedValue({
        from: '09:00',
        to: '18:00',
      } as any);
      prisma.user.findFirst.mockResolvedValue({
        ...userMock,
        businessId: 'b1',
      } as any);
      prisma.booking.findFirst.mockResolvedValue(null);
      prisma.booking.create.mockResolvedValue(mockBooking);
    };

    it('rejects a missing business', async () => {
      happyPath();
      prisma.business.findUnique.mockResolvedValue(null);
      await expect(service.create(data, client)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects a service that does not exist', async () => {
      happyPath();
      prisma.service.findUnique.mockResolvedValue(null);
      await expect(service.create(data, client)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an inactive (soft-deleted) service', async () => {
      happyPath();
      prisma.service.findUnique.mockResolvedValue({
        id: 'service1',
        businessId: 'b1',
        durationMin: 60,
        price: 1,
        active: false,
      } as any);
      await expect(service.create(data, client)).rejects.toThrow(
        'Service not found',
      );
    });

    it('rejects a service from another business', async () => {
      happyPath();
      prisma.service.findUnique.mockResolvedValue({
        businessId: 'other',
        durationMin: 60,
        price: 1,
        active: true,
      } as any);
      await expect(service.create(data, client)).rejects.toThrow(
        'Service does not belong to this business',
      );
    });

    it.each([0, -30, null])(
      'rejects an invalid service duration (%p)',
      async (durationMin) => {
        happyPath();
        prisma.service.findUnique.mockResolvedValue({
          businessId: 'b1',
          durationMin,
          price: 1,
          active: true,
        } as any);
        await expect(service.create(data, client)).rejects.toThrow(
          BadRequestException,
        );
      },
    );

    it('rejects an invalid date', async () => {
      happyPath();
      await expect(
        service.create({ ...data, date: 'invalid-date' }, client),
      ).rejects.toThrow('Invalid date format');
    });

    it('rejects a date in the past', async () => {
      happyPath();
      await expect(
        service.create({ ...data, date: '2020-01-01T10:00:00Z' }, client),
      ).rejects.toThrow('Cannot book a date in the past');
    });

    it('rejects a time outside opening hours', async () => {
      happyPath();
      prisma.schedule.findFirst.mockResolvedValue(null);
      await expect(service.create(data, client)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects when the service would end after closing time', async () => {
      happyPath();
      prisma.schedule.findFirst.mockResolvedValue({
        from: '09:00',
        to: '10:30',
      } as any);
      await expect(service.create(data, client)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects when no employee is available', async () => {
      happyPath();
      prisma.user.findMany.mockResolvedValue([]);
      await expect(
        service.create({ ...data, employeeId: undefined }, client),
      ).rejects.toThrow('No available employees');
    });

    it('rejects an employee that is not in the business', async () => {
      happyPath();
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.create(data, client)).rejects.toThrow(
        'Employee not found in this business',
      );
    });

    it('rejects when the employee is already booked', async () => {
      happyPath();
      prisma.booking.findFirst.mockResolvedValue(mockBooking);
      await expect(service.create(data, client)).rejects.toThrow(
        'not available',
      );
    });

    it('forbids an admin from booking in a business they do not own', async () => {
      happyPath();
      prisma.business.findUnique.mockResolvedValue({
        id: 'b1',
        ownerId: 'someone-else',
        timezone: 'Europe/Madrid',
      } as any);
      await expect(service.create(data, admin)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('forbids an employee from booking in another business', async () => {
      happyPath();
      prisma.user.findUnique.mockResolvedValue({ businessId: 'other' } as any);
      await expect(
        service.create(data, { userId: 'emp1', role: 'EMPLOYEE' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('uses the server-side price, the business timezone and the authenticated client', async () => {
      happyPath();
      const result = await service.create(
        { ...data, userId: 'someone-else' },
        client,
      );
      expect(result).toEqual(mockBooking);
      expect(prisma.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'client1', // no el userId del body
            finalPrice: new Prisma.Decimal(2500), // no el finalPrice del body
            timezone: 'Europe/Madrid', // no la timezone del body
          }),
        }),
      );
    });

    it('takes a per-business advisory lock inside the transaction (no double booking)', async () => {
      happyPath();
      await service.create(data, client);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.$executeRaw).toHaveBeenCalled();
    });

    it('lets an admin book a walk-in (no client) in their own business', async () => {
      happyPath();
      await service.create(data, admin);
      expect(prisma.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: null }),
        }),
      );
    });
  });
});
