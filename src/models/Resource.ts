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
    
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

resourceSchema.index({ deletedAt: 1 });

export default models.Resource || mongoose.model("Resource", resourceSchema);