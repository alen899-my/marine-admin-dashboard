"use client";

import React, { useState, useEffect } from "react";
import Badge from "@/components/ui/badge/Badge";
import CommonReportTable from "@/components/tables/CommonReportTable";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { Eye, ClipboardList, Anchor, CheckCircle2, Circle } from "lucide-react";
import ViewModal from "@/components/common/ViewModal";
import ChecklistModal from "@/components/Onboarding/ChecklistModal";
import ConfirmOnboardModal from "@/components/Onboarding/ConfirmOnboardModal";

interface Application {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  rank: string;
  nationality: string;
  status: string;
  positionApplied?: string;
  jobTitle?: string | null;
  dateOfAvailability?: string;
  cellPhone?: string;
  createdAt: string;
  company: string;
  companyName?: string;
  onboardingChecklist?: {
    _id: string;
    text: string;
    completed: boolean;
    createdAt: string;
  }[];
  onboardDate?: string;
  onboardPort?: string;
  contractStart?: string;
  contractEnd?: string;
  contractPeriod?: string;
  profilePhoto?: string;
}

interface OnboardingTableProps {
  data: Application[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isSuperAdmin?: boolean;
}

const statusMap: Record<string, { color: "slate" | "sky" | "indigo" | "purple" | "cyan" | "teal" | "emerald" | "lime" | "green" | "gray" | "rose"; label: string }> = {
  accepted:         { color: "green",   label: "Accepted" },
  onboarding_ready: { color: "teal",    label: "Onboarding Ready" },
  onboarded:        { color: "green",   label: "Onboarded" },
};

const formatDateOnly = (date?: string) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function OnboardingTable({
  data,
  pagination,
  isSuperAdmin = false,
}: OnboardingTableProps): React.ReactElement | null {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can, isReady } = useAuthorization();

  const canConfirm = can("onboarding.confirm");
  const canEdit = can("onboarding.edit");
  const canDelete = can("onboarding.delete");
  const canChecklistAdd = can("onboarding.checklistadding");

  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [checklistAppId, setChecklistAppId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAppId, setConfirmAppId] = useState<string | null>(null);

  // Keep checklist data in sync after update
  const [localData, setLocalData] = useState(data);
  useEffect(() => { setLocalData(data); }, [data]);

  const checklistApp = localData.find((a) => a._id === checklistAppId);
  const confirmApp = localData.find((a) => a._id === confirmAppId);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  const columns = [
    {
      header: "S.No",
      render: (_: any, index: number) =>
        (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      header: "Candidate",
      render: (a: Application) => (
        <div className="flex flex-col gap-0.5 min-w-[200px]">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {a.firstName} {a.lastName}
          </span>
          <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
            {a.jobTitle || a.positionApplied || "—"}
          </span>
          <span className="text-xs text-gray-400">{a.rank || "—"}</span>
        </div>
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            header: "Company",
            render: (a: Application) => (
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {a.companyName || "—"}
              </span>
            ),
          },
        ]
      : []),
    {
      header: "Status",
      render: (a: Application) => {
        const config = statusMap[a.status] ?? { color: "slate" as const, label: a.status };
        return <Badge color={config.color}>{config.label}</Badge>;
      },
    },
    {
      header: "Checklist",
      render: (a: Application) => {
        const checklist = a.onboardingChecklist || [];
        const done = checklist.filter((i) => i.completed).length;
        const total = checklist.length;
        return (
          <div className="flex flex-col gap-1">
            {total > 0 ? (
              <>
                <div className="flex items-center gap-1.5 min-w-[120px]">
                  <div className="w-24 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(done / total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {done}/{total}
                  </span>
                </div>
              </>
            ) : (
              <span className="text-xs text-gray-400 italic">No items</span>
            )}
          </div>
        );
      },
    },
    {
      header: "Actions",
      render: (a: Application) => (
        <div className="flex items-center gap-2">
          {/* View */}
          <Button
            size="sm"
            variant="outline"
            className="dark:border-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedApplication(a);
              setViewOpen(true);
            }}
          >
            <Eye className="h-4 w-4 text-blue-500" />
          </Button>

          {/* Checklist */}
          {canChecklistAdd && (
            <Button
              size="sm"
              variant="outline"
              className="px-2 text-xs dark:border-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                setChecklistAppId(a._id);
                setChecklistOpen(true);
              }}
            >
              <ClipboardList className="h-4 w-4 text-indigo-500" />
              <span className="text-indigo-500 text-xs font-semibold uppercase tracking-wider">Checklist</span>
            </Button>
          )}

          {/* Confirm Onboard */}
          {canConfirm && a.status === "onboarding_ready" && (
            <Button
              size="sm"
              variant="outline"
              className="px-2 text-xs dark:border-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmAppId(a._id);
                setConfirmOpen(true);
              }}
            >
              <Anchor className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                Confirm Onboard
              </span>
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (!isReady) return null;

  return (
    <>
      <div className="border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900 rounded-xl">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1500px]">
            <CommonReportTable
              data={localData}
              columns={columns}
              loading={false}
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              onRowClick={(a: Application) => {
                setSelectedApplication(a);
                setViewOpen(true);
              }}
            />
          </div>
        </div>
      </div>

      {/* View Modal */}
      <ViewModal
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setSelectedApplication(null);
        }}
        title="Onboarding Details"
        headerRight={
          selectedApplication && (
            <div className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
              <span className="font-bold">
                {selectedApplication.firstName} {selectedApplication.lastName}
              </span>
              <span>|</span>
              <span>{selectedApplication.jobTitle || selectedApplication.positionApplied}</span>
            </div>
          )
        }
      >
        {selectedApplication && (
          <div className="text-[13px] py-1">
            <div className="space-y-8 mx-auto w-full">
              {/* Candidate */}
              <section className="space-y-1.5">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                  Candidate
                </h3>
                {[
                  ["Name", `${selectedApplication.firstName} ${selectedApplication.lastName}`],
                  ["Email", selectedApplication.email],
                  ["Rank", selectedApplication.rank],
                  ["Nationality", selectedApplication.nationality],
                  ["Phone", selectedApplication.cellPhone],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-gray-500 shrink-0">{label}</span>
                    <span className="font-medium text-right">{value || "—"}</span>
                  </div>
                ))}
              </section>

              {/* Checklist */}
              {(selectedApplication.onboardingChecklist?.length ?? 0) > 0 && (
                <section className="space-y-1.5">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                    Checklist
                  </h3>
                  <div className="space-y-1.5">
                    {selectedApplication.onboardingChecklist?.map((item) => (
                      <div key={item._id} className="flex items-center gap-2">
                        <span className="shrink-0">
                          {item.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                          )}
                        </span>
                        <span
                          className={`text-sm ${
                            item.completed
                              ? "line-through text-gray-400"
                              : "text-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </ViewModal>

      {/* Checklist Modal */}
      {checklistApp && (
        <ChecklistModal
          isOpen={checklistOpen}
          onClose={() => {
            setChecklistOpen(false);
            setChecklistAppId(null);
          }}
          applicationId={checklistApp._id}
          candidateName={`${checklistApp.firstName} ${checklistApp.lastName}`}
          initialChecklist={checklistApp.onboardingChecklist || []}
          onUpdate={() => router.refresh()}
          profilePhoto={checklistApp.profilePhoto}
          positionApplied={checklistApp.jobTitle || checklistApp.positionApplied}
        />
      )}

      {/* Confirm Onboard Modal */}
      {confirmApp && (
        <ConfirmOnboardModal
          isOpen={confirmOpen}
          onClose={() => {
            setConfirmOpen(false);
            setConfirmAppId(null);
          }}
          applicationId={confirmApp._id}
          candidateName={`${confirmApp.firstName} ${confirmApp.lastName}`}
          positionApplied={confirmApp.jobTitle || confirmApp.positionApplied}
          profilePhoto={confirmApp.profilePhoto}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}
