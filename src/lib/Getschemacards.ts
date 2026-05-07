// src/lib/Getschemacards.ts
// Returns placeholder cards for the template builder tabs.

import {
  STATIC_PLACEHOLDER_CARDS,
  type PlaceholderCard,
} from "@/lib/seaPlaceholders";
import mongoose from "mongoose";

/**
 * Returns all placeholder cards for the SEA Template Builder.
 * Fetches dynamic allowance and deduction labels from the AllowanceDeduction master collection.
 */
export async function getSchemaCards(companyId?: string) {
  const { dbConnect } = await import("@/lib/db");
  await dbConnect();

  // Clone to avoid mutating the static constant across requests
  const cards = JSON.parse(
    JSON.stringify(STATIC_PLACEHOLDER_CARDS),
  ) as PlaceholderCard[];
  const wagesCard = cards.find((c) => c.id === "wages");

  if (!companyId || !mongoose.isValidObjectId(companyId) || !wagesCard) {
    return cards;
  }

  const AllowanceDeduction = (await import("@/models/AllowanceDeduction")).default;
  const companyObjectId = new mongoose.Types.ObjectId(companyId);
  const [allowances, deductions]: [string[], string[]] = await Promise.all([
    AllowanceDeduction.distinct("name", {
      type: "allowance",
      status: "active",
      company: companyObjectId,
    }),
    AllowanceDeduction.distinct("name", {
      type: "deduction",
      status: "active",
      company: companyObjectId,
    }),
  ]);

  if (allowances.length > 0) {
    allowances
      .filter((label: string) => Boolean(label?.trim()))
      .sort((a: string, b: string) => a.localeCompare(b))
      .forEach((label: string) => {
      if (!label) return;
      const key = `[WAGES.${label.toUpperCase().replace(/[^A-Z0-9]/g, "_")}]`;
      // Don't add if it somehow already exists as a static one
      if (!wagesCard.items.some((item) => item.key === key)) {
        wagesCard.items.push({
          key,
          label: label,
          modelField: `wages.allowances.${label}`,
        });
      }
    });
  }

  if (deductions.length > 0) {
    deductions
      .filter((label: string) => Boolean(label?.trim()))
      .sort((a: string, b: string) => a.localeCompare(b))
      .forEach((label: string) => {
        const key = `[WAGES.DEDUCTION_${label.toUpperCase().replace(/[^A-Z0-9]/g, "_")}]`;
        if (!wagesCard.items.some((item) => item.key === key)) {
          wagesCard.items.push({
            key,
            label: `Deduction: ${label}`,
            modelField: `wages.deductions.${label}`,
          });
        }
      });
  }

  return cards;
}
