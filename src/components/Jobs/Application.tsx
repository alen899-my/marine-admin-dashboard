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
import { applicationSchema } from "@/lib/validations/applicationSchema";
import Joi from "joi";
import { toast } from "react-toastify";

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

const emptyLicence = (): LicenceItem => ({ licenceType: "coc", country: "", grade: "", number: "", placeIssued: "", dateIssued: "", dateExpired: "" });
const emptyPassport = (): PassportItem => ({ number: "", country: "", placeIssued: "", dateIssued: "", dateExpired: "" });
const emptySeaman = (): SeamansBookItem => ({ number: "", country: "", placeIssued: "", dateIssued: "", dateExpired: "" });
const emptyVisa = (): VisaItem => ({ country: "", visaType: "", number: "", placeIssued: "", dateIssued: "", dateExpired: "" });
const emptyEndorse = (): EndorsementItem => ({ name: "", country: "", number: "", placeIssued: "", dateIssued: "", dateExpired: "" });
const emptyCert = (): CertificateItem => ({ name: "", courseNumber: "", placeIssued: "", dateIssued: "", dateExpired: "" });
const emptySeaExp = (): SeaExperienceItem => ({ vesselName: "", flag: "", grt: "", vesselType: "", engineType: "", engineKW: "", company: "", rank: "", periodFrom: "", periodTo: "", areaOfOperation: "", jobDescription: "" });

// ─────────────────────────────────────────────────────────────────
// STEPS
// ─────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: "Personal Information", description: "Identity, contact and physical details" },
  { id: 2, title: "Certificate of Competency", description: "CoC licences issued by flag states" },
  { id: 3, title: "Certificate of Equivalent", description: "CoE licences issued by flag states" },
  { id: 4, title: "Passport", description: "All passports, including expired" },
  { id: 5, title: "Seaman's Book", description: "All seaman's books, including expired" },
  { id: 6, title: "Visa", description: "" },
  { id: 7, title: "Endorsements", description: "Flag-state endorsements and attestations" },
  { id: 8, title: "Certificates", description: "Training certificates" },
  { id: 9, title: "Sea Experience", description: "Previous sea service and vessel history" },
  { id: 10, title: "Documents", description: "All Documents Upload" },
  { id: 11, title: "Review & Submit", description: "Verify your details before final submission" },
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

  const add = useCallback((empty: T) => setItems((prev) => [...prev, empty]), []);
  const remove = useCallback((idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx)), []);
  const reset = useCallback((newItems: T[]) => setItems(newItems), []);

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
  status: string;
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
  seaExperienceDetail: "", additionalInfo: "", status: "draft",
};

// ─────────────────────────────────────────────────────────────────
// SELECT OPTIONS
// ─────────────────────────────────────────────────────────────────

const MARITAL_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
];

const COVERALL_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"].map((s) => ({ value: s, label: s }));

const VESSEL_TYPE_OPTIONS = [
  "LPG", "LNGC", "Oil Tanker", "Chemical Tanker", "Container", "Bulk Carrier",
  "Offshore Supply", "AHTS", "RORO", "Passenger", "General Cargo", "Other",
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
    positionApplied: data.positionApplied ?? "",
    rank: data.rank ?? "",
    dateOfAvailability: data.dateOfAvailability ?? "",
    availabilityNote: data.availabilityNote ?? "",
    profilePhoto: null,
    resume: null,
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    nationality: data.nationality ?? "",
    dateOfBirth: data.dateOfBirth ?? "",
    placeOfBirth: data.placeOfBirth ?? "",
    maritalStatus: data.maritalStatus ?? "",
    fatherName: data.fatherName ?? "",
    motherName: data.motherName ?? "",
    presentAddress: data.presentAddress ?? "",
    email: data.email ?? "",
    cellPhone: data.cellPhone ?? "",
    homePhone: data.homePhone ?? "",
    languages: langs,
    nearestAirport: data.nearestAirport ?? "",
    kmFromAirport: String(data.kmFromAirport ?? ""),
    weightKg: String(data.weightKg ?? ""),
    heightCm: String(data.heightCm ?? ""),
    coverallSize: data.coverallSize ?? "",
    shoeSize: data.shoeSize ?? "",
    hairColor: data.hairColor ?? "",
    eyeColor: data.eyeColor ?? "",
    medicalCertIssuedDate: data.medicalCertIssuedDate ?? "",
    medicalCertExpiredDate: data.medicalCertExpiredDate ?? "",
    nextOfKinName: data.nextOfKin?.name ?? "",
    nextOfKinRelationship: data.nextOfKin?.relationship ?? "",
    nextOfKinPhone: data.nextOfKin?.phone ?? "",
    nextOfKinAddress: data.nextOfKin?.address ?? "",
    seaExperienceDetail: data.seaExperienceDetail ?? "",
    additionalInfo: data.additionalInfo ?? "",
    status: data.status ?? "draft",
  };
}

function sanitizeLicence(l: LicenceItem & { _id?: string; uploadStatus?: string }): LicenceItem {
  return {
    licenceType: l.licenceType === "coe" ? "coe" : "coc",
    country: l.country ?? "",
    grade: l.grade ?? "",
    number: l.number ?? "",
    placeIssued: l.placeIssued ?? "",
    dateIssued: l.dateIssued ?? "",
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
  companyName?: string;
  mode?: FormMode;
  initialData?: CrewApplicationData;
  applicationId?: string;
}

export default function CrewApplicationForm({
  companyId,
  companyName,
  mode = "create",
  initialData,
  applicationId,
}: CrewApplicationFormProps) {
  const router = useRouter();
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>(() =>
  isEdit ? STEPS.map((s) => s.id) : []
);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
  const coc = useArray<LicenceItem>([emptyLicence()]);
  const coe = useArray<LicenceItem>([emptyLicence()]);
  const passports = useArray<PassportItem>([emptyPassport()]);
  const seamans = useArray<SeamansBookItem>([emptySeaman()]);
  const visas = useArray<VisaItem>([emptyVisa()]);
  const endorsements = useArray<EndorsementItem>([]);
  const stcw = useArray<CertificateItem>([emptyCert()]);
  const otherCerts = useArray<CertificateItem>([]);
  const seaExp = useArray<SeaExperienceItem>([emptySeaExp()]);
  const extraDocs = useArray<{ name: string; file: File | null }>([
    { name: "Experience Certificate", file: null },
    { name: "STCW Course", file: null },
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

    if (initialData.passports?.length) passports.reset(initialData.passports.map(sanitizePassport));
    if (initialData.seamansBooks?.length) seamans.reset(initialData.seamansBooks.map(sanitizeSeaman));
    if (initialData.visas?.length) visas.reset(initialData.visas.map(sanitizeVisa));
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
  const handleNext = async () => {
    // Basic step validation
    setValidationErrors({});
    let isValid = true;
    const errors: Record<string, string> = {};

    const validateJoi = (schema: Joi.Schema, data: any, prefix?: string) => {
      const { error } = schema.validate(data, { abortEarly: false, allowUnknown: true });
      if (error) {
        isValid = false;
        error.details.forEach(detail => {
          const path = prefix ? `${prefix}.${detail.path.join(".")}` : detail.path.join(".");
          errors[path] = detail.message.replace(/"/g, '');
        });
      }
    };

    if (currentStep === 1) {
      // Validate all Step 1 scalar fields using the main schema
      // Since scalar contains everything, we just validate it against the entire schema
      // and only care about the scalar keys. The schema allows unknown keys.
      const step1Data = {
        ...scalar,
        nextOfKin: {
          name: scalar.nextOfKinName,
          relationship: scalar.nextOfKinRelationship,
          phone: scalar.nextOfKinPhone,
          address: scalar.nextOfKinAddress,
        },
      };

      const step1Schema = applicationSchema.fork(
        ["licences", "passports", "seamansBooks", "visas", "seaExperience", "company", "formSource"],
        (schema) => schema.optional()
      );

      validateJoi(step1Schema, step1Data);
    } else if (currentStep === 2) {
      // CoC
      if (coc.items.length === 0) {
        isValid = false;
        errors["coc"] = "At least one CoC is required";
      }
      coc.items.forEach((item, idx) => {
        validateJoi(applicationSchema.extract("licences").$_terms.items[0], item, `coc.${idx}`);
      });
    } else if (currentStep === 3) {
      // CoE
      coe.items.forEach((item, idx) => {
        if (item.number || item.country || item.dateIssued) {
          validateJoi(applicationSchema.extract("licences").$_terms.items[0], item, `coe.${idx}`);
        }
      });
    } else if (currentStep === 4) {
      // Passports - minimum 1 required by schema
      if (passports.items.length === 0) {
        isValid = false;
        errors["passports"] = "At least one Passport is required";
      }
      passports.items.forEach((item, idx) => {
        validateJoi(applicationSchema.extract("passports").$_terms.items[0], item, `passports.${idx}`);
      });
    } else if (currentStep === 5) {
      // Seaman's Book - minimum 1 required
      if (seamans.items.length === 0) {
        isValid = false;
        errors["seamansBooks"] = "At least one Seaman's Book is required";
      }
      seamans.items.forEach((item, idx) => {
        validateJoi(applicationSchema.extract("seamansBooks").$_terms.items[0], item, `seamansBooks.${idx}`);
      });
    } else if (currentStep === 6) {
      // Visas
      visas.items.forEach((item, idx) => {
        if (item.country || item.visaType || item.number || item.dateIssued) {
          validateJoi(applicationSchema.extract("visas").$_terms.items[0], item, `visas.${idx}`);
        }
      });
    } else if (currentStep === 7) {
      // Endorsements
      endorsements.items.forEach((item, idx) => {
        if (item.name || item.number || item.dateIssued) {
          validateJoi(Joi.object({
            name: Joi.string().required().label("Certificates Name").messages({ "string.empty": "{#label} is required" }),
          }).unknown(true), item, `endorsements.${idx}`);
        }
      });
    } else if (currentStep === 8) {
      stcw.items.forEach((item, idx) => {
        if (item.name || item.courseNumber || item.dateIssued) {
          validateJoi(Joi.object({
            name: Joi.string().required().label("Certificate Name").messages({ "string.empty": "{#label} is required" }),
          }).unknown(true), item, `stcw.${idx}`);
        }
      });
    } else if (currentStep === 9) {
      // Sea Experience - minimum 1 required
      if (seaExp.items.length === 0) {
        isValid = false;
        errors["seaExperience"] = "At least one Sea Experience entry is required";
      }
      seaExp.items.forEach((item, idx) => {
        validateJoi(applicationSchema.extract("seaExperience").$_terms.items[0], item, `seaExperience.${idx}`);
      });
    } else if (currentStep === 10) {
      if (!isEdit && !scalar.profilePhoto) {
        isValid = false;
        errors["profilePhoto"] = "Profile Photo is required";
      }
      if (!isEdit && !scalar.resume) {
        isValid = false;
        errors["resume"] = "Resume is required";
      }
    }

    if (!isValid) {
      setValidationErrors(errors);
      toast.error("Please fill in all required fields marked with *");
      return;
    }

    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }
    setCurrentStep((p) => Math.min(p + 1, STEPS.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStepClick = (stepId: number) => {
    // Only allow clicking steps you have already completed or the direct next allowed step
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
        "positionApplied", "rank", "dateOfAvailability", "availabilityNote",
        "firstName", "lastName", "nationality", "dateOfBirth", "placeOfBirth",
        "maritalStatus", "fatherName", "motherName",
        "presentAddress", "email", "cellPhone", "homePhone", "languages",
        "nearestAirport", "kmFromAirport", "weightKg", "heightCm",
        "coverallSize", "shoeSize", "hairColor", "eyeColor",
        "medicalCertIssuedDate", "medicalCertExpiredDate",
        "seaExperienceDetail", "additionalInfo", "status",
      ];
      scalarKeys.forEach((k) => {
        const v = scalar[k];
        if (v && typeof v === "string") fd.append(k, v);
      });

      if (scalar.nextOfKinName) {
        fd.append("nextOfKin.name", scalar.nextOfKinName);
        fd.append("nextOfKin.relationship", scalar.nextOfKinRelationship);
        if (scalar.nextOfKinPhone) fd.append("nextOfKin.phone", scalar.nextOfKinPhone);
        if (scalar.nextOfKinAddress) fd.append("nextOfKin.address", scalar.nextOfKinAddress);
      }

      if (scalar.profilePhoto) fd.append("profilePhoto", scalar.profilePhoto);
      if (scalar.resume) fd.append("resume", scalar.resume);

      const allLicences = [
        ...coc.items.map((l) => ({ ...l, licenceType: "coc" })),
        ...coe.items.map((l) => ({ ...l, licenceType: "coe" })),
      ];
      fd.append("licences", JSON.stringify(allLicences));
      fd.append("passports", JSON.stringify(passports.items));
      fd.append("seamansBooks", JSON.stringify(seamans.items));
      fd.append("visas", JSON.stringify(visas.items));
      fd.append("endorsements", JSON.stringify(endorsements.items));
      fd.append("stcwCertificates", JSON.stringify(stcw.items));
      fd.append("otherCertificates", JSON.stringify(otherCerts.items));
      fd.append("seaExperience", JSON.stringify(seaExp.items));

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
        router.refresh(); // Invalidate cache so list and view pages are fresh
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

    // ── Tiny shared components ────────────────────────────────────────────────

    // Section heading with a numbered badge
    const Sec = ({ n, title }: { n: string; title: string }) => (
      <div className="flex items-center gap-2 pt-2 pb-3 border-b border-gray-200 dark:border-white/10 mb-4">
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-brand-600 text-[10px] font-bold text-white">
          {n}
        </span>
        <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{title}</span>
      </div>
    );

    // Single label + value pair
    const F = ({ label, value }: { label: string; value?: string | null }) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {label}
        </span>
        <span className="text-sm text-gray-800 dark:text-white/90 break-words">
          {value?.trim() || <span className="text-gray-300 dark:text-gray-600 italic">—</span>}
        </span>
      </div>
    );

    // Responsive grid wrapper
    const G2 = ({ children }: { children: React.ReactNode }) => (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">{children}</div>
    );
    const G3 = ({ children }: { children: React.ReactNode }) => (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">{children}</div>
    );

    // Thin divider
    const Hr = () => <hr className="border-gray-100 dark:border-white/5 my-5" />;

    // Small repeating-record label (Record 1, Record 2…)
    const RecLabel = ({ i }: { i: number }) =>
      i === 0 ? null : (
        <div className="mt-5 mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Record {i + 1}
        </div>
      );

    // ── Page ─────────────────────────────────────────────────────────────────

    return (
      <div className="space-y-0 divide-y divide-gray-100 dark:divide-white/5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 overflow-hidden pb-2">

        {/* ── PROFILE HEADER ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 p-5">

          {/* Photo */}
          {d.profilePhoto ? (
            <img
              src={d.profilePhoto}
              alt="Profile"
              className="h-20 w-20 shrink-0 rounded-lg object-cover border border-gray-200 dark:border-white/10"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">No Photo</span>
            </div>
          )}

          {/* Name + meta */}
          <div className="flex flex-1 flex-col justify-center gap-1.5">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              {d.firstName} {d.lastName}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {[d.rank, d.positionApplied, d.nationality].filter(Boolean).join(" · ")}
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              {d.status && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 dark:border-brand-500/30 bg-brand-50 dark:bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700 dark:text-brand-300 capitalize">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  {d.status.replace("_", " ")}
                </span>
              )}
              {d.email && (
                <span className="text-[11px] text-gray-400 dark:text-gray-500">{d.email}</span>
              )}
              {d.cellPhone && (
                <span className="text-[11px] text-gray-400 dark:text-gray-500">{d.cellPhone}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── 01 PERSONAL INFORMATION ───────────────────────────────────── */}
        <div className="p-5 space-y-5">
          <Sec n="01" title="Personal Information" />
          <G3>
            <F label="First Name" value={d.firstName} />
            <F label="Last Name" value={d.lastName} />
            <F label="Nationality" value={d.nationality} />
            <F label="Date of Birth" value={formatDate(d.dateOfBirth)} />
            <F label="Place of Birth" value={d.placeOfBirth} />
            <F label="Marital Status" value={d.maritalStatus} />
            <F label="Father's Name" value={d.fatherName} />
            <F label="Mother's Name" value={d.motherName} />
          </G3>
          <Hr />
          <G2>
            <F label="Email" value={d.email} />
            <F label="Cell Phone" value={d.cellPhone} />
            <F label="Home Phone" value={d.homePhone} />
            <F label="Languages" value={langDisplay} />
          </G2>
          <F label="Present Address" value={d.presentAddress} />
          <Hr />
          <G3>
            <F label="Nearest Airport" value={d.nearestAirport} />
            <F label="Km from Airport" value={String(d.kmFromAirport ?? "")} />
            <F label="Weight (kg)" value={String(d.weightKg ?? "")} />
            <F label="Height (cm)" value={String(d.heightCm ?? "")} />
            <F label="Coverall Size" value={d.coverallSize} />
            <F label="Shoe Size" value={d.shoeSize} />
            <F label="Hair Color" value={d.hairColor} />
            <F label="Eye Color" value={d.eyeColor} />
            <F label="Medical Cert. Issued" value={formatDate(d.medicalCertIssuedDate)} />
            <F label="Medical Cert. Expired" value={formatDate(d.medicalCertExpiredDate)} />
          </G3>

          {/* Next of Kin */}
          {d.nextOfKin?.name && (
            <>
              <Hr />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                Next of Kin
              </p>
              <G2>
                <F label="Name" value={d.nextOfKin.name} />
                <F label="Relationship" value={d.nextOfKin.relationship} />
                <F label="Phone" value={d.nextOfKin.phone} />
                <F label="Address" value={d.nextOfKin.address} />
              </G2>
            </>
          )}
        </div>

        {/* ── 02 AVAILABILITY ───────────────────────────────────────────── */}
        <div className="p-5 space-y-4">
          <Sec n="02" title="Position & Availability" />
          <G2>
            <F label="Position Applied" value={d.positionApplied} />
            <F label="Rank" value={d.rank} />
            <F label="Date of Availability" value={formatDate(d.dateOfAvailability)} />
            <F label="Availability Note" value={d.availabilityNote} />
          </G2>
        </div>

        {/* ── 06 CoC ────────────────────────────────────────────────────── */}
        {cocItems.length > 0 && (
          <div className="p-5 space-y-0">
            <Sec n="06" title="Certificates of Competency (CoC)" />
            {cocItems.map((l, i) => (
              <div key={i}>
                {i > 0 && <Hr />}
                {cocItems.length > 1 && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                    Record {i + 1}
                  </p>
                )}
                <G3>
                  <F label="Country" value={l.country} />
                  <F label="Grade" value={l.grade} />
                  <F label="Licence No." value={l.number} />
                  <F label="Place Issued" value={l.placeIssued} />
                  <F label="Date Issued" value={formatDate(l.dateIssued as string)} />
                  <F label="Date Expired" value={formatDate(l.dateExpired as string) || "Unlimited"} />
                </G3>
              </div>
            ))}
          </div>
        )}

        {/* ── 07 CoE ────────────────────────────────────────────────────── */}
        {coeItems.length > 0 && (
          <div className="p-5 space-y-0">
            <Sec n="07" title="Certificates of Equivalency (CoE)" />
            {coeItems.map((l, i) => (
              <div key={i}>
                {i > 0 && <Hr />}
                {coeItems.length > 1 && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                    Record {i + 1}
                  </p>
                )}
                <G3>
                  <F label="Country" value={l.country} />
                  <F label="Grade" value={l.grade} />
                  <F label="Licence No." value={l.number} />
                  <F label="Place Issued" value={l.placeIssued} />
                  <F label="Date Issued" value={formatDate(l.dateIssued as string)} />
                  <F label="Date Expired" value={formatDate(l.dateExpired as string) || "Unlimited"} />
                </G3>
              </div>
            ))}
          </div>
        )}

        {/* ── 08 PASSPORTS ──────────────────────────────────────────────── */}
        {(d.passports?.length ?? 0) > 0 && (
          <div className="p-5">
            <Sec n="08" title="Passports" />
            {d.passports!.map((p, i) => (
              <div key={i}>
                {i > 0 && <Hr />}
                {d.passports!.length > 1 && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                    Record {i + 1}
                  </p>
                )}
                <G3>
                  <F label="Passport No." value={p.number} />
                  <F label="Country" value={p.country} />
                  <F label="Place Issued" value={p.placeIssued} />
                  <F label="Date Issued" value={formatDate(p.dateIssued as string)} />
                  <F label="Date Expired" value={formatDate(p.dateExpired as string)} />
                </G3>
              </div>
            ))}
          </div>
        )}

        {/* ── 09 SEAMAN'S BOOKS ─────────────────────────────────────────── */}
        {(d.seamansBooks?.length ?? 0) > 0 && (
          <div className="p-5">
            <Sec n="09" title="Seaman's Books" />
            {d.seamansBooks!.map((s, i) => (
              <div key={i}>
                {i > 0 && <Hr />}
                {d.seamansBooks!.length > 1 && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                    Record {i + 1}
                  </p>
                )}
                <G3>
                  <F label="Book No." value={s.number} />
                  <F label="Country" value={s.country} />
                  <F label="Place Issued" value={s.placeIssued} />
                  <F label="Date Issued" value={formatDate(s.dateIssued as string)} />
                  <F label="Date Expired" value={formatDate(s.dateExpired as string) || "Unlimited"} />
                </G3>
              </div>
            ))}
          </div>
        )}

        {/* ── 10 VISAS ──────────────────────────────────────────────────── */}
        {(d.visas?.length ?? 0) > 0 && (
          <div className="p-5">
            <Sec n="10" title="Visas" />
            {d.visas!.map((v, i) => (
              <div key={i}>
                {i > 0 && <Hr />}
                {d.visas!.length > 1 && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                    Record {i + 1}
                  </p>
                )}
                <G3>
                  <F label="Country" value={v.country} />
                  <F label="Visa Type" value={v.visaType} />
                  <F label="Visa No." value={v.number} />
                  <F label="Place Issued" value={v.placeIssued} />
                  <F label="Date Issued" value={formatDate(v.dateIssued as string)} />
                  <F label="Date Expired" value={formatDate(v.dateExpired as string)} />
                </G3>
              </div>
            ))}
          </div>
        )}

        {/* ── 11 ENDORSEMENTS ───────────────────────────────────────────── */}
        {(d.endorsements?.length ?? 0) > 0 && (
          <div className="p-5">
            <Sec n="11" title="Endorsements" />
            {d.endorsements!.map((e, i) => (
              <div key={i}>
                {i > 0 && <Hr />}
                {d.endorsements!.length > 1 && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                    Record {i + 1}
                  </p>
                )}
                <div className="space-y-4">
                  <F label="Certificate Name" value={e.name} />
                  <G3>
                    <F label="Number" value={e.number} />
                    <F label="Place Issued" value={e.placeIssued} />
                    <F label="Date Issued" value={formatDate(e.dateIssued as string)} />
                    <F label="Date Expired" value={formatDate(e.dateExpired as string) || "Unlimited"} />
                  </G3>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 12 STCW CERTIFICATES ──────────────────────────────────────── */}
        {(d.stcwCertificates?.length ?? 0) > 0 && (
          <div className="p-5">
            <Sec n="12" title="Training Certificates (STCW)" />
            {d.stcwCertificates!.map((c, i) => (
              <div key={i}>
                {i > 0 && <Hr />}
                {d.stcwCertificates!.length > 1 && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                    Record {i + 1}
                  </p>
                )}
                <div className="space-y-4">
                  <F label="Certificate Name" value={c.name} />
                  <G3>
                    <F label="Course No." value={c.courseNumber} />
                    <F label="Place Issued" value={c.placeIssued} />
                    <F label="Date Issued" value={formatDate(c.dateIssued as string)} />
                    <F label="Expiry Date" value={formatDate(c.dateExpired as string) || "No Expiry"} />
                  </G3>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 13 SEA SERVICE RECORD ─────────────────────────────────────── */}
        {(d.seaExperience?.length ?? 0) > 0 && (
          <div className="p-5">
            <Sec n="13" title="Sea Service Record" />
            <div className="overflow-x-auto -mx-1">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/10">
                    {["Vessel", "Flag", "Type", "GRT", "Engine", "KW", "Company", "Rank", "From", "To"].map((h) => (
                      <th
                        key={h}
                        className="pb-2 pr-5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {d.seaExperience!.map((s, i) => (
                    <tr key={i} className="align-top">
                      <td className="py-3 pr-5 font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">{s.vesselName || "—"}</td>
                      <td className="py-3 pr-5 text-gray-600 dark:text-gray-400 whitespace-nowrap">{s.flag || "—"}</td>
                      <td className="py-3 pr-5 text-gray-600 dark:text-gray-400 whitespace-nowrap">{s.vesselType || "—"}</td>
                      <td className="py-3 pr-5 text-gray-600 dark:text-gray-400 whitespace-nowrap">{s.grt ?? "—"}</td>
                      <td className="py-3 pr-5 text-gray-600 dark:text-gray-400 whitespace-nowrap">{s.engineType || "—"}</td>
                      <td className="py-3 pr-5 text-gray-600 dark:text-gray-400 whitespace-nowrap">{s.engineKW ?? "—"}</td>
                      <td className="py-3 pr-5 text-gray-600 dark:text-gray-400 whitespace-nowrap">{s.company || "—"}</td>
                      <td className="py-3 pr-5 font-medium text-brand-600 dark:text-brand-400 whitespace-nowrap">{s.rank || "—"}</td>
                      <td className="py-3 pr-5 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(s.periodFrom as string) || "—"}</td>
                      <td className="py-3 pr-5 whitespace-nowrap">
                        {s.periodTo
                          ? <span className="text-gray-600 dark:text-gray-400">{formatDate(s.periodTo as string)}</span>
                          : <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-400">Present</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Job descriptions below table if any */}
            {d.seaExperience!.some((s) => s.jobDescription) && (
              <div className="mt-4 space-y-3">
                {d.seaExperience!.map((s, i) =>
                  s.jobDescription ? (
                    <div key={i}>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        {s.vesselName} — Remarks
                      </span>
                      <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{s.jobDescription}</p>
                    </div>
                  ) : null
                )}
              </div>
            )}
          </div>
        )}

        {/* ── 14 DOCUMENTS ──────────────────────────────────────────────── */}
        <div className="p-5">
          <Sec n="14" title="Uploaded Documents" />
          <div className="space-y-3">
            {d.resume?.fileUrl && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 w-24 shrink-0">Resume / CV</span>
                <a href={d.resume.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
                  {d.resume.fileName ?? "View Resume"}
                </a>
              </div>
            )}
            {(d.extraDocs?.length ?? 0) > 0 && d.extraDocs!.map((doc, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 w-24 shrink-0 truncate">
                  {doc.name || `Doc ${i + 1}`}
                </span>
                {doc.fileUrl
                  ? <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">{doc.fileName ?? "View File"}</a>
                  : <span className="text-sm text-gray-300 dark:text-gray-600 italic">Not uploaded</span>
                }
              </div>
            ))}
            {!d.resume?.fileUrl && (d.extraDocs?.length ?? 0) === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">No documents uploaded.</p>
            )}
          </div>
        </div>

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
      pageTitle={isEdit ? "Edit Crew Application" : (companyName ? `${companyName} Crew Application Form` : "Crew Application Form")}
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
                {isEdit && (
                  <div className="col-span-1 sm:col-span-2">
                    <Select
                      label="Application Status"
                      options={[
                        { value: "draft", label: "Draft" },
                        { value: "submitted", label: "Submitted" },
                        { value: "reviewing", label: "Reviewing" },
                        { value: "approved", label: "Approved" },
                        { value: "rejected", label: "Rejected" },
                        { value: "on_hold", label: "On Hold" },
                        { value: "archived", label: "Archived" },
                      ]}
                      placeholder="Select status..."
                      value={scalar.status}
                      onChange={(v) => setField("status", v)}
                    />
                  </div>
                )}
                <Input
                  label="Position Applied *"
                  placeholder="e.g. Third Officer"
                  value={scalar.positionApplied}
                  onChange={txt("positionApplied")}
                  error={!!validationErrors.positionApplied}
                  hint={validationErrors.positionApplied}
                />
                <Input
                  label="Rank *"
                  placeholder="e.g. 2nd Officer"
                  value={scalar.rank}
                  onChange={txt("rank")}
                  error={!!validationErrors.rank}
                  hint={validationErrors.rank}
                />
                <DatePicker
                  id="dateOfAvailability"
                  label="Date of Availability *"
                  placeholder="DD/MM/YYYY"
                  onChange={(dates) =>
                    setField("dateOfAvailability", dates?.[0]?.toISOString() ?? "")
                  }
                  error={!!validationErrors.dateOfAvailability}
                  hint={validationErrors.dateOfAvailability}
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
                <Input label="First Name *" placeholder="e.g. John" value={scalar.firstName} onChange={txt("firstName")} hint={validationErrors.firstName} error={!!validationErrors.firstName} />
                <Input label="Last Name *" placeholder="e.g. Doe" value={scalar.lastName} onChange={txt("lastName")} hint={validationErrors.lastName} error={!!validationErrors.lastName} />
                <Input label="Nationality *" placeholder="e.g. Indian" value={scalar.nationality} onChange={txt("nationality")} hint={validationErrors.nationality} error={!!validationErrors.nationality} />
                <DatePicker id="dob" label="Date of Birth *" placeholder="DD/MM/YYYY"
                  defaultDate={scalar.dateOfBirth ? new Date(scalar.dateOfBirth) : undefined}
                  onChange={(dates) => setField("dateOfBirth", dates?.[0]?.toISOString() ?? "")}
                  hint={validationErrors.dateOfBirth} error={!!validationErrors.dateOfBirth}
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
                    error={!!validationErrors.presentAddress}
                    hint={validationErrors.presentAddress}
                  />
                </div>
                <FormGrid cols={2}>
                  <Input label="Email Address *" type="email" placeholder="john@example.com" value={scalar.email} onChange={txt("email")} error={!!validationErrors.email} hint={validationErrors.email} />
                  <Input label="Cell Phone *" type="number" placeholder="919876543210" value={scalar.cellPhone} onChange={txt("cellPhone")} error={!!validationErrors.cellPhone} hint={validationErrors.cellPhone} />
                  <Input label="Home Phone" type="number" placeholder="91112345678" value={scalar.homePhone} onChange={txt("homePhone")} />
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
                <Input label="Nearest Airport" value={scalar.nearestAirport} onChange={txt("nearestAirport")} placeholder="Dehradun, India" />
                <Input label="Km from Airport" type="number" value={scalar.kmFromAirport} onChange={txt("kmFromAirport")} placeholder="220" />
                <Input label="Weight (kg) *" placeholder="e.g. 75" type="number" value={scalar.weightKg} onChange={txt("weightKg")} error={!!validationErrors.weightKg} hint={validationErrors.weightKg} />
                <Input label="Height (cm) *" placeholder="e.g. 175" type="number" value={scalar.heightCm} onChange={txt("heightCm")} error={!!validationErrors.heightCm} hint={validationErrors.heightCm} />
                <Input label="Coverall Size *" placeholder="e.g. XL" value={scalar.coverallSize} onChange={txt("coverallSize")} error={!!validationErrors.coverallSize} hint={validationErrors.coverallSize} />
                <Input label="Safety Shoe Size *" type="number" placeholder="e.g. 42" value={scalar.shoeSize} onChange={txt("shoeSize")} error={!!validationErrors.shoeSize} hint={validationErrors.shoeSize} />
                <Input label="Hair Color *" placeholder="e.g. Black" value={scalar.hairColor} onChange={txt("hairColor")} error={!!validationErrors.hairColor} hint={validationErrors.hairColor} />
                <Input label="Eye Color *" placeholder="e.g. Brown" value={scalar.eyeColor} onChange={txt("eyeColor")} error={!!validationErrors.eyeColor} hint={validationErrors.eyeColor} />
              </FormGrid>
            </FormSection>

            <FormSection >
              <FormGrid cols={2}>
                <DatePicker id="med_issued" label="Date Issued *" placeholder="DD/MM/YYYY"
                  defaultDate={scalar.medicalCertIssuedDate ? new Date(scalar.medicalCertIssuedDate) : undefined}
                  onChange={(dates) => setField("medicalCertIssuedDate", dates?.[0]?.toISOString() ?? "")}
                  error={!!validationErrors.medicalCertIssuedDate} hint={validationErrors.medicalCertIssuedDate}
                />
                <DatePicker id="med_exp" label="Expiration Date *" placeholder="DD/MM/YYYY"
                  defaultDate={scalar.medicalCertExpiredDate ? new Date(scalar.medicalCertExpiredDate) : undefined}
                  onChange={(dates) => setField("medicalCertExpiredDate", dates?.[0]?.toISOString() ?? "")}
                  error={!!validationErrors.medicalCertExpiredDate} hint={validationErrors.medicalCertExpiredDate}
                />
              </FormGrid>
              <div className="mt-5">
                <FormGrid cols={2}>
                  <Input
                    label="Next of Kin — Name *"
                    value={scalar.nextOfKinName}
                    onChange={txt("nextOfKinName")}
                    placeholder="Full name"
                    error={!!validationErrors["nextOfKin.name"]}
                    hint={validationErrors["nextOfKin.name"]}
                  />
                  <Input
                    label="Relationship *"
                    value={scalar.nextOfKinRelationship}
                    onChange={txt("nextOfKinRelationship")}
                    placeholder="Wife / Father"
                    error={!!validationErrors["nextOfKin.relationship"]}
                    hint={validationErrors["nextOfKin.relationship"]}
                  />
                  <Input
                    label="NOK Phone *"
                    type="number"
                    value={scalar.nextOfKinPhone}
                    onChange={txt("nextOfKinPhone")}
                    placeholder="919999999999"
                    error={!!validationErrors["nextOfKin.phone"]}
                    hint={validationErrors["nextOfKin.phone"]}
                  />
                  <div className="sm:col-span-2 col-span-1">
                    <Label>NOK Address *</Label>
                    <TextArea
                      rows={2}
                      value={scalar.nextOfKinAddress}
                      onChange={(e) => setField("nextOfKinAddress", e.target.value)}
                      placeholder="Full address"
                      error={!!validationErrors["nextOfKin.address"]}
                      hint={validationErrors["nextOfKin.address"]}
                    />
                  </div>
                </FormGrid>
              </div>
            </FormSection>
          </div>
        )
        }

        {/* ═══════════════════════════════════════════════════════
            STEP 2 — CERTIFICATE OF COMPETENCY (CoC)
        ═══════════════════════════════════════════════════════ */}
        {
          currentStep === 2 && (
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
                    <Input label="Country *" placeholder="e.g. Honduras" value={item.country} onChange={(e) => coc.update(idx, "country", e.target.value)} error={!!validationErrors[`coc.${idx}.country`]} hint={validationErrors[`coc.${idx}.country`]} />
                    <Input label="Grade of Licence *" placeholder="e.g. Chief Mate Reg. II/2 (Unlimited)" value={item.grade} onChange={(e) => coc.update(idx, "grade", e.target.value)} error={!!validationErrors[`coc.${idx}.grade`]} hint={validationErrors[`coc.${idx}.grade`]} />
                    <Input label="Licence Number *" placeholder="e.g. K8037816" value={item.number} onChange={(e) => coc.update(idx, "number", e.target.value)} error={!!validationErrors[`coc.${idx}.number`]} hint={validationErrors[`coc.${idx}.number`]} />
                    <Input label="Place of Issue" placeholder="City/Country" value={item.placeIssued} onChange={(e) => coc.update(idx, "placeIssued", e.target.value)} />
                    <DatePicker id={`coc_issued_${idx}`} label="Date Issued *" placeholder="DD/MM/YYYY" onChange={(dates) => coc.update(idx, "dateIssued", dates?.[0]?.toISOString() ?? "")} error={!!validationErrors[`coc.${idx}.dateIssued`]} hint={validationErrors[`coc.${idx}.dateIssued`]} />
                    <DatePicker id={`coc_expiry_${idx}`} label="Date Expired" placeholder="DD/MM/YYYY (blank = unlimited)" onChange={(dates) => coc.update(idx, "dateExpired", dates?.[0]?.toISOString() ?? "")} />
                  </FormGrid>
                </RepeatCard>
              ))}
              <div className="flex justify-end pt-2">
                <AddItemButton onClick={() => coc.add(emptyLicence())}>Add CoC</AddItemButton>
              </div>
            </div>
          )
        }

        {/* ═══════════════════════════════════════════════════════
            STEP 3 — CERTIFICATE OF EQUIVALENCY (CoE)
        ═══════════════════════════════════════════════════════ */}
        {
          currentStep === 3 && (
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
                    <Input label="Country *" placeholder="e.g. Liberia" value={item.country} onChange={(e) => coe.update(idx, "country", e.target.value)} error={!!validationErrors[`coe.${idx}.country`]} hint={validationErrors[`coe.${idx}.country`]} />
                    <Input label="Grade of Licence *" placeholder="e.g. Second Officer II/1" value={item.grade} onChange={(e) => coe.update(idx, "grade", e.target.value)} error={!!validationErrors[`coe.${idx}.grade`]} hint={validationErrors[`coe.${idx}.grade`]} />
                    <Input label="Licence Number *" placeholder="Number" value={item.number} onChange={(e) => coe.update(idx, "number", e.target.value)} error={!!validationErrors[`coe.${idx}.number`]} hint={validationErrors[`coe.${idx}.number`]} />
                    <Input label="Place of Issue" placeholder="City/Country" value={item.placeIssued} onChange={(e) => coe.update(idx, "placeIssued", e.target.value)} />
                    <DatePicker id={`coe_issued_${idx}`} label="Date Issued *" placeholder="DD/MM/YYYY" onChange={(dates) => coe.update(idx, "dateIssued", dates?.[0]?.toISOString() ?? "")} error={!!validationErrors[`coe.${idx}.dateIssued`]} hint={validationErrors[`coe.${idx}.dateIssued`]} />
                    <DatePicker id={`coe_expiry_${idx}`} label="Date Expired" placeholder="DD/MM/YYYY (blank = unlimited)" onChange={(dates) => coe.update(idx, "dateExpired", dates?.[0]?.toISOString() ?? "")} />
                  </FormGrid>
                </RepeatCard>
              ))}
              <div className="flex justify-end pt-2">
                <AddItemButton onClick={() => coe.add(emptyLicence())}>Add CoE</AddItemButton>
              </div>
            </div>
          )
        }

        {/* ═══════════════════════════════════════════════════════
            STEP 4 — PASSPORTS
        ═══════════════════════════════════════════════════════ */}
        {
          currentStep === 4 && (
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
                    <Input label="Passport Number *" placeholder="e.g. Z6824864" value={item.number} onChange={(e) => passports.update(idx, "number", e.target.value)} error={!!validationErrors[`passports.${idx}.number`]} hint={validationErrors[`passports.${idx}.number`]} />
                    <Input label="Country *" placeholder="e.g. India" value={item.country} onChange={(e) => passports.update(idx, "country", e.target.value)} error={!!validationErrors[`passports.${idx}.country`]} hint={validationErrors[`passports.${idx}.country`]} />
                    <Input label="Place of Issue" placeholder="e.g. Dehradun" value={item.placeIssued} onChange={(e) => passports.update(idx, "placeIssued", e.target.value)} />
                    <DatePicker id={`pass_issued_${idx}`} label="Date Issued *" placeholder="DD/MM/YYYY" onChange={(dates) => passports.update(idx, "dateIssued", dates?.[0]?.toISOString() ?? "")} error={!!validationErrors[`passports.${idx}.dateIssued`]} hint={validationErrors[`passports.${idx}.dateIssued`]} />
                    <DatePicker id={`pass_expiry_${idx}`} label="Date Expired" placeholder="DD/MM/YYYY" onChange={(dates) => passports.update(idx, "dateExpired", dates?.[0]?.toISOString() ?? "")} />
                  </FormGrid>
                </RepeatCard>
              ))}
              <div className="flex justify-end pt-2">
                <AddItemButton onClick={() => passports.add(emptyPassport())}>Add Passport</AddItemButton>
              </div>
            </div>
          )
        }

        {/* ═══════════════════════════════════════════════════════
            STEP 5 — SEAMAN'S BOOKS
        ═══════════════════════════════════════════════════════ */}
        {
          currentStep === 5 && (
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
                    <Input label="Country *" placeholder="e.g. India" value={item.country} onChange={(e) => seamans.update(idx, "country", e.target.value)} error={!!validationErrors[`seamansBooks.${idx}.country`]} hint={validationErrors[`seamansBooks.${idx}.country`]} />
                    <Input label="Number *" placeholder="e.g. MUM132428" value={item.number} onChange={(e) => seamans.update(idx, "number", e.target.value)} error={!!validationErrors[`seamansBooks.${idx}.number`]} hint={validationErrors[`seamansBooks.${idx}.number`]} />
                    <Input label="Place of Issue" placeholder="e.g. Mumbai" value={item.placeIssued} onChange={(e) => seamans.update(idx, "placeIssued", e.target.value)} />
                    <DatePicker id={`sb_issued_${idx}`} label="Date Issued *" placeholder="DD/MM/YYYY" onChange={(dates) => seamans.update(idx, "dateIssued", dates?.[0]?.toISOString() ?? "")} error={!!validationErrors[`seamansBooks.${idx}.dateIssued`]} hint={validationErrors[`seamansBooks.${idx}.dateIssued`]} />
                    <DatePicker id={`sb_expiry_${idx}`} label="Date Expired" placeholder="DD/MM/YYYY (blank = unlimited)" onChange={(dates) => seamans.update(idx, "dateExpired", dates?.[0]?.toISOString() ?? "")} />
                  </FormGrid>
                </RepeatCard>
              ))}
              <div className="flex justify-end pt-2">
                <AddItemButton onClick={() => seamans.add(emptySeaman())}>Add Seaman&apos;s Book</AddItemButton>
              </div>
            </div>
          )
        }

        {/* ═══════════════════════════════════════════════════════
            STEP 6 — VISAS
        ═══════════════════════════════════════════════════════ */}
        {
          currentStep === 6 && (
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
                    <Input label="Country *" placeholder="e.g. USA" value={item.country} onChange={(e) => visas.update(idx, "country", e.target.value)} error={!!validationErrors[`visas.${idx}.country`]} hint={validationErrors[`visas.${idx}.country`]} />
                    <Input label="Visa Type *" placeholder="e.g. C1/D, Schengen" value={item.visaType} onChange={(e) => visas.update(idx, "visaType", e.target.value)} error={!!validationErrors[`visas.${idx}.visaType`]} hint={validationErrors[`visas.${idx}.visaType`]} />
                    <Input label="Visa Number *" placeholder="e.g. N2791258" value={item.number} onChange={(e) => visas.update(idx, "number", e.target.value)} error={!!validationErrors[`visas.${idx}.number`]} hint={validationErrors[`visas.${idx}.number`]} />
                    <Input label="Place of Issue" placeholder="e.g. Kolkata" value={item.placeIssued} onChange={(e) => visas.update(idx, "placeIssued", e.target.value)} />
                    <DatePicker id={`visa_issued_${idx}`} label="Date Issued *" placeholder="DD/MM/YYYY" onChange={(dates) => visas.update(idx, "dateIssued", dates?.[0]?.toISOString() ?? "")} error={!!validationErrors[`visas.${idx}.dateIssued`]} hint={validationErrors[`visas.${idx}.dateIssued`]} />
                    <DatePicker id={`visa_expiry_${idx}`} label="Date Expired" placeholder="DD/MM/YYYY" onChange={(dates) => visas.update(idx, "dateExpired", dates?.[0]?.toISOString() ?? "")} />
                  </FormGrid>
                </RepeatCard>
              ))}
              <div className="flex justify-end pt-2">
                <AddItemButton onClick={() => visas.add(emptyVisa())}>Add Visa</AddItemButton>
              </div>
            </div>
          )
        }

        {/* ═══════════════════════════════════════════════════════
            STEP 7 — ENDORSEMENTS
        ═══════════════════════════════════════════════════════ */}
        {
          currentStep === 7 && (
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
                        error={!!validationErrors[`endorsements.${idx}.name`]} hint={validationErrors[`endorsements.${idx}.name`]}
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
          )
        }

        {/* ═══════════════════════════════════════════════════════
            STEP 8 — CERTIFICATES (STCW)
        ═══════════════════════════════════════════════════════ */}
        {
          currentStep === 8 && (
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
                            error={!!validationErrors[`stcw.${idx}.name`]} hint={validationErrors[`stcw.${idx}.name`]}
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
          )
        }

        {/* ═══════════════════════════════════════════════════════
            STEP 9 — SEA EXPERIENCE
        ═══════════════════════════════════════════════════════ */}
        {
          currentStep === 9 && (
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
                        <Input label="Vessel Name *" placeholder="e.g. LPG GAS TEESA" value={item.vesselName} onChange={(e) => seaExp.update(idx, "vesselName", e.target.value)} error={!!validationErrors[`seaExperience.${idx}.vesselName`]} hint={validationErrors[`seaExperience.${idx}.vesselName`]} />
                        <Input label="Flag" placeholder="e.g. Malaysia" value={item.flag} onChange={(e) => seaExp.update(idx, "flag", e.target.value)} />
                        <Select label="Vessel Type *" options={VESSEL_TYPE_OPTIONS} placeholder="Select type..." value={item.vesselType} onChange={(v) => seaExp.update(idx, "vesselType", v)} error={!!validationErrors[`seaExperience.${idx}.vesselType`]} hint={validationErrors[`seaExperience.${idx}.vesselType`]} />
                      </FormGrid>
                      <FormGrid cols={3}>
                        <Input label="GRT" placeholder="e.g. 5103" type="number" value={item.grt} onChange={(e) => seaExp.update(idx, "grt", e.target.value)} />
                        <Input label="Engine Type" placeholder="e.g. MAK 6M 552C" value={item.engineType} onChange={(e) => seaExp.update(idx, "engineType", e.target.value)} />
                        <Input label="Engine KW" placeholder="e.g. 4563" type="number" value={item.engineKW} onChange={(e) => seaExp.update(idx, "engineKW", e.target.value)} />
                      </FormGrid>
                      <FormGrid cols={2}>
                        <Input label="Shipping Company *" placeholder="e.g. UNI Fleet SDN BHD" value={item.company} onChange={(e) => seaExp.update(idx, "company", e.target.value)} error={!!validationErrors[`seaExperience.${idx}.company`]} hint={validationErrors[`seaExperience.${idx}.company`]} />
                        <Input label="Rank *" placeholder="e.g. Second Officer" value={item.rank} onChange={(e) => seaExp.update(idx, "rank", e.target.value)} error={!!validationErrors[`seaExperience.${idx}.rank`]} hint={validationErrors[`seaExperience.${idx}.rank`]} />
                        <DatePicker id={`sea_from_${idx}`} label="Period From *" placeholder="DD/MM/YYYY" onChange={(dates) => seaExp.update(idx, "periodFrom", dates?.[0]?.toISOString() ?? "")} error={!!validationErrors[`seaExperience.${idx}.periodFrom`]} hint={validationErrors[`seaExperience.${idx}.periodFrom`]} />
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
          )
        }

        {/* ═══════════════════════════════════════════════════════
            STEP 10 — DOCUMENTS
        ═══════════════════════════════════════════════════════ */}
        {
          currentStep === 10 && (
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
          )
        }

        {/* ═══════════════════════════════════════════════════════
            STEP 11 — REVIEW & SUBMIT
        ═══════════════════════════════════════════════════════ */}
        {
          currentStep === 11 && (
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
          )
        }

      </div >
    </MultiStepFormLayout >
  );
}