import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BankModule } from './bank/bank.module.js';
import { SheetModule } from './sheet/sheet.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BankModule,
     SheetModule,
  ],
})
export class AppModule {}