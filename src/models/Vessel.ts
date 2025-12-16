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
}

const VesselSchema = new Schema<IVessel>(
  {
    name: String,
    imo: String,
    fleet: String,
    status: {
      type: String,
      enum: ["active", "laid_up", "sold", "dry_dock"],
      default: "active",
    },

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
  },
  { timestamps: true }
);

export default mongoose.models.Vessel ||
  mongoose.model<IVessel>("Vessel", VesselSchema);
