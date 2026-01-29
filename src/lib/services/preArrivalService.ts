
import { dbConnect } from "@/lib/db";
import PreArrival from "@/models/PreArrival";
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage";
import Company from "@/models/Company";
import JSZip from "jszip";
export async function getPreArrivalData(params: {
  user: any;
  search?: string;
  status?: string;
  vesselId?: string;
  companyId?: string;
  page?: number;
  limit?: number;
  init?: boolean;
}) {
  await dbConnect();
  
  const { user, search = "", status = "all", vesselId, companyId, page = 1, limit = 10, init = false } = params;
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = user.company?.id;
  const skip = (page - 1) * limit;

  const query: Record<string, any> = { deletedAt: null };

  // Authorization scoping
  if (!isSuperAdmin) {
    if (!userCompanyId) throw new Error("Access denied: No company assigned");
    const companyVessels = await Vessel.find({ company: userCompanyId, deletedAt: null }).select("_id");
    const companyVesselIds = companyVessels.map((v) => v._id.toString());
    query.vesselId = vesselId && companyVesselIds.includes(vesselId) ? vesselId : { $in: companyVesselIds };
  } else {
    if (companyId && companyId !== "all") {
      const targetVessels = await Vessel.find({ company: companyId, deletedAt: null }).select("_id");
      query.vesselId = { $in: targetVessels.map(v => v._id) };
    } else if (vesselId) {
      query.vesselId = vesselId;
    }
  }

  if (status !== "all") query.status = status;
  if (search) {
    query.$or = [{ portName: { $regex: search, $options: "i" } }, { requestId: { $regex: search, $options: "i" } }];
  }

  const [total, preArrivals] = await Promise.all([
    PreArrival.countDocuments(query),
    PreArrival.find(query)
      .populate("vesselId", "name certificates")
      .populate("voyageId", "voyageNo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
  ]);

  // ✅ ENHANCED: Full Hydration for the list refresh
  const dataWithStats = preArrivals.map((pack: any) => {
    // 1. Convert Map to Object if necessary
    const rawDocs = pack.documents ? (pack.documents instanceof Map ? Object.fromEntries(pack.documents) : pack.documents) : {};
    const vesselCerts = pack.vesselId?.certificates || [];
    
    // 2. Perform Hydration (Merging Master Library Data)
    const hydratedDocs: Record<string, any> = { ...rawDocs };
    
    Object.keys(hydratedDocs).forEach((docType) => {
      const doc = hydratedDocs[docType];

      // If it's a library doc, pull live names and URLs from the populated vesselId
      if (doc.docSource === "vessel_library") {
        const liveCert = vesselCerts.find((c: any) => 
            (doc.vesselCertId && c._id.toString() === doc.vesselCertId.toString()) || 
            (c.docType === docType)
        );

        if (liveCert) {
          hydratedDocs[docType] = {
            ...doc,
            name: liveCert.name,
            fileName: liveCert.fileName,
            fileUrl: liveCert.fileUrl,
            owner: liveCert.owner || "office",
          };
        }
      }
    });

    // 3. Calculate stats based on hydrated state
    const uploadedCount = Object.values(hydratedDocs).filter((d: any) => !!d.fileUrl || !!d.vesselCertId).length;
    
    return { 
      ...pack, 
      documents: hydratedDocs, 
      uploadedCount 
    };
  });

  let vessels: any[] = [];
  let companies: any[] = [];
  let voyages: any[] = [];

  if (init) {
    const vesselFilter: any = { status: "active", deletedAt: null };
    if (!isSuperAdmin) vesselFilter.company = userCompanyId;
    else if (companyId && companyId !== "all") vesselFilter.company = companyId;
    
    vessels = await Vessel.find(vesselFilter).select("_id name company status").sort({ name: 1 }).lean();
    companies = isSuperAdmin ? await Company.find({ deletedAt: null }).select("_id name status").lean() : [];
    
    const activeVoyages = await Voyage.find({ 
      vesselId: { $in: vessels.map(v => v._id) }, 
      status: "active", 
      deletedAt: null 
    }).select("vesselId voyageNo").lean();
    voyages = activeVoyages.map(voy => ({ _id: voy._id, vesselId: voy.vesselId, voyageNo: voy.voyageNo }));
  }

  return {
    data: dataWithStats,
    vessels,
    companies,
    voyages,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
}
export async function getPreArrivalById(id: string) {
  await dbConnect();

  // 1. Fetch the Pre-Arrival voyage pack
  const data = await PreArrival.findById(id)
    .populate({
      path: "vesselId",
      select: "name certificates",
    })
    .lean();

  if (!data) return null;

  const vesselCerts = (data.vesselId as any)?.certificates || [];
  const voyageDocs = data.documents || {};

  // Create a working copy for formatting the hydrated response
  const combinedDocs: Record<string, any> = { ...voyageDocs };

  // 2. HYDRATION: Replace NULL/Missing fields with LIVE strings from Vessel Master
  Object.keys(combinedDocs).forEach((docType) => {
    const doc = combinedDocs[docType];

    if (doc.docSource === "vessel_library") {
      const liveCert = vesselCerts.find((c: any) => 
          (doc.vesselCertId && c._id.toString() === doc.vesselCertId.toString()) || 
          (c.docType === docType)
      );

      if (liveCert) {
        combinedDocs[docType] = {
          ...doc,
          name: liveCert.name,
          owner: liveCert.owner || "office",
          fileName: liveCert.fileName,
          fileUrl: liveCert.fileUrl,
        };
      }
    }
  });

  // 3. AUTO-INJECT: Show master documents that haven't been "added" yet
  vesselCerts.forEach((cert: any) => {
    if (!combinedDocs[cert.docType]) {
      combinedDocs[cert.docType] = {
        name: cert.name,
        owner: cert.owner || "office",
        fileName: cert.fileName,
        fileUrl: cert.fileUrl,
        note: "",
        docSource: "vessel_library",
        vesselCertId: cert._id,
        status: "approved", 
        uploadedAt: cert.updatedAt,
        uploadedBy: cert.uploadedBy
      };
    }
  });

  return {
    ...data,
    documents: combinedDocs,
  };
}
export async function generatePreArrivalZip(id: string) {
  await dbConnect();

  // 1. Fetch the data - your JSON shows everything is already inside 'documents'
  const data = await PreArrival.findById(id).lean();
  if (!data) return null;

  // Handle Mongoose Lean Map
  const voyageDocs = data.documents instanceof Map 
    ? Object.fromEntries(data.documents) 
    : data.documents || {};
  
  const zip = new JSZip();
  const fetchPromises: Promise<void>[] = [];

  // 2. Simply iterate through everything in the 'documents' object
  for (const [docKey, doc] of Object.entries(voyageDocs) as [string, any][]) {
    
    // ✅ Rule: If it's approved and has a URL, we include it
    if (doc.status === "approved" && doc.fileUrl) {
      fetchPromises.push(
        (async () => {
          try {
            const res = await fetch(doc.fileUrl);
            if (res.ok) {
              const buffer = await res.arrayBuffer();
              
              // Use the fileName from the DB (e.g., "file1.xlsx"), 
              // or fall back to the doc name/key
              const safeName = doc.fileName || `${doc.name || docKey}.pdf`;
              
              zip.file(safeName, buffer);
            }
          } catch (err) {
            console.error(`Download failed for ${docKey}:`, err);
          }
        })()
      );
    }
  }

  // 3. Wait for all files to be fetched
  await Promise.all(fetchPromises);
  
  // 4. Return the ZIP buffer
  return await zip.generateAsync({ type: "uint8array" });
}