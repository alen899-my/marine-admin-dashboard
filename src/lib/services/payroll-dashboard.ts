import { dbConnect } from "@/lib/db";
import Payroll from "@/models/Payroll";
import Candidate from "@/models/Candidate";
import mongoose from "mongoose";

export async function getPayrollDashboardMetrics(user: any, selectedCompanyId?: string) {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = user.company?.id || user.company;

  const filter: any = { deletedAt: null };
  if (!isSuperAdmin) {
    if (!userCompanyId) throw new Error("No company assigned");
    filter.company = new mongoose.Types.ObjectId(userCompanyId);
  } else if (selectedCompanyId && selectedCompanyId !== "" && selectedCompanyId !== "all") {
    filter.company = new mongoose.Types.ObjectId(selectedCompanyId);
  }

  // 1. Payroll Status Bar Chart (grouped by month+year)
  const statusCounts = await Payroll.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { month: "$month", year: "$year", status: "$status" },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const groupedStatusData: Record<string, any> = {};

  statusCounts.forEach(item => {
    const key = `${monthNames[item._id.month - 1]} ${item._id.year}`;
    if (!groupedStatusData[key]) {
      groupedStatusData[key] = { monthYear: key, saved: 0, captain_verified: 0, finance_approved: 0, sortKey: item._id.year * 100 + item._id.month };
    }
    if (item._id.status in groupedStatusData[key]) {
      groupedStatusData[key][item._id.status] = item.count;
    }
  });

  const statusBarChartData = Object.values(groupedStatusData)
    .sort((a: any, b: any) => a.sortKey - b.sortKey)
    .slice(-6);

  // 2. Payroll Approval Queue (status="saved" or "captain_verified")
  const queueRaw = await Payroll.find({
    ...filter,
    status: { $in: ["saved", "captain_verified"] }
  })
    .sort({ createdAt: -1 })
    .populate("applicationId", "firstName lastName rank profilePhoto")
    .limit(10)
    .lean();

  const approvalQueue = queueRaw.map((p: any) => ({
    id: p._id.toString(),
    name: p.applicationId ? `${p.applicationId.firstName} ${p.applicationId.lastName}` : "Unknown",
    rank: p.applicationId?.rank || "N/A",
    monthYear: `${monthNames[p.month - 1]} ${p.year}`,
    netPayable: p.netPayable,
    status: p.status,
    profilePhoto: p.applicationId?.profilePhoto || null
  }));

  // 3. Monthly Payroll Cost Line Chart (last 6 months, sum of netPayable)
// Only include approved payrolls as actual cost
  const costData = await Payroll.aggregate([
    { $match: { ...filter, status: { $in: ["saved", "captain_verified", "finance_approved"] } } },
    {
      $group: {
        _id: { month: "$month", year: "$year" },
        total: { $sum: "$netPayable" }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  const costLineChartData = costData.map(item => ({
    monthYear: `${monthNames[item._id.month - 1]} ${item._id.year}`,
    amount: Math.round(item.total * 100) / 100,
    sortKey: item._id.year * 100 + item._id.month
  })).sort((a, b) => a.sortKey - b.sortKey).slice(-6);

  return {
    statusBarChartData,
    approvalQueue,
    costLineChartData
  };
}
