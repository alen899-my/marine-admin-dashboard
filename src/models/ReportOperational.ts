import mongoose, { Document, Schema } from "mongoose";

export interface IReportOperational extends Document {
  voyageId: mongoose.Types.ObjectId;
  vesselId: mongoose.Types.ObjectId; // Added for consistency

  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  voyageNo: string;
  vesselName: string;

  eventType: "departure" | "arrival" | "nor";
  portName?: string;
  lastPort?: string;
  eventTime?: Date;
  reportDate?: Date;

  navigation?: {
    distanceToGo?: number;
    distanceToNextPortNm?: number;
    etaNextPort?: Date;
  };

  departureStats?: {
    robVlsfo?: number;
    robLsmgo?: number;
    bunkersReceivedVlsfo?: number;
    bunkersReceivedLsmgo?: number;
    cargoQtyLoadedMt?: number;
    cargoQtyUnloadedMt?: number;
    cargoSummary?: string;
  };

  arrivalStats?: {
    robVlsfo?: number;
    robLsmgo?: number;
    arrivalTime?: Date;
    arrivalCargoQtyMt?: number;
  };

  norDetails?: {
    pilotStation?: string;
    documentUrl?: string;
    etaPort?: Date;
    tenderTime?: Date;
    norTime?: Date;
  };

  remarks?: string;
  status: "active" | "inactive";
  deletedAt: Date | null;
}

const ReportOperationalSchema = new Schema<IReportOperational>(
  {
    //  LINK TO VOYAGE COLLECTION
    voyageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voyage",
      required: true,
      index: true,
    },

    //  LINK TO VESSEL COLLECTION
    vesselId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vessel",
      required: true,
      index: true,
    },

    //  SNAPSHOT STRINGS
    voyageNo: { type: String, required: true }, // "OP-1225-IN"
    vesselName: { type: String, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    eventType: {
      type: String,
      enum: ["departure", "arrival", "nor"],
      required: true,
    },

    portName: String,
    lastPort: String,
    eventTime: Date,

    reportDate: { type: Date },

    navigation: {
      distanceToGo: Number,
      distanceToNextPortNm: Number,
      etaNextPort: Date,
    },

    departureStats: {
      robVlsfo: Number,
      robLsmgo: Number,
      bunkersReceivedVlsfo: { type: Number, default: 0 },
      bunkersReceivedLsmgo: { type: Number, default: 0 },
      cargoQtyLoadedMt: { type: Number, default: 0 },
      cargoQtyUnloadedMt: { type: Number, default: 0 },
      cargoSummary: String,
    },

    arrivalStats: {
      robVlsfo: Number,
      robLsmgo: Number,
      arrivalTime: Date,
      arrivalCargoQtyMt: { type: Number, default: 0 },
    },

    norDetails: {
      pilotStation: String,
      documentUrl: String,
      etaPort: Date,
      tenderTime: Date,
      norTime: Date,
    },

    remarks: String,

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.ReportOperational ||
  mongoose.model<IReportOperational>(
    "ReportOperational",
    ReportOperationalSchema,
  );
