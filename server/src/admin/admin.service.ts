import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UpdateAdminDto } from './DTO/updateAdmin.dto';
import { User, Role, AuthProvider } from '@prisma/client';
import MetricsResponse from './DTO/metricsDto.dto';
import { convertBigIntToString } from 'src/utils/convertBigIntToString';
import { CreateAdminDto } from './DTO/createAdminDto.dto';
import { CreateEmployeeDto } from './DTO/createEmployeeDto.dto';
import { UpdateEmployeeDto } from './DTO/updateEmployeeDto.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}
  private readonly logger = new Logger(AdminService.name);
  async createAdmin(dto: CreateAdminDto) {
    const { email, password, name, authProvider, role } = dto;

    if (role !== 'ADMIN') {
      throw new Error('Role must be ADMIN');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Validación condicional de password
    let hashedPassword: string | null = null;

    if (authProvider === 'LOCAL') {
      if (!password || password.trim().length === 0) {
        throw new BadRequestException(
          'Password is required for local authentication',
        );
      }

      hashedPassword = await bcrypt.hash(password, 10);
    }
    
    // Crear admin SIN business asignado
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        authProvider: authProvider || AuthProvider.LOCAL,
        role,
        // NO businessId aquí - el admin lo crea después
      },
    });

    return user;
  }
  async updateAdmin(id: string, updateAdminDto: UpdateAdminDto): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: updateAdminDto,
    });
  }
  async getEmployeesByBusiness(businessId: string, userId: string) {
  // Verificar que el business pertenece al admin (ownerId)
  const business = await this.prisma.business.findFirst({
    where: { 
      id: businessId, 
      ownerId: userId  // Aquí verificamos que es propietario
    },
  });

  if (!business) {
    throw new ForbiddenException(
      'You do not have permission to access this business employees.',
    );
  }

  // Obtener todos los employees del business
  return this.prisma.user.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
  });
}
  async getDashboard(userId: string) {
    // 1. Obtener los negocios del admin
    const userWithBusinesses = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { businesses: true },
    });
    if (!userWithBusinesses) throw new Error('User not found');

    const businessIds = userWithBusinesses.businesses.map((b) => b.id);

    // 2. Contar solo los datos relacionados a esos negocios
    const totalUser = await this.prisma.user.count({
      where: {
        businesses: {
          some: { id: { in: businessIds } },
        },
      },
    });
    const totalSchedules = await this.prisma.schedule.count({
      where: { businessId: { in: businessIds } },
    });
    const totalBookings = await this.prisma.booking.count({
      where: { businessId: { in: businessIds } },
    });
    const totalServices = await this.prisma.service.count({
      where: { businessId: { in: businessIds } },
    });
    const totalBusiness = businessIds.length;

    return {
      totalUser,
      totalSchedules,
      totalBookings,
      totalServices,
      totalBusiness,
    };
  }
  /**
   * Returns aggregated metrics for the admin dashboard.
   * @param businessId Business ID to filter metrics.
   * @param userId ID of the requesting user.
   * @param from Start date (YYYY-MM-DD).
   * @param to End date (YYYY-MM-DD).
   * @param groupBy Grouping period: 'day', 'month', or 'year'.
   */

  async getAllMetrics(
    businessId: string,
    userId: string,
    from: string,
    to: string,
    groupBy: string,
  ): Promise<MetricsResponse> {
    if (!businessId || !userId || !from || !to || !groupBy) {
      throw new BadRequestException(
        'Missing required parameters: businessId, userId, from, to, groupBy',
      );
    }
    const startDate = new Date(from);
    const endDate = new Date(to);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException(
        'Invalid date format. Use ISO 8601 format (YYYY-MM-DD).',
      );
    }
    const validGroupByValues = ['day', 'month', 'year'];
    const groupByLowerCase = groupBy.trim().toLowerCase();
    if (!validGroupByValues.includes(groupByLowerCase)) {
      throw new BadRequestException(
        'Invalid groupBy value. Use "day", "month", or "year".',
      );
    }

    const UserWithBusiness = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        businesses: true,
      },
    });
    this.logger.debug(`User with Business: ${JSON.stringify(UserWithBusiness)}`);
    if (!UserWithBusiness) {
      throw new ForbiddenException(
        'Business not found or you do not have access to it.',
      );
    }
    const isOwner = UserWithBusiness.businesses.some(
      (business) => business.id === businessId,
    );
    if (!isOwner) {
      throw new ForbiddenException(
        'You do not have permission to access this business metrics.',
      );
    }

    if (!validGroupByValues.includes(groupBy.trim().toLowerCase())) {
      throw new ForbiddenException(
        'Invalid groupBy value. Use "day", "month", or "year".',
      );
    }
    const allBookings = await this.prisma.booking.findMany({
      where: {
        businessId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        date: true,
        finalPrice: true,
        status: true,
      },
      orderBy: { date: 'asc' },
    });
    const bookingsByGroup = this.groupBookingsByPeriod(
      allBookings,
      groupByLowerCase as 'day' | 'month' | 'year',
    );

    //Bookings by service
    const bookingByService = await this.prisma.booking.findMany({
      where: {
        businessId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        service: true,
      },
    });

    // Total bookings and revenue
    const totalBookings = await this.prisma.booking.count({
      where: {
        businessId,
        date: { gte: startDate, lte: endDate },
      },
    });
    const totalRevenue = await this.prisma.booking.aggregate({
      _sum: { finalPrice: true },
      where: {
        businessId,
        status: 'CONFIRMED',
        date: { gte: startDate, lte: endDate },
      },
    });
    const result = {
      totalBookings,
      totalRevenue: totalRevenue._sum.finalPrice || 0,
      bookingsByGroup,
      bookingByService: bookingByService.map((booking) => ({
        serviceName: booking.service.name,
        date: booking.date.toISOString(),
        finalPrice: booking.finalPrice,
        status: booking.status,
      })),
      groupFormat:
        groupByLowerCase === 'day'
          ? 'YYYY-MM-DD'
          : groupByLowerCase === 'month'
            ? 'YYYY-MM'
            : 'YYYY',
    };
        return convertBigIntToString(result);
  }
  async getAdminById(userId: string) {
    if (!userId) throw new Error('User ID is required');

    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        businesses: true,
      }
    }
  );
  
  }
  async getAllEmployees(
    userId: string,
    params: {
      search?: string;
      page: number;
      limit: number;
      businessId?: string;
    },
  ) {
    const { search, businessId } = params;
    let businessIds: string[] = [];
    if (businessId) {
      const business = await this.prisma.business.findUnique({
        where: { id: businessId, ownerId: userId },
      });
      if (!business) throw new ForbiddenException('Unauthorized');
      businessIds = [businessId];
    } else {
      const businesses = await this.prisma.business.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });
      businessIds = businesses.map((b) => b.id);
    }

    const where: any = {
      role: 'EMPLOYEE',
      businessId: { in: businessIds },
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
    };
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const [employees, total] = await Promise.all([
      this.prisma.user.findMany({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          business: { select: { name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this.prisma.user.count({ where }),
    ]);
    // Mapear el nombre del negocio para el frontend
    const mapped = employees.map((e) => ({
      ...e,
      businessName: e.business?.name || '-',
    }));
    return { employees: mapped, total };
  }
  async deleteEmployee(employeeId: string, adminId: string) {
    if (!employeeId) throw new Error('Employee ID is required');

    // Verificar que el empleado pertenece a un negocio del admin
    const employee = await this.prisma.user.findFirst({
      where: {
        id: employeeId,
        role: 'EMPLOYEE',
        business: {
          ownerId: adminId
        }
      },
    });

    if (!employee) {
      throw new Error('No puedes eliminar este empleado');
    }

    return this.prisma.user.delete({
      where: { id: employeeId },
    });
  }
  async createEmployee(dto: CreateEmployeeDto, adminId: string) {
    const { name, email, password, businessId } = dto;
    // Validar que el negocio pertenece al admin
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, ownerId: adminId },
    });
    if (!business) throw new Error('No puedes crear empleados en este negocio');

    // Validar que el email no exista
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new Error('El email ya está registrado');
    }
    if (!password || password.trim().length === 0) {
      throw new BadRequestException(
        'Password is required to create an employee',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: {
        name,
        email,

        password: hashedPassword,
        role: Role.EMPLOYEE,
        authProvider: AuthProvider.LOCAL,
        businessId: businessId,
      },
    });
  }
  /**
   * Agrupa bookings por período (día, mes o año)
   * @param bookings Lista de bookings
   * @param groupBy Período de agrupación: 'day', 'month', 'year'
   * @returns Array de objetos con período, totalBookings y totalRevenue
   */
  private groupBookingsByPeriod(
    bookings: { date: Date; status: string; finalPrice: number }[],
    groupBy: 'day' | 'month' | 'year',
  ): { period: string; totalBookings: number; totalRevenue: number }[] {
    // Crear un mapa para agrupar
    const groupMap = new Map<string, { count: number; revenue: number }>();

    for (const booking of bookings) {
      // Formatear la fecha según el groupBy
      let period: string;
      const date = new Date(booking.date);

      if (groupBy === 'day') {
        // Formato: YYYY-MM-DD
        period = date.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        // Formato: YYYY-MM
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        period = `${year}-${month}`;
      } else {
        // Formato: YYYY
        period = String(date.getFullYear());
      }

      // Obtener o inicializar el grupo
      const group = groupMap.get(period) || { count: 0, revenue: 0 };

      // Incrementar contador
      group.count++;

      // Sumar revenue solo si está confirmado
      if (booking.status === 'CONFIRMED') {
        group.revenue += booking.finalPrice;
      }

      groupMap.set(period, group);
    }

    // Convertir el mapa a array y ordenar por período
    return Array.from(groupMap.entries())
      .map(([period, data]) => ({
        period,
        totalBookings: data.count,
        totalRevenue: data.revenue,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }
  async updateEmployee(
    dto: UpdateEmployeeDto,
    adminId: string,
    employeeId: string,
  ) {
    // Verificar que el empleado existe y pertenece a un negocio del admin
    const employee = await this.prisma.user.findFirst({
      where: {
        id: employeeId,
        role: 'EMPLOYEE',
        business: {
          ownerId: adminId
        }
      },
    });

    if (!employee) {
      throw new Error('No puedes actualizar este empleado');
    }

    // Validar que el email no exista en otro usuario (solo si se está actualizando)
    if (dto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id: employeeId } },
      });
      if (existingUser) {
        throw new Error('El email ya está registrado');
      }
    }

    const updateData: any = {};

    if (dto.name) updateData.name = dto.name;
    if (dto.email) updateData.email = dto.email;
    if (dto.password && dto.password.trim().length > 0) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id: employeeId },
      data: updateData,
    });
  }
}