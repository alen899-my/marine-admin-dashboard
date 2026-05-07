"use client"; // Kept because useCountUp is a client hook

import { useAuthorization } from "@/hooks/useAuthorization";
import { useCountUp } from "@/hooks/useCountUp";
import {
  Boxes,
  Building2,
  CalendarClock,
  CircleDollarSign,
  FileCheck,
  FileStack,
  FileText,
  Flag,
  Map,
  Ship,
  SquareArrowDownRight,
  SquareArrowUpLeft,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users2,
} from "lucide-react";
import Link from "next/link";
import { MetricCard } from "./MetricCard";
import type { MetricsData } from "@/types/dashboard";

// ─── Types ────────────────────────────────────────────────────────────────────

// Using shared MetricCard component

type SectionTitle = "Fleet & HR" | "Operations & Voyages" | "Administrative";

interface MetricWidgetConfig {
  section: SectionTitle;
  permission: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  valueKey: keyof MetricsData;
  path: string;
  trendKey: keyof MetricsData;
  sparklineKey: keyof MetricsData;
}

const METRIC_WIDGETS: MetricWidgetConfig[] = [
  {
    section: "Fleet & HR",
    permission: "stats.vessels",
    icon: <Ship size={22} className="text-teal-600 dark:text-teal-400" />,
    iconBg: "bg-teal-50 dark:bg-teal-900/20",
    title: "Vessels in Fleet",
    valueKey: "vesselCount",
    path: "/vessels",
    trendKey: "vesselTrend",
    sparklineKey: "vesselSparkline",
  },
  {
    section: "Fleet & HR",
    permission: "stats.activecrew",
    icon: <Users2 size={22} className="text-blue-600 dark:text-blue-400" />,
    iconBg: "bg-blue-50 dark:bg-blue-900/20",
    title: "Active Crew",
    valueKey: "activeCrewCount",
    path: "/crews",
    trendKey: "crewTrend",
    sparklineKey: "crewSparkline",
  },
  {
    section: "Fleet & HR",
    permission: "stats.candidates",
    icon: <UserCheck size={22} className="text-indigo-600 dark:text-indigo-400" />,
    iconBg: "bg-indigo-50 dark:bg-indigo-900/20",
    title: "Total Candidates",
    valueKey: "candidateCount",
    path: "/onboarding",
    trendKey: "candidateTrend",
    sparklineKey: "candidateSparkline",
  },
  {
    section: "Fleet & HR",
    permission: "stats.activecontracts",
    icon: <FileCheck size={22} className="text-violet-600 dark:text-violet-400" />,
    iconBg: "bg-violet-50 dark:bg-violet-900/20",
    title: "Active Contracts",
    valueKey: "activeContractCount",
    path: "/contracts",
    trendKey: "contractTrend",
    sparklineKey: "contractSparkline",
  },
  {
    section: "Operations & Voyages",
    permission: "stats.voyages",
    icon: <Map size={22} className="text-teal-600 dark:text-teal-400" />,
    iconBg: "bg-teal-50 dark:bg-teal-900/20",
    title: "Voyages",
    valueKey: "voyageCount",
    path: "/voyage",
    trendKey: "voyageTrend",
    sparklineKey: "voyageSparkline",
  },
  {
    section: "Operations & Voyages",
    permission: "stats.noon",
    icon: <FileText size={22} className="text-teal-600 dark:text-teal-400" />,
    iconBg: "bg-teal-50 dark:bg-teal-900/20",
    title: "Daily Noon Reports",
    valueKey: "dailyNoon",
    path: "/daily-noon-report",
    trendKey: "noonTrend",
    sparklineKey: "noonSparkline",
  },
  {
    section: "Operations & Voyages",
    permission: "stats.departure",
    icon: <SquareArrowUpLeft size={22} className="text-teal-600 dark:text-teal-400" />,
    iconBg: "bg-teal-50 dark:bg-teal-900/20",
    title: "Departure Reports",
    valueKey: "departure",
    path: "/departure-report",
    trendKey: "departureTrend",
    sparklineKey: "departureSparkline",
  },
  {
    section: "Operations & Voyages",
    permission: "stats.arrival",
    icon: <SquareArrowDownRight size={22} className="text-teal-600 dark:text-teal-400" />,
    iconBg: "bg-teal-50 dark:bg-teal-900/20",
    title: "Arrival Reports",
    valueKey: "arrival",
    path: "/arrival-report",
    trendKey: "arrivalTrend",
    sparklineKey: "arrivalSparkline",
  },
  {
    section: "Operations & Voyages",
    permission: "stats.nor",
    icon: <Flag size={22} className="text-teal-600 dark:text-teal-400" />,
    iconBg: "bg-teal-50 dark:bg-teal-900/20",
    title: "NOR Reports",
    valueKey: "nor",
    path: "/nor",
    trendKey: "norTrend",
    sparklineKey: "norSparkline",
  },
  {
    section: "Operations & Voyages",
    permission: "stats.cargo_stowage",
    icon: <Boxes size={22} className="text-teal-600 dark:text-teal-400" />,
    iconBg: "bg-teal-50 dark:bg-teal-900/20",
    title: "Cargo Stowage Reports",
    valueKey: "cargoStowage",
    path: "/cargo-stowage-cargo-documents",
    trendKey: "stowageTrend",
    sparklineKey: "stowageSparkline",
  },
  {
    section: "Operations & Voyages",
    permission: "stats.cargo_docs",
    icon: <FileStack size={22} className="text-teal-600 dark:text-teal-400" />,
    iconBg: "bg-teal-50 dark:bg-teal-900/20",
    title: "Cargo Documents",
    valueKey: "cargoDocuments",
    path: "/cargo-stowage-cargo-documents",
    trendKey: "cargoDocTrend",
    sparklineKey: "cargoDocSparkline",
  },
  {
    section: "Administrative",
    permission: "stats.openpayrolls",
    icon: <CircleDollarSign size={22} className="text-emerald-600 dark:text-emerald-400" />,
    iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
    title: "Open Payrolls",
    valueKey: "openPayrollCount",
    path: "/payroll",
    trendKey: "payrollTrend",
    sparklineKey: "payrollSparkline",
  },
  {
    section: "Administrative",
    permission: "stats.pendingleaves",
    icon: <CalendarClock size={22} className="text-amber-600 dark:text-amber-400" />,
    iconBg: "bg-amber-50 dark:bg-amber-900/20",
    title: "Pending Leave Approvals",
    valueKey: "pendingLeaveCount",
    path: "/payroll",
    trendKey: "pendingLeaveTrend",
    sparklineKey: "pendingLeaveSparkline",
  },
  {
    section: "Administrative",
    permission: "stats.users",
    icon: <Users2 size={22} className="text-slate-600 dark:text-slate-400" />,
    iconBg: "bg-slate-50 dark:bg-slate-900/20",
    title: "Users",
    valueKey: "userCount",
    path: "/manage-users",
    trendKey: "userTrend",
    sparklineKey: "userSparkline",
  },
  {
    section: "Administrative",
    permission: "stats.companies",
    icon: <Building2 size={22} className="text-slate-600 dark:text-slate-400" />,
    iconBg: "bg-slate-50 dark:bg-slate-900/20",
    title: "Companies",
    valueKey: "companyCount",
    path: "/manage-companies",
    trendKey: "companyTrend",
    sparklineKey: "companySparkline",
  },
];

// ─── Metrics (main export) ────────────────────────────────────────────────────

export const Metrics = ({ data }: { data: MetricsData }) => {
  const { can, isReady } = useAuthorization();

  if (!isReady) return null;

  const sections: SectionTitle[] = [
    "Fleet & HR",
    "Operations & Voyages",
    "Administrative",
  ];

  return (
    <div className="space-y-8 w-full max-w-full">
      {sections.map((section) => {
        const visibleWidgets = METRIC_WIDGETS.filter(
          (widget) => widget.section === section && can(widget.permission),
        );

        if (visibleWidgets.length === 0) return null;

        const gridClassName =
          section === "Operations & Voyages"
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6";

        return (
          <div key={section}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4 ml-1">
              {section}
            </h3>
            <div className={gridClassName}>
              {visibleWidgets.map((widget) => (
                <MetricCard
                  key={widget.permission}
                  id={widget.permission}
                  icon={widget.icon}
                  iconBg={widget.iconBg}
                  title={widget.title}
                  value={data[widget.valueKey] as number}
                  path={widget.path}
                  trend={data[widget.trendKey] as number}
                  sparkline={data[widget.sparklineKey] as number[]}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
