"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { Anchor, FileText } from "lucide-react";
import { toast } from "react-toastify";
import Input from "@/components/form/input/InputField";
import SimpleDatePicker from "@/components/form/new-datepicker";
import { useSidebarNotifications } from "@/context/SidebarNotificationContext";

interface ConfirmOnboardInitialValues {
  onboardDate?: string;
  port?: string;
  contractStart?: string;
  contractEnd?: string;
  contractPeriod?: string;
}

interface ConfirmOnboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName: string;
  positionApplied?: string;
  profilePhoto?: string;
  mode?: "confirm" | "edit";
  embedded?: boolean;
  initialValues?: ConfirmOnboardInitialValues;
  onSuccess?: () => void;
}

export default function ConfirmOnboardModal({
  isOpen,
  onClose,
  applicationId,
  candidateName,
  positionApplied,
  profilePhoto,
  mode = "confirm",
  embedded = false,
  initialValues,
  onSuccess,
}: ConfirmOnboardModalProps) {
  const [onboardDate, setOnboardDate] = useState(initialValues?.onboardDate || "");
  const [port, setPort] = useState(initialValues?.port || "");
  const [contractStart, setContractStart] = useState(initialValues?.contractStart || "");
  const [contractEnd, setContractEnd] = useState(initialValues?.contractEnd || "");
  const [contractPeriod, setContractPeriod] = useState(initialValues?.contractPeriod || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { refreshCounts } = useSidebarNotifications();
  const [hasContractData, setHasContractData] = useState(false);

  const title = mode === "edit" ? "Edit Onboarding Details" : "Confirm Onboard";
  const submitLabel =
    mode === "edit"
      ? (isSubmitting ? "Saving..." : "Save Onboarding Details")
      : (isSubmitting ? "Confirming..." : "Confirm Onboard");

  const resetForm = useCallback(() => {
    setOnboardDate(initialValues?.onboardDate || "");
    setPort(initialValues?.port || "");
    setContractStart(initialValues?.contractStart || "");
    setContractEnd(initialValues?.contractEnd || "");
    setContractPeriod(initialValues?.contractPeriod || "");
    setErrors({});
  }, [
    initialValues?.contractEnd,
    initialValues?.contractPeriod,
    initialValues?.contractStart,
    initialValues?.onboardDate,
    initialValues?.port,
  ]);

  useEffect(() => {
    if (!isOpen && !embedded) return;
    resetForm();
  }, [embedded, isOpen, resetForm]);

  const fetchContractData = useCallback(async () => {
    if (!applicationId || mode !== "confirm") return;

    try {
      const res = await fetch(`/api/contracts/by-application/${applicationId}`);
      if (res.ok) {
        const data = await res.json();
        const contract = data.contract;

        if (contract) {
          setHasContractData(true);

          if (contract.onboardDate && !initialValues?.onboardDate) {
            const dateStr = new Date(contract.onboardDate).toISOString().split("T")[0];
            setOnboardDate(dateStr);
          }

          if (contract.portOfJoining && !initialValues?.port) {
            setPort(contract.portOfJoining);
          }

          if (contract.contractStart && !initialValues?.contractStart) {
            const startStr = new Date(contract.contractStart).toISOString().split("T")[0];
            setContractStart(startStr);
          }

          if (contract.contractEnd && !initialValues?.contractEnd) {
            const endStr = new Date(contract.contractEnd).toISOString().split("T")[0];
            setContractEnd(endStr);
          }

          if (contract.contractPeriod && !initialValues?.contractPeriod) {
            setContractPeriod(contract.contractPeriod);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch contract data:", error);
    }
  }, [applicationId, mode, initialValues]);

  useEffect(() => {
    if (isOpen && mode === "confirm" && !embedded) {
      fetchContractData();
    }
  }, [isOpen, mode, embedded, fetchContractData]);

  const calculatePeriod = (start: string, end: string) => {
    if (!start || !end) return "";
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return "";

    if (endDate < startDate) return "Invalid Range";

    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    const totalMonths = years * 12 + months;
    const parts = [];

    if (totalMonths > 0) {
      parts.push(`${totalMonths} ${totalMonths === 1 ? "Month" : "Months"}`);
    }
    if (days > 0) {
      parts.push(`${days} ${days === 1 ? "Day" : "Days"}`);
    }

    return parts.length > 0 ? parts.join(", ") : "0 Days";
  };

  const handleDateChange = (type: "start" | "end", val: string) => {
    if (type === "start") {
      setContractStart(val);
      if (errors.contractStart) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.contractStart;
          return next;
        });
      }
      setContractPeriod(calculatePeriod(val, contractEnd));
      return;
    }

    setContractEnd(val);
    if (errors.contractEnd) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.contractEnd;
        return next;
      });
    }
    setContractPeriod(calculatePeriod(contractStart, val));
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!onboardDate) nextErrors.onboardDate = "Onboard date is required";
    if (!port.trim()) nextErrors.port = "Port of joining is required";
    if (!contractStart) nextErrors.contractStart = "Contract start date is required";
    if (!contractEnd) nextErrors.contractEnd = "Contract end date is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/confirm", {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          onboardDate,
          port,
          contractStart,
          contractEnd,
          contractPeriod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error ||
            (mode === "edit"
              ? "Failed to update onboarding details"
              : "Failed to confirm onboarding"),
        );
      }

      await refreshCounts();
      toast.success(
        data.message ||
          (mode === "edit"
            ? "Onboarding details updated successfully."
            : "Onboarding confirmed! Crew is now Active."),
      );
      onSuccess?.();

      if (!embedded) {
        handleClose();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <>
      {/* Header */}
      <div className="shrink-0 mb-6">
        <h4 className="text-xl font-medium text-gray-800 dark:text-white/90">
          {title}
        </h4>
      </div>

      {/* Body */}
      <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-0.5">
            {/* Avatar with ring */}
            <div className="relative shrink-0">
              {profilePhoto ? (
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-brand-500 border border-gray-200 dark:border-white/10">
                  <Image
                    src={profilePhoto}
                    alt={candidateName}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-lg">
                  {candidateName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {/* Name & metadata */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight">
                {candidateName}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-md">
                  {positionApplied || "Crew Member"}
                </span>
              </div>
            </div>
          </div>

          {hasContractData && (
            <div className="rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 p-3 flex gap-2 items-start">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Fields have been populated from the saved contract. You can edit these values as needed.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SimpleDatePicker
              label="Onboard Date *"
              value={onboardDate}
              onChange={(val) => {
                setOnboardDate(val);
                if (errors.onboardDate) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.onboardDate;
                    return next;
                  });
                }
              }}
              disabled={isSubmitting}
              error={!!errors.onboardDate}
              hint={errors.onboardDate}
            />
            <Input
              label="Port of Joining *"
              placeholder="e.g. Mumbai, Singapore"
              value={port}
              onChange={(e) => {
                setPort(e.target.value);
                if (errors.port) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.port;
                    return next;
                  });
                }
              }}
              disabled={isSubmitting}
              error={!!errors.port}
              hint={errors.port}
            />
            <SimpleDatePicker
              label="Contract Start *"
              value={contractStart}
              onChange={(val) => handleDateChange("start", val)}
              disabled={isSubmitting}
              error={!!errors.contractStart}
              hint={errors.contractStart}
            />
            <SimpleDatePicker
              label="Contract End *"
              value={contractEnd}
              onChange={(val) => handleDateChange("end", val)}
              disabled={isSubmitting}
              error={!!errors.contractEnd}
              hint={errors.contractEnd}
            />
            <div className="sm:col-span-2">
              <Input
                label="Contract Period"
                placeholder="e.g. 9 Months"
                value={contractPeriod}
                onChange={(e) => setContractPeriod(e.target.value)}
                disabled={isSubmitting}
                hint={
                  errors.contractPeriod ||
                  "Auto-calculates from start & end dates, but can be edited."
                }
                error={!!errors.contractPeriod}
              />
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3 flex gap-3">
            <Anchor className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-2.5" />
            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
              {mode === "edit" ? (
                <>These values control the crew member&apos;s onboarding and joining details.</>
              ) : (
                <>By confirming, this crew member will be marked as <strong>Onboard</strong> and removed from the onboarding list.</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 shrink-0 pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button
          variant="outline"
          onClick={embedded ? resetForm : handleClose}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {embedded ? "Reset" : "Cancel"}
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {submitLabel}
        </Button>
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900 overflow-hidden p-4 sm:p-6 lg:p-8">
        {content}
      </div>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[600px] p-4 sm:p-6 lg:p-8"
    >
      {content}
    </Modal>
  );
}
