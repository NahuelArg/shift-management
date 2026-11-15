import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ForbiddenException } from '@nestjs/common';
/**
 * El service se reemplaza por un mock: el controller solo debe validar el
 * request y delegar con el usuario autenticado (las reglas viven en el service).
 */
describe('AdminController', () => {
  let controller: AdminController;
  const service = {
    getAdminById: jest.fn(),
    updateAdmin: jest.fn(),
    getAllMetrics: jest.fn(),
  };
  const req = {
    user: { userId: 'user-1', email: 'u@test.com', role: 'ADMIN' },
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: service }],
    }).compile();
    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('uses the authenticated admin for /admin/me', async () => {
    service.getAdminById.mockResolvedValue({ id: 'user-1' });
    await controller.getAdminById(req);
    expect(service.getAdminById).toHaveBeenCalledWith('user-1');
  });

  it('forbids updating another user profile', async () => {
    await expect(
      controller.updateUser('someone-else', { name: 'x' }, req),
    ).rejects.toThrow(ForbiddenException);
    expect(service.updateAdmin).not.toHaveBeenCalled();
  });

  it('takes the userId for metrics from the token, not from the query', async () => {
    await controller.getAllMetrics(
      req,
      'biz-1',
      '2026-01-01',
      '2026-01-31',
      'day',
    );
    expect(service.getAllMetrics).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      '2026-01-01',
      '2026-01-31',
      'day',
    );
  });
});
