import mongoose, { Document, Schema } from "mongoose";

export interface IWageAllowance {
  label: string;
  value: number;
  type?: 'amount' | 'percent';
}

export interface IWage extends Document {
  company: mongoose.Types.ObjectId;
  contractId: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;

  basic: number;
  otherAllowance: number | { value: number; type: 'amount' | 'percent' };
  allowances: IWageAllowance[];
  effectiveFrom: Date;
  configuredEffectiveTo?: Date | null;
  effectiveTo?: Date | null;
  isCurrent: boolean;

  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AllowanceSchema = new Schema<IWageAllowance>(
  {
    label: { type: String, required: true, trim: true },
    value: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['amount', 'percent'], default: 'amount' },
  },
  { _id: false }
);

const WageSchema = new Schema<IWage>(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    contractId: { type: mongoose.Schema.Types.ObjectId, ref: "Contract", required: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true },

    basic: { type: Number, min: 0, default: 0 },
    otherAllowance: { 
      type: mongoose.Schema.Types.Mixed, 
      default: 0 
    },

    allowances: { type: [AllowanceSchema], default: [] },
    effectiveFrom: { type: Date, required: true, default: Date.now },
    configuredEffectiveTo: { type: Date, default: null },
    effectiveTo: { type: Date, default: null },
    isCurrent: { type: Boolean, default: true },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

WageSchema.index(
  { contractId: 1, effectiveFrom: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);
WageSchema.index({ contractId: 1, effectiveFrom: -1, effectiveTo: 1, deletedAt: 1 });
WageSchema.index({ company: 1, applicationId: 1, effectiveFrom: -1, deletedAt: 1 });

if (mongoose.models.Wage) {
  delete mongoose.models.Wage;
}

const Wage = mongoose.model<IWage>("Wage", WageSchema);

export default Wage;
