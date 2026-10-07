import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomBanksService } from './custom-banks.service.js';

@ApiTags('Custom Banks')
@Controller('custom-banks')
export class CustomBanksController {
  constructor(
    private readonly customBanksService: CustomBanksService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add custom bank' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        bankName: { type: 'string', example: 'ABC BANK' },
        ifsc: { type: 'string', example: 'ABCD0001234' },
        branch: { type: 'string' },
        address: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        micr: { type: 'string' },
      },
      required: ['bankName', 'ifsc'],
    },
  })
  async addBank(@Body() body: any) {
    return this.customBanksService.addBank(body);
  }

  @Get()
  @ApiOperation({ summary: 'Get custom bank list' })
  async getAll() {
    return this.customBanksService.getAll();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete custom bank' })
  async delete(@Param('id') id: string) {
    return this.customBanksService.deleteBank(id);
  }
}
