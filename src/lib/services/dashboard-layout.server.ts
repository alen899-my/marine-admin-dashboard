import { dbConnect } from "@/lib/db";
import UserDashboardLayout from "@/models/UserDashboardLayout";
import mongoose from "mongoose";

export interface DashboardLayoutData {
  sectionOrder: string[];
  widgetOrders: Record<string, string[]>;
  widgetHeights: Record<string, number>;
  widgetSpans: Record<string, Record<string, number>>;
}

/**
 * Fetch the saved dashboard layout for a user.
 * Returns null if no layout has been saved yet (first-time user).
 */
export async function getDashboardLayout(
  userId: string,
): Promise<DashboardLayoutData | null> {
  await dbConnect();

  const doc = await UserDashboardLayout.findOne({
    userId: new mongoose.Types.ObjectId(userId),
  })
    .select("sectionOrder widgetOrders widgetHeights widgetSpans")
    .lean();

  if (!doc) return null;

  return {
    sectionOrder: Array.isArray(doc.sectionOrder) ? doc.sectionOrder : [],
    widgetOrders:
      doc.widgetOrders && typeof doc.widgetOrders === "object"
        ? (doc.widgetOrders as Record<string, string[]>)
        : {},
    widgetHeights:
      doc.widgetHeights && typeof doc.widgetHeights === "object"
        ? (doc.widgetHeights as Record<string, number>)
        : {},
    widgetSpans:
      doc.widgetSpans && typeof doc.widgetSpans === "object"
        ? (doc.widgetSpans as Record<string, Record<string, number>>)
        : {},
  };
}

/**
 * Upsert the dashboard layout for a user.
 * Creates a new document if one doesn't exist yet.
 */
export async function saveDashboardLayout(
  userId: string,
  payload: Partial<DashboardLayoutData>,
): Promise<void> {
  await dbConnect();

  const updateData: Record<string, unknown> = {};
  if (payload.sectionOrder !== undefined)
    updateData.sectionOrder = payload.sectionOrder;
  if (payload.widgetOrders !== undefined)
    updateData.widgetOrders = payload.widgetOrders;
  if (payload.widgetHeights !== undefined)
    updateData.widgetHeights = payload.widgetHeights;
  if (payload.widgetSpans !== undefined)
    updateData.widgetSpans = payload.widgetSpans;

  if (Object.keys(updateData).length === 0) return;

  await UserDashboardLayout.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    { $set: updateData },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}
