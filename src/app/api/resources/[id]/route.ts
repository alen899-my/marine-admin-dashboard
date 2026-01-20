import { dbConnect } from "@/lib/db";
import Resource from "@/models/Resource";
import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";

/* ======================================================
   PATCH: Update Resource
====================================================== */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeRequest("resource.edit");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    // Check if name is being changed and if it already exists elsewhere
    if (body.name) {
      const duplicate = await Resource.findOne({
        name: { $regex: new RegExp(`^${body.name}$`, "i") },
        _id: { $ne: id }
      });
      if (duplicate) {
        return NextResponse.json({ error: "Another resource with this name already exists" }, { status: 409 });
      }
    }

    const updated = await Resource.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updated) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeRequest("resource.delete");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const { id } = await params;

    const softDeleted = await Resource.findByIdAndUpdate(
      id,
      { 
        $set: { 
          deletedAt: new Date(), 
          status: "inactive" 
        } 
      },
      { new: true }
    );

    if (!softDeleted) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Resource moved to trash" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}