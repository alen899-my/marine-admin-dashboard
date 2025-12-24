import mongoose, { Schema, models } from "mongoose";

const roleSchema = new Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g., "Superintendent"
    
    // We store slugs (strings) here for faster checking
    // e.g., ["users.view", "reports.create", "vessels.edit"]
    permissions: [{ type: String }], 
    
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default models.Role || mongoose.model("Role", roleSchema);