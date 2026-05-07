"use client";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import { StepBar, STEPS } from "./StepBar";
import { Field } from "./Field";
import { PrefixInput } from "./PrefixInput";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import SearchableSelect from "@/components/form/SearchableSelect";
import SimpleDatePicker from "@/components/form/new-datepicker";
import { getCurrencySymbol } from "@/constants/geoData";
import { formatCurrency } from "@/lib/formatCurrency";
import { useAllowanceDeductionOptions } from "@/hooks/useAllowanceDeductionOptions";
import ComponentCard from "@/components/common/ComponentCard";
import { useSidebarNotifications } from "@/context/SidebarNotificationContext";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Application {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  rank: string;
  positionApplied?: string;
  jobTitle?: string | null;
  company?: string;
  companyName?: string;
  contractRaw?: any;
  contractStatus?: string;
  profilePhoto?: string;
  status?: string;
}

interface FormData {
  // Step 1 — Seafarer
  cdcNo: string;
  indosNo: string;
  // Step 2 — Wages
  wageEffectiveFrom: string;
  wageEffectiveTo: string;
  basicWages: string;
  otherAllowance: { value: string; type: 'amount' | 'percent' };
  allowances: { label: string; value: string; type?: 'amount' | 'percent' }[];
  // Step 3 — Vessel & Contract
  portOfJoining: string;
  commencement: string;
  contractPeriod: string;
  vesselId: string;
  signDate: string;
  signPlace: string;
  referenceNo: string;
}

type FormErrors = Partial<Record<Exclude<keyof FormData, "allowances">, string>> & {
  allowances?: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  mode?: "add" | "edit" | "view";
  onStatusChange?: () => void;
  embedded?: boolean;
  onLivePreviewChange?: (data: {
    vesselName?: string;
  }) => void;
  vesselOptions?: { value: string; label: string; id: string; companyId?: string }[];
  currencyCode?: string;
  currencySettings?: {
    currencyPosition: "left" | "right";
    currencyFormatType: "symbol" | "code";
    currencySpace: boolean;
  };
}

function getDuplicateAllowanceMessage(
  allowances: { label: string; value: string }[],
): string | null {
  const seen = new Set<string>();

  for (const allowance of allowances) {
    const label = allowance.label.trim();
    if (!label) continue;

    const normalized = label.toLowerCase();
    if (seen.has(normalized)) {
      return `${label} cannot be added more than once.`;
    }

    seen.add(normalized);
  }

  return null;
}

const statusMap: Record<
  string,
  {
    color:
      | "slate"
      | "sky"
      | "indigo"
      | "purple"
      | "cyan"
      | "teal"
      | "emerald"
      | "lime"
      | "green"
      | "gray"
      | "rose";
    label: string;
  }
> = {
  draft: { color: "slate", label: "Draft" },
  submitted: { color: "sky", label: "Submitted" },
  hr_review: { color: "indigo", label: "HR Review" },
  shortlisted: { color: "purple", label: "Shortlisted" },
  interview_scheduled: { color: "cyan", label: "Interview Scheduled" },
  interview_completed: { color: "teal", label: "Interview Completed" },
  selected: { color: "emerald", label: "Selected" },
  offer_sea_issued: { color: "lime", label: "Offer/SEA Issued" },
  accepted: { color: "green", label: "Accepted" },
  onboarding_ready: { color: "green", label: "Onboarding Ready" },
  onboarded: { color: "green", label: "Onboarded" },
  rejected: { color: "rose", label: "Rejected" },
};

// ─── Main Component ────────────────────────────────────────────────────────
const createDefaultForm = (): FormData => ({
  cdcNo: "",
  indosNo: "",
  wageEffectiveFrom: new Date().toISOString().split("T")[0],
  wageEffectiveTo: "",
  basicWages: "",
  otherAllowance: { value: "", type: "amount" },
  allowances: [],
  portOfJoining: "",
  commencement: "",
  contractPeriod: "",
  vesselId: "",
  signDate: "",
  signPlace: "",
  referenceNo: "",
});

export default function NewContractModal({
  isOpen,
  onClose,
  application,
  mode = "add",
  onStatusChange,
  embedded = false,
  onLivePreviewChange,
  vesselOptions: passedVesselOptions,
  currencyCode = "USD",
  currencySettings,
}: Props) {
  const currencySymbol = getCurrencySymbol(currencyCode);
  const embeddedSectionPadding = embedded
    ? "px-3 pt-3 sm:px-5 sm:pt-5 lg:px-6 lg:pt-6"
    : "";
  const embeddedInlinePadding = embedded ? "px-3 sm:px-5 lg:px-6" : "";
  const embeddedContentPadding = embedded
    ? "px-3 pb-3 sm:px-5 sm:pb-5 lg:px-6 lg:pb-6"
    : "p-1";
  const embeddedFooterPadding = embedded
    ? "px-3 pb-3 sm:px-5 sm:pb-5 lg:px-6 lg:pb-6"
    : "";
  const { options: allowanceOptions, loading: loadingAllowances } =
    useAllowanceDeductionOptions("allowance", application?.company);
  const router = useRouter();
  const { refreshCounts } = useSidebarNotifications();
  const [step, setStep] = useState(1);
  const [completed, setCompleted] = useState<number[]>([]);
  const [form, setForm] = useState<FormData>(createDefaultForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [vesselOptions, setVesselOptions] = useState<
    { value: string; label: string; id: string; companyId?: string }[]
  >([]);
  const [loadingVessels, setLoadingVessels] = useState(false);
  const [markingSent, setMarkingSent] = useState(false);
  const hasAutoAdvanced = useRef(false);
  const lastAppId = useRef<string | null>(null);

  // Update and filter local vesselOptions if passed prop or application changes
  useEffect(() => {
    if (passedVesselOptions && application?.company) {
      const filtered = passedVesselOptions.filter(
        (v) => !v.companyId || v.companyId === application.company,
      );
      setVesselOptions(filtered);
    } else if (passedVesselOptions) {
      setVesselOptions(passedVesselOptions);
    }
  }, [passedVesselOptions, application?.company]);

  // Reset on close or populate on open
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setCompleted([]);
      setForm(createDefaultForm());
      setErrors({});
      setSubmitting(false);
      hasAutoAdvanced.current = false;
      lastAppId.current = null;
      return;
    }

    // Only populate form if it's a new open OR a new application
    const isNewApp = application?._id !== lastAppId.current;

    if (application?.contractRaw && (isNewApp || !hasAutoAdvanced.current)) {
      const c = application.contractRaw;
      const w = c.wages || {};

      const cdc = c.cdcNo || "";
      const indos = c.indosNo || "";
      const basic = w.basic ? String(w.basic) : "";
      const joining = c.portOfJoining || "";
      const commence = c.commencement
        ? new Date(c.commencement).toISOString().split("T")[0]
        : "";
      const wageEffectiveFrom = w.effectiveFrom
        ? new Date(w.effectiveFrom).toISOString().split("T")[0]
        : commence || new Date().toISOString().split("T")[0];
      const wageEffectiveTo = w.effectiveTo
        ? new Date(w.effectiveTo).toISOString().split("T")[0]
        : "";
      const period = c.contractPeriod || "";

      setForm({
        cdcNo: cdc,
        indosNo: indos,
        wageEffectiveFrom,
        wageEffectiveTo,
        basicWages: basic,
        otherAllowance: (w.otherAllowance && typeof w.otherAllowance === 'object')
          ? { value: String((w.otherAllowance as any).value || ""), type: (w.otherAllowance as any).type || 'amount' }
          : { value: w.otherAllowance != null ? String(w.otherAllowance) : "", type: 'amount' },
        allowances:
          Array.isArray(w.allowances) && w.allowances.length > 0
            ? w.allowances.map((a: any) => ({
                label: a.label,
                value: String(a.value),
                type: a.type || 'amount',
              }))
            : [],
        portOfJoining: joining,
        commencement: commence,
        contractPeriod: period,
        vesselId: c.vesselId?._id || c.vesselId || "",
        signDate: c.signDate
          ? new Date(c.signDate).toISOString().split("T")[0]
          : "",
        signPlace: c.signPlace || "",
        referenceNo: c.referenceNo || "",
      });

      // Auto-advance step if draft is partially filled (only on first open/new app)
      let currentStep = 1;
      const newCompleted: number[] = [];

      if (cdc && indos) {
        newCompleted.push(1);
        currentStep = 2;
        if (basic && parseFloat(basic) > 0) {
          newCompleted.push(2);
          currentStep = 3;
          if (joining && commence && period) {
            newCompleted.push(3);
          }
        }
      }

      setStep(currentStep);
      setCompleted(newCompleted);
      hasAutoAdvanced.current = true;
      lastAppId.current = application._id;
    } else if (
      !application?.contractRaw &&
      (isNewApp || !hasAutoAdvanced.current)
    ) {
      setStep(1);
      setCompleted([]);
      setForm(createDefaultForm());
      hasAutoAdvanced.current = true;
      lastAppId.current = application?._id || null;
    }

    setErrors({});
    setSubmitting(false);
  }, [isOpen, application]);

  const set =
    (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
    };

  const handleOtherAllowanceChange = (field: 'value' | 'type', value: string) => {
    setForm((prev) => ({
      ...prev,
      otherAllowance: { ...prev.otherAllowance, [field]: value },
    }));
  };

  const handleDateChange = (key: keyof FormData) => (isoString: string) => {
    setForm((prev) => ({ ...prev, [key]: isoString }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const basicVal = parseFloat(form.basicWages || "0") || 0;
  const otherVal = parseFloat(form.otherAllowance.value || "0") || 0;
  const otherCalculated = form.otherAllowance.type === 'percent' 
    ? (basicVal * (otherVal / 100)) 
    : otherVal;

  const total = basicVal + otherCalculated + form.allowances.reduce(
    (acc, curr) => {
      const val = parseFloat(curr.value || "0") || 0;
      const calculated = curr.type === 'percent' ? (basicVal * (val / 100)) : val;
      return acc + calculated;
    },
    0,
  );

  useEffect(() => {
    if (!onLivePreviewChange) return;

    const selectedVessel = vesselOptions.find((v) => v.value === form.vesselId);
    onLivePreviewChange({
      vesselName:
        selectedVessel?.label ||
        application?.contractRaw?.vesselId?.name ||
        application?.contractRaw?.vesselName ||
        "",
    });
  }, [
    application?.contractRaw?.vesselId?.name,
    application?.contractRaw?.vesselName,
    form.vesselId,
    onLivePreviewChange,
    vesselOptions,
  ]);

  // ─── Validation ───────────────────────────────────────────────────
  const validateStep = (s: number): boolean => {
    const errs: FormErrors = {};
    if (s === 1) {
      if (!form.cdcNo.trim()) errs.cdcNo = "CDC Number is required";
      if (!form.indosNo.trim()) errs.indosNo = "INDOS Number is required";
    }
    if (s === 2) {
      if (!form.wageEffectiveFrom) {
        errs.wageEffectiveFrom = "Salary effective from date is required";
      }
      if (
        form.wageEffectiveFrom &&
        form.wageEffectiveTo &&
        new Date(form.wageEffectiveTo).getTime() <
          new Date(form.wageEffectiveFrom).getTime()
      ) {
        errs.wageEffectiveTo =
          "Salary effective end date cannot be before the start date";
      }
      if (!form.basicWages || parseFloat(form.basicWages) <= 0)
        errs.basicWages = "Basic wages must be greater than 0";

      const duplicateAllowanceMessage = getDuplicateAllowanceMessage(
        form.allowances,
      );
      if (duplicateAllowanceMessage) {
        errs.allowances = duplicateAllowanceMessage;
      }
    }
    if (s === 3) {
      if (!form.portOfJoining.trim())
        errs.portOfJoining = "Port of joining is required";
      if (!form.commencement)
        errs.commencement = "Commencement date is required";
      if (!form.contractPeriod)
        errs.contractPeriod = "Contract period is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setCompleted((prev) => (prev.includes(step) ? prev : [...prev, step]));
    handleSubmit(true, true); // Auto-save as draft
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep === step) return;

    // If moving forward, validate current step
    if (targetStep > step) {
      if (mode !== "view") {
        if (!validateStep(step)) return;
        setCompleted((prev) => (prev.includes(step) ? prev : [...prev, step]));
        handleSubmit(true, true); // Auto-save
      } else {
        setCompleted((prev) => (prev.includes(step) ? prev : [...prev, step]));
      }
    }

    setStep(targetStep);
  };

  // ─── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async (
    isDraft: boolean = false,
    isAutoSave: boolean = false,
  ) => {
    if (mode === "view") return;
    if (!isDraft && !validateStep(3)) return;
    if (!application) return;

    const duplicateAllowanceMessage = getDuplicateAllowanceMessage(
      form.allowances,
    );
    if (duplicateAllowanceMessage) {
      setErrors((prev) => ({ ...prev, allowances: duplicateAllowanceMessage }));
      if (!isAutoSave) setStep(2);
      return;
    }

    if (!isAutoSave) setSubmitting(true);
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: application.contractRaw?._id,
          applicationId: application._id,
          seafarerName: `${application.firstName} ${application.lastName}`,
          seafarerEmail: application.email,
          rank: application.rank,
          positionApplied:
            application.jobTitle || application.positionApplied || "",
          companyId: application.company,
          cdcNo: form.cdcNo.trim(),
          indosNo: form.indosNo.trim(),
          vesselId: form.vesselId,
          portOfJoining: form.portOfJoining.trim(),
          commencement: form.commencement,
          contractPeriod: form.contractPeriod,
          isDraft,
          wages: {
            basic: parseFloat(form.basicWages || "0") || 0,
            otherAllowance: {
              value: parseFloat(form.otherAllowance.value || "0") || 0,
              type: form.otherAllowance.type,
            },
            allowances: form.allowances.map((a) => ({
              ...a,
              value: parseFloat(a.value || "0") || 0,
            })),
          },
          wageEffectiveFrom: form.wageEffectiveFrom,
          wageEffectiveTo: form.wageEffectiveTo,
          signDate: form.signDate,
          signPlace: form.signPlace.trim(),
          referenceNo: form.referenceNo.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create contract");

      await refreshCounts();

      if (isAutoSave) {
        router.refresh(); // Refresh background table
      } else {
        toast.success(
          isDraft
            ? "Contract draft saved!"
            : "Contract generated successfully!",
        );
        router.refresh();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to auto-save draft");
    } finally {
      if (!isAutoSave) setSubmitting(false);
    }
  };


  if (!application) return null;

  const name = `${application.firstName} ${application.lastName}`;
  const initials =
    `${application.firstName?.[0] ?? ""}${application.lastName?.[0] ?? ""}`.toUpperCase();
  const position = application.jobTitle || application.positionApplied || "—";
  const statusConfig = statusMap[application.status || "draft"] ?? statusMap.draft;

  // ─── Step Content ─────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            {/* Candidate card */}
            <ComponentCard title="Seafarer">
              <div className="flex items-center gap-3 sm:gap-4 py-1">
                {application.profilePhoto ? (
                  <Image
                    src={application.profilePhoto}
                    alt={name}
                    width={48}
                    height={48}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 shrink-0"
                  />
                ) : (
                  <span className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold text-sm sm:text-base shadow-sm ring-1 ring-brand-600/10 dark:ring-brand-500/20 shrink-0">
                    {initials}
                  </span>
                )}
                
                <div className="min-w-0 flex-1 flex items-center justify-between gap-4">
                  <div className="flex flex-col min-w-0">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                      {name}
                    </h4>
                    <p className="mt-0.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{application.rank}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0"></span>
                      <span className="truncate">{position}</span>
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                      {application.email}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Badge color={statusConfig.color as any}>{statusConfig.label}</Badge>
                  </div>
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Identification">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="CDC Number *"
                  placeholder="e.g. MUM-2024-001234"
                  value={form.cdcNo}
                  onChange={set("cdcNo")}
                  error={!!errors.cdcNo}
                  hint={errors.cdcNo}
                  disabled={submitting}
                />
                <Input
                  label="INDOS Number *"
                  placeholder="e.g. INDOS123456789"
                  value={form.indosNo}
                  onChange={set("indosNo")}
                  error={!!errors.indosNo}
                  hint={errors.indosNo}
                  disabled={submitting}
                />
              </div>
            </ComponentCard>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <ComponentCard title="Wage Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SimpleDatePicker
                  label="Salary Effective From *"
                  value={form.wageEffectiveFrom}
                  onChange={handleDateChange("wageEffectiveFrom")}
                  error={!!errors.wageEffectiveFrom}
                  hint={errors.wageEffectiveFrom}
                  disabled={submitting}
                />
                <SimpleDatePicker
                  label="Salary Effective End Date"
                  value={form.wageEffectiveTo}
                  onChange={handleDateChange("wageEffectiveTo")}
                  error={!!errors.wageEffectiveTo}
                  hint={errors.wageEffectiveTo}
                  disabled={submitting}
                />
                <Field
                  label={`Basic Wages (${currencyCode}/month)`}
                  required
                  error={errors.basicWages}
                >
                  <PrefixInput
                    prefix={currencySymbol}
                    type="number"
                    min="0"
                    placeholder="e.g. 2500"
                    value={form.basicWages}
                    onChange={set("basicWages")}
                    disabled={submitting}
                  />
                </Field>
                <Field label={`Other Allowance (${currencyCode}/month)`}>
                  <PrefixInput
                    prefix={currencySymbol}
                    type="number"
                    min="0"
                    placeholder="e.g. 200"
                    value={form.otherAllowance.value}
                    onChange={(e) => handleOtherAllowanceChange('value', e.target.value)}
                    showTypeSelector
                    valueType={form.otherAllowance.type}
                    onTypeChange={(type) => handleOtherAllowanceChange('type', type)}
                    disabled={submitting}
                  />
                </Field>
              </div>
            </ComponentCard>

            <ComponentCard
              title="Allowances"
              action={
                <Button
                  variant="link"
                  onClick={() => {
                    if (errors.allowances) {
                      setErrors((prev) => ({ ...prev, allowances: "" }));
                    }
                    setForm((p) => ({
                      ...p,
                      allowances: [...p.allowances, { label: "", value: "", type: "amount" }],
                    }));
                  }}
                  className="text-xs sm:text-sm font-medium"
                  disabled={submitting}
                >
                  + Add Allowance
                </Button>
              }
            >
              {errors.allowances && (
                <p className="mb-3 text-xs text-red-500">{errors.allowances}</p>
              )}
              <div className="space-y-3 pr-0.5">
                {form.allowances.map((allowance, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end"
                  >
                    <div className="flex-1 min-w-0">
                      <Select
                        label={index === 0 ? "Allowance Name" : ""}
                        options={allowanceOptions}
                        placeholder={
                          loadingAllowances ? "Loading..." : "Select allowance"
                        }
                        value={allowance.label}
                        onChange={(val) => {
                          const newAllowances = [...form.allowances];
                          newAllowances[index].label = val;
                          if (errors.allowances) {
                            setErrors((prev) => ({ ...prev, allowances: "" }));
                          }
                          setForm((p) => ({ ...p, allowances: newAllowances }));
                        }}
                        disabled={submitting || loadingAllowances}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Field label={index === 0 ? `Amount (${currencyCode})` : ""}>
                        <PrefixInput
                          prefix={currencySymbol}
                          type="number"
                          min="0"
                          placeholder="Amount"
                          value={allowance.value}
                          onChange={(e) => {
                            const newAllowances = [...form.allowances];
                            newAllowances[index].value = e.target.value;
                            if (errors.allowances) {
                              setErrors((prev) => ({ ...prev, allowances: "" }));
                            }
                            setForm((p) => ({
                              ...p,
                              allowances: newAllowances,
                            }));
                          }}
                          showTypeSelector
                          valueType={allowance.type || 'amount'}
                          onTypeChange={(type) => {
                            const newAllowances = [...form.allowances];
                            newAllowances[index].type = type;
                            setForm((p) => ({ ...p, allowances: newAllowances }));
                          }}
                          disabled={submitting}
                        />
                      </Field>
                    </div>
                    <button
                      type="button"
                      title="Remove allowance"
                      onClick={() => {
                        const newAllowances = [...form.allowances];
                        newAllowances.splice(index, 1);
                        if (errors.allowances) {
                          setErrors((prev) => ({ ...prev, allowances: "" }));
                        }
                        setForm((p) => ({ ...p, allowances: newAllowances }));
                      }}
                      className="mt-1 inline-flex items-center justify-center self-end rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 sm:my-1.5 sm:self-auto"
                      disabled={submitting}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {form.allowances.length === 0 && (
                  <p className="text-xs text-center text-gray-400 italic py-2">
                    No allowances added.
                  </p>
                )}
              </div>
            </ComponentCard>

            {/* Total preview */}
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                Total Monthly Package
              </span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {total > 0 ? formatCurrency(total, currencyCode, { currencySettings }) : formatCurrency(null, currencyCode, { currencySettings })}
              </span>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              When you change salary with a later effective date, a new pay scale
              is created and the previous salary remains in history.
            </p>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <ComponentCard title="Vessel &amp; Contract">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Port of Joining *"
                  placeholder="e.g. Mumbai, India"
                  value={form.portOfJoining}
                  onChange={set("portOfJoining")}
                  error={!!errors.portOfJoining}
                  hint={errors.portOfJoining}
                  disabled={submitting}
                />
                <Field label="Vessel">
                  <SearchableSelect
                    options={vesselOptions}
                    placeholder={
                      loadingVessels ? "Loading vessels..." : "Search Vessel"
                    }
                    value={form.vesselId}
                    onChange={(val) => {
                      setForm((prev) => ({ ...prev, vesselId: val }));
                    }}
                    disabled={submitting || loadingVessels}
                  />
                </Field>
                <SimpleDatePicker
                  label="Commencement Date *"
                  value={form.commencement}
                  onChange={handleDateChange("commencement")}
                  error={!!errors.commencement}
                  hint={errors.commencement}
                  disabled={submitting}
                />
                <Select
                  label="Contract Period *"
                  options={[
                    { value: "3 Months", label: "3 Months" },
                    { value: "6 Months", label: "6 Months" },
                    { value: "9 Months", label: "9 Months" },
                    { value: "12 Months", label: "12 Months" },
                    { value: "18 Months", label: "18 Months" },
                    { value: "24 Months", label: "24 Months" },
                  ]}
                  value={form.contractPeriod}
                  onChange={(val) =>
                    setForm((p) => ({ ...p, contractPeriod: val }))
                  }
                  error={!!errors.contractPeriod}
                  hint={errors.contractPeriod}
                  disabled={submitting}
                />
              </div>
            </ComponentCard>

            <ComponentCard title="Sign Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Reference Number"
                  placeholder="e.g. REF/2024/001"
                  value={form.referenceNo}
                  onChange={set("referenceNo")}
                  disabled={submitting}
                />
                <SimpleDatePicker
                  label="Sign Date"
                  value={form.signDate}
                  onChange={handleDateChange("signDate")}
                  disabled={submitting}
                />
                <Input
                  label="Sign Place"
                  placeholder="e.g. Mumbai"
                  value={form.signPlace}
                  onChange={set("signPlace")}
                  disabled={submitting}
                />
              </div>
            </ComponentCard>
          </div>
        );
    }
  };

  const content = (
    // ── FIX: the modal itself is a flex-col container capped at max-h.
    // Header + StepBar + Footer are shrink-0 (never shrink).
    // Only the step content area is flex-1 min-h-0 overflow-y-auto,
    // so it absorbs all available space and scrolls independently.
    <>
      {/* Header — fixed height, never scrolls */}
      <div className={`shrink-0 mb-6 ${embeddedSectionPadding}`}>
        <h4 className="text-xl font-medium text-gray-800 dark:text-white/90">
          {mode === "edit" ? "Edit Contract" : "New Contract"}
        </h4>
        <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
          Fill in the details to create an employment contract
        </p>
      </div>

      {/* Step bar — fixed height, never scrolls */}
      <div className={`shrink-0 mb-2 ${embeddedInlinePadding}`}>
        <StepBar
          current={step}
          completed={completed}
          onStepClick={handleStepClick}
        />
      </div>

      {/* Step content — scrollable area, matches salary head max-h-[75vh] pattern */}
      <div
        className={`max-h-[60vh] sm:max-h-[66vh] overflow-y-auto space-y-5 custom-scrollbar ${embeddedContentPadding}`}
      >
        {renderStep()}
      </div>

      {/* Footer — responsive */}
      <div className={`mt-6 shrink-0 pt-4 ${embeddedFooterPadding}`}>
        {/* ── Mobile: two rows ── */}
        <div className="flex flex-col gap-2 sm:hidden">
          {/* Row 1: Step indicator left · Back + Next right */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold tabular-nums text-gray-400 uppercase tracking-widest whitespace-nowrap">
              Step {step} of {STEPS.length}
            </span>
            <div className="flex items-center gap-2">
              {step > 1 && (
                <Button size="sm" variant="outline" onClick={handleBack} disabled={submitting}>
                  <ChevronLeftIcon className="w-4 h-4" />
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button size="sm" variant="primary" onClick={handleNext} disabled={submitting}>
                  Next Step
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button size="sm" variant="primary" onClick={() => handleSubmit(false)} disabled={submitting}>
                  {submitting ? "Saving…" : "Save & Generate"}
                </Button>
              )}
            </div>
          </div>
          {/* Row 2: Cancel full width */}
          <Button size="sm" variant="outline" onClick={onClose} disabled={submitting} className="w-full justify-center">
            Cancel
          </Button>
        </div>

        {/* ── Desktop: single row ── */}
        <div className="hidden sm:flex items-center justify-between gap-3">
          <span className="text-xs font-bold tabular-nums text-gray-400 uppercase tracking-widest whitespace-nowrap">
            Step {step} of {STEPS.length}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            {step > 1 && (
              <Button size="sm" variant="outline" onClick={handleBack} disabled={submitting}>
                <ChevronLeftIcon className="w-4 h-4" />
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button size="sm" variant="primary" onClick={handleNext} disabled={submitting}>
                Next Step
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button size="sm" variant="primary" onClick={() => handleSubmit(false)} disabled={submitting} className="min-w-[120px]">
                {submitting ? "Saving…" : "Save & Generate"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="mx-auto flex min-h-[76vh] max-h-[86vh] w-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {content}
        </div>
      </div>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[800px] p-4 sm:p-6 lg:p-8"
    >
      {content}
    </Modal>
  );
}
