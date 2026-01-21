import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";
import User from "@/models/User";
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage";
import ReportDaily from "@/models/ReportDaily";
import { put } from "@vercel/blob";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import ReportOperational from "@/models/ReportOperational";
import Document from "@/models/Document";

// --- UPDATE COMPANY (PATCH) ---
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authorization
    const authz = await authorizeRequest("company.edit");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const { id } = await context.params;

    // 2. Parse FormData
    const formData = await req.formData();

    // 3. Find Company
    const company = await Company.findById(id);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // 4. Build Update Object
    const updateData: any = {};
    if (formData.has("name")) updateData.name = formData.get("name") as string;
    if (formData.has("email"))
      updateData.email = formData.get("email") as string;
    if (formData.has("phone"))
      updateData.phone = formData.get("phone") as string;
    if (formData.has("address"))
      updateData.address = formData.get("address") as string;
    if (formData.has("status"))
      updateData.status = formData.get("status") as string;

    if (formData.has("contactName")) {
      updateData.contactName = formData.get("contactName") as string;
    }
    if (formData.has("contactEmail")) {
      updateData.contactEmail = formData.get("contactEmail") as string;
    }

    // 5. Handle Logo Update (If a new file is provided)
    const file = formData.get("logo") as File | null;
    if (file && file.size > 0) {
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Logo exceeds 2MB limit." },
          { status: 400 }
        );
      }

      const filename = `company_${Date.now()}_${file.name.replace(/\s/g, "_")}`;

      if (process.env.NODE_ENV === "development") {
        // Local storage for Dev
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = path.join(process.cwd(), "public/uploads/companies");
        if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), buffer);
        updateData.logo = `/uploads/companies/${filename}`;
      } else {
        // Vercel Blob for Prod
        const blob = await put(filename, file, {
          access: "public",
          addRandomSuffix: true,
        });
        updateData.logo = blob.url;
      }
    }

    // 6. Update Database
    const updatedCompany = await Company.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json({ success: true, company: updatedCompany });
  } catch (error: any) {
    console.error("UPDATE COMPANY ERROR →", error);
    // Handle Duplicate Email Error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A company with this email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Update failed" },
      { status: 500 }
    );
  }
}

// --- DELETE COMPANY (SOFT DELETE) ---
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authorization
    const authz = await authorizeRequest("company.delete");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const { id } = await context.params;
    const now = new Date();

    // 2. CHECK FOR EXISTING USERS
    // We check if any user is linked to this company who is NOT already marked as 'deleted'
    const userCount = await User.countDocuments({ 
      company: id, 
      status: "active",           // Only block if there are truly "active" users
      deletedAt: null             // Ensure we ignore anyone already soft-deleted
    });

    if (userCount > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete company. There are still ${userCount} active user(s) associated with this company.` 
        }, 
        { status: 400 } // Bad Request / Conflict
      );
    }

    // 3. Perform Soft Delete on Company
    const deleted = await Company.findByIdAndUpdate(
      id,
      { 
        status: "inactive", 
        deletedAt: now 
      },
      { new: true }
    );

    if (!deleted) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // 4. RELATIONSHIP CASCADING (Vessels, Voyages, Reports)
    // Since we know userCount is 0, we don't need to update Users, 
    // but we still deactivate vessels and their related data.
    const vessels = await Vessel.find({ company: id }).select("_id");
    const vesselIds = vessels.map((v) => v._id);

    await Promise.all([
      Vessel.updateMany(
        { company: id }, 
        { $set: { status: "inactive", deletedAt: now } }
      ),
      Voyage.updateMany(
        { vesselId: { $in: vesselIds } }, 
        { $set: { deletedAt: now } }
      ),
      ReportDaily.updateMany(
        { vesselId: { $in: vesselIds } },
        { $set: { deletedAt: now } }
      ),
      ReportOperational.updateMany(
        { vesselId: { $in: vesselIds } },
        { $set: { deletedAt: now } }
      ),
      Document.updateMany(
        { vesselId: { $in: vesselIds } },
        { $set: { deletedAt: now } }
      )
    ]);

    return NextResponse.json({
      success: true,
      message: "Company and associated maritime data deactivated successfully",
    });
  } catch (error) {
    console.error("DELETE COMPANY ERROR →", error);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}
