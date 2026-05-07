export interface LeaveTypeRecord {
  _id: string;
  companyId: string;
  companyName?: string;
  name: string;
  code: string;
  type: string;
  isCarryForward: boolean;
  maxCarryForward: number;
  maxDays: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveTypeFormValues {
  companyId: string;
  name: string;
  code: string;
  type: string;
  isCarryForward: boolean;
  maxCarryForward: number;
  maxDays: number;
  status: string;
}

export function createEmptyLeaveTypeForm(): LeaveTypeFormValues {
  return {
    companyId: "",
    name: "",
    code: "",
    type: "paid",
    isCarryForward: false,
    maxCarryForward: 0,
    maxDays: 0,
    status: "active",
  };
}

export function toLeaveTypePayload(formData: LeaveTypeFormValues) {
  return {
    companyId: formData.companyId,
    name: formData.name.trim(),
    code: formData.code.trim().toUpperCase(),
    type: formData.type,
    status: formData.status,
    isCarryForward: formData.isCarryForward,
    maxCarryForward: Number(formData.isCarryForward ? formData.maxCarryForward : 0),
    maxDays: Number(formData.maxDays),
  };
}

export function toLeaveTypeFormValues(record: LeaveTypeRecord): LeaveTypeFormValues {
  return {
    companyId: record.companyId || "",
    name: record.name || "",
    code: record.code || "",
    type: record.type || "paid",
    isCarryForward: !!record.isCarryForward,
    maxCarryForward: record.maxCarryForward || 0,
    maxDays: record.maxDays || 0,
    status: record.status || "active",
  };
}
