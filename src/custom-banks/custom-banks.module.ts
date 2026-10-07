import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomBank, CustomBankSchema } from './custom-bank.schema.js';
import { CustomBanksService } from './custom-banks.service.js';
import { CustomBanksController } from './custom-banks.controller.js';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CustomBank.name,
        schema: CustomBankSchema,
      },
    ]),
  ],
  controllers: [CustomBanksController],
  providers: [CustomBanksService],
  exports: [CustomBanksService],
})
export class CustomBanksModule {}
