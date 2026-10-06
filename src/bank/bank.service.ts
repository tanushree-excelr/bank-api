import { Injectable } from '@nestjs/common';

@Injectable()
export class BankService {
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

      if (!response.ok) {
        return {
          valid: false,
          flags: [
            {
              field: 'ifsc',
              message: 'IFSC code is not found',
            },
            {
              field: 'bankName',
              message: 'Bank could not be verified',
            },
          ],
        };
      }

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
        };
      }

      return {
        valid: true,
        flags: [],
        bank: data,
      };
    } catch (error) {
      return {
        valid: false,
        flags: [
          {
            field: 'api',
            message: 'Unable to verify bank details',
          },
        ],
      };
    }
  }
}