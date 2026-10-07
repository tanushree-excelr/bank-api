import { Injectable } from '@nestjs/common';
import XLSX from 'xlsx';
import { BankService } from '../bank/bank.service.js';

@Injectable()
export class SheetService {
  constructor(
    private readonly bankService: BankService,
  ) {}

  private normalizeHeader(value: string): string {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  private findColumn(
    headers: string[],
    possibleNames: string[],
  ): string | undefined {
    const normalizedNames = possibleNames.map((name) =>
      this.normalizeHeader(name),
    );

    return headers.find((header) =>
      normalizedNames.includes(this.normalizeHeader(header)),
    );
  }

  async validateSheet(file: any) {
    if (!file) {
      throw new Error('Excel file is required');
    }

    const workbook = XLSX.read(file.buffer, {
      type: 'buffer',
    });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows: Record<string, any>[] =
      XLSX.utils.sheet_to_json(sheet, {
        defval: '',
        raw: false,
      });

    const headers = rows.length ? Object.keys(rows[0]) : [];

    const bankColumn = this.findColumn(headers, [
      'BANK',
      'BANK NAME',
      'BENEFICIARY BANK',
      'BANK OF BENEFICIARY',
    ]);

    const ifscColumn = this.findColumn(headers, [
      'IFSC',
      'IFSC CODE',
      'IFSC CODE OF PAYEE',
      'BENEFICIARY IFSC',
      'IFSC CODE OF BENEFICIARY',
    ]);

    const accountColumn = this.findColumn(headers, [
      'ACCOUNT NUMBER',
      'ACCOUNT NO',
      'ACCOUNT NO.',
      'A/C NO',
      'A/C NUMBER',
      'BENEFICIARY ACCOUNT',
      'BENEFICIARY ACCOUNT NO',
      'BENEFICIARY ACCOUNT NUMBER',
      'BNEF A/C',
      'PAYEE ACCOUNT NUMBER',
      'BANK ACCOUNT NUMBER',
    ]);

    const outputRows: Record<string, any>[] = [];

    for (const row of rows) {
      const errors: string[] = [];

      // Check every cell for commas and dots
      for (const [column, value] of Object.entries(row)) {
        if (String(value ?? '').includes(',')) {
          errors.push(`Comma found in column "${column}"`);
        }

        if (String(value ?? '').includes('.')) {
          errors.push(`Dot found in column "${column}"`);
        }
      }

      // Account number validation
      if (accountColumn) {
        const accountNumber = String(
          row[accountColumn] ?? '',
        ).trim();

        if (!accountNumber) {
          errors.push('Account number is missing');
        } else if (!/^[0-9]+$/.test(accountNumber)) {
          errors.push(
            'Account number must contain digits only',
          );
        }
      }

      if (!bankColumn) {
        errors.push('Bank name column not recognized');
      }

      if (!ifscColumn) {
        errors.push('IFSC column not recognized');
      }

      // SAME validation logic used by /bank/validate
      if (bankColumn && ifscColumn) {
        const bankName = String(
          row[bankColumn] ?? '',
        ).trim();

        const ifsc = String(
          row[ifscColumn] ?? '',
        ).trim().toUpperCase();

        if (!bankName) {
          errors.push('Bank name is missing');
        }

        if (!ifsc) {
          errors.push('IFSC code is missing');
        }

        if (bankName && ifsc) {
          try {
            const result =
              await this.bankService.validateBank(
                bankName,
                ifsc,
              );

            if (!result.valid) {
              for (const flag of result.flags || []) {
                if (typeof flag === 'string') {
                  errors.push(flag);
                } else if (flag?.message) {
                  errors.push(flag.message);
                }
              }

              if (!result.flags?.length) {
                errors.push('Bank details could not be verified');
              }
            }
          } catch {
            errors.push(
              'Unable to verify bank details; please retry',
            );
          }
        }
      }

      outputRows.push({
        ...row,
        STATUS: errors.length ? 'INVALID' : 'VALID',
        ERROR: [...new Set(errors)].join('; '),
      });
    }

    const outputWorkbook = XLSX.utils.book_new();

    const outputSheet =
      XLSX.utils.json_to_sheet(outputRows);

    XLSX.utils.book_append_sheet(
      outputWorkbook,
      outputSheet,
      'Validation Result',
    );

    return XLSX.write(outputWorkbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });
  }
}
