import mongoose, { Schema, models } from "mongoose";

const userGuideSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "UserGuideGroup",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: "",
    },
    roleContents: {
      type: Map,
      of: String,
      default: {},
    },
    assignedRoles: [{
      type: mongoose.Schema.Types.Mixed,
    }],
    
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

userGuideSchema.index({ deletedAt: 1, groupId: 1, title: 1 });

export default models.UserGuide || mongoose.model("UserGuide", userGuideSchema);
