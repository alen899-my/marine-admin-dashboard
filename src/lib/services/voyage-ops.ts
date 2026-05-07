import { dbConnect } from "@/lib/db";
import Voyage from "@/models/Voyage";
import ReportDaily from "@/models/ReportDaily";
import PreArrival from "@/models/PreArrival";
import Vessel from "@/models/Vessel";

// ─────────────────────────────────────────────────────────────────────────────
// Return shapes
// ─────────────────────────────────────────────────────────────────────────────

export interface ActiveVoyageRow {
  voyageId: string;
  vesselName: string;
  voyageNo: string;
  status: string;
  loadPort: string;
  dischargePort: string;
  eta: string | null;
  lastNoonDate: string | null;
}

export interface NoonReportRow {
  reportId: string;
  vesselName: string;
  reportDate: string;
  lat: string;
  long: string;
  distLast24h: number;
  vlsfo: number;
  lsmgo: number;
}

export interface PreArrivalRow {
  requestId: string;
  vesselName: string;
  portName: string;
  eta: string | null;
  dueDate: string | null;
  status: string;
  pendingDocs: number;
}

export interface VoyageOpsData {
  activeVoyages: ActiveVoyageRow[];
  noonReports: NoonReportRow[];
  preArrivals: PreArrivalRow[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function toISO(d: Date | null | undefined): string | null {
  return d ? new Date(d).toISOString() : null;
}

async function getVesselIdFilter(
  isSuperAdmin: boolean,
  userCompanyId: any,
  selectedCompanyId?: string
): Promise<{ vesselIds: any[] | null }> {
  if (!isSuperAdmin) {
    const vessels = await Vessel.find({
      company: userCompanyId,
      deletedAt: null,
    }).select("_id");
    return { vesselIds: vessels.map((v) => v._id) };
  }
  if (selectedCompanyId && selectedCompanyId !== "all") {
    const vessels = await Vessel.find({
      company: selectedCompanyId,
      deletedAt: null,
    }).select("_id");
    return { vesselIds: vessels.map((v) => v._id) };
  }
  return { vesselIds: null }; // super-admin, all companies
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Service
// ─────────────────────────────────────────────────────────────────────────────

export async function getVoyageOpsMetrics(
  user: any,
  selectedCompanyId?: string
): Promise<VoyageOpsData> {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = user.company?.id || user.company;

  if (!isSuperAdmin && !userCompanyId) throw new Error("No company assigned");

  const { vesselIds } = await getVesselIdFilter(
    isSuperAdmin,
    userCompanyId,
    selectedCompanyId
  );

  const vesselFilter = vesselIds ? { vesselId: { $in: vesselIds } } : {};

  // ── 1. Active Voyages ──────────────────────────────────────────────────────
  const activeVoyagesRaw = await Voyage.find({
    ...vesselFilter,
    status: "active",
    deletedAt: null,
  })
    .populate({ path: "vesselId", select: "name" })
    .select("voyageNo status route.loadPort route.dischargePort schedule.eta vesselId")
    .sort({ "schedule.eta": 1 })
    .limit(20)
    .lean();

  // Fetch last noon report date per vessel in bulk
  const activeVesselIds = activeVoyagesRaw
    .map((v: any) => v.vesselId?._id)
    .filter(Boolean);

  const lastNoonReports = await ReportDaily.aggregate([
    {
      $match: {
        vesselId: { $in: activeVesselIds },
        type: "noon",
        status: "active",
        deletedAt: null,
      },
    },
    { $sort: { reportDate: -1 } },
    {
      $group: {
        _id: "$vesselId",
        lastDate: { $first: "$reportDate" },
      },
    },
  ]);

  const lastNoonMap: Record<string, Date> = {};
  lastNoonReports.forEach((r: any) => {
    lastNoonMap[r._id.toString()] = r.lastDate;
  });

  const activeVoyages: ActiveVoyageRow[] = activeVoyagesRaw.map((v: any) => ({
    voyageId: v._id.toString(),
    vesselName: v.vesselId?.name ?? "Unknown",
    voyageNo: v.voyageNo ?? "—",
    status: v.status,
    loadPort: v.route?.loadPort ?? "—",
    dischargePort: v.route?.dischargePort ?? "—",
    eta: toISO(v.schedule?.eta),
    lastNoonDate: toISO(lastNoonMap[v.vesselId?._id?.toString()] ?? null),
  }));

  // ── 2. Latest 5 Noon Reports ───────────────────────────────────────────────
  const noonRaw = await ReportDaily.find({
    ...vesselFilter,
    type: "noon",
    status: "active",
    deletedAt: null,
  })
    .sort({ reportDate: -1 })
    .limit(5)
    .select(
      "vesselName reportDate position.lat position.long navigation.distLast24h consumption.vlsfo consumption.lsmgo"
    )
    .lean();

  const noonReports: NoonReportRow[] = noonRaw.map((r: any) => ({
    reportId: r._id.toString(),
    vesselName: r.vesselName ?? "Unknown",
    reportDate: toISO(r.reportDate) ?? "",
    lat: r.position?.lat ?? "—",
    long: r.position?.long ?? "—",
    distLast24h: r.navigation?.distLast24h ?? 0,
    vlsfo: r.consumption?.vlsfo ?? 0,
    lsmgo: r.consumption?.lsmgo ?? 0,
  }));

  // ── 3. Pre-Arrival Requests (published | sent | acknowledged) ─────────────
  const preArrivalRaw = await PreArrival.find({
    ...vesselFilter,
    status: { $in: ["draft", "published", "sent", "acknowledged"] },
  })
    .populate({ path: "vesselId", select: "name" })
    .select("requestId portName eta dueDate status documents vesselId")
    .sort({ eta: 1 })
    .limit(20)
    .lean();

  const preArrivals: PreArrivalRow[] = preArrivalRaw.map((p: any) => {
    // Count pending documents (status = "pending_review")
    let pendingDocs = 0;
    if (p.documents) {
      const docs = p.documents instanceof Map
        ? Array.from(p.documents.values())
        : Object.values(p.documents);
      pendingDocs = (docs as any[]).filter(
        (d: any) => d?.status === "pending_review"
      ).length;
    }

    return {
      requestId: p.requestId ?? p._id.toString(),
      vesselName: p.vesselId?.name ?? "Unknown",
      portName: p.portName ?? "—",
      eta: toISO(p.eta),
      dueDate: toISO(p.dueDate),
      status: p.status,
      pendingDocs,
    };
  });

  return { activeVoyages, noonReports, preArrivals };
}
