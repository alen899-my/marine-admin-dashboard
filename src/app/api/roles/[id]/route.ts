import { dbConnect } from "@/lib/db";
import Role from "@/models/Role";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
      const authz = await authorizeRequest("roles.edit");
        if (!authz.ok) return authz.response;
    await dbConnect();

    const { id } = await params;
    const body = await req.json();

    // Explicitly mapping fields for Role
    const updated = await Role.findByIdAndUpdate(
      id,
      {
        name: body.name,
        permissions: body.permissions, // Expecting array of permission slugs
        status: body.status,
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Return structure matching frontend expectation { role: ... }
    return NextResponse.json({ success: true, role: updated });
  } catch (error: any) {
    console.error("UPDATE ROLE ERROR →", error);
    
    // Optional: Handle duplicate name error specifically
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A role with this name already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
        const authz = await authorizeRequest("roles.delete");
        if (!authz.ok) return authz.response;
    await dbConnect();

    const { id } = await params;

    // ✅ 1. CHECK DEPENDENCY: Is this role assigned to any user?
    const isAssigned = await User.findOne({ role: id });

    if (isAssigned) {
      return NextResponse.json(
        { 
          error: "Cannot delete this role because it is currently assigned to one or more users. Please reassign those users first." 
        }, 
        { status: 409 } // 409 Conflict
      );
    }

    // ✅ 2. Proceed with delete if safe
    const deleted = await Role.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    console.error("DELETE ROLE ERROR →", error);
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 }
    );
  }
}