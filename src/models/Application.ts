import mongoose, { Document, Schema } from "mongoose";

// ═══════════════════════════════════════════════════════════════════
// CREW APPLICATION / CV SCHEMA  —  MULTI-TENANT
// ═══════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────
// SHARED UPLOAD META
// ───────────────────────────────────────────────────────────────────

export interface IUploadMeta {
  fileName?: string;
  fileUrl?: string;
  uploadStatus: "not_uploaded" | "pending" | "approved" | "rejected";
  rejectionReason?: string;
  uploadedAt?: Date;
  fileUpdatedAt?: Date;
  uploadedBy?: mongoose.Types.ObjectId | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const uploadMetaFields: Record<string, any> = {
  fileName:        { type: String },
  fileUrl:         { type: String },
  uploadStatus:    { type: String, enum: ["not_uploaded", "pending", "approved", "rejected"], default: "not_uploaded" },
  rejectionReason: { type: String, default: "" },
  uploadedAt:      { type: Date },
  fileUpdatedAt:   { type: Date },
  uploadedBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
};

// ───────────────────────────────────────────────────────────────────
// SUB-DOCUMENT INTERFACES
// ───────────────────────────────────────────────────────────────────

export interface ILicence extends IUploadMeta {
  _id?: mongoose.Types.ObjectId;
  licenceType: "coc" | "coe";
  country: string;
  grade: string;
  number: string;
  placeIssued?: string;
  dateIssued?: Date;
  dateExpired?: Date | null;
}

export interface IPassport extends IUploadMeta {
  _id?: mongoose.Types.ObjectId;
  number: string;
  // FIX: country is required in schema but the passport step in the form
  // does NOT have a country field — made optional here to avoid validation errors.
  // If you re-add the country field to the passport step, change back to required.
  country?: string;
  placeIssued?: string;
  dateIssued?: Date;
  dateExpired?: Date;
}

export interface ISeamansBook extends IUploadMeta {
  _id?: mongoose.Types.ObjectId;
  number: string;
  country: string;
  placeIssued?: string;
  dateIssued?: Date;
  dateExpired?: Date | null;
}

export interface IVisa extends IUploadMeta {
  _id?: mongoose.Types.ObjectId;
  country: string;
  visaType: string;
  number: string;
  placeIssued?: string;
  dateIssued?: Date;
  dateExpired?: Date | null;
}

export interface IEndorsement extends IUploadMeta {
  _id?: mongoose.Types.ObjectId;
  name: string;
  country?: string;
  number?: string;
  placeIssued?: string;
  dateIssued?: Date;
  dateExpired?: Date | null;
}

export interface ICertificate extends IUploadMeta {
  _id?: mongoose.Types.ObjectId;
  name: string;
  courseNumber?: string;
  placeIssued?: string;
  dateIssued?: Date;
  dateExpired?: Date | null;
}

export interface ISeaExperience {
  _id?: mongoose.Types.ObjectId;
  vesselName: string;
  flag?: string;
  grt?: number;
  vesselType: string;
  engineType?: string;
  engineKW?: number;
  company: string;
  rank: string;
  periodFrom: Date;
  periodTo?: Date;
  areaOfOperation?: string;
  jobDescription?: string;
}

// NEW: extra uploaded documents (Experience Cert, STCW Course, etc.)
export interface IExtraDoc {
  _id?: mongoose.Types.ObjectId;
  name: string;           // user-supplied label, e.g. "Yellow Fever Cert"
  fileName?: string;
  fileUrl?: string;
  uploadStatus: "not_uploaded" | "pending" | "approved" | "rejected";
  rejectionReason?: string;
  uploadedAt?: Date;
  fileUpdatedAt?: Date;
  uploadedBy?: mongoose.Types.ObjectId | null;
}

export interface INextOfKin {
  name: string;
  relationship: string;
  phone?: string;
  address?: string;
}

export interface IAdminNote {
  _id?: mongoose.Types.ObjectId;
  note: string;
  addedBy: mongoose.Types.ObjectId;
  addedAt: Date;
}

// ───────────────────────────────────────────────────────────────────
// MAIN CREW INTERFACE
// ───────────────────────────────────────────────────────────────────

export interface ICrew extends Document {
  // ── TENANCY
  company: mongoose.Types.ObjectId;

  // ── FORM META
  submissionToken: string;
  formSource: "public_form" | "admin_created";
  lastEditedBy?: mongoose.Types.ObjectId | null;

  // ── IDENTITY
  firstName: string;
  lastName: string;
  rank: string;
  positionApplied?: string;
  dateOfAvailability?: Date;
  availabilityNote?: string;
  profilePhoto?: string;          // URL of uploaded photo

  // ── RESUME
  resume: IUploadMeta;

  // ── PERSONAL DETAILS
  nationality: string;
  dateOfBirth: Date;
  placeOfBirth?: string;
  maritalStatus?: "single" | "married" | "divorced" | "widowed";
  fatherName?: string;
  motherName?: string;

  // ── CONTACT
  presentAddress: string;
  email: string;
  cellPhone?: string;
  homePhone?: string;

  // ── LOCATION / TRAVEL
  nearestAirport?: string;
  kmFromAirport?: number;
  languages?: string[];           // stored as array; form sends comma-separated string

  // ── PHYSICAL / MEDICAL
  weightKg?: number;
  heightCm?: number;
  hairColor?: string;
  eyeColor?: string;
  coverallSize?: string;          // free text: "XL" or "40R"
  shoeSize?: string;
  medicalCertIssuedDate?: Date;
  medicalCertExpiredDate?: Date;

  // ── EMERGENCY CONTACT
  nextOfKin?: INextOfKin;

  // ── DOCUMENTS
  licences:          ILicence[];
  passports:         IPassport[];
  seamansBooks:      ISeamansBook[];
  visas:             IVisa[];
  endorsements:      IEndorsement[];
  stcwCertificates:  ICertificate[];
  otherCertificates: ICertificate[];

  // ── EXTRA UPLOADED DOCS (NEW)
  extraDocs: IExtraDoc[];

  // ── SEA EXPERIENCE
  seaExperience: ISeaExperience[];

  // ── FREE-TEXT
  additionalInfo?: string;
  seaExperienceDetail?: string;

  // ── WORKFLOW
  status: "draft" | "submitted" | "reviewing" | "approved" | "rejected" | "on_hold" | "archived";
  assignedTo?: mongoose.Types.ObjectId;

  // ── ADMIN ONLY
  adminNotes: IAdminNote[];

  // ── SOFT DELETE + TIMESTAMPS
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ───────────────────────────────────────────────────────────────────
// SUB-SCHEMAS
// ───────────────────────────────────────────────────────────────────

const LicenceSchema = new Schema(
  {
    licenceType: { type: String, required: true, enum: ["coc", "coe"], default: "coc" },
    country:     { type: String, required: true },
    grade:       { type: String, required: true },
    number:      { type: String, required: true },
    placeIssued: String,
    dateIssued:  Date,
    dateExpired: { type: Date, default: null },
    ...uploadMetaFields,
  },
  { _id: true }
);

const PassportSchema = new Schema(
  {
    number:      { type: String, required: true },
    // FIX: not required — passport step has no country field in the form
    country:     { type: String, default: "" },
    placeIssued: String,
    dateIssued:  Date,
    dateExpired: Date,
    ...uploadMetaFields,
  },
  { _id: true }
);

const SeamansBookSchema = new Schema(
  {
    number:      { type: String, required: true },
    country:     { type: String, required: true },
    placeIssued: String,
    dateIssued:  Date,
    dateExpired: { type: Date, default: null },
    ...uploadMetaFields,
  },
  { _id: true }
);

const VisaSchema = new Schema(
  {
    country:     { type: String, required: true },
    visaType:    { type: String, required: true },
    number:      { type: String, required: true },
    placeIssued: String,
    dateIssued:  Date,
    dateExpired: { type: Date, default: null },
    ...uploadMetaFields,
  },
  { _id: true }
);

const EndorsementSchema = new Schema(
  {
    name:        { type: String, required: true },
    country:     String,
    number:      String,
    placeIssued: String,
    dateIssued:  Date,
    dateExpired: { type: Date, default: null },
    ...uploadMetaFields,
  },
  { _id: true }
);

const CertificateSchema = new Schema(
  {
    name:         { type: String, required: true },
    courseNumber: String,
    placeIssued:  String,
    dateIssued:   Date,
    dateExpired:  { type: Date, default: null },
    ...uploadMetaFields,
  },
  { _id: true }
);

const SeaExperienceSchema = new Schema(
  {
    vesselName:      { type: String, required: true },
    flag:            String,
    grt:             Number,
    vesselType:      { type: String, required: true },
    engineType:      String,
    engineKW:        Number,
    company:         { type: String, required: true },
    rank:            { type: String, required: true },
    periodFrom:      { type: Date, required: true },
    periodTo:        Date,
    areaOfOperation: String,
    jobDescription:  String,
  },
  { _id: true }
);

// NEW: extra docs sub-schema reuses uploadMetaFields + a "name" label
const ExtraDocSchema = new Schema(
  {
    name:            { type: String, required: true, trim: true },
    fileName:        String,
    fileUrl:         String,
    uploadStatus:    { type: String, enum: ["not_uploaded", "pending", "approved", "rejected"], default: "not_uploaded" },
    rejectionReason: { type: String, default: "" },
    uploadedAt:      Date,
    fileUpdatedAt:   Date,
    uploadedBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: true }
);

const NextOfKinSchema = new Schema(
  {
    name:         { type: String, required: true },
    relationship: { type: String, required: true },
    phone:        String,
    address:      String,
  },
  { _id: false }
);

const AdminNoteSchema = new Schema(
  {
    note:    { type: String, required: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// ───────────────────────────────────────────────────────────────────
// MAIN SCHEMA
// ───────────────────────────────────────────────────────────────────

const CrewSchema = new Schema<ICrew>(
  {
    // ── Tenancy
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, immutable: true },

    // ── Form Meta
    submissionToken: { type: String, required: true },
    formSource:      { type: String, enum: ["public_form", "admin_created"], default: "public_form" },
    lastEditedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // ── Identity
    firstName:          { type: String, required: true, trim: true },
    lastName:           { type: String, required: true, trim: true },
    rank:               { type: String, required: true, trim: true },
    positionApplied:    { type: String, trim: true },
    dateOfAvailability: Date,
    availabilityNote:   { type: String, trim: true },
    profilePhoto:       String,

    // ── Resume
    resume: {
      type: new Schema({ ...uploadMetaFields }, { _id: false }),
      default: () => ({ uploadStatus: "not_uploaded" }),
    },

    // ── Personal Details
    nationality:   { type: String, required: true },
    dateOfBirth:   { type: Date, required: true },
    placeOfBirth:  String,
    maritalStatus: { type: String, enum: ["single", "married", "divorced", "widowed"] },
    fatherName:    String,
    motherName:    String,

    // ── Contact
    presentAddress: { type: String, required: true },
    email:          { type: String, required: true, lowercase: true, trim: true },
    cellPhone:      String,
    homePhone:      String,

    // ── Location / Travel
    nearestAirport: String,
    kmFromAirport:  Number,
    languages:      [String],

    // ── Physical / Medical
    weightKg:              Number,
    heightCm:              Number,
    hairColor:             String,
    eyeColor:              String,
    coverallSize:          String,
    shoeSize:              String,
    medicalCertIssuedDate: Date,
    medicalCertExpiredDate:Date,

    // ── Emergency Contact
    nextOfKin: NextOfKinSchema,

    // ── Documents
    licences:          { type: [LicenceSchema],     default: [] },
    passports:         { type: [PassportSchema],     default: [] },
    seamansBooks:      { type: [SeamansBookSchema],  default: [] },
    visas:             { type: [VisaSchema],          default: [] },
    endorsements:      { type: [EndorsementSchema],  default: [] },
    stcwCertificates:  { type: [CertificateSchema],  default: [] },
    otherCertificates: { type: [CertificateSchema],  default: [] },

    // ── Extra uploaded docs (NEW)
    extraDocs: { type: [ExtraDocSchema], default: [] },

    // ── Sea Experience
    seaExperience: { type: [SeaExperienceSchema], default: [] },

    // ── Free-text
    additionalInfo:      String,
    seaExperienceDetail: String,

    // ── Workflow
    status: {
      type: String,
      enum: ["draft", "submitted", "reviewing", "approved", "rejected", "on_hold", "archived"],
      default: "draft",
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // ── Admin only
    adminNotes: { type: [AdminNoteSchema], default: [] },

    // ── Soft delete
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

// ───────────────────────────────────────────────────────────────────
// INDEXES
// ───────────────────────────────────────────────────────────────────

CrewSchema.index({ submissionToken: 1 }, { unique: true });
CrewSchema.index({ company: 1, email: 1 }, { unique: true });
CrewSchema.index({ company: 1, status: 1, deletedAt: 1 });
CrewSchema.index({ company: 1, status: 1, rank: 1 });
CrewSchema.index({ company: 1, status: 1, nationality: 1 });
CrewSchema.index({ company: 1, assignedTo: 1, status: 1 });
CrewSchema.index({ company: 1, medicalCertExpiredDate: 1 });
CrewSchema.index({ company: 1, "licences.dateExpired": 1 });
CrewSchema.index({ company: 1, "seaExperience.vesselType": 1 });
CrewSchema.index({ company: 1, "seaExperience.rank": 1 });
CrewSchema.index(
  { firstName: "text", lastName: "text", rank: "text", nationality: "text" },
  { name: "crew_text_search" }
);
CrewSchema.index({ company: 1, status: 1, rank: 1, nationality: 1, deletedAt: 1 });

// ───────────────────────────────────────────────────────────────────
// EXPORT
// ───────────────────────────────────────────────────────────────────

export default mongoose.models.Crew ||
  mongoose.model<ICrew>("Crew", CrewSchema);