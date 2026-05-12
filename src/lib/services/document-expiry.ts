import { dbConnect } from "@/lib/db";
import Candidate from "@/models/Candidate";
import Vessel from "@/models/Vessel";

export interface ExpiryRow {
  seafarerName: string;
  profilePhoto?: string | null;
  documentType: string;
  documentNumber: string;
  expiryDate: string; // ISO string
  daysRemaining: number; // negative = already expired
}

export interface DocumentExpiryCounts {
  expired: number;
  expiringSoon: number; // < 60 days
  valid: number;        // 60–90 days window
}

export interface DocumentExpiryData {
  rows: ExpiryRow[];
  counts: DocumentExpiryCounts;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function daysDiff(expiryDate: Date, now: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((expiryDate.getTime() - now.getTime()) / msPerDay);
}

function addRows(
  out: ExpiryRow[],
  seafarerName: string,
  docs: any[],
  docType: string,
  getNumber: (d: any) => string,
  now: Date,
  cutoff: Date,
  profilePhoto?: string | null
) {
  for (const doc of docs) {
    if (!doc.dateExpired) continue;
    const exp = new Date(doc.dateExpired);
    if (exp > cutoff) continue; // beyond 90 days — skip
    out.push({
      seafarerName,
      profilePhoto,
      documentType: docType,
      documentNumber: getNumber(doc) || "—",
      expiryDate: exp.toISOString(),
      daysRemaining: daysDiff(exp, now),
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Service
// ─────────────────────────────────────────────────────────────────────────────

export async function getDocumentExpiryAlerts(
  user: any,
  selectedCompanyId?: string
): Promise<DocumentExpiryData> {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = user.company?.id || user.company;

  // Build company filter - only active crew (not candidates/inactive)
  const candidateFilter: any = { 
    deletedAt: null,
    crew: { $nin: ["inactive", "resigned", "blacklisted"] }
  };

  if (!isSuperAdmin) {
    if (!userCompanyId) throw new Error("No company assigned");
    candidateFilter.company = userCompanyId;
  } else if (selectedCompanyId && selectedCompanyId !== "all") {
    candidateFilter.company = selectedCompanyId;
  }

  // Fetch only the fields we need
  const candidates = await Candidate.find(candidateFilter)
    .select(
      "firstName lastName profilePhoto " +
      "licences.number licences.dateExpired " +
      "passports.number passports.dateExpired " +
      "seamansBooks.number seamansBooks.dateExpired " +
      "visas.number visas.dateExpired " +
      "endorsements.name endorsements.number endorsements.dateExpired " +
      "stcwCertificates.name stcwCertificates.courseNumber stcwCertificates.dateExpired " +
      "otherCertificates.name otherCertificates.courseNumber otherCertificates.dateExpired " +
      "medicalCertExpiredDate"
    )
    .lean();

  const now = new Date();
  const cutoff = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const rows: ExpiryRow[] = [];

  for (const c of candidates) {
    const name = `${c.firstName} ${c.lastName}`;

    addRows(rows, name, c.licences ?? [], "Licence (COC/COE)", (d) => d.number, now, cutoff, c.profilePhoto);
    addRows(rows, name, c.passports ?? [], "Passport", (d) => d.number, now, cutoff, c.profilePhoto);
    addRows(rows, name, c.seamansBooks ?? [], "Seaman's Book", (d) => d.number, now, cutoff, c.profilePhoto);
    addRows(rows, name, c.visas ?? [], "Visa", (d) => d.number, now, cutoff, c.profilePhoto);
    addRows(rows, name, c.endorsements ?? [], "Endorsement", (d) => d.number || d.name, now, cutoff, c.profilePhoto);
    addRows(rows, name, c.stcwCertificates ?? [], "STCW Certificate", (d) => d.courseNumber || d.name, now, cutoff, c.profilePhoto);
    addRows(rows, name, c.otherCertificates ?? [], "Certificate", (d) => d.courseNumber || d.name, now, cutoff, c.profilePhoto);

    // Medical cert — single field, no document number
    if (c.medicalCertExpiredDate) {
      const exp = new Date(c.medicalCertExpiredDate);
      if (exp <= cutoff) {
        rows.push({
          seafarerName: name,
          profilePhoto: c.profilePhoto || null,
          documentType: "Medical Certificate",
          documentNumber: "—",
          expiryDate: exp.toISOString(),
          daysRemaining: daysDiff(exp, now),
        });
      }
    }
  }

  // Sort by expiry date ascending (most urgent first)
  rows.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  // Count badges
  const expired = rows.filter((r) => r.daysRemaining < 0).length;
  const expiringSoon = rows.filter((r) => r.daysRemaining >= 0 && r.daysRemaining < 60).length;
  const valid = rows.filter((r) => r.daysRemaining >= 60).length; // 60–90 day window

  return {
    rows,
    counts: { expired, expiringSoon, valid },
  };
}
