import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingStatus } from '@prisma/client';
/**
 * El service se reemplaza por un mock: el controller solo debe validar el
 * request y delegar con el usuario autenticado (las reglas viven en el service).
 */
describe('BookingsController', () => {
  let controller: BookingsController;
  const service = {
    create: jest.fn(),
    changeStatus: jest.fn(),
    getBookingsByUser: jest.fn(),
    delete: jest.fn(),
  };
  const req = {
    user: { userId: 'user-1', email: 'u@test.com', role: 'CLIENT' },
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [{ provide: BookingsService, useValue: service }],
    }).compile();
    controller = module.get<BookingsController>(BookingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('creates bookings on behalf of the authenticated user', async () => {
    const dto = {
      serviceId: 's',
      businessId: 'b',
      date: '2030-01-01T10:00:00Z',
    };
    await controller.create(dto, req);
    expect(service.create).toHaveBeenCalledWith(dto, {
      userId: 'user-1',
      role: 'CLIENT',
    });
  });

  it('changes status with the actor taken from the token', async () => {
    await controller.updateBookingStatus(
      'bk-1',
      { status: BookingStatus.CANCELLED },
      req,
    );
    expect(service.changeStatus).toHaveBeenCalledWith(
      { userId: 'user-1', role: 'CLIENT' },
      'bk-1',
      BookingStatus.CANCELLED,
    );
  });

  it('lists only the bookings of the authenticated client', async () => {
    await controller.getMyBookings(req);
    expect(service.getBookingsByUser).toHaveBeenCalledWith('user-1');
  });
});
