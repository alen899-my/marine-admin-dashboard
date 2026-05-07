import { AllowanceDeductionRecord } from "./allowanceDeduction";

export function hydrateAllowanceDeductionRecord(
  record: any,
): AllowanceDeductionRecord {
  return {
    _id: String(record._id || ""),
    name: record.name || "",
    code: record.code || "",
    type: record.type === "deduction" ? "deduction" : "allowance",
    company:
      record.company && typeof record.company === "object"
        ? {
            _id: String(record.company._id || ""),
            name: record.company.name || "",
          }
        : record.company
          ? String(record.company)
          : null,
    description: record.description || "",
    status: record.status || "active",
    createdAt: record.createdAt ? new Date(record.createdAt).toISOString() : undefined,
    updatedAt: record.updatedAt ? new Date(record.updatedAt).toISOString() : undefined,
  };
}
