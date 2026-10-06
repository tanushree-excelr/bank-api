import { Module } from '@nestjs/common';
import { SheetController } from './sheet.controller.js';
import { SheetService } from './sheet.service.js';

@Module({
  controllers: [SheetController],
  providers: [SheetService],
})
export class SheetModule {}
