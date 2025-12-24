import mongoose, { Schema, Document } from "mongoose";

export interface IReportOperational extends Document {
  voyageId: string;
  eventType: "departure" | "arrival" | "nor";

  vesselName?: string;
  portName?: string;
  lastPort?: string; // NEW FIELD

  // Generic root event time (kept for sorting compatibility)
  eventTime?: Date;

  // NEW FIELD
  reportDate?: Date;

  navigation?: {
    distanceToGo?: number; // Kept for compatibility
    distanceToNextPortNm?: number; // UPDATED FIELD
    etaNextPort?: Date;
  };

  departureStats?: {
    robVlsfo?: number;
    robLsmgo?: number;
    bunkersReceivedVlsfo?: number; // NEW FIELD
    bunkersReceivedLsmgo?: number; // NEW FIELD
    cargoQtyLoadedMt?: number; // NEW FIELD
    cargoQtyUnloadedMt?: number; // NEW FIELD
    cargoSummary?: string;
  };

  arrivalStats?: {
    robVlsfo?: number;
    robLsmgo?: number;
    arrivalTime?: Date; // Added to store actual arrival time
    arrivalCargoQtyMt?: number; // NEW: Added for cargo on board at arrival
  };

  norDetails?: {
    pilotStation?: string;
    documentUrl?: string;
    etaPort?: Date;
    tenderTime?: Date;
    norTime?: Date; // NEW: Explicit field for NOR Time
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
    lastPort: String, // NEW FIELD
    eventTime: Date,

    reportDate: {
      type: Date,
    },

    navigation: {
      distanceToGo: Number,
      distanceToNextPortNm: Number, // UPDATED FIELD
      etaNextPort: Date,
    },

    departureStats: {
      robVlsfo: Number,
      robLsmgo: Number,
      bunkersReceivedVlsfo: { type: Number, default: 0 }, // NEW FIELD
      bunkersReceivedLsmgo: { type: Number, default: 0 }, // NEW FIELD
      cargoQtyLoadedMt: { type: Number, default: 0 }, // NEW FIELD
      cargoQtyUnloadedMt: { type: Number, default: 0 }, // NEW FIELD
      cargoSummary: String,
    },

    arrivalStats: {
      robVlsfo: Number,
      robLsmgo: Number,
      arrivalTime: Date, // NEW
      arrivalCargoQtyMt: { type: Number, default: 0 }, // NEW
    },

    norDetails: {
      pilotStation: String,
      documentUrl: String,
      etaPort: Date,
      tenderTime: Date,
      norTime: Date, // NEW
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