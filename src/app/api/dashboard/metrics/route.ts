import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server"; // ✅ Added NextRequest

// MODELS
import Company from "@/models/Company";
import Document from "@/models/Document";
import ReportDaily from "@/models/ReportDaily";
import ReportOperational from "@/models/ReportOperational";
import Role from "@/models/Role"; // ✅ Imported Role to find the Super Admin ID
import User from "@/models/User";
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // 🔒 1. Session & Multi-Tenancy Setup
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = session;
    const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
    // ✅ Identify if the user is Op-Staff
    const isOpStaff = user.role?.toLowerCase() === "op-staff";
    const userCompanyId = user.company?.id;
    const userId = user.id;

    // ✅ Get companyId from URL for Super Admin filtering
    const { searchParams } = new URL(req.url);
    const selectedCompanyId = searchParams.get("companyId");

    // 2. Build Base Query Filter
    // ✅ SUPER ADMIN: Only requires deletedAt: null (global view)
    const filter: any = { status: "active", deletedAt: null };

    // Additional filters for global entities (Users/Vessels) that don't use 'vesselId'
    const companyFilter: any = { status: "active", deletedAt: null };

    // =========================================================
    // 🔒 MULTI-TENANCY & FILTERING LOGIC
    // =========================================================
    if (!isSuperAdmin) {
      // 🔵 FOR COMPANY ADMINS & STAFF: Strictly force their own company
      if (!userCompanyId) {
        return NextResponse.json(
          { error: "Access denied: No company assigned to your profile." },
          { status: 403 },
        );
      }

      // ✅ NEW LOGIC: Separate Report Filter from Global Company Filter
      // We use 'reportFilter' for the actual document counts (Noon, Arrival, etc.)
      const reportFilter: any = { status: "active", deletedAt: null };

      if (isOpStaff) {
        // 🟠 FOR OP-STAFF: Only show records that are NOT deleted AND created by him
        reportFilter.createdBy = userId;
      } else {
        // 🔵 FOR COMPANY ADMINS: Show records that are NOT deleted AND belong to his company vessels
        const companyVessels = await Vessel.find({
          company: userCompanyId,
          status: "active",
          deletedAt: null,
        }).select("_id");

        const companyVesselIds = companyVessels.map((v) => v._id);
        reportFilter.vesselId = { $in: companyVesselIds };
      }

      companyFilter.company = userCompanyId;
      // Update the main filter used in Promise.all for reports
      Object.assign(filter, reportFilter);
    } else if (selectedCompanyId && selectedCompanyId !== "all") {
      // 🟢 FOR SUPER ADMINS (with selection): Show records NOT deleted AND in specific company
      const companyVessels = await Vessel.find({
        company: selectedCompanyId,
        status: "active",
        deletedAt: null,
      }).select("_id");

      const companyVesselIds = companyVessels.map((v) => v._id);
      filter.vesselId = { $in: companyVesselIds };
      companyFilter.company = selectedCompanyId;
    }

    // ✅ Find Super Admin Role ID to exclude from count if requester is not Super Admin
    let superAdminRoleId = null;
    if (!isSuperAdmin) {
      const saRole = await Role.findOne({
        name: { $regex: /^super-admin$/i },
      }).select("_id");
      superAdminRoleId = saRole?._id;
    }
    // =========================================================

    // 3. Fire all queries simultaneously using Promise.all with the filtered query
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
      // 1) Daily Noon (Enforces deletedAt: null + ownership/tenancy via filter)
      ReportDaily.countDocuments({ ...filter, type: "noon" }),

      // 2) Departure (Enforces deletedAt: null + ownership/tenancy via filter)
      ReportOperational.countDocuments({ ...filter, eventType: "departure" }),

      // 3) Arrival (Enforces deletedAt: null + ownership/tenancy via filter)
      ReportOperational.countDocuments({ ...filter, eventType: "arrival" }),

      // 4) NOR (Enforces deletedAt: null + ownership/tenancy via filter)
      ReportOperational.countDocuments({ ...filter, eventType: "nor" }),

      // 5) Cargo Stowage (Enforces deletedAt: null + ownership/tenancy via filter)
      Document.countDocuments({ ...filter, documentType: "stowage_plan" }),

      // 6) Cargo Documents (Enforces deletedAt: null + ownership/tenancy via filter)
      Document.countDocuments({ ...filter, documentType: "cargo_documents" }),

      // 7) Total Vessels (Filtered by status: active AND deletedAt: null)
      Vessel.countDocuments({
        status: "active",
        deletedAt: null,
        ...(isSuperAdmin && (!selectedCompanyId || selectedCompanyId === "all")
          ? {}
          : { company: companyFilter.company }),
      }),

      // 8) Total Voyages (Filtered by status: active AND deletedAt: null)
      Voyage.countDocuments({
        status: "active",
        deletedAt: null,
        ...(filter.vesselId ? { vesselId: filter.vesselId } : {}),
        ...(isOpStaff ? { createdBy: userId } : {}), // ✅ Staff only see their own active voyages
      }),

      // 9) Total Users (Filtered by status: active AND deletedAt: null)
      User.countDocuments({
        status: "active",
        deletedAt: null,
        ...(isSuperAdmin && (!selectedCompanyId || selectedCompanyId === "all")
          ? {}
          : { company: companyFilter.company }),
        // ✅ Hide Super Admins from the count for non-Super Admin users
        ...(!isSuperAdmin && superAdminRoleId
          ? { role: { $ne: superAdminRoleId } }
          : {}),
      }),

      // 10) Total Companies (Filtered by status: active AND deletedAt: null)
      Company.countDocuments({
        status: "active",
        deletedAt: null,
        ...(isSuperAdmin && (!selectedCompanyId || selectedCompanyId === "all")
          ? {}
          : { _id: companyFilter.company }),
      }),
    ]);

    // ✅ Mapping names to match the Frontend IMetrics interface
    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("METRICS API ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load metrics" },
      { status: 500 },
    );
  }
}
