import mongoose, { Schema, models } from "mongoose";

const userSessionSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isValid: {
      type: Boolean,
      default: true,
      index: true,
    },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    loginAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    invalidatedAt: { type: Date, default: null },
    invalidatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: false }
);

// Auto-expire sessions after 8 days (1 day buffer over JWT maxAge of 7 days)
userSessionSchema.index(
  { loginAt: 1 },
  { expireAfterSeconds: 8 * 24 * 60 * 60 }
);

export default models.UserSession ||
  mongoose.model("UserSession", userSessionSchema);
