import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { SheetService } from './sheet.service.js';

@ApiTags('Sheet')
@Controller('sheet')
export class SheetController {
  constructor(private readonly sheetService: SheetService) {}

  @Post('validate')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async validateSheet(
    @UploadedFile() file: any,
    @Res() res: Response,
  ) {
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is required',
      });
    }

    const excelBuffer =
      await this.sheetService.validateSheet(file);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename="bank-validation-result.xlsx"',
    });

    return res.send(excelBuffer);
  }
}

