import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import SeaTemplate from "@/models/Seatemplate";
import { getNextCopyName } from "@/lib/utils";

type LeanTemplateCopy = {
  name: string;
  _id?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedBy?: unknown;
  [key: string]: unknown;
};

type SessionUserWithId = {
  id?: string;
};

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authz = await authorizeRequest("templates.create");
    if (!authz.ok) return authz.response;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { id } = await params;
    const template = await SeaTemplate.findOne({ _id: id, deletedAt: null }).lean<LeanTemplateCopy>();
    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }

    const existingTemplates = await SeaTemplate.find({ deletedAt: null }).select("name").lean();
    const existingNames = existingTemplates.map((t) => t.name);

    const duplicatePayload: Record<string, unknown> = { ...template };
    delete duplicatePayload._id;
    delete duplicatePayload.createdAt;
    delete duplicatePayload.updatedAt;
    delete duplicatePayload.updatedBy;

    const duplicate = await SeaTemplate.create({
      ...duplicatePayload,
      name: getNextCopyName(template.name, existingNames),
      isDefault: false,
      createdBy: (session.user as SessionUserWithId).id,
    });

    return NextResponse.json({
      success: true,
      data: JSON.parse(JSON.stringify(duplicate)),
    });
  } catch (error) {
    console.error("POST /api/sea-templates/[id]/duplicate", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
