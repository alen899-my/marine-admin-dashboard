import mongoose, { Document, Schema } from "mongoose";
import "./Company";
import "./Candidate";
import "./Vessel";

export interface IVaultDocument {
  name: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  uploadedBy?: mongoose.Types.ObjectId;
}

export interface IContract extends Document {
  // ── Tenancy
  company: mongoose.Types.ObjectId;

  // ── Linked application / candidate
  applicationId: mongoose.Types.ObjectId;

  // ── Seafarer details (denormalised for quick display)
  seafarerName: string;
  seafarerEmail: string;
  rank: string;
  positionApplied?: string;

  // ── CDC / INDOS
  cdcNo?: string;
  indosNo?: string;

  // ── Vessel & Contract
  vesselId?: mongoose.Types.ObjectId;
  portOfJoining?: string;
  commencement?: Date;
  contractStart?: Date;
  contractEnd?: Date;
  contractPeriod?: string; // e.g. "9 Months"

  // ── SEA Metadata
  signDate?: Date;
  signPlace?: string;
  referenceNo?: string;

  // ── Status
  contractStatus: "draft" | "generated" | "pending" | "active" | "expired" | "terminated";

  // ── Vault Documents (signed contracts)
  vaultDocuments: IVaultDocument[];

  // ── Soft delete + timestamps
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ContractSchema = new Schema<IContract>(
  {
    // ── Tenancy
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    // ── Linked application
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },

    // ── Seafarer info (denormalised)
    seafarerName: { type: String, required: true, trim: true },
    seafarerEmail: { type: String, required: true, lowercase: true, trim: true },
    rank: { type: String, required: true, trim: true },
    positionApplied: { type: String, trim: true },

    // ── CDC / INDOS
    cdcNo: { type: String, trim: true },
    indosNo: { type: String, trim: true },

    // ── Vessel & Contract
    vesselId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vessel",
    },
    portOfJoining: { type: String, trim: true },
    commencement: { type: Date },
    contractStart: { type: Date },
    contractEnd: { type: Date },
    contractPeriod: { type: String },

    // ── SEA Metadata
    signDate: { type: Date },
    signPlace: { type: String, trim: true },
    referenceNo: { type: String, trim: true },

    // ── Status
    contractStatus: {
      type: String,
      enum: ["draft", "generated", "pending", "active", "expired", "terminated"],
      default: "draft",
    },

    // ── Vault Documents (signed contracts)
    vaultDocuments: {
      type: [{
        name: { type: String, required: true },
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      }],
      default: [],
    },

    // ── Soft delete
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

ContractSchema.index({ company: 1, applicationId: 1 });
ContractSchema.index({ company: 1, contractStatus: 1 });
ContractSchema.index({ company: 1, commencement: 1 });

// Force re-compilation in Next.js dev mode to pick up schema changes
if (mongoose.models.Contract) {
  delete mongoose.models.Contract;
}

const Contract = mongoose.model<IContract>("Contract", ContractSchema);

export default Contract;
