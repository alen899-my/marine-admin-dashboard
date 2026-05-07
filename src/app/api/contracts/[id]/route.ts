import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Contract from "@/models/Contract";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeRequest("contracts.delete");
    if (!authz.ok) return authz.response;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    if (!id || id.length !== 24) {
      return NextResponse.json({ error: "Invalid contract ID" }, { status: 400 });
    }

    await dbConnect();

    const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
    const companyId = session.user.company?.id;

    // Build query - super admins can delete any contract, tenant admins only their own
    const query: any = { _id: id, deletedAt: null };
    if (!isSuperAdmin && companyId) {
      query.company = companyId;
    } else if (!isSuperAdmin) {
      return NextResponse.json({ error: "Unable to determine company" }, { status: 400 });
    }

    const contract = await Contract.findOne(query);

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    // Hard delete
    await contract.deleteOne();

    // Also delete associated wages
    const Wage = (await import("@/models/Wage")).default;
    await Wage.deleteMany({ contractId: id });

    return NextResponse.json({ success: true, message: "Contract deleted successfully" });
  } catch (error: any) {
    console.error("DELETE CONTRACT ERROR →", error);
    return NextResponse.json({ error: "Failed to delete contract" }, { status: 500 });
  }
}
