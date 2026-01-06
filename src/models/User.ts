import mongoose, { Schema, models } from "mongoose";

const userSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: false },
    password: { type: String, required: true },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
  
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role", 
      required: true,
    },


    additionalPermissions: {
      type: [String],
      default: [],
    },

  
    excludedPermissions: {
      type: [String],
      default: [],
    },

    assignedVesselId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vessel",
      default: null,
    },
    profilePicture: { 
      type: String, 
      default: null 
    },

    status: {
      type: String,
      enum: ["inactive", "active", "banned"], // Updated to match your requirements
      default: "active",
    },

    lastLoginAt: { type: Date, default: null }, // Renamed to match your requested 'last_login_at'
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Number, default: null },
  },
  { timestamps: true }
);

export default models.User || mongoose.model("User", userSchema);