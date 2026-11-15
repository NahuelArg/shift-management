import { Test, TestingModule } from '@nestjs/testing';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';

/**
 * El service se reemplaza por un mock: el controller solo debe validar el
 * request y delegar con el usuario autenticado (las reglas viven en el service).
 */
describe('BusinessController', () => {
  let controller: BusinessController;
  const service = {
    getBusinessesByUserId: jest.fn(),
    getAllBusinessesPublic: jest.fn(),
  };
  const req = {
    user: { userId: 'user-1', email: 'u@test.com', role: 'ADMIN' },
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessController],
      providers: [{ provide: BusinessService, useValue: service }],
    }).compile();
    controller = module.get<BusinessController>(BusinessController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('lists only the businesses of the authenticated admin', async () => {
    await controller.findAll(req);
    expect(service.getBusinessesByUserId).toHaveBeenCalledWith('user-1');
  });
});
