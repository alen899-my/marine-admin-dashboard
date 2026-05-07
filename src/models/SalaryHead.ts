import mongoose, { Document, Schema } from "mongoose";

export interface ISalaryHeadAllowance {
  label: string;
  value: number;
  type?: 'amount' | 'percent';
}

export interface ISalaryHeadDeduction {
  label: string;
  value: number;
  type?: 'amount' | 'percent';
}

export interface ISalaryHead extends Document {
  companyId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  periodFrom: Date;
  periodTo: Date;
  allowances: ISalaryHeadAllowance[];
  totalAllowance: number;
  deductions: ISalaryHeadDeduction[];
  totalDeductions: number;
  status: "active" | "inactive";
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SalaryHeadEntrySchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['amount', 'percent'], default: 'amount' },
  },
  { _id: false },
);

const SalaryHeadSchema = new Schema<ISalaryHead>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    periodFrom: { type: Date, required: true },
    periodTo: { type: Date, required: true },
    allowances: { type: [SalaryHeadEntrySchema], default: [] },
    totalAllowance: { type: Number, min: 0, default: 0 },
    deductions: { type: [SalaryHeadEntrySchema], default: [] },
    totalDeductions: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

SalaryHeadSchema.index({ companyId: 1, deletedAt: 1 });
SalaryHeadSchema.index({ companyId: 1, title: 1, deletedAt: 1 });
SalaryHeadSchema.index({ deletedAt: 1 });
SalaryHeadSchema.index({ title: 1, deletedAt: 1 });

if (mongoose.models.SalaryHead) {
  delete mongoose.models.SalaryHead;
}

const SalaryHead = mongoose.model<ISalaryHead>("SalaryHead", SalaryHeadSchema);

export default SalaryHead;
