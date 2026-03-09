import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";
import User from "@/models/User";
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage";
import ReportDaily from "@/models/ReportDaily";
import { existsSync } from "fs";
import { NextRequest, NextResponse } from "next/server";
import ReportOperational from "@/models/ReportOperational";
import Document from "@/models/Document";
import { auth } from "@/auth";
import mongoose from "mongoose";
import { handleUpload } from "@/lib/handleUpload";
import { del } from "@vercel/blob";
import { unlink } from "fs/promises";
import path from "path";
// --- UPDATE COMPANY (PATCH) ---
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authorization
    const authz = await authorizeRequest("company.edit");
    if (!authz.ok) return authz.response;

    // 2. Authentication
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentUserId = session.user.id;

    await dbConnect();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Company ID" }, { status: 400 });
    }

    // 3. Parse FormData
    const formData = await req.formData();

    // 4. Find Company
    const company = await Company.findById(id);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // 5. Build Update Object
    const updateData: any = {
      updatedBy: currentUserId,
    };

    if (formData.has("name")) updateData.name = formData.get("name") as string;
    if (formData.has("email")) updateData.email = formData.get("email") as string;
    if (formData.has("phone")) updateData.phone = formData.get("phone") as string;
    if (formData.has("address")) updateData.address = formData.get("address") as string;
    if (formData.has("status")) updateData.status = formData.get("status") as string;
    if (formData.has("contactName")) updateData.contactName = formData.get("contactName") as string;
    if (formData.has("contactEmail")) updateData.contactEmail = formData.get("contactEmail") as string;

    // 6. Handle Logo Update
    const file = formData.get("logo") as File | null;
    if (file && file.size > 0) {
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Logo exceeds 2MB limit." },
          { status: 400 }
        );
      }
      const oldLogo = company.logo;
  if (oldLogo) {
    await deleteFile(oldLogo); // ← add this
  }
      try {
        const uploaded = await handleUpload(file, "companies");
        updateData.logo = uploaded.url;
      } catch (err) {
        console.error("Company logo upload failed:", err);
        return NextResponse.json(
          { error: "Failed to upload logo." },
          { status: 500 }
        );
      }
    }


    // 7. Update Database
    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName");

    return NextResponse.json({
      success: true,
      message: "Company updated successfully",
      company: updatedCompany,
    });
  } catch (error: any) {
    console.error("UPDATE COMPANY ERROR →", error);
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
async function deleteFile(fileUrl: string) {
  if (!fileUrl) return;
  try {
    if (process.env.UPLOAD_PROVIDER === "local") {
      let urlPath = fileUrl;
      if (fileUrl.startsWith("http")) {
        urlPath = new URL(fileUrl).pathname;
      }
      const uploadsPrefix = "/uploads/";
      if (urlPath.startsWith(uploadsPrefix)) {
        const relativePath = urlPath.slice(uploadsPrefix.length);
        const filePath = path.join(process.cwd(), "public", "uploads", relativePath);
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
      }
    } else {
      if (fileUrl.startsWith("http")) {
        await del(fileUrl);
      }
    }
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}