import React from "react";
import {
  User, Ship, Globe, CreditCard, Award,
  CheckCircle2, XCircle, FileText, Anchor,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

function fmtDate(val: any): string {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function isDateStr(v: any): boolean {
  return typeof v === "string" && v.length > 8 && v.includes("T") && !isNaN(Date.parse(v));
}

function displayVal(v: any): string {
  if (v === null || v === undefined || v === "") return "—";
  if (isDateStr(v)) return fmtDate(v);
  if (typeof v === "object") return "—";
  return String(v);
}

// ─────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────

// Section with icon header + numbered badge
const Sec = ({
  n, title, icon: Icon, children,
}: {
  n: string; title: string; icon: any; children: React.ReactNode;
}) => (
  <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 overflow-hidden">
    <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 px-4 py-2.5">
      <Icon size={14} className="text-brand-500 shrink-0" />
      <span className="text-xs font-semibold text-gray-700 dark:text-white/80">{title}</span>
      <span className="ml-auto text-[10px] font-bold text-brand-500 tabular-nums">{n}</span>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

// Field: label above value
const F = ({ label, value }: { label: string; value?: any }) => {
  const v = displayVal(value);
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {label}
      </p>
      <p className={`text-sm break-words ${v === "—" ? "text-gray-300 dark:text-gray-600 italic" : "text-gray-800 dark:text-white/90"}`}>
        {v}
      </p>
    </div>
  );
};

// Simple responsive grid
const Grid = ({ cols = 3, children }: { cols?: number; children: React.ReactNode }) => (
  <div className={`grid gap-x-6 gap-y-4 grid-cols-2 sm:grid-cols-${cols}`}>{children}</div>
);

// Hairline divider
const Hr = () => <hr className="border-gray-100 dark:border-white/5 my-4" />;

// Inline record separator for repeated items
const RecordBadge = ({ i, total }: { i: number; total: number }) =>
  total <= 1 ? null : (
    <div className={`${i > 0 ? "mt-5 pt-4 border-t border-gray-100 dark:border-white/5" : ""} mb-3`}>
      <span className="inline-block rounded bg-gray-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
        Record {i + 1}
      </span>
    </div>
  );

// ─────────────────────────────────────────────────────────────────
// SCALAR FIELD GROUPS
// The personal section has a lot of fields — we group them cleanly.
// ─────────────────────────────────────────────────────────────────

const SCALAR_SKIP = ["profilePhoto", "resume"]; // shown separately in documents

interface ScalarState {
  firstName?: string; lastName?: string; nationality?: string;
  dateOfBirth?: string; placeOfBirth?: string; maritalStatus?: string;
  fatherName?: string; motherName?: string;
  positionApplied?: string; rank?: string;
  dateOfAvailability?: string; availabilityNote?: string;
  email?: string; cellPhone?: string; homePhone?: string; languages?: string;
  presentAddress?: string;
  nearestAirport?: string; kmFromAirport?: string;
  weightKg?: string; heightCm?: string; coverallSize?: string; shoeSize?: string;
  hairColor?: string; eyeColor?: string;
  medicalCertIssuedDate?: string; medicalCertExpiredDate?: string;
  nextOfKinName?: string; nextOfKinRelationship?: string;
  nextOfKinPhone?: string; nextOfKinAddress?: string;
  seaExperienceDetail?: string; additionalInfo?: string;
  profilePhoto?: File | null; resume?: File | null;
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

interface DynamicReviewProps {
  scalar: ScalarState;
  coc: { items: any[] };
  coe: { items: any[] };
  passports: { items: any[] };
  seamans: { items: any[] };
  visas: { items: any[] };
  seaExp: { items: any[] };
  extraDocs: { items: { name: string; file: File | null }[] };
}

export default function DynamicReview({
  scalar, coc, coe, passports, seamans, visas, seaExp, extraDocs,
}: DynamicReviewProps) {
  return (
    <div className="space-y-4">

      {/* ── 01 PERSONAL INFORMATION ───────────────────────────────── */}
      <Sec n="01" title="Personal Information" icon={User}>
        <div className="space-y-5">
          <Grid cols={3}>
            <F label="First Name"     value={scalar.firstName} />
            <F label="Last Name"      value={scalar.lastName} />
            <F label="Nationality"    value={scalar.nationality} />
            <F label="Date of Birth"  value={scalar.dateOfBirth} />
            <F label="Place of Birth" value={scalar.placeOfBirth} />
            <F label="Marital Status" value={scalar.maritalStatus} />
            <F label="Father's Name"  value={scalar.fatherName} />
            <F label="Mother's Name"  value={scalar.motherName} />
          </Grid>

          <Hr />

          <Grid cols={2}>
            <F label="Position Applied"     value={scalar.positionApplied} />
            <F label="Rank"                 value={scalar.rank} />
            <F label="Date of Availability" value={scalar.dateOfAvailability} />
            <F label="Availability Note"    value={scalar.availabilityNote} />
          </Grid>

          <Hr />

          <Grid cols={2}>
            <F label="Email"      value={scalar.email} />
            <F label="Cell Phone" value={scalar.cellPhone} />
            <F label="Home Phone" value={scalar.homePhone} />
            <F label="Languages"  value={scalar.languages} />
          </Grid>
          <F label="Present Address" value={scalar.presentAddress} />

          <Hr />

          <Grid cols={3}>
            <F label="Nearest Airport" value={scalar.nearestAirport} />
            <F label="Km from Airport" value={scalar.kmFromAirport} />
            <F label="Weight (kg)"     value={scalar.weightKg} />
            <F label="Height (cm)"     value={scalar.heightCm} />
            <F label="Coverall Size"   value={scalar.coverallSize} />
            <F label="Shoe Size"       value={scalar.shoeSize} />
            <F label="Hair Color"      value={scalar.hairColor} />
            <F label="Eye Color"       value={scalar.eyeColor} />
            <F label="Medical Cert. Issued"  value={scalar.medicalCertIssuedDate} />
            <F label="Medical Cert. Expired" value={scalar.medicalCertExpiredDate} />
          </Grid>

          {scalar.nextOfKinName && (
            <>
              <Hr />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                Next of Kin
              </p>
              <Grid cols={2}>
                <F label="Name"         value={scalar.nextOfKinName} />
                <F label="Relationship" value={scalar.nextOfKinRelationship} />
                <F label="Phone"        value={scalar.nextOfKinPhone} />
                <F label="Address"      value={scalar.nextOfKinAddress} />
              </Grid>
            </>
          )}
        </div>
      </Sec>

      {/* ── 06 CoC ────────────────────────────────────────────────── */}
      {coc.items.filter(i => i.number || i.grade).length > 0 && (
        <Sec n="06" title="Certificates of Competency (CoC)" icon={CreditCard}>
          {coc.items.map((l, i) => (
            <div key={i}>
              <RecordBadge i={i} total={coc.items.length} />
              <Grid cols={3}>
                <F label="Country"      value={l.country} />
                <F label="Grade"        value={l.grade} />
                <F label="Licence No."  value={l.number} />
                <F label="Place Issued" value={l.placeIssued} />
                <F label="Date Issued"  value={l.dateIssued} />
                <F label="Date Expired" value={l.dateExpired || "Unlimited"} />
              </Grid>
            </div>
          ))}
        </Sec>
      )}

      {/* ── 07 CoE ────────────────────────────────────────────────── */}
      {coe.items.filter(i => i.number || i.grade).length > 0 && (
        <Sec n="07" title="Certificates of Equivalency (CoE)" icon={CreditCard}>
          {coe.items.map((l, i) => (
            <div key={i}>
              <RecordBadge i={i} total={coe.items.length} />
              <Grid cols={3}>
                <F label="Country"      value={l.country} />
                <F label="Grade"        value={l.grade} />
                <F label="Licence No."  value={l.number} />
                <F label="Place Issued" value={l.placeIssued} />
                <F label="Date Issued"  value={l.dateIssued} />
                <F label="Date Expired" value={l.dateExpired || "Unlimited"} />
              </Grid>
            </div>
          ))}
        </Sec>
      )}

      {/* ── 08 PASSPORTS ──────────────────────────────────────────── */}
      {passports.items.filter(i => i.number).length > 0 && (
        <Sec n="08" title="Passports" icon={Globe}>
          {passports.items.map((p, i) => (
            <div key={i}>
              <RecordBadge i={i} total={passports.items.length} />
              <Grid cols={3}>
                <F label="Passport No."  value={p.number} />
                <F label="Country"       value={p.country} />
                <F label="Place Issued"  value={p.placeIssued} />
                <F label="Date Issued"   value={p.dateIssued} />
                <F label="Date Expired"  value={p.dateExpired} />
              </Grid>
            </div>
          ))}
        </Sec>
      )}

      {/* ── 09 SEAMAN'S BOOKS ─────────────────────────────────────── */}
      {seamans.items.filter(i => i.number).length > 0 && (
        <Sec n="09" title="Seaman's Books" icon={Anchor}>
          {seamans.items.map((s, i) => (
            <div key={i}>
              <RecordBadge i={i} total={seamans.items.length} />
              <Grid cols={3}>
                <F label="Book No."     value={s.number} />
                <F label="Country"      value={s.country} />
                <F label="Place Issued" value={s.placeIssued} />
                <F label="Date Issued"  value={s.dateIssued} />
                <F label="Date Expired" value={s.dateExpired || "Unlimited"} />
              </Grid>
            </div>
          ))}
        </Sec>
      )}

      {/* ── 10 VISAS ──────────────────────────────────────────────── */}
      {visas.items.filter(i => i.number).length > 0 && (
        <Sec n="10" title="Visas" icon={Globe}>
          {visas.items.map((v, i) => (
            <div key={i}>
              <RecordBadge i={i} total={visas.items.length} />
              <Grid cols={3}>
                <F label="Country"      value={v.country} />
                <F label="Visa Type"    value={v.visaType} />
                <F label="Visa No."     value={v.number} />
                <F label="Place Issued" value={v.placeIssued} />
                <F label="Date Issued"  value={v.dateIssued} />
                <F label="Date Expired" value={v.dateExpired} />
              </Grid>
            </div>
          ))}
        </Sec>
      )}

      {/* ── 13 SEA EXPERIENCE ─────────────────────────────────────── */}
      {seaExp.items.filter(i => i.vesselName).length > 0 && (
        <Sec n="13" title="Sea Service Record" icon={Ship}>
          {seaExp.items.map((s, i) => (
            <div key={i}>
              <RecordBadge i={i} total={seaExp.items.length} />
              <div className="space-y-4">
                <Grid cols={3}>
                  <F label="Vessel Name"  value={s.vesselName} />
                  <F label="Flag"         value={s.flag} />
                  <F label="Vessel Type"  value={s.vesselType} />
                  <F label="GRT"          value={s.grt} />
                  <F label="Engine Type"  value={s.engineType} />
                  <F label="Engine KW"    value={s.engineKW} />
                </Grid>
                <Grid cols={2}>
                  <F label="Shipping Company" value={s.company} />
                  <F label="Rank"             value={s.rank} />
                  <F label="Period From"       value={s.periodFrom} />
                  <F label="Period To"         value={s.periodTo || "Present (On Board)"} />
                </Grid>
                {s.jobDescription && (
                  <F label="Job Description / Remarks" value={s.jobDescription} />
                )}
              </div>
            </div>
          ))}
        </Sec>
      )}

      {/* ── DOCUMENTS ─────────────────────────────────────────────── */}
      <Sec n="14" title="Uploaded Documents" icon={FileText}>
        <div className="space-y-2">
          <DocRow label="Profile Photo" file={scalar.profilePhoto} />
          <DocRow label="Resume / CV"   file={scalar.resume} />
          {extraDocs.items.map((doc, i) => (
            <DocRow key={i} label={doc.name || `Document ${i + 1}`} file={doc.file} />
          ))}
        </div>
      </Sec>

    </div>
  );
}

// ── Document status row ──────────────────────────────────────────
function DocRow({ label, file }: { label: string; file: File | null | undefined }) {
  const attached = !!file;
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
      <span className="text-sm text-gray-700 dark:text-white/80">{label}</span>
      {attached ? (
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={13} />
          <span className="text-[11px] font-semibold">{file!.name}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
          <XCircle size={13} />
          <span className="text-[11px]">Not attached</span>
        </div>
      )}
    </div>
  );
}