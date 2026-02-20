"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import MultiStepFormLayout, {
  FormSection,
  FormGrid,
  RepeatCard,
  AddItemButton,
} from "@/components/common/MultiFormStepLayout";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import DatePicker from "@/components/form/date-picker";
import FileInput from "@/components/form/input/FileInput";
import Select from "@/components/form/Select";
import DynamicReview from "../common/ReviewComponent";

// ─────────────────────────────────────────────────────────────────
// MODE TYPE
// ─────────────────────────────────────────────────────────────────

export type FormMode = "create" | "edit" | "view";

// ─────────────────────────────────────────────────────────────────
// TYPES — mirror the schema interfaces exactly
// ─────────────────────────────────────────────────────────────────

interface LicenceItem {
  licenceType: "coc" | "coe";
  country: string;
  grade: string;
  number: string;
  placeIssued: string;
  dateIssued: string;
  dateExpired: string;
}

interface PassportItem {
  number: string;
  country: string;
  placeIssued: string;
  dateIssued: string;
  dateExpired: string;
}

interface SeamansBookItem {
  number: string;
  country: string;
  placeIssued: string;
  dateIssued: string;
  dateExpired: string;
}

interface VisaItem {
  country: string;
  visaType: string;
  number: string;
  placeIssued: string;
  dateIssued: string;
  dateExpired: string;
}

interface EndorsementItem {
  name: string;
  country: string;
  number: string;
  placeIssued: string;
  dateIssued: string;
  dateExpired: string;
}

interface CertificateItem {
  name: string;
  courseNumber: string;
  placeIssued: string;
  dateIssued: string;
  dateExpired: string;
}

interface SeaExperienceItem {
  vesselName: string;
  flag: string;
  grt: string;
  vesselType: string;
  engineType: string;
  engineKW: string;
  company: string;
  rank: string;
  periodFrom: string;
  periodTo: string;
  areaOfOperation: string;
  jobDescription: string;
}

// ─────────────────────────────────────────────────────────────────
// INITIAL / EXISTING DATA SHAPE (used to prefill edit/view modes)
// ─────────────────────────────────────────────────────────────────

export interface CrewApplicationData {
  _id?: string;
  positionApplied?: string;
  rank?: string;
  dateOfAvailability?: string;
  availabilityNote?: string;
  firstName?: string;
  lastName?: string;
  nationality?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  maritalStatus?: string;
  fatherName?: string;
  motherName?: string;
  presentAddress?: string;
  email?: string;
  cellPhone?: string;
  homePhone?: string;
  languages?: string | string[];
  nearestAirport?: string;
  kmFromAirport?: string | number;
  weightKg?: string | number;
  heightCm?: string | number;
  coverallSize?: string;
  shoeSize?: string;
  hairColor?: string;
  eyeColor?: string;
  medicalCertIssuedDate?: string;
  medicalCertExpiredDate?: string;
  nextOfKin?: {
    name?: string;
    relationship?: string;
    phone?: string;
    address?: string;
  };
  seaExperienceDetail?: string;
  additionalInfo?: string;
  licences?: Array<LicenceItem & { _id?: string; uploadStatus?: string }>;
  passports?: Array<PassportItem & { _id?: string; uploadStatus?: string }>;
  seamansBooks?: Array<SeamansBookItem & { _id?: string; uploadStatus?: string }>;
  visas?: Array<VisaItem & { _id?: string; uploadStatus?: string }>;
  endorsements?: Array<EndorsementItem & { _id?: string; uploadStatus?: string }>;
  stcwCertificates?: Array<CertificateItem & { _id?: string; uploadStatus?: string }>;
  otherCertificates?: Array<CertificateItem & { _id?: string; uploadStatus?: string }>;
  seaExperience?: Array<SeaExperienceItem & { _id?: string }>;
  profilePhoto?: string;
  resume?: { fileName?: string; fileUrl?: string; uploadStatus?: string };
  extraDocs?: Array<{ name?: string; fileName?: string; fileUrl?: string; uploadStatus?: string }>;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─────────────────────────────────────────────────────────────────
// EMPTY ITEM FACTORIES
// ─────────────────────────────────────────────────────────────────

const emptyLicence    = (): LicenceItem      => ({ licenceType: "coc", country: "", grade: "", number: "", placeIssued: "", dateIssued: "", dateExpired: "" });
const emptyPassport   = (): PassportItem     => ({ number: "", country: "", placeIssued: "", dateIssued: "", dateExpired: "" });
const emptySeaman     = (): SeamansBookItem  => ({ number: "", country: "", placeIssued: "", dateIssued: "", dateExpired: "" });
const emptyVisa       = (): VisaItem         => ({ country: "", visaType: "", number: "", placeIssued: "", dateIssued: "", dateExpired: "" });
const emptyEndorse    = (): EndorsementItem  => ({ name: "", country: "", number: "", placeIssued: "", dateIssued: "", dateExpired: "" });
const emptyCert       = (): CertificateItem  => ({ name: "", courseNumber: "", placeIssued: "", dateIssued: "", dateExpired: "" });
const emptySeaExp     = (): SeaExperienceItem => ({ vesselName: "", flag: "", grt: "", vesselType: "", engineType: "", engineKW: "", company: "", rank: "", periodFrom: "", periodTo: "", areaOfOperation: "", jobDescription: "" });

// ─────────────────────────────────────────────────────────────────
// STEPS
// ─────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1,  title: "Personal Information",       description: "Identity, contact and physical details" },
  { id: 2,  title: "Certificate of Competency",  description: "CoC licences issued by flag states" },
  { id: 3,  title: "Certificate of Equivalent",  description: "CoE licences issued by flag states" },
  { id: 4,  title: "Passport",                   description: "All passports, including expired" },
  { id: 5,  title: "Seaman's Book",              description: "All seaman's books, including expired" },
  { id: 6,  title: "Visa",                       description: "" },
  { id: 7,  title: "Endorsements",               description: "Flag-state endorsements and attestations" },
  { id: 8,  title: "Certificates",               description: "Training certificates" },
  { id: 9,  title: "Sea Experience",             description: "Previous sea service and vessel history" },
  { id: 10, title: "Documents",                  description: "All Documents Upload" },
  { id: 11, title: "Review & Submit",            description: "Verify your details before final submission" },
];

// ─────────────────────────────────────────────────────────────────
// ARRAY UPDATER HOOK
// ─────────────────────────────────────────────────────────────────

function useArray<T>(initial: T[]) {
  const [items, setItems] = useState<T[]>(initial);

  const update = useCallback((idx: number, field: keyof T, value: T[keyof T]) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }, []);

  const add    = useCallback((empty: T) => setItems((prev) => [...prev, empty]), []);
  const remove = useCallback((idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx)), []);
  const reset  = useCallback((newItems: T[]) => setItems(newItems), []);

  return { items, update, add, remove, reset };
}

// ─────────────────────────────────────────────────────────────────
// SCALAR FORM STATE
// ─────────────────────────────────────────────────────────────────

interface ScalarState {
  positionApplied: string;
  rank: string;
  dateOfAvailability: string;
  availabilityNote: string;
  profilePhoto: File | null;
  resume: File | null;
  firstName: string;
  lastName: string;
  nationality: string;
  dateOfBirth: string;
  placeOfBirth: string;
  maritalStatus: string;
  fatherName: string;
  motherName: string;
  presentAddress: string;
  email: string;
  cellPhone: string;
  homePhone: string;
  languages: string;
  nearestAirport: string;
  kmFromAirport: string;
  weightKg: string;
  heightCm: string;
  coverallSize: string;
  shoeSize: string;
  hairColor: string;
  eyeColor: string;
  medicalCertIssuedDate: string;
  medicalCertExpiredDate: string;
  nextOfKinName: string;
  nextOfKinRelationship: string;
  nextOfKinPhone: string;
  nextOfKinAddress: string;
  seaExperienceDetail: string;
  additionalInfo: string;
}

const initialScalar: ScalarState = {
  positionApplied: "", rank: "", dateOfAvailability: "", availabilityNote: "",
  profilePhoto: null, resume: null,
  firstName: "", lastName: "", nationality: "", dateOfBirth: "", placeOfBirth: "",
  maritalStatus: "", fatherName: "", motherName: "",
  presentAddress: "", email: "", cellPhone: "", homePhone: "", languages: "",
  nearestAirport: "", kmFromAirport: "", weightKg: "", heightCm: "",
  coverallSize: "", shoeSize: "", hairColor: "", eyeColor: "",
  medicalCertIssuedDate: "", medicalCertExpiredDate: "",
  nextOfKinName: "", nextOfKinRelationship: "", nextOfKinPhone: "", nextOfKinAddress: "",
  seaExperienceDetail: "", additionalInfo: "",
};

// ─────────────────────────────────────────────────────────────────
// SELECT OPTIONS
// ─────────────────────────────────────────────────────────────────

const MARITAL_OPTIONS = [
  { value: "single",   label: "Single" },
  { value: "married",  label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed",  label: "Widowed" },
];

const COVERALL_OPTIONS = ["XS","S","M","L","XL","XXL","XXXL"].map((s) => ({ value: s, label: s }));

const VESSEL_TYPE_OPTIONS = [
  "LPG","LNGC","Oil Tanker","Chemical Tanker","Container","Bulk Carrier",
  "Offshore Supply","AHTS","RORO","Passenger","General Cargo","Other",
].map((v) => ({ value: v, label: v }));

// ─────────────────────────────────────────────────────────────────
// VIEW-MODE FIELD COMPONENT
// ─────────────────────────────────────────────────────────────────

function ViewField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm text-gray-900 dark:text-gray-100 break-words">
        {value || <span className="text-gray-400 dark:text-gray-600 italic">—</span>}
      </span>
    </div>
  );
}

function ViewGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  const colMap: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  };
  return (
    <div className={`grid ${colMap[cols] ?? colMap[2]} gap-x-6 gap-y-4`}>
      {children}
    </div>
  );
}

function ViewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-700/50">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h4>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function formatDate(val?: string | null) {
  if (!val) return undefined;
  try {
    return new Date(val).toLocaleDateString("en-GB");
  } catch {
    return val;
  }
}

// ─────────────────────────────────────────────────────────────────
// HELPER: convert DB data → scalar state
// ─────────────────────────────────────────────────────────────────

function dataToScalar(data: CrewApplicationData): ScalarState {
  const langs = Array.isArray(data.languages)
    ? data.languages.join(", ")
    : data.languages ?? "";

  return {
    positionApplied:      data.positionApplied      ?? "",
    rank:                 data.rank                 ?? "",
    dateOfAvailability:   data.dateOfAvailability   ?? "",
    availabilityNote:     data.availabilityNote     ?? "",
    profilePhoto:         null,
    resume:               null,
    firstName:            data.firstName            ?? "",
    lastName:             data.lastName             ?? "",
    nationality:          data.nationality          ?? "",
    dateOfBirth:          data.dateOfBirth          ?? "",
    placeOfBirth:         data.placeOfBirth         ?? "",
    maritalStatus:        data.maritalStatus        ?? "",
    fatherName:           data.fatherName           ?? "",
    motherName:           data.motherName           ?? "",
    presentAddress:       data.presentAddress       ?? "",
    email:                data.email                ?? "",
    cellPhone:            data.cellPhone            ?? "",
    homePhone:            data.homePhone            ?? "",
    languages:            langs,
    nearestAirport:       data.nearestAirport       ?? "",
    kmFromAirport:        String(data.kmFromAirport ?? ""),
    weightKg:             String(data.weightKg      ?? ""),
    heightCm:             String(data.heightCm      ?? ""),
    coverallSize:         data.coverallSize         ?? "",
    shoeSize:             data.shoeSize             ?? "",
    hairColor:            data.hairColor            ?? "",
    eyeColor:             data.eyeColor             ?? "",
    medicalCertIssuedDate:  data.medicalCertIssuedDate  ?? "",
    medicalCertExpiredDate: data.medicalCertExpiredDate ?? "",
    nextOfKinName:         data.nextOfKin?.name         ?? "",
    nextOfKinRelationship: data.nextOfKin?.relationship ?? "",
    nextOfKinPhone:        data.nextOfKin?.phone        ?? "",
    nextOfKinAddress:      data.nextOfKin?.address      ?? "",
    seaExperienceDetail:  data.seaExperienceDetail  ?? "",
    additionalInfo:       data.additionalInfo       ?? "",
  };
}

function sanitizeLicence(l: LicenceItem & { _id?: string; uploadStatus?: string }): LicenceItem {
  return {
    licenceType: l.licenceType === "coe" ? "coe" : "coc",
    country:     l.country     ?? "",
    grade:       l.grade       ?? "",
    number:      l.number      ?? "",
    placeIssued: l.placeIssued ?? "",
    dateIssued:  l.dateIssued  ?? "",
    dateExpired: l.dateExpired ?? "",
  };
}

function sanitizePassport(p: PassportItem & { _id?: string; uploadStatus?: string }): PassportItem {
  return { number: p.number ?? "", country: p.country ?? "", placeIssued: p.placeIssued ?? "", dateIssued: p.dateIssued ?? "", dateExpired: p.dateExpired ?? "" };
}

function sanitizeSeaman(s: SeamansBookItem & { _id?: string; uploadStatus?: string }): SeamansBookItem {
  return { number: s.number ?? "", country: s.country ?? "", placeIssued: s.placeIssued ?? "", dateIssued: s.dateIssued ?? "", dateExpired: s.dateExpired ?? "" };
}

function sanitizeVisa(v: VisaItem & { _id?: string; uploadStatus?: string }): VisaItem {
  return { country: v.country ?? "", visaType: v.visaType ?? "", number: v.number ?? "", placeIssued: v.placeIssued ?? "", dateIssued: v.dateIssued ?? "", dateExpired: v.dateExpired ?? "" };
}

function sanitizeEndorse(e: EndorsementItem & { _id?: string; uploadStatus?: string }): EndorsementItem {
  return { name: e.name ?? "", country: e.country ?? "", number: e.number ?? "", placeIssued: e.placeIssued ?? "", dateIssued: e.dateIssued ?? "", dateExpired: e.dateExpired ?? "" };
}

function sanitizeCert(c: CertificateItem & { _id?: string; uploadStatus?: string }): CertificateItem {
  return { name: c.name ?? "", courseNumber: c.courseNumber ?? "", placeIssued: c.placeIssued ?? "", dateIssued: c.dateIssued ?? "", dateExpired: c.dateExpired ?? "" };
}

function sanitizeSeaExp(s: SeaExperienceItem & { _id?: string }): SeaExperienceItem {
  return { vesselName: s.vesselName ?? "", flag: s.flag ?? "", grt: String(s.grt ?? ""), vesselType: s.vesselType ?? "", engineType: s.engineType ?? "", engineKW: String(s.engineKW ?? ""), company: s.company ?? "", rank: s.rank ?? "", periodFrom: s.periodFrom ?? "", periodTo: s.periodTo ?? "", areaOfOperation: s.areaOfOperation ?? "", jobDescription: s.jobDescription ?? "" };
}

// ─────────────────────────────────────────────────────────────────
// MAIN FORM COMPONENT
// ─────────────────────────────────────────────────────────────────

interface CrewApplicationFormProps {
  companyId: string;
  mode?: FormMode;
  initialData?: CrewApplicationData;
  applicationId?: string;
}

export default function CrewApplicationForm({
  companyId,
  mode = "create",
  initialData,
  applicationId,
}: CrewApplicationFormProps) {
  const router = useRouter();
  const isView   = mode === "view";
  const isEdit   = mode === "edit";
  const isCreate = mode === "create";

  const [currentStep,    setCurrentStep]    = useState(1);
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [submitError,    setSubmitError]    = useState<string | null>(null);

  // ── Scalar state
  const [scalar, setScalar] = useState<ScalarState>(() =>
    initialData ? dataToScalar(initialData) : initialScalar
  );
  const setField = <K extends keyof ScalarState>(key: K, value: ScalarState[K]) =>
    setScalar((prev) => ({ ...prev, [key]: value }));
  const txt = (key: keyof ScalarState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setField(key, e.target.value as ScalarState[typeof key]);

  // ── Array states
  const coc          = useArray<LicenceItem>([emptyLicence()]);
  const coe          = useArray<LicenceItem>([emptyLicence()]);
  const passports    = useArray<PassportItem>([emptyPassport()]);
  const seamans      = useArray<SeamansBookItem>([emptySeaman()]);
  const visas        = useArray<VisaItem>([emptyVisa()]);
  const endorsements = useArray<EndorsementItem>([]);
  const stcw         = useArray<CertificateItem>([emptyCert()]);
  const otherCerts   = useArray<CertificateItem>([]);
  const seaExp       = useArray<SeaExperienceItem>([emptySeaExp()]);
  const extraDocs    = useArray<{ name: string; file: File | null }>([
    { name: "Experience Certificate", file: null },
    { name: "STCW Course",            file: null },
  ]);

  // ── Prefill arrays when initialData is provided (edit or view mode)
  useEffect(() => {
    if (!initialData) return;

    setScalar(dataToScalar(initialData));

    const allLicences = initialData.licences ?? [];
    const cocItems = allLicences.filter((l) => l.licenceType !== "coe").map(sanitizeLicence);
    const coeItems = allLicences.filter((l) => l.licenceType === "coe").map(sanitizeLicence);
    coc.reset(cocItems.length ? cocItems : [emptyLicence()]);
    coe.reset(coeItems.length ? coeItems : [emptyLicence()]);

    if (initialData.passports?.length)   passports.reset(initialData.passports.map(sanitizePassport));
    if (initialData.seamansBooks?.length) seamans.reset(initialData.seamansBooks.map(sanitizeSeaman));
    if (initialData.visas?.length)        visas.reset(initialData.visas.map(sanitizeVisa));
    if (initialData.endorsements?.length) endorsements.reset(initialData.endorsements.map(sanitizeEndorse));
    if (initialData.stcwCertificates?.length) stcw.reset(initialData.stcwCertificates.map(sanitizeCert));
    if (initialData.otherCertificates?.length) otherCerts.reset(initialData.otherCertificates.map(sanitizeCert));
    if (initialData.seaExperience?.length) seaExp.reset(initialData.seaExperience.map(sanitizeSeaExp));

    // Extra docs — populate with existing names but no file (already uploaded)
    if (initialData.extraDocs?.length) {
      extraDocs.reset(
        initialData.extraDocs.map((d) => ({ name: d.name ?? "", file: null }))
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  // ── Navigation
  const handleBack = () => setCurrentStep((p) => Math.max(p - 1, 1));
  const handleNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }
    setCurrentStep((p) => Math.min(p + 1, STEPS.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStepClick = (stepId: number) => {
    const maxCompleted = completedSteps.length > 0 ? Math.max(...completedSteps) : 0;
    if (stepId <= maxCompleted + 1) setCurrentStep(stepId);
  };

  // ── Submit (create or edit)
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const fd = new FormData();

      const scalarKeys: (keyof ScalarState)[] = [
        "positionApplied","rank","dateOfAvailability","availabilityNote",
        "firstName","lastName","nationality","dateOfBirth","placeOfBirth",
        "maritalStatus","fatherName","motherName",
        "presentAddress","email","cellPhone","homePhone","languages",
        "nearestAirport","kmFromAirport","weightKg","heightCm",
        "coverallSize","shoeSize","hairColor","eyeColor",
        "medicalCertIssuedDate","medicalCertExpiredDate",
        "seaExperienceDetail","additionalInfo",
      ];
      scalarKeys.forEach((k) => {
        const v = scalar[k];
        if (v && typeof v === "string") fd.append(k, v);
      });

      if (scalar.nextOfKinName) {
        fd.append("nextOfKin.name",         scalar.nextOfKinName);
        fd.append("nextOfKin.relationship", scalar.nextOfKinRelationship);
        if (scalar.nextOfKinPhone)   fd.append("nextOfKin.phone",   scalar.nextOfKinPhone);
        if (scalar.nextOfKinAddress) fd.append("nextOfKin.address", scalar.nextOfKinAddress);
      }

      if (scalar.profilePhoto) fd.append("profilePhoto", scalar.profilePhoto);
      if (scalar.resume)       fd.append("resume",       scalar.resume);

      const allLicences = [
        ...coc.items.map((l) => ({ ...l, licenceType: "coc" })),
        ...coe.items.map((l) => ({ ...l, licenceType: "coe" })),
      ];
      fd.append("licences",          JSON.stringify(allLicences));
      fd.append("passports",         JSON.stringify(passports.items));
      fd.append("seamansBooks",      JSON.stringify(seamans.items));
      fd.append("visas",             JSON.stringify(visas.items));
      fd.append("endorsements",      JSON.stringify(endorsements.items));
      fd.append("stcwCertificates",  JSON.stringify(stcw.items));
      fd.append("otherCertificates", JSON.stringify(otherCerts.items));
      fd.append("seaExperience",     JSON.stringify(seaExp.items));

      extraDocs.items.forEach((doc, i) => {
        if (doc.file) {
          fd.append(`extraDocs[${i}][file]`, doc.file);
          fd.append(`extraDocs[${i}][name]`, doc.name);
        }
      });

      fd.append("companyId", companyId);

      // ── Route differs between create and edit
      let res: Response;
      if (isEdit && applicationId) {
        res = await fetch(`/api/applications/${applicationId}`, {
          method: "PATCH",
          body: fd,
        });
      } else {
        res = await fetch("/api/applications/public", {
          method: "POST",
          body: fd,
        });
      }

      const result = await res.json();
      if (!result.success) {
        setSubmitError(result.error);
        return;
      }

      if (isEdit) {
        router.push(`/jobs/view/${applicationId}`);
      } else {
        router.push(`/apply/success?token=${result.data.submissionToken}`);
      }
    } catch {
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // VIEW MODE — full read-only rendering across all steps
  // ─────────────────────────────────────────────────────────────────

  if (isView && initialData) {
    const d = initialData;
    const allLicences = d.licences ?? [];
    const cocItems = allLicences.filter((l) => l.licenceType !== "coe");
    const coeItems = allLicences.filter((l) => l.licenceType === "coe");
    const langDisplay = Array.isArray(d.languages)
      ? d.languages.join(", ")
      : d.languages ?? "";

    return (
      <div className="space-y-6 pb-12">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {d.firstName} {d.lastName}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{d.rank} — {d.nationality}</p>
          </div>
          {d.status && (
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300 capitalize border border-brand-200 dark:border-brand-500/30">
              {d.status.replace("_", " ")}
            </span>
          )}
        </div>

        {/* Section 1 — Personal */}
        <ViewCard title="Personal Information">
          <div className="space-y-5">
            <ViewGrid cols={3}>
              <ViewField label="First Name"       value={d.firstName} />
              <ViewField label="Last Name"        value={d.lastName} />
              <ViewField label="Nationality"      value={d.nationality} />
              <ViewField label="Date of Birth"    value={formatDate(d.dateOfBirth)} />
              <ViewField label="Place of Birth"   value={d.placeOfBirth} />
              <ViewField label="Marital Status"   value={d.maritalStatus} />
              <ViewField label="Father's Name"    value={d.fatherName} />
              <ViewField label="Mother's Name"    value={d.motherName} />
            </ViewGrid>
            <hr className="border-gray-100 dark:border-gray-700" />
            <ViewGrid cols={2}>
              <ViewField label="Position Applied"   value={d.positionApplied} />
              <ViewField label="Rank"               value={d.rank} />
              <ViewField label="Date of Availability" value={formatDate(d.dateOfAvailability)} />
              <ViewField label="Availability Note"  value={d.availabilityNote} />
            </ViewGrid>
            <hr className="border-gray-100 dark:border-gray-700" />
            <ViewGrid cols={2}>
              <ViewField label="Email"       value={d.email} />
              <ViewField label="Cell Phone"  value={d.cellPhone} />
              <ViewField label="Home Phone"  value={d.homePhone} />
              <ViewField label="Languages"   value={langDisplay} />
              <div className="sm:col-span-2">
                <ViewField label="Present Address" value={d.presentAddress} />
              </div>
            </ViewGrid>
            <hr className="border-gray-100 dark:border-gray-700" />
            <ViewGrid cols={3}>
              <ViewField label="Nearest Airport"   value={d.nearestAirport} />
              <ViewField label="Km from Airport"   value={String(d.kmFromAirport ?? "")} />
              <ViewField label="Weight (kg)"       value={String(d.weightKg ?? "")} />
              <ViewField label="Height (cm)"       value={String(d.heightCm ?? "")} />
              <ViewField label="Coverall Size"     value={d.coverallSize} />
              <ViewField label="Shoe Size"         value={d.shoeSize} />
              <ViewField label="Hair Color"        value={d.hairColor} />
              <ViewField label="Eye Color"         value={d.eyeColor} />
              <ViewField label="Medical Cert. Issued"  value={formatDate(d.medicalCertIssuedDate)} />
              <ViewField label="Medical Cert. Expired" value={formatDate(d.medicalCertExpiredDate)} />
            </ViewGrid>
            {d.nextOfKin?.name && (
              <>
                <hr className="border-gray-100 dark:border-gray-700" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Next of Kin</p>
                <ViewGrid cols={2}>
                  <ViewField label="Name"         value={d.nextOfKin.name} />
                  <ViewField label="Relationship" value={d.nextOfKin.relationship} />
                  <ViewField label="Phone"        value={d.nextOfKin.phone} />
                  <ViewField label="Address"      value={d.nextOfKin.address} />
                </ViewGrid>
              </>
            )}
          </div>
        </ViewCard>

        {/* Section 2 — Licences */}
        {cocItems.length > 0 && (
          <ViewCard title="Certificates of Competency (CoC)">
            <div className="space-y-4">
              {cocItems.map((l, i) => (
                <div key={i} className="rounded-lg border border-gray-100 dark:border-gray-700 p-4">
                  <ViewGrid cols={3}>
                    <ViewField label="Country"      value={l.country} />
                    <ViewField label="Grade"        value={l.grade} />
                    <ViewField label="Number"       value={l.number} />
                    <ViewField label="Place Issued" value={l.placeIssued} />
                    <ViewField label="Date Issued"  value={formatDate(l.dateIssued)} />
                    <ViewField label="Date Expired" value={formatDate(l.dateExpired)} />
                  </ViewGrid>
                </div>
              ))}
            </div>
          </ViewCard>
        )}

        {coeItems.length > 0 && (
          <ViewCard title="Certificates of Equivalency (CoE)">
            <div className="space-y-4">
              {coeItems.map((l, i) => (
                <div key={i} className="rounded-lg border border-gray-100 dark:border-gray-700 p-4">
                  <ViewGrid cols={3}>
                    <ViewField label="Country"      value={l.country} />
                    <ViewField label="Grade"        value={l.grade} />
                    <ViewField label="Number"       value={l.number} />
                    <ViewField label="Place Issued" value={l.placeIssued} />
                    <ViewField label="Date Issued"  value={formatDate(l.dateIssued)} />
                    <ViewField label="Date Expired" value={formatDate(l.dateExpired)} />
                  </ViewGrid>
                </div>
              ))}
            </div>
          </ViewCard>
        )}

        {/* Section 3 — Passports */}
        {(d.passports?.length ?? 0) > 0 && (
          <ViewCard title="Passports">
            <div className="space-y-4">
              {d.passports!.map((p, i) => (
                <div key={i} className="rounded-lg border border-gray-100 dark:border-gray-700 p-4">
                  <ViewGrid cols={3}>
                    <ViewField label="Number"       value={p.number} />
                    <ViewField label="Country"      value={p.country} />
                    <ViewField label="Place Issued" value={p.placeIssued} />
                    <ViewField label="Date Issued"  value={formatDate(p.dateIssued)} />
                    <ViewField label="Date Expired" value={formatDate(p.dateExpired)} />
                  </ViewGrid>
                </div>
              ))}
            </div>
          </ViewCard>
        )}

        {/* Section 4 — Seaman's Books */}
        {(d.seamansBooks?.length ?? 0) > 0 && (
          <ViewCard title="Seaman's Books">
            <div className="space-y-4">
              {d.seamansBooks!.map((s, i) => (
                <div key={i} className="rounded-lg border border-gray-100 dark:border-gray-700 p-4">
                  <ViewGrid cols={3}>
                    <ViewField label="Number"       value={s.number} />
                    <ViewField label="Country"      value={s.country} />
                    <ViewField label="Place Issued" value={s.placeIssued} />
                    <ViewField label="Date Issued"  value={formatDate(s.dateIssued)} />
                    <ViewField label="Date Expired" value={formatDate(s.dateExpired)} />
                  </ViewGrid>
                </div>
              ))}
            </div>
          </ViewCard>
        )}

        {/* Section 5 — Visas */}
        {(d.visas?.length ?? 0) > 0 && (
          <ViewCard title="Visas">
            <div className="space-y-4">
              {d.visas!.map((v, i) => (
                <div key={i} className="rounded-lg border border-gray-100 dark:border-gray-700 p-4">
                  <ViewGrid cols={3}>
                    <ViewField label="Country"      value={v.country} />
                    <ViewField label="Visa Type"    value={v.visaType} />
                    <ViewField label="Number"       value={v.number} />
                    <ViewField label="Place Issued" value={v.placeIssued} />
                    <ViewField label="Date Issued"  value={formatDate(v.dateIssued)} />
                    <ViewField label="Date Expired" value={formatDate(v.dateExpired)} />
                  </ViewGrid>
                </div>
              ))}
            </div>
          </ViewCard>
        )}

        {/* Section 6 — Endorsements */}
        {(d.endorsements?.length ?? 0) > 0 && (
          <ViewCard title="Endorsements">
            <div className="space-y-4">
              {d.endorsements!.map((e, i) => (
                <div key={i} className="rounded-lg border border-gray-100 dark:border-gray-700 p-4">
                  <ViewGrid cols={3}>
                    <ViewField label="Name"         value={e.name} />
                    <ViewField label="Number"       value={e.number} />
                    <ViewField label="Place Issued" value={e.placeIssued} />
                    <ViewField label="Date Issued"  value={formatDate(e.dateIssued)} />
                    <ViewField label="Date Expired" value={formatDate(e.dateExpired)} />
                  </ViewGrid>
                </div>
              ))}
            </div>
          </ViewCard>
        )}

        {/* Section 7 — STCW Certificates */}
        {(d.stcwCertificates?.length ?? 0) > 0 && (
          <ViewCard title="Certificates">
            <div className="space-y-4">
              {d.stcwCertificates!.map((c, i) => (
                <div key={i} className="rounded-lg border border-gray-100 dark:border-gray-700 p-4">
                  <ViewGrid cols={3}>
                    <ViewField label="Name"          value={c.name} />
                    <ViewField label="Course Number" value={c.courseNumber} />
                    <ViewField label="Place Issued"  value={c.placeIssued} />
                    <ViewField label="Date Issued"   value={formatDate(c.dateIssued)} />
                    <ViewField label="Date Expired"  value={formatDate(c.dateExpired)} />
                  </ViewGrid>
                </div>
              ))}
            </div>
          </ViewCard>
        )}

        {/* Section 8 — Sea Experience */}
        {(d.seaExperience?.length ?? 0) > 0 && (
          <ViewCard title="Sea Experience">
            <div className="space-y-4">
              {d.seaExperience!.map((s, i) => (
                <div key={i} className="rounded-lg border border-gray-100 dark:border-gray-700 p-4">
                  <ViewGrid cols={3}>
                    <ViewField label="Vessel Name"      value={s.vesselName} />
                    <ViewField label="Flag"             value={s.flag} />
                    <ViewField label="Vessel Type"      value={s.vesselType} />
                    <ViewField label="GRT"              value={String(s.grt ?? "")} />
                    <ViewField label="Engine Type"      value={s.engineType} />
                    <ViewField label="Engine KW"        value={String(s.engineKW ?? "")} />
                    <ViewField label="Shipping Company" value={s.company} />
                    <ViewField label="Rank"             value={s.rank} />
                    <ViewField label="Period From"      value={formatDate(s.periodFrom)} />
                    <ViewField label="Period To"        value={s.periodTo ? formatDate(s.periodTo) : "Present"} />
                  </ViewGrid>
                  {s.jobDescription && (
                    <div className="mt-3">
                      <ViewField label="Job Description" value={s.jobDescription} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ViewCard>
        )}

        {/* Section 9 — Documents */}
        <ViewCard title="Documents">
          <div className="space-y-4">
            {d.profilePhoto && (
              <div className="flex items-center gap-3">
                <img
                  src={d.profilePhoto}
                  alt="Profile"
                  className="h-20 w-20 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Profile Photo</span>
              </div>
            )}
            {d.resume?.fileUrl && (
              <div className="flex items-center gap-3">
                <a
                  href={d.resume.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-600 hover:underline dark:text-brand-400"
                >
                  {d.resume.fileName ?? "Resume / CV"}
                </a>
                <span className="text-xs text-gray-400 capitalize">({d.resume.uploadStatus})</span>
              </div>
            )}
            {(d.extraDocs?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Additional Documents</p>
                {d.extraDocs!.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {doc.fileUrl ? (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-600 hover:underline dark:text-brand-400"
                      >
                        {doc.name ?? doc.fileName ?? `Document ${i + 1}`}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-500">{doc.name ?? `Document ${i + 1}`}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ViewCard>

      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // CREATE / EDIT MODE — full multi-step form
  // ─────────────────────────────────────────────────────────────────

  return (
    <MultiStepFormLayout
      steps={STEPS}
      currentStep={currentStep}
      pageTitle={isEdit ? "Edit Crew Application" : "Crew Application Form"}
      pageSubtitle={
        isEdit
          ? "Update the application details below."
          : "Complete all steps to submit your professional profile."
      }
      onNext={handleNext}
      onBack={handleBack}
      completedSteps={completedSteps}
      onStepClick={handleStepClick}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="space-y-8">

        {/* ═══════════════════════════════════════════════════════
            STEP 1 — PERSONAL INFORMATION
        ═══════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">

            <FormSection>
              <FormGrid cols={2}>
                <Input
                  label="Position Applied"
                  placeholder="e.g. Third Officer"
                  value={scalar.positionApplied}
                  onChange={txt("positionApplied")}
                />
                <Input
                  label="Rank *"
                  placeholder="e.g. 2nd Officer"
                  value={scalar.rank}
                  onChange={txt("rank")}
                />
                <DatePicker
                  id="dateOfAvailability"
                  label="Date of Availability"
                  placeholder="DD/MM/YYYY"
                  onChange={(dates) =>
                    setField("dateOfAvailability", dates?.[0]?.toISOString() ?? "")
                  }
                />
                <Input
                  label="Availability Note"
                  placeholder="e.g. Any Time / After 30 days"
                  value={scalar.availabilityNote}
                  onChange={txt("availabilityNote")}
                />
              </FormGrid>
            </FormSection>

            <FormSection>
              <FormGrid cols={3}>
                <Input label="First Name *" value={scalar.firstName} onChange={txt("firstName")} />
                <Input label="Last Name *"  value={scalar.lastName}  onChange={txt("lastName")}  />
                <Input label="Nationality *" value={scalar.nationality} onChange={txt("nationality")} placeholder="e.g. Indian" />
              </FormGrid>
              <div className="mt-5">
                <FormGrid cols={3}>
                  <DatePicker
                    id="dateOfBirth"
                    label="Date of Birth *"
                    placeholder="DD/MM/YYYY"
                    onChange={(dates) =>
                      setField("dateOfBirth", dates?.[0]?.toISOString() ?? "")
                    }
                  />
                  <Input
                    label="Place of Birth"
                    placeholder="City, Country"
                    value={scalar.placeOfBirth}
                    onChange={txt("placeOfBirth")}
                  />
                  <Select
                    label="Marital Status"
                    options={MARITAL_OPTIONS}
                    placeholder="Select..."
                    value={scalar.maritalStatus}
                    onChange={(v) => setField("maritalStatus", v)}
                  />
                </FormGrid>
              </div>
              <div className="mt-5">
                <FormGrid cols={2}>
                  <Input label="Father's Name" value={scalar.fatherName} onChange={txt("fatherName")} />
                  <Input label="Mother's Name" value={scalar.motherName} onChange={txt("motherName")} />
                </FormGrid>
              </div>
            </FormSection>

            <FormSection>
              <div className="space-y-5">
                <div>
                  <Label>Present Address *</Label>
                  <TextArea
                    rows={2}
                    placeholder="Full residential address"
                    value={scalar.presentAddress}
                    onChange={(e) => setField("presentAddress", e.target.value)}
                  />
                </div>
                <FormGrid cols={2}>
                  <Input label="Email Address *" type="email" value={scalar.email}    onChange={txt("email")}    placeholder="john@example.com" />
                  <Input label="Cell Phone"                   value={scalar.cellPhone} onChange={txt("cellPhone")} placeholder="+91 9999999999" />
                  <Input label="Home Phone"                   value={scalar.homePhone} onChange={txt("homePhone")} placeholder="+91 011 2222222" />
                  <Input
                    label="Languages Spoken"
                    value={scalar.languages}
                    onChange={txt("languages")}
                    placeholder="English, Hindi (comma-separated)"
                  />
                </FormGrid>
              </div>
            </FormSection>

            <FormSection>
              <FormGrid cols={3}>
                <Input label="Nearest Airport"  value={scalar.nearestAirport} onChange={txt("nearestAirport")} placeholder="Dehradun, India" />
                <Input label="Km from Airport" type="number" value={scalar.kmFromAirport} onChange={txt("kmFromAirport")} placeholder="220" />
                <Input label="Weight (kg)"     type="number" value={scalar.weightKg}      onChange={txt("weightKg")}      placeholder="70" />
                <Input label="Height (cm)"     type="number" value={scalar.heightCm}      onChange={txt("heightCm")}      placeholder="175" />
                <Input
                  label="Coverall Size"
                  value={scalar.coverallSize}
                  onChange={txt("coverallSize")}
                  placeholder="e.g. 40R or XL"
                />
                <Input label="Shoe Size"  value={scalar.shoeSize}  onChange={txt("shoeSize")}  placeholder="8" />
                <Input label="Hair Color" value={scalar.hairColor} onChange={txt("hairColor")} placeholder="Black" />
                <Input label="Eye Color"  value={scalar.eyeColor}  onChange={txt("eyeColor")}  placeholder="Brown" />
              </FormGrid>
            </FormSection>

            <FormSection>
              <FormGrid cols={2}>
                <DatePicker
                  id="medicalCertIssuedDate"
                  label="Medical Cert. Issued"
                  placeholder="DD/MM/YYYY"
                  onChange={(dates) =>
                    setField("medicalCertIssuedDate", dates?.[0]?.toISOString() ?? "")
                  }
                />
                <DatePicker
                  id="medicalCertExpiredDate"
                  label="Medical Cert. Expired"
                  placeholder="DD/MM/YYYY"
                  onChange={(dates) =>
                    setField("medicalCertExpiredDate", dates?.[0]?.toISOString() ?? "")
                  }
                />
              </FormGrid>
              <div className="mt-5">
                <FormGrid cols={2}>
                  <Input
                    label="Next of Kin — Name"
                    value={scalar.nextOfKinName}
                    onChange={txt("nextOfKinName")}
                    placeholder="Full name"
                  />
                  <Input
                    label="Relationship"
                    value={scalar.nextOfKinRelationship}
                    onChange={txt("nextOfKinRelationship")}
                    placeholder="Wife / Father"
                  />
                  <Input
                    label="NOK Phone"
                    value={scalar.nextOfKinPhone}
                    onChange={txt("nextOfKinPhone")}
                    placeholder="+91 9999999999"
                  />
                  <div className="sm:col-span-2 col-span-1">
                    <Label>NOK Address</Label>
                    <TextArea
                      rows={2}
                      value={scalar.nextOfKinAddress}
                      onChange={(e) => setField("nextOfKinAddress", e.target.value)}
                      placeholder="Full address"
                    />
                  </div>
                </FormGrid>
              </div>
            </FormSection>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            STEP 2 — CERTIFICATE OF COMPETENCY (CoC)
        ═══════════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {coc.items.map((item, idx) => (
              <RepeatCard
                key={idx}
                index={idx}
                label="CoC"
                onRemove={() => coc.remove(idx)}
                canRemove={coc.items.length > 1}
              >
                <FormGrid cols={2}>
                  <Input label="Country *" placeholder="e.g. Honduras" value={item.country} onChange={(e) => coc.update(idx, "country", e.target.value)} />
                  <Input label="Grade of Licence *" placeholder="e.g. Chief Mate Reg. II/2 (Unlimited)" value={item.grade} onChange={(e) => coc.update(idx, "grade", e.target.value)} />
                  <Input label="Licence Number *" placeholder="e.g. K8037816" value={item.number} onChange={(e) => coc.update(idx, "number", e.target.value)} />
                  <Input label="Place of Issue" placeholder="City/Country" value={item.placeIssued} onChange={(e) => coc.update(idx, "placeIssued", e.target.value)} />
                  <DatePicker id={`coc_issued_${idx}`} label="Date Issued" placeholder="DD/MM/YYYY" onChange={(dates) => coc.update(idx, "dateIssued", dates?.[0]?.toISOString() ?? "")} />
                  <DatePicker id={`coc_expiry_${idx}`} label="Date Expired" placeholder="DD/MM/YYYY (blank = unlimited)" onChange={(dates) => coc.update(idx, "dateExpired", dates?.[0]?.toISOString() ?? "")} />
                </FormGrid>
              </RepeatCard>
            ))}
            <div className="flex justify-end pt-2">
              <AddItemButton onClick={() => coc.add(emptyLicence())}>Add CoC</AddItemButton>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            STEP 3 — CERTIFICATE OF EQUIVALENCY (CoE)
        ═══════════════════════════════════════════════════════ */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {coe.items.map((item, idx) => (
              <RepeatCard
                key={idx}
                index={idx}
                label="CoE"
                onRemove={() => coe.remove(idx)}
                canRemove={coe.items.length > 1}
              >
                <FormGrid cols={2}>
                  <Input label="Country *" placeholder="e.g. Liberia" value={item.country} onChange={(e) => coe.update(idx, "country", e.target.value)} />
                  <Input label="Grade of Licence *" placeholder="e.g. Second Officer II/1" value={item.grade} onChange={(e) => coe.update(idx, "grade", e.target.value)} />
                  <Input label="Licence Number *" placeholder="Number" value={item.number} onChange={(e) => coe.update(idx, "number", e.target.value)} />
                  <Input label="Place of Issue" placeholder="City/Country" value={item.placeIssued} onChange={(e) => coe.update(idx, "placeIssued", e.target.value)} />
                  <DatePicker id={`coe_issued_${idx}`} label="Date Issued" placeholder="DD/MM/YYYY" onChange={(dates) => coe.update(idx, "dateIssued", dates?.[0]?.toISOString() ?? "")} />
                  <DatePicker id={`coe_expiry_${idx}`} label="Date Expired" placeholder="DD/MM/YYYY (blank = unlimited)" onChange={(dates) => coe.update(idx, "dateExpired", dates?.[0]?.toISOString() ?? "")} />
                </FormGrid>
              </RepeatCard>
            ))}
            <div className="flex justify-end pt-2">
              <AddItemButton onClick={() => coe.add(emptyLicence())}>Add CoE</AddItemButton>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            STEP 4 — PASSPORTS
        ═══════════════════════════════════════════════════════ */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {passports.items.map((item, idx) => (
              <RepeatCard
                key={idx}
                index={idx}
                label="Passport"
                onRemove={() => passports.remove(idx)}
                canRemove={passports.items.length > 1}
              >
                <FormGrid cols={1}>
                  <Input label="Passport Number *" placeholder="e.g. Z6824864" value={item.number} onChange={(e) => passports.update(idx, "number", e.target.value)} />
                  <Input label="Country *" placeholder="e.g. India" value={item.country} onChange={(e) => passports.update(idx, "country", e.target.value)} />
                  <Input label="Place of Issue" placeholder="e.g. Dehradun" value={item.placeIssued} onChange={(e) => passports.update(idx, "placeIssued", e.target.value)} />
                  <DatePicker id={`pass_issued_${idx}`} label="Date Issued" placeholder="DD/MM/YYYY" onChange={(dates) => passports.update(idx, "dateIssued", dates?.[0]?.toISOString() ?? "")} />
                  <DatePicker id={`pass_expiry_${idx}`} label="Date Expired" placeholder="DD/MM/YYYY" onChange={(dates) => passports.update(idx, "dateExpired", dates?.[0]?.toISOString() ?? "")} />
                </FormGrid>
              </RepeatCard>
            ))}
            <div className="flex justify-end pt-2">
              <AddItemButton onClick={() => passports.add(emptyPassport())}>Add Passport</AddItemButton>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            STEP 5 — SEAMAN'S BOOKS
        ═══════════════════════════════════════════════════════ */}
        {currentStep === 5 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {seamans.items.map((item, idx) => (
              <RepeatCard
                key={idx}
                index={idx}
                label="Seaman's Book"
                onRemove={() => seamans.remove(idx)}
                canRemove={seamans.items.length > 1}
              >
                <FormGrid cols={2}>
                  <Input label="Country *" placeholder="e.g. India" value={item.country} onChange={(e) => seamans.update(idx, "country", e.target.value)} />
                  <Input label="Number *" placeholder="e.g. MUM132428" value={item.number} onChange={(e) => seamans.update(idx, "number", e.target.value)} />
                  <Input label="Place of Issue" placeholder="e.g. Mumbai" value={item.placeIssued} onChange={(e) => seamans.update(idx, "placeIssued", e.target.value)} />
                  <DatePicker id={`sb_issued_${idx}`} label="Date Issued" placeholder="DD/MM/YYYY" onChange={(dates) => seamans.update(idx, "dateIssued", dates?.[0]?.toISOString() ?? "")} />
                  <DatePicker id={`sb_expiry_${idx}`} label="Date Expired" placeholder="DD/MM/YYYY (blank = unlimited)" onChange={(dates) => seamans.update(idx, "dateExpired", dates?.[0]?.toISOString() ?? "")} />
                </FormGrid>
              </RepeatCard>
            ))}
            <div className="flex justify-end pt-2">
              <AddItemButton onClick={() => seamans.add(emptySeaman())}>Add Seaman&apos;s Book</AddItemButton>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            STEP 6 — VISAS
        ═══════════════════════════════════════════════════════ */}
        {currentStep === 6 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {visas.items.map((item, idx) => (
              <RepeatCard
                key={idx}
                index={idx}
                label="Visa"
                onRemove={() => visas.remove(idx)}
                canRemove={visas.items.length > 1}
              >
                <FormGrid cols={2}>
                  <Input label="Country *" placeholder="e.g. USA" value={item.country} onChange={(e) => visas.update(idx, "country", e.target.value)} />
                  <Input label="Visa Type *" placeholder="e.g. C1/D, Schengen" value={item.visaType} onChange={(e) => visas.update(idx, "visaType", e.target.value)} />
                  <Input label="Visa Number *" placeholder="e.g. N2791258" value={item.number} onChange={(e) => visas.update(idx, "number", e.target.value)} />
                  <Input label="Place of Issue" placeholder="e.g. Kolkata" value={item.placeIssued} onChange={(e) => visas.update(idx, "placeIssued", e.target.value)} />
                  <DatePicker id={`visa_issued_${idx}`} label="Date Issued" placeholder="DD/MM/YYYY" onChange={(dates) => visas.update(idx, "dateIssued", dates?.[0]?.toISOString() ?? "")} />
                  <DatePicker id={`visa_expiry_${idx}`} label="Date Expired" placeholder="DD/MM/YYYY" onChange={(dates) => visas.update(idx, "dateExpired", dates?.[0]?.toISOString() ?? "")} />
                </FormGrid>
              </RepeatCard>
            ))}
            <div className="flex justify-end pt-2">
              <AddItemButton onClick={() => visas.add(emptyVisa())}>Add Visa</AddItemButton>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            STEP 7 — ENDORSEMENTS
        ═══════════════════════════════════════════════════════ */}
        {currentStep === 7 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {endorsements.items.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
                No endorsements added yet. Click below to add one.
              </p>
            )}
            {endorsements.items.map((item, idx) => (
              <RepeatCard
                key={idx}
                index={idx}
                label="Endorsement"
                onRemove={() => endorsements.remove(idx)}
                canRemove
              >
                <FormGrid cols={2}>
                  <div className="sm:col-span-2">
                    <Input
                      label="Certificates Name *"
                      placeholder="e.g. Ship Security Officer / Tanker Endorsement"
                      value={item.name}
                      onChange={(e) => endorsements.update(idx, "name", e.target.value)}
                    />
                  </div>
                  <Input label="Number" placeholder="e.g. K8037816" value={item.number} onChange={(e) => endorsements.update(idx, "number", e.target.value)} />
                  <Input label="Place of Issue" value={item.placeIssued} onChange={(e) => endorsements.update(idx, "placeIssued", e.target.value)} />
                  <DatePicker id={`endors_issued_${idx}`} label="Date Issued" placeholder="DD/MM/YYYY" onChange={(dates) => endorsements.update(idx, "dateIssued", dates?.[0]?.toISOString() ?? "")} />
                  <DatePicker id={`endors_expiry_${idx}`} label="Date Expired" placeholder="DD/MM/YYYY (blank = unlimited)" onChange={(dates) => endorsements.update(idx, "dateExpired", dates?.[0]?.toISOString() ?? "")} />
                </FormGrid>
              </RepeatCard>
            ))}
            <div className="flex justify-end pt-2">
              <AddItemButton onClick={() => endorsements.add(emptyEndorse())}>Add Endorsement</AddItemButton>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            STEP 8 — CERTIFICATES (STCW)
        ═══════════════════════════════════════════════════════ */}
        {currentStep === 8 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <FormSection>
              <div className="space-y-4">
                {stcw.items.map((item, idx) => (
                  <RepeatCard
                    key={idx}
                    index={idx}
                    label="Certificate"
                    onRemove={() => stcw.remove(idx)}
                    canRemove={stcw.items.length > 1}
                  >
                    <FormGrid cols={2}>
                      <div className="sm:col-span-2">
                        <Input
                          label="Certificate Name *"
                          placeholder="e.g. Advanced Fire Fighting Course"
                          value={item.name}
                          onChange={(e) => stcw.update(idx, "name", e.target.value)}
                        />
                      </div>
                      <Input label="Course Number" placeholder="e.g. AFF/0221/AD/0651" value={item.courseNumber} onChange={(e) => stcw.update(idx, "courseNumber", e.target.value)} />
                      <Input label="Place of Issue" placeholder="e.g. Greater Noida" value={item.placeIssued} onChange={(e) => stcw.update(idx, "placeIssued", e.target.value)} />
                      <DatePicker id={`stcw_issued_${idx}`} label="Date Issued" placeholder="DD/MM/YYYY" onChange={(dates) => stcw.update(idx, "dateIssued", dates?.[0]?.toISOString() ?? "")} />
                      <DatePicker id={`stcw_expiry_${idx}`} label="Expiration Date" placeholder="DD/MM/YYYY (blank = unlimited)" onChange={(dates) => stcw.update(idx, "dateExpired", dates?.[0]?.toISOString() ?? "")} />
                    </FormGrid>
                  </RepeatCard>
                ))}
                <div className="flex justify-end pt-2">
                  <AddItemButton onClick={() => stcw.add(emptyCert())}>Add Another Certificate</AddItemButton>
                </div>
              </div>
            </FormSection>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            STEP 9 — SEA EXPERIENCE
        ═══════════════════════════════════════════════════════ */}
        {currentStep === 9 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-4">
              {seaExp.items.map((item, idx) => (
                <RepeatCard
                  key={idx}
                  index={idx}
                  label="Vessel"
                  onRemove={() => seaExp.remove(idx)}
                  canRemove={seaExp.items.length > 1}
                >
                  <div className="space-y-5">
                    <FormGrid cols={3}>
                      <Input label="Vessel Name *" placeholder="e.g. LPG GAS TEESA" value={item.vesselName} onChange={(e) => seaExp.update(idx, "vesselName", e.target.value)} />
                      <Input label="Flag" placeholder="e.g. Malaysia" value={item.flag} onChange={(e) => seaExp.update(idx, "flag", e.target.value)} />
                      <Select label="Vessel Type *" options={VESSEL_TYPE_OPTIONS} placeholder="Select type..." value={item.vesselType} onChange={(v) => seaExp.update(idx, "vesselType", v)} />
                    </FormGrid>
                    <FormGrid cols={3}>
                      <Input label="GRT" placeholder="e.g. 5103" type="number" value={item.grt} onChange={(e) => seaExp.update(idx, "grt", e.target.value)} />
                      <Input label="Engine Type" placeholder="e.g. MAK 6M 552C" value={item.engineType} onChange={(e) => seaExp.update(idx, "engineType", e.target.value)} />
                      <Input label="Engine KW" placeholder="e.g. 4563" type="number" value={item.engineKW} onChange={(e) => seaExp.update(idx, "engineKW", e.target.value)} />
                    </FormGrid>
                    <FormGrid cols={2}>
                      <Input label="Shipping Company *" placeholder="e.g. UNI Fleet SDN BHD" value={item.company} onChange={(e) => seaExp.update(idx, "company", e.target.value)} />
                      <Input label="Rank *" placeholder="e.g. Second Officer" value={item.rank} onChange={(e) => seaExp.update(idx, "rank", e.target.value)} />
                      <DatePicker id={`sea_from_${idx}`} label="Period From *" placeholder="DD/MM/YYYY" onChange={(dates) => seaExp.update(idx, "periodFrom", dates?.[0]?.toISOString() ?? "")} />
                      <DatePicker id={`sea_to_${idx}`} label="Period To" placeholder="DD/MM/YYYY (blank = still onboard)" onChange={(dates) => seaExp.update(idx, "periodTo", dates?.[0]?.toISOString() ?? "")} />
                    </FormGrid>
                    <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
                      <Label>Job Description / Offshore Details</Label>
                      <TextArea
                        rows={3}
                        placeholder="Type of job (Supply, AHTS), water depth, rig/barge name, charterer, client..."
                        value={item.jobDescription}
                        onChange={(e) => seaExp.update(idx, "jobDescription", e.target.value)}
                      />
                    </div>
                  </div>
                </RepeatCard>
              ))}
              <div className="flex justify-end pt-2">
                <AddItemButton onClick={() => seaExp.add(emptySeaExp())}>Add Vessel</AddItemButton>
              </div>
            </div>

            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 dark:border-red-500/20 dark:bg-red-500/10">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">{submitError}</p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            STEP 10 — DOCUMENTS
        ═══════════════════════════════════════════════════════ */}
        {currentStep === 10 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">

            <FormSection>
              <FormGrid cols={2}>
                <div className="space-y-2">
                  <Label>Profile Photo (Passport Size) *</Label>
                  <FileInput
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setField("profilePhoto", file);
                    }}
                  />
                  {/* Show existing photo in edit mode */}
                  {isEdit && initialData?.profilePhoto && !scalar.profilePhoto && (
                    <div className="flex items-center gap-2 mt-2">
                      <img
                        src={initialData.profilePhoto}
                        alt="Current profile"
                        className="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                      />
                      <span className="text-xs text-gray-500">Current photo (upload to replace)</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Image format preferred (JPG/PNG)</p>
                </div>

                <div className="space-y-2">
                  <Label>Full Resume / CV *</Label>
                  <FileInput
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setField("resume", file);
                    }}
                  />
                  {/* Show existing resume in edit mode */}
                  {isEdit && initialData?.resume?.fileUrl && !scalar.resume && (
                    <div className="flex items-center gap-2 mt-2">
                      <a
                        href={initialData.resume.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand-600 hover:underline dark:text-brand-400"
                      >
                        {initialData.resume.fileName ?? "Current Resume"}
                      </a>
                      <span className="text-xs text-gray-400">(upload to replace)</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">PDF or Word document</p>
                </div>
              </FormGrid>
            </FormSection>

            <FormSection>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Additional Documents</h3>
                <p className="text-sm text-gray-500">Add any other relevant certificates, appraisals, or medical records.</p>
              </div>

              <div className="space-y-4">
                {extraDocs.items.map((item, idx) => (
                  <RepeatCard
                    key={idx}
                    index={idx}
                    label="Extra Document"
                    onRemove={() => extraDocs.remove(idx)}
                    canRemove={true}
                  >
                    <FormGrid cols={2}>
                      <div className="space-y-1">
                        <Label>Document Name</Label>
                        <Input
                          placeholder="e.g. Yellow Fever Cert"
                          value={item.name}
                          onChange={(e) => extraDocs.update(idx, "name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Upload File</Label>
                        <FileInput
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            extraDocs.update(idx, "file", file);
                          }}
                        />
                        {/* Show existing uploaded doc link in edit mode */}
                        {isEdit && initialData?.extraDocs?.[idx]?.fileUrl && !item.file && (
                          <a
                            href={initialData.extraDocs[idx].fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-600 hover:underline dark:text-brand-400"
                          >
                            {initialData.extraDocs[idx].fileName ?? "Existing file"} (upload to replace)
                          </a>
                        )}
                      </div>
                    </FormGrid>
                  </RepeatCard>
                ))}
                <div className="flex justify-end pt-2">
                  <AddItemButton onClick={() => extraDocs.add({ name: "", file: null })}>
                    Add Document
                  </AddItemButton>
                </div>
              </div>
            </FormSection>

            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 dark:border-red-500/20 dark:bg-red-500/10">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">{submitError}</p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            STEP 11 — REVIEW & SUBMIT
        ═══════════════════════════════════════════════════════ */}
        {currentStep === 11 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DynamicReview
              scalar={scalar}
              coc={coc}
              coe={coe}
              passports={passports}
              seamans={seamans}
              visas={visas}
              seaExp={seaExp}
              extraDocs={extraDocs}
            />
          </div>
        )}

      </div>
    </MultiStepFormLayout>
  );
}