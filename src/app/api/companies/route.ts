import { auth } from "@/auth"; // Ensure this matches your Auth.js/NextAuth path
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";
import User from "@/models/User";
import Vessel from "@/models/Vessel";
import { put } from "@vercel/blob";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { handleUpload } from "@/lib/handleUpload";


// --- GET COMPANIES (LIST / SEARCH / PAGINATE) ---
export async function GET(req: NextRequest) {
  try {
    // 1. Get current user session
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = session;
    const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
    const userCompanyId = user.company?.id;

    await dbConnect();
    const { searchParams } = new URL(req.url);

    
    const query: any = { deletedAt: null };

    if (!isSuperAdmin) {
      
      if (!userCompanyId) {
        return NextResponse.json(
          { error: "Forbidden: No company assigned to your profile." },
          { status: 403 },
        );
      }
      // Force filter to ONLY their company
      query._id = userCompanyId;
    } else {
      // Super Admin: Perform standard permission check for the management list
      const authz = await authorizeRequest("company.view");
      if (!authz.ok) return authz.response;
    }
    // =========================================================

    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    if (status !== "all") query.status = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { contactName: { $regex: search, $options: "i" } },
        { contactEmail: { $regex: search, $options: "i" } },
      ];
    }

    if (startDate || endDate) {
      const dateQuery: any = {};
      if (startDate) dateQuery.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.$lte = end;
      }
      query.createdAt = dateQuery;
    }

    const total = await Company.countDocuments(query);

    //  POPULATE audit fields so names appear in the View modal
    const companies = await Company.find(query)
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      data: companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET COMPANIES ERROR →", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 },
    );
  }
}
// --- CREATE COMPANY (POST) ---
export async function POST(req: NextRequest) {
  try {
    // 1. Authorization Check
    const authz = await authorizeRequest("company.create");
    if (!authz.ok) return authz.response;

    const session = await auth();
    const currentUserId = session?.user?.id;

    await dbConnect();

    // 2. Parse FormData
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const contactName = formData.get("contactName") as string;
    const contactEmail = formData.get("contactEmail") as string;
    const status = (formData.get("status") as string) || "active";

    const userIdsRaw = formData.get("userIds") as string;
    const vesselIdsRaw = formData.get("vesselIds") as string;
    let userIds: string[] = [];
    let vesselIds: string[] = [];
    try {
      if (userIdsRaw) userIds = JSON.parse(userIdsRaw);
      if (vesselIdsRaw) vesselIds = JSON.parse(vesselIdsRaw);
    } catch (e) {
      console.warn("Failed to parse linked IDs JSON", e);
    }

    // 3. Handle Logo Upload
    const file = formData.get("logo") as File | null;
    let logoUrl = "";

    if (file && file.size > 0) {
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Logo exceeds 2MB limit." },
          { status: 400 }
        );
      }
      try {
        const uploaded = await handleUpload(file, "companies");
        logoUrl = uploaded.url;
      } catch (err) {
        console.error("Company logo upload failed:", err);
        return NextResponse.json(
          { error: "Failed to upload logo." },
          { status: 500 }
        );
      }
    }

    // 4. Validations
    if (!name || !email) {
      return NextResponse.json(
        { error: "Missing Name or Email" },
        { status: 400 }
      );
    }

    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return NextResponse.json(
        { error: "A company with this email already exists" },
        { status: 409 }
      );
    }

    // 5. Save Company
    const newCompany = await Company.create({
      name,
      email,
      phone,
      address,
      contactName,
      contactEmail,
      logo: logoUrl || null,
      status,
      createdBy: currentUserId,
      updatedBy: currentUserId,
    });

    // 6. Relationship Linking
    if (userIds.length > 0) {
      await User.updateMany(
        { _id: { $in: userIds } },
        { $set: { companyId: newCompany._id } }
      );
    }

    if (vesselIds.length > 0) {
      await Vessel.updateMany(
        { _id: { $in: vesselIds } },
        { $set: { companyId: newCompany._id } }
      );
    }

    return NextResponse.json(
      { success: true, companyId: newCompany._id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("CREATE COMPANY ERROR →", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}