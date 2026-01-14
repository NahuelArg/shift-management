import { Test, TestingModule } from '@nestjs/testing';
import { CashRegisterController } from './cash-register.controller';

describe('CashRegisterController', () => {
  let controller: CashRegisterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CashRegisterController],
    }).compile();

    controller = module.get<CashRegisterController>(CashRegisterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
