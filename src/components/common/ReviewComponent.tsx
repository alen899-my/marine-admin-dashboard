import React from "react";
import {
  CheckCircle2,
  XCircle,
  Download,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

function fmtDate(val: any): string {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isDateStr(v: any): boolean {
  return (
    typeof v === "string" &&
    v.length > 8 &&
    v.includes("T") &&
    !isNaN(Date.parse(v))
  );
}

function displayVal(v: any): string {
  if (v === null || v === undefined || v === "") return "—";
  if (isDateStr(v)) return fmtDate(v);
  if (typeof v === "object") return "—";
  return String(v);
}

// ─────────────────────────────────────────────────────────────────
// PRIMITIVES — matching the view-mode government-form style
// ─────────────────────────────────────────────────────────────────

// Section heading with numbered badge
const Sec = ({ n, title }: { n: string; title: string }) => (
  <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/15 px-3 py-2 mb-0">
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-brand-600 text-[10px] font-bold text-white">
      {n}
    </span>
    <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-white/80">
      {title}
    </span>
  </div>
);

// Bordered field cell
const F = ({
  label,
  value,
  span,
}: {
  label: string;
  value?: any;
  span?: boolean;
}) => {
  const v = displayVal(value);
  return (
    <div
      className={`border border-gray-300 dark:border-white/15 px-2.5 py-1.5 min-w-0 ${span ? "col-span-full" : ""}`}
    >
      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
        {label}
      </p>
      <p
        className={`text-sm break-words leading-snug ${v === "—" ? "text-gray-300 dark:text-gray-600 italic" : "text-gray-800 dark:text-white/90"}`}
      >
        {v}
      </p>
    </div>
  );
};

// Bordered grid (cells share borders)
const G = ({
  cols = 3,
  children,
}: {
  cols?: number;
  children: React.ReactNode;
}) => {
  const colMap: Record<number, string> = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  };
  return (
    <div
      className={`grid ${colMap[cols] ?? colMap[3]} -mt-px -ml-px [&>*]:-mb-px [&>*]:-mr-px`}
    >
      {children}
    </div>
  );
};

// Sub-section label
const SubTitle = ({ title }: { title: string }) => (
  <div className="col-span-full bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/15 px-2.5 py-1.5">
    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
      {title}
    </p>
  </div>
);

// Thin spacer
const Spacer = () => <div className="h-2" />;

// Record separator for repeated items
const RecLabel = ({ i, total }: { i: number; total: number }) =>
  total <= 1 ? null : (
    <div
      className={`${i > 0 ? "mt-3 pt-3 border-t border-gray-200 dark:border-white/10" : ""} mb-1`}
    >
      <span className="inline-block rounded bg-gray-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
        Record {i + 1}
      </span>
    </div>
  );

// Table header row for document-style sections
const TH = ({
  headers,
  cols,
}: {
  headers: string[];
  cols: number;
}) => (
  <div
    className={`grid grid-cols-${cols} border border-gray-300 dark:border-white/15 bg-gray-50 dark:bg-white/5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400`}
  >
    {headers.map((h) => (
      <div
        key={h}
        className="px-2 py-2 border-r border-gray-300 dark:border-white/15 last:border-r-0 whitespace-nowrap"
      >
        {h}
      </div>
    ))}
  </div>
);

// Table cell (no label, just value)
const TC = ({ value }: { value?: any }) => {
  const v = displayVal(value);
  return (
    <div className="border-r border-gray-300 dark:border-white/15 last:border-r-0 px-2 py-1.5">
      <p
        className={`text-sm break-words leading-snug ${v === "—" ? "text-gray-300 dark:text-gray-600 italic" : "text-gray-800 dark:text-white/90"}`}
      >
        {v}
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// SCALAR STATE TYPE
// ─────────────────────────────────────────────────────────────────

interface ScalarState {
  firstName?: string;
  lastName?: string;
  nationality?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  maritalStatus?: string;
  fatherName?: string;
  motherName?: string;
  positionApplied?: string;
  rank?: string;
  dateOfAvailability?: string;
  availabilityNote?: string;
  email?: string;
  cellPhone?: string;
  homePhone?: string;
  languages?: string;
  presentAddress?: string;
  nearestAirport?: string;
  kmFromAirport?: string;
  weightKg?: string;
  heightCm?: string;
  coverallSize?: string;
  shoeSize?: string;
  hairColor?: string;
  eyeColor?: string;
  medicalCertIssuedDate?: string;
  medicalCertExpiredDate?: string;
  nextOfKinName?: string;
  nextOfKinRelationship?: string;
  nextOfKinPhone?: string;
  nextOfKinAddress?: string;
  seaExperienceDetail?: string;
  additionalInfo?: string;
  profilePhoto?: File | null;
  resume?: File | null;
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
  extraDocs: {
    items: {
      name: string;
      file: File | null;
      _fileUrl?: string;
      _fileName?: string;
    }[];
  };
  existingProfilePhoto?: string;
  existingResume?: { fileUrl?: string; fileName?: string };
}

export default function DynamicReview({
  scalar,
  coc,
  coe,
  passports,
  seamans,
  visas,
  seaExp,
  extraDocs,
  existingProfilePhoto,
  existingResume,
}: DynamicReviewProps) {
  return (
    <div className="space-y-0 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 overflow-hidden">
      {/* ── 01 PERSONAL INFORMATION ─────────────────────────────── */}
      <div className="p-4">
        <Sec n="01" title="Personal Information" />

        <G cols={3}>
          <F label="First Name" value={scalar.firstName} />
          <F label="Last Name" value={scalar.lastName} />
          <F label="Nationality" value={scalar.nationality} />
          <F label="Date of Birth" value={scalar.dateOfBirth} />
          <F label="Place of Birth" value={scalar.placeOfBirth} />
          <F label="Marital Status" value={scalar.maritalStatus} />
          <F label="Father's Name" value={scalar.fatherName} />
          <F label="Mother's Name" value={scalar.motherName} />
        </G>

        <Spacer />

        <G cols={3}>
          <F label="Email" value={scalar.email} />
          <F label="Cell Phone" value={scalar.cellPhone} />
          <F label="Languages" value={scalar.languages} />
        </G>
        <G cols={1}>
          <F label="Present Address" value={scalar.presentAddress} span />
        </G>

        <Spacer />

        <G cols={3}>
          <F label="Nearest Airport" value={scalar.nearestAirport} />
          <F label="Km from Airport" value={scalar.kmFromAirport} />
          <F label="Weight (kg)" value={scalar.weightKg} />
          <F label="Height (cm)" value={scalar.heightCm} />
          <F label="Coverall Size" value={scalar.coverallSize} />
          <F label="Shoe Size" value={scalar.shoeSize} />
          <F label="Hair Color" value={scalar.hairColor} />
          <F label="Eye Color" value={scalar.eyeColor} />
          <F label="Medical Cert. Issued" value={scalar.medicalCertIssuedDate} />
          <F
            label="Medical Cert. Expired"
            value={scalar.medicalCertExpiredDate}
          />
        </G>

        {scalar.nextOfKinName && (
          <>
            <Spacer />
            <G cols={2}>
              <SubTitle title="Next of Kin" />
              <F label="Name" value={scalar.nextOfKinName} />
              <F label="Relationship" value={scalar.nextOfKinRelationship} />
              <F label="Phone" value={scalar.nextOfKinPhone} />
              <F label="Address" value={scalar.nextOfKinAddress} />
            </G>
          </>
        )}
      </div>

      {/* ── 02 POSITION & AVAILABILITY ──────────────────────────── */}
      <div className="p-4 border-t border-gray-100 dark:border-white/5">
        <Sec n="02" title="Position & Availability" />

        <G cols={4}>
          <F label="Position Applied" value={scalar.positionApplied} />
          <F label="Rank" value={scalar.rank} />
          <F label="Date of Availability" value={scalar.dateOfAvailability} />
          <F label="Availability Note" value={scalar.availabilityNote} />
        </G>
      </div>

      {/* ── 03 CoC ──────────────────────────────────────────────── */}
      {coc.items.filter((i) => i.number || i.grade).length > 0 && (
        <div className="p-4 border-t border-gray-100 dark:border-white/5">
          <Sec n="03" title="Certificates of Competency (CoC)" />
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <TH
                headers={[
                  "Country",
                  "Grade",
                  "Licence No.",
                  "Place Issued",
                  "Date Issued",
                  "Date Expired",
                ]}
                cols={6}
              />
              {coc.items.map((l, i) => (
                <div
                  key={i}
                  className="grid grid-cols-6 border-l border-r border-b border-gray-300 dark:border-white/15"
                >
                  <TC value={l.country} />
                  <TC value={l.grade} />
                  <TC value={l.number} />
                  <TC value={l.placeIssued} />
                  <TC value={l.dateIssued} />
                  <TC value={l.dateExpired || "Unlimited"} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 04 CoE ──────────────────────────────────────────────── */}
      {coe.items.filter((i) => i.number || i.grade).length > 0 && (
        <div className="p-4 border-t border-gray-100 dark:border-white/5">
          <Sec n="04" title="Certificates of Equivalency (CoE)" />
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <TH
                headers={[
                  "Country",
                  "Grade",
                  "Licence No.",
                  "Place Issued",
                  "Date Issued",
                  "Date Expired",
                ]}
                cols={6}
              />
              {coe.items.map((l, i) => (
                <div
                  key={i}
                  className="grid grid-cols-6 border-l border-r border-b border-gray-300 dark:border-white/15"
                >
                  <TC value={l.country} />
                  <TC value={l.grade} />
                  <TC value={l.number} />
                  <TC value={l.placeIssued} />
                  <TC value={l.dateIssued} />
                  <TC value={l.dateExpired || "Unlimited"} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 05 PASSPORTS ────────────────────────────────────────── */}
      {passports.items.filter((i) => i.number).length > 0 && (
        <div className="p-4 border-t border-gray-100 dark:border-white/5">
          <Sec n="05" title="Passports" />
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <TH
                headers={[
                  "Passport No.",
                  "Country",
                  "Place Issued",
                  "Date Issued",
                  "Date Expired",
                ]}
                cols={5}
              />
              {passports.items.map((p, i) => (
                <div
                  key={i}
                  className="grid grid-cols-5 border-l border-r border-b border-gray-300 dark:border-white/15"
                >
                  <TC value={p.number} />
                  <TC value={p.country} />
                  <TC value={p.placeIssued} />
                  <TC value={p.dateIssued} />
                  <TC value={p.dateExpired} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 06 SEAMAN'S BOOKS ───────────────────────────────────── */}
      {seamans.items.filter((i) => i.number).length > 0 && (
        <div className="p-4 border-t border-gray-100 dark:border-white/5">
          <Sec n="06" title="Seaman's Books" />
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <TH
                headers={[
                  "Book No.",
                  "Country",
                  "Place Issued",
                  "Date Issued",
                  "Date Expired",
                ]}
                cols={5}
              />
              {seamans.items.map((s, i) => (
                <div
                  key={i}
                  className="grid grid-cols-5 border-l border-r border-b border-gray-300 dark:border-white/15"
                >
                  <TC value={s.number} />
                  <TC value={s.country} />
                  <TC value={s.placeIssued} />
                  <TC value={s.dateIssued} />
                  <TC value={s.dateExpired || "Unlimited"} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 07 VISAS ────────────────────────────────────────────── */}
      {visas.items.filter((i) => i.number || i.visaType).length > 0 && (
        <div className="p-4 border-t border-gray-100 dark:border-white/5">
          <Sec n="07" title="Visas" />
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <TH
                headers={[
                  "Country",
                  "Visa Type",
                  "Visa No.",
                  "Place Issued",
                  "Date Issued",
                  "Date Expired",
                ]}
                cols={6}
              />
              {visas.items.map((v, i) => (
                <div
                  key={i}
                  className="grid grid-cols-6 border-l border-r border-b border-gray-300 dark:border-white/15"
                >
                  <TC value={v.country} />
                  <TC value={v.visaType} />
                  <TC value={v.number} />
                  <TC value={v.placeIssued} />
                  <TC value={v.dateIssued} />
                  <TC value={v.dateExpired} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 08 SEA EXPERIENCE ───────────────────────────────────── */}
      {seaExp.items.filter((i) => i.vesselName).length > 0 && (
        <div className="p-4 border-t border-gray-100 dark:border-white/5">
          <Sec n="08" title="Sea Service Record" />
          {seaExp.items.map((s, i) => (
            <div key={i}>
              <RecLabel i={i} total={seaExp.items.length} />
              <G cols={3}>
                <F label="Vessel Name" value={s.vesselName} />
                <F label="Flag" value={s.flag} />
                <F label="Vessel Type" value={s.vesselType} />
                <F label="GRT" value={s.grt} />
                <F label="Engine Type" value={s.engineType} />
                <F label="Engine KW" value={s.engineKW} />
              </G>
              <G cols={4}>
                <F label="Shipping Company" value={s.company} />
                <F label="Rank" value={s.rank} />
                <F label="Period From" value={s.periodFrom} />
                <F
                  label="Period To"
                  value={s.periodTo || "Present"}
                />
              </G>
              {s.jobDescription && (
                <G cols={1}>
                  <F
                    label="Job Description / Remarks"
                    value={s.jobDescription}
                    span
                  />
                </G>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── 09 DOCUMENTS ────────────────────────────────────────── */}
      <div className="p-4 border-t border-gray-100 dark:border-white/5">
        <Sec n="09" title="Uploaded Documents" />

        <div className="rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden mt-1">
          <DocRow
            label="Profile Photo"
            file={scalar.profilePhoto}
            existingUrl={existingProfilePhoto}
            existingName={existingProfilePhoto ? "Current photo" : undefined}
          />
          <DocRow
            label="Resume / CV"
            file={scalar.resume}
            existingUrl={existingResume?.fileUrl}
            existingName={existingResume?.fileName}
          />
          {extraDocs.items
            .filter((doc) => doc.name || doc.file || doc._fileUrl)
            .map((doc, i) => (
              <DocRow
                key={i}
                label={doc.name || `Document ${i + 1}`}
                file={doc.file}
                existingUrl={doc._fileUrl}
                existingName={doc._fileName}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

// ── Document status row ──────────────────────────────────────────
function DocRow({
  label,
  file,
  existingUrl,
  existingName,
}: {
  label: string;
  file: File | null | undefined;
  existingUrl?: string;
  existingName?: string;
}) {
  const hasNewFile = !!file;
  const hasExisting = !!existingUrl;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5 last:border-0 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
      <span className="text-sm font-medium text-gray-700 dark:text-white/80">
        {label}
      </span>
      {hasNewFile ? (
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={14} />
          <span className="text-xs font-semibold">{file!.name}</span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            (new)
          </span>
        </div>
      ) : hasExisting ? (
        <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
          <Download size={14} />
          <a
            href={existingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold hover:underline"
          >
            {existingName || "Existing file"}
          </a>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
          <XCircle size={14} />
          <span className="text-xs">Not attached</span>
        </div>
      )}
    </div>
  );
}
