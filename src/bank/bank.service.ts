import { Injectable } from '@nestjs/common';
import { CustomBanksService } from '../custom-banks/custom-banks.service.js';

@Injectable()
export class BankService {
  constructor(
    private readonly customBanksService: CustomBanksService,
  ) {}

  async validateBank(bankName: string, ifsc: string) {
    const cleanBankName = (bankName || '').trim().toLowerCase();
    const cleanIfsc = (ifsc || '').trim().toUpperCase();

    const flags: any[] = [];

    if (!cleanBankName) {
      flags.push({
        field: 'bankName',
        message: 'Bank name is required',
      });
    }

    if (!cleanIfsc) {
      flags.push({
        field: 'ifsc',
        message: 'IFSC code is required',
      });
    }

    if (flags.length) {
      return {
        valid: false,
        flags,
      };
    }

    try {
      const response = await fetch(
        `https://ifsc.razorpay.com/${cleanIfsc}`,
      );

      // Razorpay knows this IFSC
      if (response.ok) {
        const data = await response.json();

        const actualBankName = (data.BANK || '')
          .trim()
          .toLowerCase();

        if (actualBankName !== cleanBankName) {
          return {
            valid: false,
            flags: [
              {
                field: 'bankName',
                message: 'Bank name does not match the IFSC code',
                expected: data.BANK,
              },
            ],
            bank: data,
            source: 'API',
          };
        }

        return {
          valid: true,
          flags: [],
          bank: data,
          source: 'API',
        };
      }

      // Razorpay does NOT know this IFSC
      // Check MongoDB Custom Bank List
      const customBank = await this.customBanksService.findBank(
        cleanIfsc,
        bankName,
      );

      if (customBank) {
        return {
          valid: true,
          flags: [],
          bank: {
            BANK: customBank.bankName,
            IFSC: customBank.ifsc,
            BRANCH: customBank.branch,
            ADDRESS: customBank.address,
            CITY: customBank.city,
            STATE: customBank.state,
            MICR: customBank.micr,
          },
          source: 'CUSTOM_BANK',
        };
      }

      return {
        valid: false,
        flags: [
          {
            field: 'ifsc',
            message: 'IFSC code is not found in API or Custom Bank List',
          },
          {
            field: 'bankName',
            message: 'Bank could not be verified',
          },
        ],
        source: 'NONE',
      };
    } catch (error) {
      // If Razorpay API is unavailable, also check Custom Bank List
      const customBank = await this.customBanksService.findBank(
        cleanIfsc,
        bankName,
      );

      if (customBank) {
        return {
          valid: true,
          flags: [],
          bank: {
            BANK: customBank.bankName,
            IFSC: customBank.ifsc,
            BRANCH: customBank.branch,
            ADDRESS: customBank.address,
            CITY: customBank.city,
            STATE: customBank.state,
            MICR: customBank.micr,
          },
          source: 'CUSTOM_BANK',
        };
      }

      return {
        valid: false,
        flags: [
          {
            field: 'api',
            message: 'Unable to verify bank details',
          },
        ],
        source: 'NONE',
      };
    }
  }
}
