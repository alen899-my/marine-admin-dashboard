import mongoose, { Document, Schema } from "mongoose";

export interface IVessel extends Document {
  name: string;
  imo: string;
  fleet: string;
  status: "active" | "laid_up" | "sold" | "dry_dock";
  callSign: string;
  mmsi: string;
  flag: string;
  yearBuilt: number;
  company: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  // This acts as the "Vessel Library" for Admin/Office documents
  certificates: {
    _id?: mongoose.Types.ObjectId; 
    docType: string;               
    name: string;                  
    owner: "ship" | "office";
    fileName: string;              
    fileUrl: string;               
    note?: string;
    expiryDate?: Date;
    updatedAt: Date;
    uploadedBy?: mongoose.Types.ObjectId;
  }[];
  dimensions: {
    loa: number;
    beam: number;
    maxDraft: number;
    dwt: number;
    grossTonnage: number;
  };
  performance: {
    designSpeed: number;
    ballastConsumption: number;
    ladenConsumption: number;
  };
  machinery: {
    mainEngine: string;
    allowedFuels: string[];
  };
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
}

const VesselSchema = new Schema<IVessel>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    imo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    fleet: String,
    status: {
      type: String,
      enum: ["active", "laid_up", "sold", "dry_dock"],
      default: "active",
    },
    deletedAt: { type: Date, default: null },
    callSign: String,
    mmsi: String,
    flag: String,
    yearBuilt: Number,
    // THE VESSEL LIBRARY (NOT REQUIRED)
  certificates: {
      type: [
        {
          docType: {
            type: String,
            required: true,
            enum: [
              "registry_cert", "tonnage_cert", "isps_ship", "isps_officer",
              "pi_cert", "sanitation_cert", "msm_cert", "hull_machinery",
              "safety_equipment", "medical_chest", "ships_particulars",
              "security_report"
            ]
          },
          name: { type: String, required: true },
          owner: { type: String, enum: ["ship", "office"], default: "office" },
          fileName: { type: String, required: true },
          fileUrl: { type: String, required: true },
          note: String,
          expiryDate: Date,
          updatedAt: { type: Date, default: Date.now },
          uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
        }
      ],
      default: []
    },
    dimensions: {
      loa: Number,
      beam: Number,
      maxDraft: Number,
      dwt: Number,
      grossTonnage: Number,
    },
    performance: {
      designSpeed: Number,
      ballastConsumption: Number,
      ladenConsumption: Number,
    },
    machinery: {
      mainEngine: String,
      allowedFuels: [String],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Vessel || mongoose.model<IVessel>("Vessel", VesselSchema);