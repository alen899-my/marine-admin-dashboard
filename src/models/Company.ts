import mongoose, { Schema, model, models } from "mongoose";

const CompanySchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    address: { type: String },
    contactName: {
      type: String,
      trim: true,
      default: "",
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    logo: { type: String }, // Stores the URL (Local or Vercel Blob)
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    vessels: [{ type: Schema.Types.ObjectId, ref: "Vessel" }],
    users: [{ type: Schema.Types.ObjectId, ref: "User" }],
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default models.Company || model("Company", CompanySchema);
