import { Test, TestingModule } from '@nestjs/testing';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

/**
 * El service se reemplaza por un mock: el controller solo debe validar el
 * request y delegar con el usuario autenticado (las reglas viven en el service).
 */
describe('ServicesController', () => {
  let controller: ServicesController;
  const service = { findAll: jest.fn(), getServicesByEmployee: jest.fn() };
  const req = {
    user: { userId: 'user-1', email: 'u@test.com', role: 'ADMIN' },
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [{ provide: ServicesService, useValue: service }],
    }).compile();
    controller = module.get<ServicesController>(ServicesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('lists services of the authenticated admin businesses', async () => {
    await controller.findAll(req);
    expect(service.findAll).toHaveBeenCalledWith('user-1');
  });
});
