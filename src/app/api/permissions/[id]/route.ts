import { dbConnect } from "@/lib/db";
import Permission from "@/models/Permission";
import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";


/* ======================================================
   PATCH: Update Permission Details
====================================================== */


export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const authz = await authorizeRequest("permission.update");
    if (!authz.ok) return authz.response;
    await dbConnect();
    
    const { id } = await params; 
    const body = await req.json();
    
    // 1. If slug is being changed, check for duplicates
    if (body.slug) {
      const duplicate = await Permission.findOne({ 
        slug: body.slug, 
        _id: { $ne: id } 
      });
      if (duplicate) {
        return NextResponse.json({ error: "Permission slug already exists" }, { status: 409 });
      }
    }

    if (body.resourceId) body.group = ""; 

    const updatedPermission = await Permission.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).populate("resourceId", "name"); 

    if (!updatedPermission) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: updatedPermission });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Type updated to Promise
) {
  try {
    const authz = await authorizeRequest("permission.delete");
    if (!authz.ok) return authz.response;
    await dbConnect();
    
    // 1. Unwrap params with await
    const { id } = await params;

    const deletedPermission = await Permission.findByIdAndDelete(id);

    if (!deletedPermission) {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Permission removed successfully",
    });
  } catch (error: any) {
    console.error("DELETE PERMISSION ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}