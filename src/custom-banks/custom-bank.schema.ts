import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class CustomBank {
  @Prop({ required: true })
  bankName!: string;

  @Prop({ required: true, unique: true, index: true })
  ifsc!: string;

  @Prop()
  branch?: string;

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  state?: string;

  @Prop()
  micr?: string;
}

export const CustomBankSchema = SchemaFactory.createForClass(CustomBank);
