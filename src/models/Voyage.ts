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
  },
  { timestamps: true }
);

export default mongoose.models.Voyage ||
  mongoose.model<IVoyage>("Voyage", VoyageSchema);
