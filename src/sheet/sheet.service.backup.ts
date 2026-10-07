import { Injectable } from '@nestjs/common';
import XLSX from 'xlsx';

@Injectable()
export class SheetService {
  private normalizeHeader(value: string): string {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  private normalizeBankName(value: string): string {
    const name = String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    const aliases: Record<string, string> = {
      sbi: 'statebankofindia',
      statebankofindia: 'statebankofindia',
      hdfc: 'hdfcbank',
      hdfcbank: 'hdfcbank',
      icici: 'icicibank',
      icicibank: 'icicibank',
      pnb: 'punjabnationalbank',
      punjabnationalbank: 'punjabnationalbank',
      bob: 'bankofbaroda',
      bankofbaroda: 'bankofbaroda',
      boi: 'bankofindia',
      bankofindia: 'bankofindia',
      axis: 'axisbank',
      axisbank: 'axisbank',
      kotak: 'kotakmahindrabank',
      kotakmahindrabank: 'kotakmahindrabank',
      canara: 'canarabank',
      canarabank: 'canarabank',
      idbi: 'idbibank',
      idbibank: 'idbibank',
      unionbank: 'unionbankofindia',
      unionbankofindia: 'unionbankofindia',
    };

    return aliases[name] || name;
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

    const cache = new Map<string, any>();
    const outputRows: Record<string, any>[] = [];

    for (const row of rows) {
      const errors: string[] = [];

      // Check every cell in the row for commas and dots.
      for (const [column, value] of Object.entries(row)) {
        if (String(value ?? '').includes(',')) {
          errors.push(`Comma found in column "${column}"`);
        }

        if (String(value ?? '').includes('.')) {
          errors.push(`Dot found in column "${column}"`);
        }
      }

      // Check account number if a recognized column exists.
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

      // Check whether bank and IFSC columns were identified.
      if (!bankColumn) {
        errors.push('Bank name column not recognized');
      }

      if (!ifscColumn) {
        errors.push('IFSC column not recognized');
      }

      // Validate bank name and IFSC when both columns exist.
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
            let bank = cache.get(ifsc);

            if (bank === undefined) {
              const response = await fetch(
                `https://ifsc.razorpay.com/${encodeURIComponent(ifsc)}`,
              );

              if (!response.ok) {
                bank = null;
              } else {
                bank = await response.json();
              }

              cache.set(ifsc, bank);
            }

            if (!bank) {
              errors.push('IFSC code not found');
            } else if (
              this.normalizeBankName(bankName) !==
              this.normalizeBankName(bank.BANK)
            ) {
              errors.push(
                `Bank name does not match IFSC; expected ${bank.BANK}`,
              );
            }
          } catch {
            errors.push(
              'Unable to verify IFSC; please retry',
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
    const outputSheet = XLSX.utils.json_to_sheet(outputRows);

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
