import mongoose, { Document, Schema } from "mongoose";
import { CREW_STATUSES, CrewStatus } from "./Candidate";

// ───────────────────────────────────────────────────────────────────
// SUB-DOCUMENT INTERFACES
// ───────────────────────────────────────────────────────────────────

export interface ICrewChecklistItem {
  _id?: mongoose.Types.ObjectId;
  text: string;
  completed: boolean;
  createdAt: Date;
}

export interface ICrewLeaveLimit {
  leaveTypeId: mongoose.Types.ObjectId;
  maxDays: number;
}

// ───────────────────────────────────────────────────────────────────
// MAIN Crew INTERFACE
// ───────────────────────────────────────────────────────────────────

export interface ICrew extends Document {
  // ── Links
  applicationId: mongoose.Types.ObjectId; // ref: Candidate (unique)
  company: mongoose.Types.ObjectId;        // ref: Company
  contractId?: mongoose.Types.ObjectId | null; // ref: Contract (latest)

  // ── Crew status
  crewStatus: CrewStatus;

  // ── Onboarding checklist
  onboardingChecklist: ICrewChecklistItem[];

  // ── Leave settings
  leaveLimits: ICrewLeaveLimit[];

  // ── Soft delete + timestamps
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ───────────────────────────────────────────────────────────────────
// SCHEMA
// ───────────────────────────────────────────────────────────────────

const CrewSchema = new Schema<ICrew>(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      default: null,
    },

    crewStatus: {
      type: String,
      enum: CREW_STATUSES,
      default: "inactive",
    },

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

    // ── Leave settings
    leaveLimits: {
      type: [
        new Schema(
          {
            leaveTypeId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "LeaveType",
              required: true,
            },
            maxDays: { type: Number, required: true, min: 0 },
          },
          { _id: false }
        ),
      ],
      default: [],
    },

    // ── Soft delete
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

// ───────────────────────────────────────────────────────────────────
// INDEXES
// ───────────────────────────────────────────────────────────────────

CrewSchema.index({ applicationId: 1 }, { unique: true });
CrewSchema.index({ company: 1, crewStatus: 1, deletedAt: 1 });
CrewSchema.index({ company: 1, contractId: 1 });

// ───────────────────────────────────────────────────────────────────
// EXPORT
// ───────────────────────────────────────────────────────────────────

// Force re-compilation in Next.js dev mode
if (mongoose.models.Crew) {
  delete mongoose.models.Crew;
}

const Crew = mongoose.model<ICrew>("Crew", CrewSchema);

export default Crew;
