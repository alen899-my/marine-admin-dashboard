import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import PreArrival from "@/models/PreArrival";
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage";
import Company from "@/models/Company";
import User from "@/models/User";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { auth } from "@/auth";
import { preArrivalSchema } from "@/lib/validations/preArrival";
import { getPreArrivalData } from "@/lib/services/preArrivalService";
const sendResponse = (status: number, message: string, data: any = null, success: boolean = true) => {
  return NextResponse.json({ success, message, ...data }, { status });
};

export async function GET(req: Request) {
  try {
    const authz = await authorizeRequest("prearrival.view");
    if (!authz.ok || !authz.session) return authz.response;

    const { searchParams } = new URL(req.url);
    const result = await getPreArrivalData({
      user: authz.session.user,
      init: searchParams.get("init") === "true",
      search: searchParams.get("search") || "",
      status: searchParams.get("status") || "all",
      vesselId: searchParams.get("vesselId") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
export async function POST(req: Request) {
  try {
    const authz = await authorizeRequest("prearrival.create");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const session = await auth();
    const body = await req.json();

    // 1. Validate against the schema (Ensure your Joi schema has voyageId as optional or removed)
    const { error, value } = preArrivalSchema.validate(body);
    if (error) return NextResponse.json({ error: error.details[0].message }, { status: 400 });

    // 2. Prevent duplicate Request IDs
    const existingId = await PreArrival.findOne({ requestId: value.requestId }).select("_id").lean();
    if (existingId) return NextResponse.json({ error: `Request ID "${value.requestId}" is already assigned.` }, { status: 409 });

    // 3. Verify Vessel existence
    const vessel = await Vessel.findById(value.vesselId).select("certificates").lean();
    if (!vessel) return NextResponse.json({ error: "Vessel not found." }, { status: 404 });

    // ✅ REFERENCE-ONLY INITIALIZATION (Master Library Sync)
    const initialDocuments: Record<string, any> = {};

    if (vessel.certificates && vessel.certificates.length > 0) {
      vessel.certificates.forEach((cert: any) => {
        if (cert.fileUrl) {
          initialDocuments[cert.docType] = {
            docSource: "vessel_library",
            vesselCertId: cert._id,
            fileName: null,
            fileUrl: null,
            status: "pending_review", 
            note: "",
            uploadedBy: cert.uploadedBy || session?.user?.id,
            uploadedAt: cert.updatedAt || new Date(),
          };
        }
      });
    }

   
   const { voyageId, voyageNo, ...restOfValue } = value;

    const payload = {
      ...restOfValue, // ✅ This now spreads 'status' from the validation value
      documents: initialDocuments,
     
      status: restOfValue.status || "draft", 
      isLocked: false,
      createdBy: session?.user?.id,
      updatedBy: session?.user?.id,
    };

    const newRequest = await PreArrival.create(payload);
    return NextResponse.json(newRequest, { status: 201 });
    
  } catch (error: any) {
    console.error("PRE-ARRIVAL POST ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}