import mongoose, { Document, Schema } from "mongoose";

export type AllowanceDeductionType = "allowance" | "deduction";

export interface IAllowanceDeduction extends Document {
  name: string;
  code: string;
  type: AllowanceDeductionType;
  company?: mongoose.Types.ObjectId;
  description?: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const AllowanceDeductionSchema = new Schema<IAllowanceDeduction>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    type: {
      type: String,
      enum: ["allowance", "deduction"],
      required: true,
    },
    company: { type: Schema.Types.ObjectId, ref: "Company", default: null },
    description: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true, versionKey: false },
);

AllowanceDeductionSchema.index({ company: 1, type: 1, code: 1 }, { unique: true });
AllowanceDeductionSchema.index({ company: 1 });
AllowanceDeductionSchema.index({ name: 1 });

export default mongoose.models.AllowanceDeduction ||
  mongoose.model<IAllowanceDeduction>(
    "AllowanceDeduction",
    AllowanceDeductionSchema,
  );
