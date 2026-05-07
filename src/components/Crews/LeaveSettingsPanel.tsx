"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Save, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import Button from "@/components/ui/button/Button";
import InputField from "@/components/form/input/InputField";

interface LeaveType {
  _id: string;
  name: string;
  code: string;
  maxDays: number;
  status: string;
}

interface LeaveLimit {
  leaveTypeId: string;
  maxDays: number;
}

interface LeaveSettingsPanelProps {
  crewId: string;
  companyId: string;
  initialLeaveLimits?: LeaveLimit[];
  canEdit: boolean;
}

export default function LeaveSettingsPanel({
  crewId,
  companyId,
  initialLeaveLimits,
  canEdit,
}: LeaveSettingsPanelProps) {
  const router = useRouter();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchLeaveTypes() {
      try {
        const url = `/api/leave-type?limit=none&status=active${companyId ? `&companyId=${companyId}` : ""}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch leave types");
        const data = await res.json();
        setLeaveTypes(data);

        // Map initial limits to state
        const initialOverrides: Record<string, string> = {};
        if (Array.isArray(initialLeaveLimits)) {
          initialLeaveLimits.forEach((limit) => {
            initialOverrides[limit.leaveTypeId] = String(limit.maxDays);
          });
        }
        setOverrides(initialOverrides);
      } catch (error) {
        console.error("Error fetching leave types:", error);
        toast.error("Failed to load leave types");
      } finally {
        setLoading(false);
      }
    }

    if (crewId) {
      fetchLeaveTypes();
    }
  }, [crewId, companyId]);

  const handleOverrideChange = (leaveTypeId: string, value: string) => {
    setOverrides((prev) => ({
      ...prev,
      [leaveTypeId]: value,
    }));
  };

  const handleReset = (leaveTypeId: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[leaveTypeId];
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        leaveLimits: Object.entries(overrides)
          .filter(([_, value]) => value !== "")
          .map(([leaveTypeId, value]) => ({
            leaveTypeId,
            maxDays: Number(value),
          })),
      };

      const res = await fetch(`/api/applications/${crewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save leave settings");
      }

      toast.success("Leave settings updated successfully");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to save leave settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-24 dark:border-gray-800 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        <p className="mt-4 text-sm font-medium text-gray-500">Loading leave entitlements...</p>
      </div>
    );
  }

  if (leaveTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-24 dark:border-gray-800 dark:bg-gray-900">
        <div className="rounded-full bg-gray-50 p-4 dark:bg-gray-800">
          <CalendarDays className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
          No Leave Types Available
        </h3>
        <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
          Please configure leave policies in the system settings before assigning custom limits to crew members.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-gray-200 px-6 py-5 sm:flex-row sm:items-center dark:border-gray-800">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Individual Leave Allocations
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Define custom leave quotas. Default company policies apply when not explicitly overridden.
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        )}
      </div>

      {/* Main List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {leaveTypes.map((type) => {
          const isOverridden = overrides[type._id] !== undefined;
          const currentValue = isOverridden ? overrides[type._id] : "";

          return (
            <div
              key={type._id}
              className={`flex flex-col gap-4 px-6 py-5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                isOverridden 
                  ? "bg-amber-50/30 dark:bg-amber-500/5" 
                  : "hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"
              }`}
            >
              {/* Info Column */}
              <div className="flex w-full items-center gap-4 sm:w-1/3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {type.name}
                  </h4>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {type.code}
                    </span>
                    {isOverridden && (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                        Custom Priority
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Controls Column */}
              <div className="flex w-full flex-col gap-6 sm:w-2/3 sm:flex-row sm:items-center sm:justify-end">
                {/* Default Value Display */}
                <div className="flex flex-col items-start sm:items-end">
                  <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                    System Default
                  </span>
                  <span className="mt-0.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {type.maxDays} Days
                  </span>
                </div>

                {/* Vertical Divider (Desktop only) */}
                <div className="hidden h-8 w-px bg-gray-200 dark:bg-gray-800 sm:block"></div>

                {/* Custom Override Input */}
                <div className="flex items-center gap-4">
                  <div className="w-full sm:w-40">
                    <InputField
                    type="number"
                    min="0"
                    placeholder="Enter days..."
                    value={currentValue}
                    onChange={(e) => handleOverrideChange(type._id, e.target.value)}
                    disabled={!canEdit}
                    className="!h-10 text-sm"
                  />
                  </div>
                  
                  {/* Action Column */}
                  <div className="flex w-20 justify-end">
                    {isOverridden && canEdit ? (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => handleReset(type._id)}
                        className="h-auto p-0 text-sm font-medium text-gray-500 transition-colors hover:text-error-600 dark:hover:text-error-500"
                        startIcon={<RotateCcw className="h-4 w-4" />}
                      >
                        Reset
                      </Button>
                    ) : (
                      <span className="text-sm font-medium text-gray-300 dark:text-gray-600"></span>
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
      
      {/* Footer Info */}
      <div className="border-t border-gray-200 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.01]">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 text-gray-400" />
          <p className="text-sm text-gray-500">
            Leave policies are calculated based on these custom quotas first. If no custom quota is specified, the system automatically falls back to the default limits.
          </p>
        </div>
      </div>
    </div>
  );
}
