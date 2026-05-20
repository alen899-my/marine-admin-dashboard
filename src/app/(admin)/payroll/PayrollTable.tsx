"use client";
import Image from "next/image";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import CommonReportTable from "@/components/tables/CommonReportTable";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { PayrollRow, getPayrollRowKey } from "@/lib/payroll";
import { formatCurrency } from "@/lib/formatCurrency";

type CurrencySettings = {
  currencyPosition: "left" | "right";
  currencyFormatType: "symbol" | "code";
  currencySpace: boolean;
};

type CrewBadgeColor =
  | "success"
  | "blue"
  | "emerald"
  | "purple"
  | "warning"
  | "indigo"
  | "light"
  | "rose"
  | "error";

const crewStatusMap: Record<string, { color: CrewBadgeColor; label: string }> = {
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

interface PayrollTableProps {
  rows: PayrollRow[];
  selectedKeys: string[];
  disabled?: boolean;
  canDelete?: boolean;
  canEditRow: (row: PayrollRow) => boolean;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelectRow: (rowKey: string, checked: boolean) => void;
  onEdit: (row: PayrollRow) => void;
  onView: (row: PayrollRow) => void;
  onDelete: (row: PayrollRow) => void;
  currencyCode?: string;
  currencySettings?: CurrencySettings;
}

function getStatusBadge(status: PayrollRow["status"]) {
  if (status === "finance_approved") {
    return <Badge color="success">Finance Approved</Badge>;
  }

  if (status === "captain_verified") {
    return <Badge color="blue">Captain Verified</Badge>;
  }

  if (status === "saved") {
    return <Badge color="warning">Saved</Badge>;
  }

  return <Badge color="gray">Draft</Badge>;
}

export default function PayrollTable({
  rows,
  selectedKeys,
  disabled = false,
  canDelete = false,
  canEditRow,
  onToggleSelectAll,
  onToggleSelectRow,
  onEdit,
  onView,
  onDelete,
  currencyCode = "USD",
  currencySettings,
}: PayrollTableProps) {
  const allSelected = rows.length > 0 && selectedKeys.length === rows.length;

  // Format currency using common formatCurrency with company currency
  const formatValue = (value: number) => formatCurrency(value, currencyCode, { currencySettings });
    const getAmountClass = (
    row: PayrollRow,
    approvedClass = "text-gray-700 dark:text-gray-200",
  ) =>
    row.status === "finance_approved"
      ? approvedClass
      : "text-gray-400 dark:text-gray-500";

  const columns = [
    {
      header: "Crew Details",
      cellClassName: "align-top",
      render: (row: PayrollRow) => {
        const profilePhoto = row.profilePhoto;

        return (
        <div className="min-w-[250px] py-1">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky-100 text-sm font-bold text-sky-700">
              {profilePhoto ? (
                <Image
                  src={profilePhoto}
                  alt={row.crewName}
                  width={44}
                  height={44}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                row.crewName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                  {row.crewName}
                </p>
                {(() => {
                  const status = row.crewStatus || "inactive";
                  const config = crewStatusMap[status] || {
                    color: "light",
                    label: status,
                  };
                  return (
                    <Badge color={config.color} shape="rounded">
                      {config.label}
                    </Badge>
                  );
                })()}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{row.crewEmail || "—"}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                {row.vesselName} {row.rank ? `• ${row.rank}` : ""}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Salary Head:{" "}
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {row.salaryHeadTitle || "no salary head"}
                </span>
              </p>
              {!row.hasActivePayscale && (
                <Link
                  href={`/crews/edit/${row.applicationId}?tab=payscale`}
                  className="inline-flex text-xs font-semibold text-error-600 underline decoration-error-600/30 underline-offset-2"
                >
                  Set Payscale
                </Link>
              )}
            </div>
          </div>
        </div>
      )},
    },
    {
      header: "Payscale / Salary Head",
      cellClassName: "align-top",
      render: (row: PayrollRow) => (
        <div className="min-w-[260px] py-1">
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Payable Days</span>
              <span className="font-semibold text-gray-700 dark:text-gray-200">{row.payableDays}d</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Month Days</span>
              <span className="font-semibold text-gray-700 dark:text-gray-200">{row.payrollMonthDays}d</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Cut</span>
              <span className="font-semibold text-error-500">{row.deductibleLeaveDays}d</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Per Day</span>
              <span className={`font-semibold ${getAmountClass(row)}`}>{formatValue(row.perDayRate)}</span>
            </div>
            <div className="my-1 h-px bg-gray-100 dark:bg-white/10" />
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Basic</span>
              <span className={`font-semibold ${getAmountClass(row, "text-success-600 dark:text-success-500")}`}>{formatValue(row.payableBasic)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Allowance</span>
              <span className={`font-semibold ${getAmountClass(row, "text-gray-900 dark:text-white/90")}`}>{formatValue(row.totalAllowance)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Deduction</span>
              <span className={`font-semibold ${getAmountClass(row, "text-error-600 dark:text-error-400")}`}>-{formatValue(row.totalDeductions)}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      cellClassName: "align-top",
      render: (row: PayrollRow) => (
        <div className="min-w-[140px] py-1">
          {getStatusBadge(row.status)}
        </div>
      ),
    },
    {
      header: "Net Payable",
      cellClassName: "align-top",
      render: (row: PayrollRow) => (
        <div className="min-w-[150px] py-1">
          <p className="text-[11px] uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
            Net Payable
          </p>
          <p className={`mt-2 text-2xl font-bold ${getAmountClass(row, "text-success-600 dark:text-success-400")}`}>
            {formatValue(row.netPayable)}
          </p>
        </div>
      ),
    },
  ];

  return (
    <CommonReportTable
      data={rows}
      columns={columns}
      loading={false}
      currentPage={1}
      totalPages={1}
      onPageChange={() => {}}
      getRowKey={(row) => getPayrollRowKey(row)}
      tableMinWidthClassName="min-w-[1600px] "
      onRowClick={(row) => {
        const rowKey = getPayrollRowKey(row);
        const isSelected = selectedKeys.includes(rowKey);
        onToggleSelectRow(rowKey, !isSelected);
      }}
      leadingColumn={{
        header: (
          <Checkbox
            checked={allSelected}
            onChange={onToggleSelectAll}
            disabled={disabled || !rows.length}
          />
        ),
        headerClassName: "w-[72px]",
        cellClassName: "align-top w-[72px]",
        render: (row: PayrollRow) => (
          <div className="pt-1">
            <Checkbox
              checked={selectedKeys.includes(getPayrollRowKey(row))}
              onChange={(checked) =>
                onToggleSelectRow(getPayrollRowKey(row), checked)
              }
              disabled={disabled}
            />
          </div>
        ),
      }}
      actionHeader="Actions"
      renderActions={(row: PayrollRow) => (
        <div className="flex min-w-[170px] items-center gap-2 py-1">
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg border-gray-200 bg-white px-3 py-2 dark:border-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              onView(row);
            }}
          >
            <Eye className="h-4 w-4 text-blue-500" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg border-gray-200 bg-white px-3 py-2 dark:border-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(row);
            }}
            disabled={disabled || !canEditRow(row)}
          >
            <Pencil className="h-4 w-4 text-yellow-500" />
          </Button>
          {canDelete && row.payrollId ? (
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg border-gray-200 bg-white px-3 py-2 dark:border-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          ) : null}
        </div>
      )}
    />
  );
}
