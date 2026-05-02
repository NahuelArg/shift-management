import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminService } from './admin.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AuthProvider, Role, } from '@prisma/client';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: DeepMockProxy<PrismaService>;
  let module: TestingModule;
  const adminDto = {
    id: '1',
    email: 'admin@example.com',
    password: 'password123',
    name: 'Admin User',
    authProvider: "LOCAL" as AuthProvider,
    role: Role.ADMIN,
  };
  const mockFromPrisma = [{
    id: 'emp-1',
    name: 'Employee 1',
    business: {
      id: 'biz-1',
      name: 'Business 1',
    }
  }]
  const employeeDto = {
    id: '2',
    email: 'employee@example.com',
    password: 'password123',
    name: 'Employee Name',
    authProvider: "LOCAL" as AuthProvider,
    role: Role.EMPLOYEE,
    businessId: 'biz-1',
  };
  const mappedMock = [{
    businessName: 'Business 1',
    name: 'Employee 1',
    business: {
      id: 'biz-1',
      name: 'Business 1',
    },
    id: 'emp-1',
  }];
  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [AdminService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        }
      ],
    }).compile();
    prisma = module.get<DeepMockProxy<PrismaService>>(PrismaService);
    service = module.get<AdminService>(AdminService);
  });
  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('createAdmin', () => {
    it('should create a new admin', async () => {

      await service.createAdmin(adminDto);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: adminDto.email,
          password: expect.any(String),
          name: adminDto.name,
          role: adminDto.role,
          authProvider: adminDto.authProvider,
        },
      });

    })
    it('should throw BadRequestException if role is not ADMIN', async () => {
      await expect(service.createAdmin({ ...adminDto, role: Role.CLIENT } as any)).rejects.toThrow(BadRequestException);
    })
    it('should throw ConflictException if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1' } as any);
      await expect(service.createAdmin(adminDto)).rejects.toThrow(ConflictException);
    })
    it('should throw BadRequestException if authProvider is Local but password is not provided', async () => {
      await expect(service.createAdmin({ ...adminDto, password: undefined, authProvider: AuthProvider.LOCAL } as any)).rejects.toThrow(BadRequestException);
    })
  });
  describe('updateAdmin', () => {
    it('should update admin details', async () => {
      await service.updateAdmin('1', { name: 'Updated Name' });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Updated Name' },
      });
    });
  });
  describe('getEmployeesByBusiness', () => {
    it('should throw forbidden exception if business is not from admin', async () => {
      prisma.business.findFirst.mockResolvedValue(null);
      await expect(service.getEmployeesByBusiness('businessId', 'userId')).rejects.toThrow(ForbiddenException);
    });
    it('should return all employees of a business', async () => {
      const userId = 'user-123';
      const businessId = 'biz-456';
      const mockEmployees = [{ id: 'emp-1' }, { id: 'emp-2' }];
      prisma.business.findFirst.mockResolvedValue({ id: businessId, ownerId: userId } as any);
      prisma.user.findMany.mockResolvedValue(mockEmployees as any);
      const result = await service.getEmployeesByBusiness(businessId, userId);
      expect(result).toEqual(mockEmployees);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
  describe('getDashboard', () => {
    it('get business  data for the admin', async () => {
      const userId = 'user-123';
      const mockBusinesses = [{ id: 'biz-1' }, { id: 'biz-2' }];
      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        businesses: mockBusinesses
      } as any);
      prisma.user.count.mockResolvedValue(0);
      prisma.schedule.count.mockResolvedValue(0);
      prisma.booking.count.mockResolvedValue(1);
      prisma.service.count.mockResolvedValue(0);
      const result = await service.getDashboard(userId);
      expect(result).toEqual({
        totalBusiness: 2,
        totalBookings: 1,
        totalSchedules: 0,
        totalServices: 0,
        totalUser: 0,
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { businesses: true },
      });
    });
    it('should throw NotFounException if user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getDashboard('userId')).rejects.toThrow(NotFoundException);
    });
    it('count and return only data related to that business ', async () => {
      const userId = 'user-123';
      const businessIds = ['biz-1', 'biz-2'];
      const mockBusinesses = [{ id: 'biz-1' }, { id: 'biz-2' }];
      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        businesses: mockBusinesses
      } as any);

      prisma.user.count.mockResolvedValue(10);
      prisma.schedule.count.mockResolvedValue(5);
      prisma.service.count.mockResolvedValue(3);
      prisma.booking.count.mockResolvedValue(8);
      const result = await service.getDashboard(userId);

      expect(result).toEqual({
        totalBusiness: 2,
        totalBookings: 8,
        totalSchedules: 5,
        totalServices: 3,
        totalUser: 10,
      });
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: {
          businesses: {
            some: {
              id: { in: businessIds }
            }
          }
        },
      });
    });
  });
  describe('getAllMetrics', () => {
    const metricsArgs = {
      businessId: 'businessId',
      userId: 'userId',
      from: '2023-01-01',
      to: '2023-01-31',
      groupBy: 'day',
    };
    const userId = 'user-123';
    const businessId = 'biz-456';
    it('should throw BadRequestException if missing required parameters', async () => {
      await expect(service.getAllMetrics(
        null as any,
        null as any,
        null as any,
        null as any,
        null as any))
        .rejects.toThrow(BadRequestException);
    });
    it('should throw BadRequestException if date format is Invalid', async () => {
      await expect(service.getAllMetrics(
        metricsArgs.businessId,
        metricsArgs.userId,
        'invalid-date',
        'invalid-date',
        metricsArgs.groupBy))
        .rejects.toThrow(BadRequestException);
    });
    it('should throw ForbiddenException if business is not from admin', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getAllMetrics(
        metricsArgs.businessId,
        metricsArgs.userId,
        metricsArgs.from,
        metricsArgs.to,
        metricsArgs.groupBy))
        .rejects.toThrow(ForbiddenException);
    });
    it('should throw BadRequestException if groupBy value is invalid', async () => {
      await expect(service.getAllMetrics(
        metricsArgs.businessId,
        metricsArgs.userId,
        metricsArgs.from,
        metricsArgs.to,
        'invalid-groupBy'))
        .rejects.toThrow(BadRequestException);
    });
    it('should throw ForbiddenException if isOwner is false', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: metricsArgs.userId,
        businesses: [{ id: 'other-business-id' }]
      } as any);
      await expect(service.getAllMetrics(
        metricsArgs.businessId,
        metricsArgs.userId,
        metricsArgs.from,
        metricsArgs.to,
        metricsArgs.groupBy))
        .rejects.toThrow(ForbiddenException);
    });
    it('should return metrics data', async () => {

      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        businesses: [{ id: businessId }]
      } as any);

      prisma.booking.findMany.mockResolvedValue([
        {
          date: new Date('2023-01-01T10:00:00Z'),
          finalPrice: 100,
          status: 'COMPLETED',
          timezone: 'UTC',
          service: { name: 'Service 1' }
        },
        {
          date: new Date('2023-02-02T10:00:00Z'),
          finalPrice: 150,
          status: 'COMPLETED',
          timezone: 'UTC',
          service: { name: 'Service 2' }
        },
      ] as any);
      prisma.booking.count.mockResolvedValue(5);
      prisma.booking.aggregate.mockResolvedValue({ _sum: { finalPrice: 250 } } as any);

      const result = await service.getAllMetrics(businessId, userId, '2023-01-01', '2023-01-31', 'day');
      expect(result).toEqual(expect.objectContaining({
        totalBookings: 5,
        totalRevenue: 250,
        groupFormat: 'YYYY-MM-DD',
        bookingByService: expect.arrayContaining([
          expect.objectContaining({
            serviceName: 'Service 1',
            date: '2023-01-01T10:00:00.000Z',
            finalPrice: 100,
            status: 'COMPLETED',
            timezone: 'UTC',
          },
          
        ),
        ]),
      }));
    })
    it('should return grouped metrics data by month', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        businesses: [{ id: businessId }]
      } as any);
      prisma.booking.findMany.mockResolvedValue([
        {
          date: new Date('2023-01-01T10:00:00Z'),
          finalPrice: 100,
          status: 'COMPLETED',
          timezone: 'UTC',
          service: { name: 'Service 1' }
        },
        {
          date: new Date('2023-02-02T10:00:00Z'),
          finalPrice: 150,
          status: 'COMPLETED',
          timezone: 'UTC',
          service: { name: 'Service 2' }
        },
      ] as any);
      prisma.booking.count.mockResolvedValue(5);
      prisma.booking.aggregate.mockResolvedValue({ _sum: { finalPrice: 250 } } as any);

      const result = await service.getAllMetrics(businessId, userId, '2023-01-01', '2023-12-31', 'month');
      expect(result.groupFormat).toBe('YYYY-MM');
    });
    it('should return grouped metrics data by year', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        businesses: [{ id: businessId }]
      } as any);
      prisma.booking.findMany.mockResolvedValue([
        {
          date: new Date('2023-01-01T10:00:00Z'),
          finalPrice: 100,
          status: 'COMPLETED',
          timezone: 'UTC',
          service: { name: 'Service 1' }
        },
        {
          date: new Date('2023-02-02T10:00:00Z'),
          finalPrice: 150,
          status: 'COMPLETED',
          timezone: 'UTC',
          service: { name: 'Service 2' }
        },
      ] as any);
      prisma.booking.count.mockResolvedValue(5);
      prisma.booking.aggregate.mockResolvedValue({ _sum: { finalPrice: 250 } } as any);

      const result = await service.getAllMetrics(businessId, userId, '2023-01-01', '2023-12-31', 'year');
      expect(result.groupFormat).toBe('YYYY');
    });

  });
  describe('getAdminById', () => {
    it('should return BadRequestException if user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getAdminById(null as any)).rejects.toThrow(BadRequestException);
    });
    it('should return admin by id', async () => {
      const mockAdmin = adminDto;
      prisma.user.findUnique.mockResolvedValue(mockAdmin as any);
      const result = await service.getAdminById(adminDto.id);
      expect(result).toEqual(mockAdmin);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: adminDto.id },
        include: { businesses: true },
      });
    });
    it('should throw NotFoundException if user do not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getAdminById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
  describe('getAllEmployees', () => {
    it('should throw ForbiddenException if business is not from admin', async () => {
      prisma.business.findUnique.mockResolvedValue(null);
      await expect(service.getAllEmployees(adminDto.id, { page: 1, limit: 10, businessId: 'other-business-id' })).rejects.toThrow(ForbiddenException);
    });
    it('should return all employees of a business with pagination', async () => {
      prisma.business.findUnique.mockResolvedValue({ ownerId: adminDto.id } as any);
      prisma.user.findMany.mockResolvedValue(mockFromPrisma as any);
      prisma.user.count.mockResolvedValue(2);
      const result = await service.getAllEmployees(adminDto.id, { page: 1, limit: 10, businessId: mockFromPrisma[0].business.id });
      expect(result).toEqual({ employees: mappedMock, total: 2 });
    });
    it('should return all employees with all businness if businessId is not provided', async () => {
      prisma.business.findMany.mockResolvedValue([{ ownerId: adminDto.id, id: 'biz-1' }, { ownerId: adminDto.id, id: 'biz-2' }] as any);
      prisma.user.findMany.mockResolvedValue(mockFromPrisma as any);
      prisma.user.count.mockResolvedValue(2);
      const result = await service.getAllEmployees(adminDto.id, { page: 1, limit: 10 });
      expect(result).toEqual({ employees: mappedMock, total: 2 });
    });
    it('should return employees with search filter applied', async () => {
      const search = 'Employee 1';
      prisma.business.findUnique.mockResolvedValue({ ownerId: adminDto.id } as any);
      prisma.user.findMany.mockResolvedValue(mockFromPrisma as any);
      prisma.user.count.mockResolvedValue(1);
      const result = await service.getAllEmployees(adminDto.id, { page: 1, limit: 10, businessId: 'biz-1', search });
      expect(result).toEqual({ employees: mappedMock, total: 1 });
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          role: 'EMPLOYEE',
          businessId: { in: ['biz-1'] },
          ...(search
            ? {
              OR: [
                { name: { contains: search, } },
                { email: { contains: search, } },
              ],
            }
            : {}
          ),
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          business: {
            select: {
              name: true,
            },
          },
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },

      });
    });
  });
  describe('deleteEmployee', () => {
    const adminId = adminDto.id;
    it('should throw BadRequestException if employeeId is not provided', async () => {
      await expect(service.deleteEmployee(null as any, adminDto.id)).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if employee does not belong to a business of the admin', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.deleteEmployee(employeeDto.id, adminId)).rejects.toThrow(ForbiddenException);
    });
    it('should delete employee if it belongs to a business of the admin', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: employeeDto.id, role: 'EMPLOYEE', business: { ownerId: adminId } } as any);
      await service.deleteEmployee(employeeDto.id, adminId);
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: employeeDto.id } });
    }
    );
  });
  describe('createEmployee', () => {
    const adminId = adminDto.id;
    it('should throw ForbiddenException if admin does not own the business', async () => {
      prisma.business.findFirst.mockResolvedValue(null);
      await expect(service.createEmployee(employeeDto, adminId)).rejects.toThrow(ForbiddenException);
    });
    it('should throw ConflictException if email already exists', async () => {
      prisma.business.findFirst.mockResolvedValue({ id: employeeDto.businessId, ownerId: adminId } as any);
      prisma.user.findUnique.mockResolvedValue({ id: employeeDto.id } as any);
      await expect(service.createEmployee(employeeDto, adminId)).rejects.toThrow(ConflictException);
    });
    it('should throw BadRequestException if password is not provided', async () => {
      prisma.business.findFirst.mockResolvedValue({ id: employeeDto.businessId, ownerId: adminId } as any);
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.createEmployee({ ...employeeDto, password: undefined as any }, adminId)).rejects.toThrow(BadRequestException);
    });
    it('should return created employee', async () => {
      const mockCreatedEmployee = { ...employeeDto, id: 'emp-2' };
      prisma.business.findFirst.mockResolvedValue({ id: employeeDto.businessId, ownerId: adminId } as any);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockCreatedEmployee as any);
      const result = await service.createEmployee(employeeDto, adminId);
      expect(result).toEqual(mockCreatedEmployee);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: employeeDto.email,
          password: expect.any(String),
          name: employeeDto.name,
          role: employeeDto.role,
          authProvider: employeeDto.authProvider,
          businessId: employeeDto.businessId,
        },
      });
    });

  });
  describe('updateEmployee', () => {
    it('should throw ForbiddenException if employee does not belong to a business of the admin', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.updateEmployee(employeeDto, adminDto.id, employeeDto.id)).rejects.toThrow(ForbiddenException);
    });
    it('should throw ConflictException if email already exists', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({
        id: employeeDto.id,
        role: 'EMPLOYEE',
        business: {
          ownerId: adminDto.id
        }
      } as any);
      prisma.user.findFirst.mockResolvedValueOnce({ id: employeeDto.id } as any);

      await expect(service.updateEmployee(employeeDto, adminDto.id, employeeDto.id)).rejects.toThrow(ConflictException);
    });
    it('should update and return employee', async () => {
      const mockUpdatedEmployee = { ...employeeDto, name: 'Updated Name' };
      prisma.user.findFirst.mockResolvedValueOnce({
        id: employeeDto.id,
        role: 'EMPLOYEE',
        business: {
          ownerId: adminDto.id
        }
      } as any);
      prisma.user.findFirst.mockResolvedValueOnce(null as any);
      prisma.user.update.mockResolvedValue(mockUpdatedEmployee as any);
      const result = await service.updateEmployee({ name: 'Updated Name' }, adminDto.id, employeeDto.id);
      expect(result).toEqual(mockUpdatedEmployee);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: employeeDto.id },
        data: { name: 'Updated Name' },
      });
    });
  });
});
