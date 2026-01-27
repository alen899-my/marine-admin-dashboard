"use client"; // Kept because useCountUp is a client hook

import { useAuthorization } from "@/hooks/useAuthorization";
import { useCountUp } from "@/hooks/useCountUp";
import {
  Boxes,
  Building2,
  FileStack,
  FileText,
  Flag,
  Map,
  Ship,
  SquareArrowDownRight,
  SquareArrowUpLeft,
  Users2,
} from "lucide-react";
import Link from "next/link";

// Define the interface for props
interface MetricsData {
  dailyNoon: number;
  departure: number;
  arrival: number;
  nor: number;
  cargoStowage: number;
  cargoDocuments: number;
  vesselCount: number;
  voyageCount: number;
  userCount: number;
  companyCount: number;
}

export const Metrics = ({ data }: { data: MetricsData }) => {
  const { can, isReady } = useAuthorization();

  // If auth isn't ready (client-side check), show skeleton or null
  // Note: Since data is passed from server, 'data' itself is never null/loading here
  if (!isReady) return null;

  const hasFleetAccess =
    can("stats.vessels") ||
    can("stats.voyages") ||
    can("stats.users") ||
    can("stats.companies");
  const hasOpsAccess =
    can("stats.noon") ||
    can("stats.departure") ||
    can("stats.arrival") ||
    can("stats.nor") ||
    can("stats.cargo_stowage") ||
    can("stats.cargo_docs");

  return (
    <div className="space-y-8 w-full max-w-full">
      {/* --- Section 1: Fleet & Management --- */}
      {hasFleetAccess && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4 ml-1">
            Fleet & Management
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {can("stats.vessels") && (
              <MetricCard
                icon={
                  <Ship
                    size={24}
                    className="text-teal-600 dark:text-teal-400"
                  />
                }
                iconBg="bg-teal-50 dark:bg-teal-900/20"
                title="Vessels"
                value={data.vesselCount}
                path="/vessels"
              />
            )}
            {can("stats.voyages") && (
              <MetricCard
                icon={
                  <Map size={24} className="text-teal-600 dark:text-teal-400" />
                }
                iconBg="bg-teal-50 dark:bg-teal-900/20"
                title="Voyages"
                value={data.voyageCount}
                path="/voyage"
              />
            )}
            {can("stats.users") && (
              <MetricCard
                icon={
                  <Users2
                    size={24}
                    className="text-teal-600 dark:text-teal-400"
                  />
                }
                iconBg="bg-teal-50 dark:bg-teal-900/20"
                title="Users"
                value={data.userCount}
                path="/manage-users"
              />
            )}
            {can("stats.companies") && (
              <MetricCard
                icon={
                  <Building2
                    size={24}
                    className="text-teal-600 dark:text-teal-400"
                  />
                }
                iconBg="bg-teal-50 dark:bg-teal-900/20"
                title="Companies"
                value={data.companyCount}
                path="/manage-companies"
              />
            )}
          </div>
        </div>
      )}

      {/* --- Section 2: Operational Reports --- */}
      {hasOpsAccess && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4 ml-1">
            Operational Reports
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
            {can("stats.noon") && (
              <MetricCard
                icon={
                  <FileText
                    size={24}
                    className="text-teal-600 dark:text-teal-400"
                  />
                }
                iconBg="bg-teal-50 dark:bg-teal-900/20"
                title="Daily Noon Reports"
                value={data.dailyNoon}
                path="/daily-noon-report"
              />
            )}
            {can("stats.departure") && (
              <MetricCard
                icon={
                  <SquareArrowUpLeft
                    size={24}
                    className="text-teal-600 dark:text-teal-400"
                  />
                }
                iconBg="bg-teal-50 dark:bg-teal-900/20"
                title="Departure Reports"
                value={data.departure}
                path="/departure-report"
              />
            )}
            {can("stats.arrival") && (
              <MetricCard
                icon={
                  <SquareArrowDownRight
                    size={24}
                    className="text-teal-600 dark:text-teal-400"
                  />
                }
                iconBg="bg-teal-50 dark:bg-teal-900/20"
                title="Arrival Reports"
                value={data.arrival}
                path="/arrival-report"
              />
            )}
            {can("stats.nor") && (
              <MetricCard
                icon={
                  <Flag
                    size={24}
                    className="text-teal-600 dark:text-teal-400"
                  />
                }
                iconBg="bg-teal-50 dark:bg-teal-900/20"
                title="NOR Reports"
                value={data.nor}
                path="/nor"
              />
            )}
            {can("stats.cargo_stowage") && (
              <MetricCard
                icon={
                  <Boxes
                    size={24}
                    className="text-teal-600 dark:text-teal-400"
                  />
                }
                iconBg="bg-teal-50 dark:bg-teal-900/20"
                title="Cargo Stowage Reports"
                value={data.cargoStowage}
                path="/cargo-stowage-cargo-documents"
              />
            )}
            {can("stats.cargo_docs") && (
              <MetricCard
                icon={
                  <FileStack
                    size={24}
                    className="text-teal-600 dark:text-teal-400"
                  />
                }
                iconBg="bg-teal-50 dark:bg-teal-900/20"
                title="Cargo Documents"
                value={data.cargoDocuments}
                path="/cargo-stowage-cargo-documents"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* --- KEEP MetricCard and SkeletonCard COMPONENTS AS THEY WERE --- */
const MetricCard = ({ icon, iconBg, title, value, path }: any) => {
  const animatedValue = useCountUp(Number(value), 800);
  return (
    <Link
      href={path}
      className="group block min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] dark:hover:border-brand-500/50"
    >
      <div
        className={`flex items-center justify-center w-12 h-12 rounded-xl transition-transform group-hover:scale-110 group-hover:rotate-3 ${iconBg}`}
      >
        {icon}
      </div>
      <div className="flex flex-col mt-5">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-brand-500 transition-colors line-clamp-1">
          {title}
        </span>
        <h4 className="mt-2 font-bold text-gray-800 text-2xl dark:text-white/90">
          {animatedValue}
        </h4>
      </div>
    </Link>
  );
};
