import mongoose, { Schema, models } from "mongoose";

const userGuideGroupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
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
  },
  { timestamps: true },
);

userGuideGroupSchema.index({ deletedAt: 1, sortOrder: 1, name: 1 });

export default models.UserGuideGroup ||
  mongoose.model("UserGuideGroup", userGuideGroupSchema);
