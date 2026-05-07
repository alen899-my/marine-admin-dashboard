// src/app/(admin)/compliance-expiry/ComplianceExpiryTable.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthorization } from "@/hooks/useAuthorization";
import CommonReportTable from "@/components/tables/CommonReportTable";
import Badge from "@/components/ui/badge/Badge";
import ViewModal from "@/components/common/ViewModal";
import { format, parseISO, differenceInDays } from "date-fns";

const crewStatusMap: Record<string, { color: string; label: string }> = {
  onboard: { color: "success", label: "Onboard" },
  vacation: { color: "blue", label: "Vacation" },
  available: { color: "emerald", label: "Available" },
  traveling: { color: "purple", label: "Traveling" },
  medical_leave: { color: "warning", label: "Medical Leave" },
  training: { color: "indigo", label: "Training" },
  inactive: { color: "light", label: "Inactive" },
  resigned: { color: "rose", label: "Resigned" },
  blacklisted: { color: "error", label: "Blacklisted" },
};

interface ExpiryAlert {
  type: string;
  label: string;
  expiry: string | null;
  issued: string | null;
  expired: boolean;
}

interface ComplianceCrew {
  _id: string;
  firstName: string;
  lastName: string;
  rank: string;
  nationality: string;
  profilePhoto?: string | null;
  crew: string;
  status: string;
  email: string;
  cellPhone: string;
  companyName: string;
  alerts: ExpiryAlert[];
  hasExpired: boolean;
  alertCount: number;
}

interface ComplianceExpiryTableProps {
  data: ComplianceCrew[];
  pagination: { page: number; limit: number; totalPages: number };
  isSuperAdmin: boolean;
}

function formatExpiry(iso: string | null): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "dd/MM/yyyy");
  } catch {
    return "—";
  }
}

function ExpiryBadge({ alert }: { alert: ExpiryAlert }) {
  if (!alert.expiry) return null;
  const days = differenceInDays(parseISO(alert.expiry), new Date());
  const isExpired = alert.expired;
  const textColor = isExpired
    ? "text-error-500 dark:text-error-400"
    : days <= 30
    ? "text-warning-500 dark:text-warning-400"
    : "text-gray-500 dark:text-gray-400";
  const daysText = isExpired ? `${Math.abs(days)} days ago` : `${days} days left`;

  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-sm text-gray-600 dark:text-gray-400 break-words">
        {alert.label}
      </span>
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-sm text-gray-400">Expires: {formatExpiry(alert.expiry)}</span>
        {alert.issued && (
          <span className="text-sm text-gray-400">Issued: {formatExpiry(alert.issued)}</span>
        )}
        <span className={`text-sm font-semibold ${textColor}`}>
          {daysText}
        </span>
      </div>
    </div>
  );
}

export default function ComplianceExpiryTable({
  data,
  pagination,
  isSuperAdmin,
}: ComplianceExpiryTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isReady } = useAuthorization();

  const [openView, setOpenView] = useState(false);
  const [selected, setSelected] = useState<ComplianceCrew | null>(null);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const columns = [
    {
      header: "S.No",
      render: (_: ComplianceCrew, index: number) =>
        (pagination.page - 1) * pagination.limit + index + 1,
    },
    ...(isSuperAdmin
      ? [
          {
            header: "Company",
            render: (c: ComplianceCrew) => (
              <span className="text-base text-gray-700 dark:text-gray-300">
                {c.companyName}
              </span>
            ),
          },
        ]
      : []),
    {
      header: "Crew Details",
      render: (c: ComplianceCrew) => (
        <div>
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            {c.firstName} {c.lastName}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-sm text-gray-500 capitalize">{c.rank}</span>
            {(() => {
              const status = c.crew || "inactive";
              const config = crewStatusMap[status] || {
                color: "light",
                label: status,
              };
              return (
                <Badge
                  color={config.color as any}
                  shape="rounded"
                  className="!py-0 !px-1.5 !text-[10px]"
                >
                  {config.label}
                </Badge>
              );
            })()}
          </div>
          <p className="text-sm text-gray-400">{c.nationality}</p>
        </div>
      ),
    },
    {
      header: "Contact",
      render: (c: ComplianceCrew) => (
        <div className="text-sm">
          {c.email && (
            <p className="text-gray-600 dark:text-gray-300 truncate max-w-[180px]">
              {c.email}
            </p>
          )}
          {c.cellPhone && (
            <p className="text-sm text-gray-500">{c.cellPhone}</p>
          )}
          {!c.email && !c.cellPhone && (
            <span className="text-sm text-gray-400">—</span>
          )}
        </div>
      ),
    },
    {
      header: "Expiry Details",
      render: (c: ComplianceCrew) => (
        <div className="space-y-1 min-w-[200px]">
          {c.alerts.slice(0, 2).map((a, i) => (
            <div key={i} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-gray-500 truncate max-w-[120px]">{a.label}</span>
              <Badge color={a.expired ? "error" : "warning"} size="md">
                {formatExpiry(a.expiry)}
              </Badge>
            </div>
          ))}
          {c.alerts.length > 2 && (
            <span className="text-sm text-brand-500 font-medium">
              +{c.alerts.length - 2} more
            </span>
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
          <div className="min-w-[1100px]">
            <CommonReportTable
              data={data}
              columns={columns}
              loading={false}
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              onRowClick={(c) => {
                setSelected(c);
                setOpenView(true);
              }}
              onView={(c) => {
                setSelected(c);
                setOpenView(true);
              }}
            />
          </div>
        </div>
      </div>

      {/* VIEW MODAL */}
      <ViewModal
        isOpen={openView}
        onClose={() => setOpenView(false)}
        title="Compliance Alerts"
        headerRight={
          selected && (
            <span className="text-base font-bold text-gray-900 dark:text-white">
              {selected.firstName} {selected.lastName}
            </span>
          )
        }
      >
        {selected && (
          <div className="text-sm py-1 space-y-4">
            {/* Identity */}
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 border-b pb-1">
                Crew Info
              </h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-gray-500 shrink-0">Name</span>
                  <span className="text-sm text-right">
                    {selected.firstName} {selected.lastName}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-gray-500 shrink-0">Rank</span>
                  <span className="text-sm capitalize text-right">{selected.rank}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-gray-500 shrink-0">Nationality</span>
                  <span className="text-sm text-right">{selected.nationality}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-gray-500 shrink-0">Status</span>
                  <span className="text-sm text-right">
                    {(() => {
                      const status = selected.crew || "inactive";
                      return crewStatusMap[status]?.label || status;
                    })()}
                  </span>
                </div>
                {isSuperAdmin && (
                  <div className="flex justify-between gap-4 col-span-2">
                    <span className="text-sm text-gray-500 shrink-0">Company</span>
                    <span className="text-sm text-right">{selected.companyName}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Grouped Alerts by Type */}
            {(() => {
              const cocAlerts      = selected.alerts.filter(a => a.type === "coc");
              const coeAlerts      = selected.alerts.filter(a => a.type === "coe");
              const stcwAlerts     = selected.alerts.filter(a => a.type === "stcw");
              const medicalAlerts  = selected.alerts.filter(a => a.type === "medical");
              const passportAlerts = selected.alerts.filter(a => a.type === "passport");
              const seamanAlerts   = selected.alerts.filter(a => a.type === "seaman");
              const otherAlerts    = selected.alerts.filter(
                a => !["coc", "coe", "stcw", "medical", "passport", "seaman"].includes(a.type)
              );

              const sections = [
                { key: "coc",      label: "CoC (Certificate of Competency)",   alerts: cocAlerts },
                { key: "coe",      label: "CoE (Certificate of Endorsement)",  alerts: coeAlerts },
                { key: "stcw",     label: "STCW Certificates",                 alerts: stcwAlerts },
                { key: "medical",  label: "Medical Certificate",               alerts: medicalAlerts },
                { key: "passport", label: "Passport",                          alerts: passportAlerts },
                { key: "seaman",   label: "CDC / Seaman Book",                 alerts: seamanAlerts },
                { key: "other",    label: "Other Documents",                   alerts: otherAlerts },
              ].filter(s => s.alerts.length > 0);

              if (sections.length === 0) {
                return <p className="text-sm text-gray-400">No alerts</p>;
              }

              return (
                <div className="space-y-4">
                  {sections.map(({ key, label, alerts }) => (
                    <section key={key}>
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 border-b pb-1">
                        {label} — {alerts.length}
                      </h3>
                      <div className="space-y-1.5">
                        {alerts.map((a, i) => (
                          <ExpiryBadge key={`${key}-${i}`} alert={a} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </ViewModal>
    </>
  );
}