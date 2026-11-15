import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * El service se reemplaza por un mock: el controller solo debe validar el
 * request y delegar con el usuario autenticado (las reglas viven en el service).
 */
describe('AuthController', () => {
  let controller: AuthController;
  const service = { login: jest.fn(), register: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();
    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates login to the service', async () => {
    service.login.mockResolvedValue({ accessToken: 't' });
    await expect(
      controller.login({ email: 'a@b.com', password: 'secret1' }),
    ).resolves.toEqual({ accessToken: 't' });
  });

  it('delegates register to the service', async () => {
    await controller.register({
      name: 'A',
      email: 'a@b.com',
      password: 'secret1',
    });
    expect(service.register).toHaveBeenCalledWith({
      name: 'A',
      email: 'a@b.com',
      password: 'secret1',
    });
  });
});
