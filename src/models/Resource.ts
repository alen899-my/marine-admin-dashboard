import mongoose, { Schema, models } from "mongoose";

const resourceSchema = new Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isDeleted: { type: Boolean, default: false }, // New Field
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default models.Resource || mongoose.model("Resource", resourceSchema);