import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";
import Document from "@/models/Document";
import ReportDaily from "@/models/ReportDaily";
import ReportOperational from "@/models/ReportOperational";
import Role from "@/models/Role";
import User from "@/models/User";
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage";

export async function getDashboardMetrics(
  user: any,
  selectedCompanyId?: string,
) {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const isOpStaff = user.role?.toLowerCase() === "op-staff";
  const userCompanyId = user.company?.id || user.company; // Handle populated or ID string
  const userId = user.id;

  // Base Filters
  const filter: any = { status: "active", deletedAt: null };
  const companyFilter: any = { status: "active", deletedAt: null };

  // --- LOGIC COPIED FROM YOUR API ROUTE ---
  if (!isSuperAdmin) {
    if (!userCompanyId) throw new Error("No company assigned");

    const reportFilter: any = { status: "active", deletedAt: null };

    if (isOpStaff) {
      reportFilter.createdBy = userId;
    } else {
      const companyVessels = await Vessel.find({
        company: userCompanyId,
        status: "active",
        deletedAt: null,
      }).select("_id");
      reportFilter.vesselId = { $in: companyVessels.map((v) => v._id) };
    }

    companyFilter.company = userCompanyId;
    Object.assign(filter, reportFilter);
  } else if (selectedCompanyId && selectedCompanyId !== "all") {
    const companyVessels = await Vessel.find({
      company: selectedCompanyId,
      status: "active",
      deletedAt: null,
    }).select("_id");
    filter.vesselId = { $in: companyVessels.map((v) => v._id) };
    companyFilter.company = selectedCompanyId;
  }

  let superAdminRoleId = null;
  if (!isSuperAdmin) {
    const saRole = await Role.findOne({
      name: { $regex: /^super-admin$/i },
    }).select("_id");
    superAdminRoleId = saRole?._id;
  }

  const [
    dailyNoon,
    departure,
    arrival,
    nor,
    cargoStowage,
    cargoDocuments,
    totalVessels,
    totalVoyages,
    totalUsers,
    totalCompanies,
  ] = await Promise.all([
    ReportDaily.countDocuments({ ...filter, type: "noon" }),
    ReportOperational.countDocuments({ ...filter, eventType: "departure" }),
    ReportOperational.countDocuments({ ...filter, eventType: "arrival" }),
    ReportOperational.countDocuments({ ...filter, eventType: "nor" }),
    Document.countDocuments({ ...filter, documentType: "stowage_plan" }),
    Document.countDocuments({ ...filter, documentType: "cargo_documents" }),
    Vessel.countDocuments({
      status: "active",
      deletedAt: null,
      ...(isSuperAdmin && (!selectedCompanyId || selectedCompanyId === "all")
        ? {}
        : { company: companyFilter.company }),
    }),
    Voyage.countDocuments({
      status: "active",
      deletedAt: null,
      ...(filter.vesselId ? { vesselId: filter.vesselId } : {}),
      ...(isOpStaff ? { createdBy: userId } : {}),
    }),
    User.countDocuments({
      status: "active",
      deletedAt: null,
      ...(isSuperAdmin && (!selectedCompanyId || selectedCompanyId === "all")
        ? {}
        : { company: companyFilter.company }),
      ...(!isSuperAdmin && superAdminRoleId
        ? { role: { $ne: superAdminRoleId } }
        : {}),
    }),
    Company.countDocuments({
      status: "active",
      deletedAt: null,
      ...(isSuperAdmin && (!selectedCompanyId || selectedCompanyId === "all")
        ? {}
        : { _id: companyFilter.company }),
    }),
  ]);

  return {
    dailyNoon,
    departure,
    arrival,
    nor,
    cargoStowage,
    cargoDocuments,
    vesselCount: totalVessels,
    voyageCount: totalVoyages,
    userCount: totalUsers,
    companyCount: totalCompanies,
  };
}
