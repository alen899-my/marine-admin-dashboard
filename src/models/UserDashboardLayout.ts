import mongoose, { Schema, models } from "mongoose";

const userDashboardLayoutSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    /** Ordered list of section IDs */
    sectionOrder: {
      type: [String],
      default: [],
    },

    /** Per-section widget ordering: { [sectionId]: widgetId[] } */
    widgetOrders: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    /** Per-widget height overrides: { [widgetId]: number } */
    widgetHeights: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    /** Per-widget column-span overrides: { [widgetId]: { [columnCount]: number } } */
    widgetSpans: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

export default models.UserDashboardLayout ||
  mongoose.model("UserDashboardLayout", userDashboardLayoutSchema);
