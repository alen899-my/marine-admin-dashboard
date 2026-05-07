import mongoose, { Schema, Document } from "mongoose";

/**
 * PreArrival Document Interface:
 * Office and Ship documents are stored directly in the PreArrival pack.
 * No more vessel library references.
 */
const LogEntrySchema = new Schema({
  message: String,
  role: { type: String, enum: ["admin", "ship"] },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });


export interface IPreArrivalDocument {
  docSource: "office_upload" | "onboard_upload" | "vessel_library";
  
  name?: string; 
  fileName?: string; 
  rejectionReason?: string;
  fileUrl?: string;
  fileSize?: number;

  note?: string;
  status: "pending_review" | "approved" | "rejected";
  rejectionHistory?: any[];
  owner: "ship" | "office"; 
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
}

export interface IPreArrival extends Document {
  vesselId: mongoose.Types.ObjectId;
  voyageId?: mongoose.Types.ObjectId;
  requestId: string;
  portName: string;
  eta: Date;
  agentContact: string;
  dueDate: Date;
  notes: string;
  notesHistory?: any[];
  status: "draft" | "published" | "sent" | "acknowledged" | "completed";
  isLocked: boolean;
  documents: Map<string, IPreArrivalDocument>;
  submittedAt?: Date;
  submittedBy?: mongoose.Types.ObjectId;
  acknowledgedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PreArrivalSchema = new Schema(
  {
    vesselId: { type: Schema.Types.ObjectId, ref: "Vessel", required: true },
    voyageId: { type: Schema.Types.ObjectId, ref: "Voyage", required: false },
    requestId: { type: String, unique: true, sparse: true },
    portName: { type: String, required: true },
    eta: { type: Date, required: true },
    agentContact: String,
    dueDate: Date,
    notes: String,

    notesHistory: [LogEntrySchema],
    status: { 
      type: String, 
      enum: ["draft", "published", "sent", "acknowledged", "completed"], 
      default: "draft" 
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    submittedAt: { type: Date },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User" },
    acknowledgedAt: { type: Date },

    documents: { 
      type: Map,
      of: new Schema(
        {
          docSource: { 
            type: String, 
            enum: ["office_upload", "onboard_upload", "vessel_library"],
            required: true 
          },
          
          status: { 
            type: String, 
            enum: ["pending_review", "approved", "rejected"], 
            default: "pending_review" 
          },
          owner: { type: String, enum: ["ship", "office"] },
          note: { type: String, default: "" },

          rejectionReason: { type: String, default: "" },
          rejectionHistory: [LogEntrySchema],
          uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
          uploadedAt: { type: Date, default: Date.now },
          name: { type: String }, 
          fileName: { type: String, default: null },
          fileUrl: { type: String, default: null },
          fileSize: { type: Number, default: null },
        },
        { _id: false } 
      ),
      default: {},
    },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { 
    timestamps: true,
    toJSON: { flattenMaps: false },
    toObject: { flattenMaps: false }
  }
);

// Optimize for fetching packs by Vessel
PreArrivalSchema.index({ vesselId: 1, status: 1 });

export default mongoose.models.PreArrival || mongoose.model<IPreArrival>("PreArrival", PreArrivalSchema);
