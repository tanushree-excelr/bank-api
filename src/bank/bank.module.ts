import { Module } from '@nestjs/common';
import { BankController } from './bank.controller.js';
import { BankService } from './bank.service.js';

@Module({
  controllers: [BankController],
  providers: [BankService],
  exports: [BankService],
})
export class BankModule {}
