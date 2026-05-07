// src/models/Seatemplate.ts
import mongoose, { Document, Schema } from "mongoose";

// Each section is a named block with a title + content placeholder tokens
export interface ITemplateSection {
  _id?: mongoose.Types.ObjectId;
  key: string;          // unique key e.g. "agreement_opening"
  title: string;        // section heading shown in the document
  content: string;      // rich text with {{placeholder}} tokens
  enabled: boolean;    // can be toggled off per template
  order: number;
  type?: string;       // richtext, seafarer_table, vessel_table, wage_table, etc.
  columns?: { key: string; label: string }[]; // for table sections
}

export interface ISeaTemplate extends Document {
  name: string;
  company: mongoose.Types.ObjectId;

  // Letterhead
  logoUrl?: string;
  letterheadBgUrl?: string;
  headerAddress?: string;
  footerText?: string;
  footerBgColor?: string;
  footerTextColor?: string;
  primaryColor?: string;
  mainHeading?: string;
  subHeading?: string;

  // Structured sections (form-driven)
  sections: ITemplateSection[];

  // MLC / CBA references
  cbaReference?: string;        // e.g. "FSUI CBA Applicable to ITF"
  mlcReference?: string;        // e.g. "MLC 2006 as amended"

  // Loss of life benefit amounts (editable per template)
  deathBenefitUSD?: number;     // default 114018
  dependentBenefitUSD?: number; // default 22805
  maxDependents?: number;       // default 4
  dependentAgeLimit?: number;   // default 18

  // Contract Defaults
  rpslNo?: string;
  rpslValidity?: string;
  refNoPrefix?: string;
  defaultSignPlace?: string;
  defaultSignDate?: string;

  isDefault: boolean;
  status: "active" | "inactive";
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SectionSchema = new Schema<ITemplateSection>(
  {
    key:     { type: String, required: true },
    title:   { type: String, default: "" },
    content: { type: String, default: "" },
    enabled: { type: Boolean, default: true },
    order:   { type: Number, default: 0 },
    type:    { type: String, default: "richtext" },
    columns: { type: Schema.Types.Mixed, default: [] },
  },
  { _id: true }
);

const SeaTemplateSchema = new Schema<ISeaTemplate>(
  {
    name:            { type: String, required: true, trim: true },
    company:         { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    logoUrl:         String,
    letterheadBgUrl: String,
    headerAddress:   String,
    footerText:      String,
    footerBgColor:   String,
    footerTextColor: { type: String, default: "#000000" },
    primaryColor:    { type: String, default: "#1e40af" },
    mainHeading:     { type: String, default: "" },
    subHeading:      { type: String, default: "" },
    sections:        { type: [SectionSchema], default: [] },
    cbaReference:    { type: String, default: "FSUI CBA Applicable to ITF INTERNATIONAL COLLECTIVE BARGAINING AGREEMENT" },
    mlcReference:    { type: String, default: "Maritime Labour Convention 2006 (as amended)" },
    deathBenefitUSD:      { type: Number, default: 114018 },
    dependentBenefitUSD:  { type: Number, default: 22805 },
    maxDependents:        { type: Number, default: 4 },
    dependentAgeLimit:    { type: Number, default: 18 },

    // New Fields
    rpslNo:          { type: String, default: "" },
    rpslValidity:    { type: String, default: "" },
    refNoPrefix:     { type: String, default: "" },
    defaultSignPlace: { type: String, default: "" },
    defaultSignDate: { type: String, default: "" },
    isDefault:  { type: Boolean, default: false },
    status:     { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deletedAt:  { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

SeaTemplateSchema.index({ company: 1, deletedAt: 1 });
SeaTemplateSchema.index({ company: 1, isDefault: 1 });

export default (mongoose.models.SeaTemplate as mongoose.Model<ISeaTemplate>) ||
  mongoose.model<ISeaTemplate>("SeaTemplate", SeaTemplateSchema);