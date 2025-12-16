import mongoose, { Schema, Document } from "mongoose";

export interface IReportOperational extends Document {
  voyageId: string;
  eventType: "departure" | "arrival" | "nor";

  vesselName?: string;
  portName?: string;

  // Generic root event time (kept for sorting compatibility)
  eventTime?: Date;

  // NEW FIELD
  reportDate?: Date;

  navigation?: {
    distanceToGo?: number;
    etaNextPort?: Date;
  };

  departureStats?: {
    robVlsfo?: number;
    robLsmgo?: number;
    cargoSummary?: string;
  };

  arrivalStats?: {
    robVlsfo?: number;
    robLsmgo?: number;
  };

  norDetails?: {
    pilotStation?: string;
    documentUrl?: string;
    etaPort?: Date;
    tenderTime?: Date;
  };

  remarks?: string;

  status: "active" | "inactive";
}

const ReportOperationalSchema = new Schema<IReportOperational>(
  {
    voyageId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: ["departure", "arrival", "nor"],
      required: true,
    },

    vesselName: String,
    portName: String,
    eventTime: Date,

    reportDate: {
      type: Date,
    },

    navigation: {
      distanceToGo: Number,
      etaNextPort: Date,
    },

    departureStats: {
      robVlsfo: Number,
      robLsmgo: Number,
      cargoSummary: String,
    },

    arrivalStats: {
      robVlsfo: Number,
      robLsmgo: Number,
    },

    norDetails: {
      pilotStation: String,
      documentUrl: String,
      etaPort: Date,
      tenderTime: Date,
    },

    remarks: String,

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ReportOperational ||
  mongoose.model<IReportOperational>(
    "ReportOperational",
    ReportOperationalSchema
  );
