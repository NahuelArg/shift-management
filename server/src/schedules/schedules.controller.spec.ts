import { Test, TestingModule } from '@nestjs/testing';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';

/**
 * El service se reemplaza por un mock: el controller solo debe validar el
 * request y delegar con el usuario autenticado (las reglas viven en el service).
 */
describe('SchedulesController', () => {
  let controller: SchedulesController;
  const service = { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() };
  const req = {
    user: { userId: 'user-1', email: 'u@test.com', role: 'ADMIN' },
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchedulesController],
      providers: [{ provide: SchedulesService, useValue: service }],
    }).compile();
    controller = module.get<SchedulesController>(SchedulesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('creates schedules checking ownership with the authenticated admin', async () => {
    const dto = {
      dayOfWeek: 1,
      from: '09:00',
      to: '18:00',
      businessId: 'biz-1',
    };
    await controller.create(dto, req);
    expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('reads a schedule scoped to the authenticated admin', async () => {
    await controller.findOne('sch-1', req);
    expect(service.findOne).toHaveBeenCalledWith('sch-1', 'user-1');
  });
});
