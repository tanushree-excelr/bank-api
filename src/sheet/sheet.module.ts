import { Module } from '@nestjs/common';
import { SheetController } from './sheet.controller.js';
import { SheetService } from './sheet.service.js';
import { BankModule } from '../bank/bank.module.js';

@Module({
  imports: [BankModule],
  controllers: [SheetController],
  providers: [SheetService],
})
export class SheetModule {}
