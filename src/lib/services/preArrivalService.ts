
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

  const query: Record<string, any> = {};

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
      .populate("vesselId", "name")
      .populate("voyageId", "voyageNo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
  ]);

  const dataWithStats = preArrivals.map((pack: any) => {
    const rawDocs = pack.documents instanceof Map 
      ? Object.fromEntries(pack.documents) 
      : pack.documents || {};

    const uploadedCount = Object.values(rawDocs).filter((d: any) => !!d.fileUrl).length;
    
    return { 
      ...pack, 
      documents: rawDocs, 
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

  const data = await PreArrival.findById(id)
    .populate({ path: "vesselId", select: "name" })
    .lean();

  if (!data) return null;

  const docs = data.documents instanceof Map 
    ? Object.fromEntries(data.documents) 
    : data.documents || {};

  return {
    ...data,
    documents: docs,
  };
}

export async function generatePreArrivalZip(id: string) {
  await dbConnect();

  const data = await PreArrival.findById(id).lean();
  if (!data) return null;

  const voyageDocs = data.documents instanceof Map 
    ? Object.fromEntries(data.documents) 
    : data.documents || {};
  
  const zip = new JSZip();
  const fetchPromises: Promise<void>[] = [];

  for (const [docKey, doc] of Object.entries(voyageDocs) as [string, any][]) {
    if (doc.status === "approved" && doc.fileUrl) {
      fetchPromises.push(
        (async () => {
          try {
            const res = await fetch(doc.fileUrl);
            if (res.ok) {
              const buffer = await res.arrayBuffer();
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

  await Promise.all(fetchPromises);
  
  return await zip.generateAsync({ type: "uint8array" });
}
