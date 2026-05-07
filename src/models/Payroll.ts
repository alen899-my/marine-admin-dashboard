import mongoose, { Document, Schema } from "mongoose";

export type PayrollStatus = "saved" | "captain_verified" | "finance_approved";
export type PayrollLeaveStatus = "saved" | "pending";

export interface IPayrollAllowance {
  label: string;
  value: number;
  type?: "amount" | "percent";
}

export interface IPayrollLeaveEntry {
  leaveTypeId: mongoose.Types.ObjectId;
  leaveTypeCode: string;
  leaveTypeName: string;
  leaveTypeMaxDays: number;
  days: number;
  approvedDays?: number | null;
  status: PayrollLeaveStatus;
}

export interface IPayroll extends Document {
  company: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  contractId: mongoose.Types.ObjectId;
  salaryHeadId?: mongoose.Types.ObjectId | null;
  payrollDate: Date;
  month: number;
  year: number;
  periodFrom: Date;
  periodTo: Date;
  basic: number;
  contractOtherAllowance: number | { value: number; type: 'amount' | 'percent' };
  salaryHeadAllowances: IPayrollAllowance[];
  salaryHeadDeductions: IPayrollAllowance[];
  crewAllowances: IPayrollAllowance[];
  crewDeductions: IPayrollAllowance[];
  mergedAllowances: IPayrollAllowance[];
  totalAllowance: number;
  grossWages: number;
  leaveEntries: IPayrollLeaveEntry[];
  leaveDays: number;
  leaveDeduction: number;
  bondedStore: number;
  cashAdvance: number;
  telDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netPayable: number;
  remarks?: string;
  status: PayrollStatus;
  savedBy?: mongoose.Types.ObjectId | null;
  verifiedBy?: mongoose.Types.ObjectId | null;
  verifiedAt?: Date | null;
  approvedBy?: mongoose.Types.ObjectId | null;
  approvedAt?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollAllowanceSchema = new Schema<IPayrollAllowance>(
  {
    label: { type: String, required: true, trim: true },
    value: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ["amount", "percent"], default: "amount" },
  },
  { _id: false },
);

const PayrollLeaveEntrySchema = new Schema<IPayrollLeaveEntry>(
  {
    leaveTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
    },
    leaveTypeCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    leaveTypeName: { type: String, required: true, trim: true },
    leaveTypeMaxDays: { type: Number, required: true, min: 0, default: 0 },
    days: { type: Number, required: true, min: 0 },
    approvedDays: { type: Number, min: 0, default: null },
    status: {
      type: String,
      enum: ["draft","saved", "pending"],
      default: "saved",
    },
  },
  { _id: false },
);

const PayrollSchema = new Schema<IPayroll>(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
    },
    salaryHeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryHead",
      default: null,
    },
    payrollDate: { type: Date, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 1900 },
    periodFrom: { type: Date, required: true },
    periodTo: { type: Date, required: true },
    basic: { type: Number, min: 0, default: 0 },
    contractOtherAllowance: { type: mongoose.Schema.Types.Mixed, default: 0 },
    salaryHeadAllowances: { type: [PayrollAllowanceSchema], default: [] },
    salaryHeadDeductions: { type: [PayrollAllowanceSchema], default: [] },
    crewAllowances: { type: [PayrollAllowanceSchema], default: [] },
    crewDeductions: { type: [PayrollAllowanceSchema], default: [] },
    mergedAllowances: { type: [PayrollAllowanceSchema], default: [] },
    totalAllowance: { type: Number, min: 0, default: 0 },
    grossWages: { type: Number, min: 0, default: 0 },
    leaveEntries: { type: [PayrollLeaveEntrySchema], default: [] },
    leaveDays: { type: Number, min: 0, default: 0 },
    leaveDeduction: { type: Number, min: 0, default: 0 },
    bondedStore: { type: Number, min: 0, default: 0 },
    cashAdvance: { type: Number, min: 0, default: 0 },
    telDeduction: { type: Number, min: 0, default: 0 },
    otherDeductions: { type: Number, min: 0, default: 0 },
    totalDeductions: { type: Number, min: 0, default: 0 },
    netPayable: { type: Number, default: 0 },
    remarks: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["draft","saved", "captain_verified", "finance_approved"],
      default: "saved",
    },
    savedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verifiedAt: { type: Date, default: null },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

PayrollSchema.index(
  { company: 1, applicationId: 1, month: 1, year: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);
PayrollSchema.index({ company: 1, status: 1, deletedAt: 1 });

PayrollSchema.pre("validate", function () {
  if (this.payrollDate instanceof Date && !Number.isNaN(this.payrollDate.getTime())) {
    this.month = this.payrollDate.getUTCMonth() + 1;
    this.year = this.payrollDate.getUTCFullYear();
  }
});

if (mongoose.models.Payroll) {
  delete mongoose.models.Payroll;
}

const Payroll = mongoose.model<IPayroll>("Payroll", PayrollSchema);

export default Payroll;
