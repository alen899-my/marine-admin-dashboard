import mongoose, { Schema, Document } from "mongoose";

export interface IVoyage extends Document {
  vesselId: mongoose.Types.ObjectId;
  voyageNo: string;
  status: "active" | "completed" | "scheduled";

  route: {
    loadPort: string;
    dischargePort: string;
    via?: string;
    totalDistance: number;
  };

  charter: {
    chartererName: string;
    charterPartyDate: string;
    laycanStart: string;
    laycanEnd: string;
  };

  cargo: {
    commodity: string;
    quantity: number;
    grade: string;
  };

  schedule: {
    startDate: Date;
    eta: Date;
    endDate?: Date | null;
  };

  // ✅ ADDED THESE INTERFACE FIELDS
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VoyageSchema = new Schema<IVoyage>(
  {
    vesselId: { type: Schema.Types.ObjectId, ref: "Vessel", index: true },

    voyageNo: String,

    status: {
      type: String,
      enum: ["active", "completed", "scheduled"],
      default: "scheduled",
    },

    route: {
      loadPort: String,
      dischargePort: String,
      via: String,
      totalDistance: Number,
    },

    charter: {
      chartererName: String,
      charterPartyDate: String,
      laycanStart: String,
      laycanEnd: String,
    },

    cargo: {
      commodity: String,
      quantity: Number,
      grade: String,
    },

    schedule: {
      startDate: Date,
      eta: Date,
      endDate: Date,
    },

    // ✅ ADDED THESE SCHEMA FIELDS
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);
VoyageSchema.index({ vesselId: 1, voyageNo: 1 }, { unique: true });
export default mongoose.models.Voyage ||
  mongoose.model<IVoyage>("Voyage", VoyageSchema);