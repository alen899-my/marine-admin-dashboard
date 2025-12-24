import mongoose, { Schema, models } from "mongoose";

const permissionSchema = new Schema(
  {
    slug: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true ,
      immutable: true
    },
    
    description: { type: String, required: true },
    
    // Grouping field (e.g., "Daily Noon Report")
    group: { type: String, required: true }, 

    status: {
      type: String,
      enum: ["active", "deprecated"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default models.Permission || mongoose.model("Permission", permissionSchema);