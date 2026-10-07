import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomBank } from './custom-bank.schema.js';

@Injectable()
export class CustomBanksService {
  constructor(
    @InjectModel(CustomBank.name)
    private readonly customBankModel: Model<CustomBank>,
  ) {}

  private normalize(value: string): string {
    return String(value || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  }

  async addBank(data: {
    bankName: string;
    ifsc: string;
    branch?: string;
    address?: string;
    city?: string;
    state?: string;
    micr?: string;
  }) {
    const ifsc = String(data.ifsc || '').trim().toUpperCase();

    if (!data.bankName || !ifsc) {
      throw new Error('Bank name and IFSC are required');
    }

    return this.customBankModel.findOneAndUpdate(
      { ifsc },
      {
        $set: {
          bankName: data.bankName.trim(),
          ifsc,
          branch: data.branch?.trim(),
          address: data.address?.trim(),
          city: data.city?.trim(),
          state: data.state?.trim(),
          micr: data.micr?.trim(),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
  }

  async findBank(ifsc: string, bankName: string) {
    const bank = await this.customBankModel
      .findOne({
        ifsc: ifsc.trim().toUpperCase(),
      })
      .lean();

    if (!bank) {
      return null;
    }

    if (
      this.normalize(bank.bankName) !==
      this.normalize(bankName)
    ) {
      return null;
    }

    return bank;
  }

  async getAll() {
    return this.customBankModel
      .find()
      .sort({ createdAt: -1 })
      .lean();
  }

  async deleteBank(id: string) {
    return this.customBankModel.findByIdAndDelete(id);
  }
}
