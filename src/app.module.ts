import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { BankModule } from './bank/bank.module.js';
import { SheetModule } from './sheet/sheet.module.js';
import { CustomBanksModule } from './custom-banks/custom-banks.module.js';
@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bank-validation'),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BankModule,
     SheetModule,
     CustomBanksModule,
  ],
})
export class AppModule {}
