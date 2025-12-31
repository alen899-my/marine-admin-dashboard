import mongoose, { Document, Schema } from "mongoose";

export interface IReportDaily extends Document {
  
  vesselId: mongoose.Types.ObjectId; 
  voyageId: mongoose.Types.ObjectId;
  vesselName: string;
  voyageNo: string;
 
  type: "noon";
  reportDate: Date;

  position: {
    lat: string;
    long: string;
  };

  navigation: {
    distLast24h: number;     // Observed Distance
    engineDist: number;      // ***** NEW FIELD *****
    slip: number;            // ***** NEW FIELD *****
    distToGo: number;
    nextPort: string;
  };

  consumption: {
    vlsfo: number;
    lsmgo: number;
  };

  weather: {
    wind: string;
    seaState: string;
    remarks: string;
  };

  remarks: string;

  status: "active" | "inactive";
}

const ReportDailySchema = new Schema<IReportDaily>(
  {
   vesselId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vessel",
      required: true,
      index: true,
    },

    // ✅ 2. LINK TO VOYAGE COLLECTION
    voyageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voyage",
      required: true,
      index: true,
    },

    // Snapshot Strings (Read-only copies)
    vesselName: { type: String, required: true },
    voyageNo: { type: String, required: true }, 

    type: {
      type: String,
      enum: ["noon"],
      default: "noon",
    },

    reportDate: {
      type: Date,
      required: true,
    },

    position: {
      lat: { type: String, required: true },
      long: { type: String, required: true },
    },

    navigation: {
      distLast24h: { type: Number, required: true },
      engineDist: { type: Number, required: true }, // ***** NEW FIELD *****
      slip: { type: Number },                        // ***** NEW FIELD *****
      distToGo: { type: Number, required: true },
      nextPort: { type: String, required: true },
    },

    consumption: {
      vlsfo: { type: Number, required: true },
      lsmgo: { type: Number, required: true },
    },

    weather: {
      wind: { type: String },
      seaState: { type: String },
      remarks: { type: String },
    },

    remarks: {
      type: String,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.models.ReportDaily ||
  mongoose.model<IReportDaily>("ReportDaily", ReportDailySchema);