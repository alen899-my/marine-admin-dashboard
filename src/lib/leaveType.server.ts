import { LeaveTypeRecord } from "./leaveType";

export function hydrateLeaveTypeRecord(record: any): LeaveTypeRecord {
  return {
    _id: String(record._id || ""),
    companyId: String(record.companyId?._id || record.companyId || ""),
    companyName: record.companyId?.name || "",
    name: record.name || "",
    code: record.code || "",
    type: record.type || "paid",
    isCarryForward: !!record.isCarryForward,
    maxCarryForward: Number(record.maxCarryForward) || 0,
    maxDays: Number(record.maxDays) || 0,
    status: record.status || "active",
    createdAt: record.createdAt ? new Date(record.createdAt).toISOString() : undefined,
    updatedAt: record.updatedAt ? new Date(record.updatedAt).toISOString() : undefined,
  };
}
