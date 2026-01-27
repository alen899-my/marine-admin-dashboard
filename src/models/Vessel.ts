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
  // createdAt and updatedAt are automatic via timestamps: true
}

const VesselSchema = new Schema<IVessel>(
  {
    name: {
      type: String,
      required: true, //  Required
      unique: true, // 🔒 Unique Name
      trim: true,
    },

    imo: {
      type: String,
      required: true, //  Required
      unique: true, // 🔒 Unique IMO Number
      trim: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true, //  Added to Schema
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

  { timestamps: true },
);

export default mongoose.models.Vessel ||
  mongoose.model<IVessel>("Vessel", VesselSchema);
