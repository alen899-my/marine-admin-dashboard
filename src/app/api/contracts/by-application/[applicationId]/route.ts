import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Contract from "@/models/Contract";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const authz = await authorizeRequest("contracts.view");
    if (!authz.ok) return authz.response;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { applicationId } = await params;

    if (!applicationId || !mongoose.isValidObjectId(applicationId)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 });
    }

    await dbConnect();

    const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
    const companyId = session.user.company?.id;

    const query: any = {
      applicationId: new mongoose.Types.ObjectId(applicationId),
      deletedAt: null,
    };

    if (!isSuperAdmin && companyId) {
      query.company = companyId;
    }

    const contract = await Contract.findOne(query)
      .populate("vesselId", "name _id")
      .lean();

    if (!contract) {
      return NextResponse.json(
        { error: "No contract found for this application" },
        { status: 404 }
      );
    }

    return NextResponse.json({ contract });
  } catch (error: any) {
    console.error("GET CONTRACT BY APPLICATION ERROR →", error);
    return NextResponse.json({ error: "Failed to fetch contract" }, { status: 500 });
  }
}