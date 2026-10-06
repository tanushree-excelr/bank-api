import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { BankService } from './bank.service.js';

@ApiTags('Bank')
@Controller('bank')
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Post('validate')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        bankName: {
          type: 'string',
          example: 'HDFC BANK',
        },
        ifsc: {
          type: 'string',
          example: 'HDFC0001234',
        },
      },
      required: ['bankName', 'ifsc'],
    },
  })
  async validate(
    @Body()
    body: {
      bankName: string;
      ifsc: string;
    },
  ) {
    return this.bankService.validateBank(
      body.bankName,
      body.ifsc,
    );
  }
}