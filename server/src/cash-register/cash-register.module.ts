import { Module } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import { CashRegisterController } from './cash-register.controller';

@Module({
  providers: [CashRegisterService],
  controllers: [CashRegisterController],
})
export class CashRegisterModule {}
