import mongoose, { Document, Schema } from "mongoose";

export const APPLICATION_STATUSES = [
  "draft",
  "submitted",
  "hr_review",
  "shortlisted",
  "interview_scheduled",
  "interview_completed",
  "selected",
  "offer_sea_issued",
  "accepted",
  "onboarding_ready",
  "onboarded",
  "rejected",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const CREW_STATUSES = [
  "onboard",
  "vacation",
  "available",
  "traveling",
  "medical_leave",
  "training",
  "inactive",
  "resigned",
  "blacklisted",
] as const;

export type CrewStatus = (typeof CREW_STATUSES)[number];

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
  fileName: { type: String },
  fileUrl: { type: String },
  uploadStatus: { type: String, enum: ["not_uploaded", "pending", "approved", "rejected"], default: "not_uploaded" },
  rejectionReason: { type: String, default: "" },
  uploadedAt: { type: Date },
  fileUpdatedAt: { type: Date },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
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

export interface IOnboardingChecklistItem {
  _id?: mongoose.Types.ObjectId;
  text: string;
  completed: boolean;
  createdAt: Date;
}


// ───────────────────────────────────────────────────────────────────
// MAIN Candidate INTERFACE
// ───────────────────────────────────────────────────────────────────

export interface ICandidate extends Document {
  // ── TENANCY
  company: mongoose.Types.ObjectId;
  jobId?: mongoose.Types.ObjectId | null;
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
  licences: ILicence[];
  passports: IPassport[];
  seamansBooks: ISeamansBook[];
  visas: IVisa[];
  endorsements: IEndorsement[];
  stcwCertificates: ICertificate[];
  otherCertificates: ICertificate[];

  // ── EXTRA UPLOADED DOCS (NEW)
  extraDocs: IExtraDoc[];

  // ── SEA EXPERIENCE
  seaExperience: ISeaExperience[];

  // ── FREE-TEXT
  additionalInfo?: string;
  seaExperienceDetail?: string;

  // ── WORKFLOW
  status: ApplicationStatus;
  completedSteps: number[];
  assignedTo?: mongoose.Types.ObjectId;

  // ── ADMIN ONLY
  adminNotes: IAdminNote[];

  // ── ONBOARDING
  onboardingChecklist: IOnboardingChecklistItem[];
  onboardDate?: Date;
  onboardPort?: string;
  contractStart?: Date;
  contractEnd?: Date;
  contractPeriod?: string;

  // ── SOFT DELETE + TIMESTAMPS
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  userId?: mongoose.Types.ObjectId | null;

  // ── CREW STATUS
  crew: CrewStatus;
}


// ───────────────────────────────────────────────────────────────────
// SUB-SCHEMAS
// ───────────────────────────────────────────────────────────────────

const LicenceSchema = new Schema(
  {
    licenceType: { type: String, required: true, enum: ["coc", "coe"], default: "coc" },
    country: { type: String, required: true },
    grade: { type: String, required: true },
    number: { type: String, required: true },
    placeIssued: String,
    dateIssued: Date,
    dateExpired: { type: Date, default: null },
    ...uploadMetaFields,
  },
  { _id: true }
);

const PassportSchema = new Schema(
  {
    number: { type: String, required: true },

    country: { type: String, default: "" },
    placeIssued: String,
    dateIssued: Date,
    dateExpired: Date,
    ...uploadMetaFields,
  },
  { _id: true }
);

const SeamansBookSchema = new Schema(
  {
    number: { type: String, required: true },
    country: { type: String, required: true },
    placeIssued: String,
    dateIssued: Date,
    dateExpired: { type: Date, default: null },
    ...uploadMetaFields,
  },
  { _id: true }
);

const VisaSchema = new Schema(
  {
    country: { type: String, required: true },
    visaType: { type: String, required: true },
    number: { type: String, required: true },
    placeIssued: String,
    dateIssued: Date,
    dateExpired: { type: Date, default: null },
    ...uploadMetaFields,
  },
  { _id: true }
);

const EndorsementSchema = new Schema(
  {
    name: { type: String, required: true },
    country: String,
    number: String,
    placeIssued: String,
    dateIssued: Date,
    dateExpired: { type: Date, default: null },
    ...uploadMetaFields,
  },
  { _id: true }
);

const CertificateSchema = new Schema(
  {
    name: { type: String, required: true },
    courseNumber: String,
    placeIssued: String,
    dateIssued: Date,
    dateExpired: { type: Date, default: null },
    ...uploadMetaFields,
  },
  { _id: true }
);

const SeaExperienceSchema = new Schema(
  {
    vesselName: { type: String, required: true },
    flag: String,
    grt: Number,
    vesselType: { type: String, required: true },
    engineType: String,
    engineKW: Number,
    company: { type: String, required: true },
    rank: { type: String, required: true },
    periodFrom: { type: Date, required: true },
    periodTo: Date,
    areaOfOperation: String,
    jobDescription: String,
  },
  { _id: true }
);

// NEW: extra docs sub-schema reuses uploadMetaFields + a "name" label
const ExtraDocSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    fileName: String,
    fileUrl: String,
    uploadStatus: { type: String, enum: ["not_uploaded", "pending", "approved", "rejected"], default: "not_uploaded" },
    rejectionReason: { type: String, default: "" },
    uploadedAt: Date,
    fileUpdatedAt: Date,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: true }
);

const NextOfKinSchema = new Schema(
  {
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    phone: String,
    address: String,
  },
  { _id: false }
);

const AdminNoteSchema = new Schema(
  {
    note: { type: String, required: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// ───────────────────────────────────────────────────────────────────
// MAIN SCHEMA
// ───────────────────────────────────────────────────────────────────

const CandidateShema = new Schema<ICandidate>(
  {
    // ── Tenancy
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", default: null },
    // ── Form Meta
    submissionToken: { type: String, required: true },
    formSource: { type: String, enum: ["public_form", "admin_created"], default: "public_form" },
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // ── Identity
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    rank: { type: String, required: true, trim: true },
    positionApplied: { type: String, trim: true },
    dateOfAvailability: Date,
    availabilityNote: { type: String, trim: true },
    profilePhoto: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // ── Resume
    resume: {
      type: new Schema({ ...uploadMetaFields }, { _id: false }),
      default: () => ({ uploadStatus: "not_uploaded" }),
    },

    // ── Personal Details
    nationality: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    placeOfBirth: String,
    maritalStatus: { type: String, enum: ["single", "married", "divorced", "widowed"] },
    fatherName: String,
    motherName: String,

    // ── Contact
    presentAddress: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    cellPhone: String,
    homePhone: String,

    // ── Location / Travel
    nearestAirport: String,
    kmFromAirport: Number,
    languages: [String],

    // ── Physical / Medical
    weightKg: Number,
    heightCm: Number,
    hairColor: String,
    eyeColor: String,
    coverallSize: String,
    shoeSize: String,
    medicalCertIssuedDate: Date,
    medicalCertExpiredDate: Date,

    // ── Emergency Contact
    nextOfKin: NextOfKinSchema,

    // ── Documents
    licences: { type: [LicenceSchema], default: [] },
    passports: { type: [PassportSchema], default: [] },
    seamansBooks: { type: [SeamansBookSchema], default: [] },
    visas: { type: [VisaSchema], default: [] },
    endorsements: { type: [EndorsementSchema], default: [] },
    stcwCertificates: { type: [CertificateSchema], default: [] },
    otherCertificates: { type: [CertificateSchema], default: [] },

    // ── Extra uploaded docs (NEW)
    extraDocs: { type: [ExtraDocSchema], default: [] },

    // ── Sea Experience
    seaExperience: { type: [SeaExperienceSchema], default: [] },

    // ── Free-text
    additionalInfo: String,
    seaExperienceDetail: String,

    // ── Workflow
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: "draft",
    },
    completedSteps: {
      type: [Number],
      default: [],
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // ── Admin only
    adminNotes: { type: [AdminNoteSchema], default: [] },

    // ── Onboarding checklist
    onboardingChecklist: {
      type: [
        new Schema(
          {
            text: { type: String, required: true, trim: true },
            completed: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now },
          },
          { _id: true }
        ),
      ],
      default: [],
    },
    onboardDate: Date,
    onboardPort: String,
    contractStart: Date,
    contractEnd: Date,
    contractPeriod: String,

    // ── Crew status
    crew: {
      type: String,
      enum: CREW_STATUSES,
      default: "inactive",
    },


    // ── Soft delete
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

// ───────────────────────────────────────────────────────────────────
// INDEXES
// ───────────────────────────────────────────────────────────────────

CandidateShema.index({ submissionToken: 1 }, { unique: true });
CandidateShema.index({ company: 1, email: 1 });
CandidateShema.index({ company: 1, status: 1, deletedAt: 1 });
CandidateShema.index({ company: 1, status: 1, rank: 1 });
CandidateShema.index({ company: 1, status: 1, nationality: 1 });
CandidateShema.index({ company: 1, assignedTo: 1, status: 1 });
CandidateShema.index({ company: 1, medicalCertExpiredDate: 1 });
CandidateShema.index({ company: 1, "licences.dateExpired": 1 });
CandidateShema.index({ company: 1, "seaExperience.vesselType": 1 });
CandidateShema.index({ company: 1, "seaExperience.rank": 1 });
CandidateShema.index(
  { firstName: "text", lastName: "text", rank: "text", nationality: "text" },
  { name: "candidate_text_search" }
);
CandidateShema.index({ company: 1, status: 1, rank: 1, nationality: 1, deletedAt: 1 });
CandidateShema.index({ userId: 1, company: 1 });
CandidateShema.index({ userId: 1, company: 1, jobId: 1 });

// ───────────────────────────────────────────────────────────────────
// EXPORT
// ───────────────────────────────────────────────────────────────────

const Candidate =
  (mongoose.models.Candidate as mongoose.Model<ICandidate> | undefined) ||
  mongoose.model<ICandidate>("Candidate", CandidateShema);

export default Candidate;
