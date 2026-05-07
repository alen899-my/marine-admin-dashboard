import mongoose, { Document, Schema } from "mongoose";

export interface ILeaveType extends Document {
  companyId: mongoose.Schema.Types.ObjectId;
  name: string;
  code: string;
  type: "paid" | "unpaid";
  isCarryForward: boolean;
  maxCarryForward: number;
  maxDays: number;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const LeaveTypeSchema = new Schema<ILeaveType>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    type: { type: String, enum: ["paid", "unpaid"], required: true },
    isCarryForward: { type: Boolean, default: false },
    maxCarryForward: { type: Number, default: 0, min: 0 },
    maxDays: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true, versionKey: false }
);

LeaveTypeSchema.index({ code: 1 }, { unique: true });
LeaveTypeSchema.index({ name: 1 });

if (mongoose.models.LeaveType) {
  delete mongoose.models.LeaveType;
}



const LeaveType = mongoose.model<ILeaveType>("LeaveType", LeaveTypeSchema);

export default LeaveType;
