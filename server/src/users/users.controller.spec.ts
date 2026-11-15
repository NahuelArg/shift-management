import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * El service se reemplaza por un mock: el controller solo debe validar el
 * request y delegar con el usuario autenticado (las reglas viven en el service).
 */
describe('UsersController', () => {
  let controller: UsersController;
  const service = { findAll: jest.fn(), searchByEmail: jest.fn() };
  const req = {
    user: { userId: 'user-1', email: 'u@test.com', role: 'EMPLOYEE' },
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();
    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('searches clients scoped to the authenticated user and role', async () => {
    await controller.searchUsers('ana', req);
    expect(service.searchByEmail).toHaveBeenCalledWith('ana', {
      userId: 'user-1',
      role: 'EMPLOYEE',
    });
  });
});
