import mongoose, { Schema, Document } from "mongoose";

export interface IDocument extends Document {
  vesselId?: mongoose.Types.ObjectId;
  voyageId?: mongoose.Types.ObjectId;
  
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;

  portName: string;

  portType: "load" | "discharge" | "departure";

  documentType: "stowage_plan" | "cargo_documents" | "other";

  documentDate: Date;

  reportDate?: Date;

  file: {
    url: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  };

  status: "active" | "inactive";
  deletedAt: Date | null;
  remarks?: string;
}

const DocumentSchema = new Schema<IDocument>(
  {
    vesselId: { type: Schema.Types.ObjectId, ref: "Vessel", required: true, index: true },
    voyageId: { type: Schema.Types.ObjectId, ref: "Voyage", required: true, index: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    portName: { type: String, required: true },

    portType: {
      type: String,
      enum: ["load", "discharge", "departure"],
      required: true,
    },

    documentType: {
      type: String,
      enum: ["stowage_plan", "cargo_documents", "other"],
      required: true,
    },

    documentDate: { type: Date, required: true },

    reportDate: { type: Date },

    file: {
      url: String,
      originalName: String,
      mimeType: String,
      sizeBytes: Number,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    remarks: String,
  },
  { timestamps: true }
);

export default mongoose.models.Document ||
  mongoose.model<IDocument>("Document", DocumentSchema);