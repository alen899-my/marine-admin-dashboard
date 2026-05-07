export type AllowanceDeductionType = "allowance" | "deduction";

export interface AllowanceDeductionRecord {
  _id: string;
  name: string;
  code: string;
  type: AllowanceDeductionType;
  company?: {
    _id: string;
    name: string;
  } | string | null;
  description: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AllowanceDeductionFormValues {
  name: string;
  code: string;
  type: AllowanceDeductionType;
  companyId: string;
  description: string;
  status: string;
}

export function createEmptyAllowanceDeductionForm(
  type: AllowanceDeductionType = "allowance",
): AllowanceDeductionFormValues {
  return {
    name: "",
    code: "",
    type,
    companyId: "",
    description: "",
    status: "active",
  };
}

export function toAllowanceDeductionPayload(
  formData: AllowanceDeductionFormValues,
) {
  return {
    ...formData,
    name: formData.name.trim(),
    code: formData.code.trim().toUpperCase(),
    companyId: formData.companyId,
    description: formData.description.trim(),
  };
}

export function toAllowanceDeductionFormValues(
  record: AllowanceDeductionRecord,
): AllowanceDeductionFormValues {
  return {
    name: record.name || "",
    code: record.code || "",
    type: record.type || "allowance",
    companyId:
      typeof record.company === "object" && record.company?._id
        ? record.company._id
        : typeof record.company === "string"
          ? record.company
          : "",
    description: record.description || "",
    status: record.status || "active",
  };
}
