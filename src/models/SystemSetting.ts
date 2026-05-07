import mongoose, { Document, Schema, Types } from "mongoose";

export interface ISystemSetting extends Document {
  key: string;
  companyId?: Types.ObjectId;
  payrollCaptainVerifyOnly: boolean;
  showOnGlobalCareersPage: boolean;
  publicCareersPageEnabled: boolean;
  companyCareersPageEnabled: boolean;
  currencyPosition: "left" | "right";
  currencyFormatType: "symbol" | "code";
  currencySpace: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SystemSettingSchema = new Schema<ISystemSetting>(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      default: "global",
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },
    payrollCaptainVerifyOnly: {
      type: Boolean,
      default: false,
    },
    showOnGlobalCareersPage: {
      type: Boolean,
      default: true,
    },
    publicCareersPageEnabled: {
      type: Boolean,
      default: true,
    },
    companyCareersPageEnabled: {
      type: Boolean,
      default: true,
    },
    currencyPosition: {
      type: String,
      enum: ["left", "right"],
      default: "left",
    },
    currencyFormatType: {
      type: String,
      enum: ["symbol", "code"],
      default: "symbol",
    },
    currencySpace: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

if (mongoose.models.SystemSetting) {
  delete mongoose.models.SystemSetting;
}

const SystemSetting = mongoose.model<ISystemSetting>(
  "SystemSetting",
  SystemSettingSchema,
);

export default SystemSetting;
