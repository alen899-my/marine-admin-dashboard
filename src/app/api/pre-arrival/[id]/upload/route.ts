import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import PreArrival from "@/models/PreArrival";
import Vessel from "@/models/Vessel";
import { uploadFile } from "@/lib/upload-provider";
import { authorizeRequest } from "@/lib/authorizeRequest";

const OFFICE_LIBRARY_DOCS = [
  "registry_cert", "tonnage_cert", "isps_ship", "isps_officer", 
  "pi_cert", "sanitation_cert", "msm_cert", "hull_machinery", 
  "safety_equipment", "medical_chest", "ships_particulars", "security_report"
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeRequest("prearrival.upload");
    if (!authz.ok || !authz.session) {
      return authz.response || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = authz.session.user.id;
    const userRole = authz.session.user.role?.toLowerCase();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const docId = formData.get("docId") as string; 
    const docName = formData.get("name") as string; 
    const owner = formData.get("owner") as string; 
    const note = formData.get("note") as string;

    await dbConnect();
    
    const preArrival = await PreArrival.findById(id).select("vesselId");
    if (!preArrival) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    const isLibraryDoc = OFFICE_LIBRARY_DOCS.includes(docId);
    const isAdmin = userRole === "admin" || userRole === "super-admin";

    let updateData: any = {};
    let fileInfo: any = null;

    // 1. File Upload Logic
    if (file && file.size > 0) {
      // Library docs (Office) -> Vessel folder. Onboard docs (Ship) -> Pre-Arrival folder.
      const folder = isLibraryDoc ? `vessels/${preArrival.vesselId}` : `pre-arrival/${id}`;
      const uploadResult = await uploadFile(file, folder);
      
      fileInfo = {
        name: uploadResult.name,
        url: uploadResult.url,
        size: uploadResult.size
      };
      
      // ✅ LOGIC: Only save physical file info to PreArrival if it's NOT a library doc
      if (!isLibraryDoc) {
        updateData[`documents.${docId}.fileName`] = fileInfo.name;
        updateData[`documents.${docId}.fileUrl`] = fileInfo.url;
        updateData[`documents.${docId}.fileSize`] = fileInfo.size;
      }
    }

    // 2. Prepare Metadata for PreArrival
    // For library docs, we omit 'name' and 'owner' from PreArrival DB 
    // to prevent duplication, as they exist in Vessel Library.
    if (!isLibraryDoc && docName) updateData[`documents.${docId}.name`] = docName;
    if (!isLibraryDoc && owner) updateData[`documents.${docId}.owner`] = owner;
    
    updateData[`documents.${docId}.docSource`] = isLibraryDoc ? "vessel_library" : "onboard_upload";
    updateData[`documents.${docId}.note`] = note || "";
    const pushData: any = {};
    if (note) {
      pushData[`documents.${docId}.rejectionHistory`] = {
        message: note,
        role: "ship", // Ship users are sending this note
        createdAt: new Date(),
      };
    } else if (file) {
      // Log that a new file was uploaded
      pushData[`documents.${docId}.rejectionHistory`] = {
        message: `New file uploaded: ${file.name}`,
        role: "ship",
        createdAt: new Date(),
      };
    }
    const shouldAutoApprove = isLibraryDoc || owner === "office";
   updateData[`documents.${docId}.status`] = shouldAutoApprove ? "approved" : "pending_review";
    updateData[`documents.${docId}.uploadedBy`] = userId;
    updateData[`documents.${docId}.uploadedAt`] = new Date();
    updateData[`updatedBy`] = userId;

    // 3. Handle Vessel Library Sync (Admin Only)
    if (isLibraryDoc && isAdmin) {
      const certUpdate: any = {
        docType: docId,
        name: docName, 
        owner: owner || "office",
        note: note || "", 
        updatedAt: new Date(),
        uploadedBy: userId
      };

      if (fileInfo) {
        certUpdate.fileName = fileInfo.name;
        certUpdate.fileUrl = fileInfo.url;
      }

      // Upsert into Vessel certificates array
      const vesselUpdate = await Vessel.findOneAndUpdate(
        { _id: preArrival.vesselId, "certificates.docType": docId },
        { $set: { "certificates.$": certUpdate } },
        { new: true }
      );

      let finalCertId;
      if (!vesselUpdate) {
        const added = await Vessel.findByIdAndUpdate(
          preArrival.vesselId,
          { $addToSet: { certificates: certUpdate } },
          { new: true }
        );
        finalCertId = added.certificates.find((c: any) => c.docType === docId)?._id;
      } else {
        finalCertId = vesselUpdate.certificates.find((c: any) => c.docType === docId)?._id;
      }

      // ✅ REFERENCE LOGIC: Save ONLY the pointer in PreArrival
      updateData[`documents.${docId}.vesselCertId`] = finalCertId;
      updateData[`documents.${docId}.fileName`] = null;
      updateData[`documents.${docId}.fileUrl`] = null;
    }

    // 4. Update the Pre-Arrival record
   const updatedRequest = await PreArrival.findByIdAndUpdate(
      id,
      { 
        $set: updateData,
        ...(Object.keys(pushData).length > 0 ? { $push: pushData } : {}) // ✅ ADD THIS
      },
      { new: true, lean: true }
    );

    // 5. HYDRATION: Return live strings to the frontend for UI icons/links
    // This prevents the "File Synced" placeholder by giving the real name back.
    const responseDoc = (updatedRequest.documents as any)[docId];

    if (isLibraryDoc && responseDoc.vesselCertId) {
      const vessel = await Vessel.findById(preArrival.vesselId).select("certificates").lean();
      const liveCert = vessel?.certificates?.find((c: any) => 
        c._id.toString() === responseDoc.vesselCertId.toString() || c.docType === docId
      );
      
      if (liveCert) {
        responseDoc.name = liveCert.name;
        responseDoc.owner = liveCert.owner;
        responseDoc.fileName = liveCert.fileName;
        responseDoc.fileUrl = liveCert.fileUrl;
      }
    }

    return NextResponse.json({ 
      success: true, 
      document: responseDoc 
    });

  } catch (error: any) {
    console.error("PATCH Document Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}