import mongoose, { Schema, models } from "mongoose";

const userSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: false }, 
    password: { type: String, required: true }, 
    
    role: {
      type: String,
      enum: [
        "superintendent",
        "ops_manager",
        "crew_manager",
        "vessel_user",
        "admin"
      ],
      default: "crew_manager", 
      required: true,
    },

    assignedVesselId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vessel",
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    lastLogin: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Number, default: null },
  },
  { timestamps: true }
);

export default models.User || mongoose.model("User", userSchema);