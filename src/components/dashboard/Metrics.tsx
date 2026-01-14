"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Ship,
  Anchor,
  FileText,
  Package,
  FileStack,
  ShipWheel,
  Navigation,
  Users,
  Building2,
  Boxes,
  Flag,
  SquareArrowDownRight,
  SquareArrowUpLeft,
  Users2,
  Map,
} from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { useAuthorization } from "@/hooks/useAuthorization";

interface IMetrics {
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

export const Metrics = ({ selectedCompanyId }: { selectedCompanyId?: string }) => {
  const [metrics, setMetrics] = useState<IMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const { can, isReady } = useAuthorization();

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true);
        
        const url = selectedCompanyId 
          ? `/api/dashboard/metrics?companyId=${selectedCompanyId}`
          : "/api/dashboard/metrics";

        const res = await fetch(url);
        const data = await res.json();
        setMetrics(data);
      } catch (err) {
        console.error("Failed to load metrics", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadMetrics();
  }, [selectedCompanyId]);

  if (loading || !isReady) {
    return (
      <div className="space-y-8 w-full">
        <div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4 ml-1 animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => <SkeletonCard key={`mgmt-${i}`} />)}
          </div>
        </div>
        <div>
          <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded mb-4 ml-1 animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => <SkeletonCard key={`ops-${i}`} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return <p className="text-red-500">Failed to load metrics.</p>;
  }

  return (
    <div className="space-y-8 w-full max-w-full">
      
      {/* --- Section 1: Fleet & Management (Matches Sidebar Icons) --- */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4 ml-1">Fleet & Management</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {can("stats.vessels") && (
            <MetricCard
              icon={<Ship size={24} className="text-teal-600 dark:text-teal-400" />}
              iconBg="bg-teal-50 dark:bg-teal-900/20"
              title="Vessels"
              value={metrics.vesselCount}
              path="/vessels"
            />
          )}
          {can("stats.voyages") && (
            <MetricCard
              icon={<Map size={24} className="text-teal-600 dark:text-teal-400" />}
              iconBg="bg-teal-50 dark:bg-teal-900/20"
              title="Voyages"
              value={metrics.voyageCount}
              path="/voyage"
            />
          )}
          {can("stats.users") && (
            <MetricCard
              icon={<Users2 size={24} className="text-teal-600 dark:text-teal-400" />}
              iconBg="bg-teal-50 dark:bg-teal-900/20"
              title="Active Users"
              value={metrics.userCount}
              path="/manage-users"
            />
          )}
          {can("stats.companies") && (
            <MetricCard
              icon={<Building2 size={24} className="text-teal-600 dark:text-teal-400" />}
              iconBg="bg-teal-50 dark:bg-teal-900/20"
              title="Companies"
              value={metrics.companyCount}
              path="/manage-companies"
            />
          )}
        </div>
      </div>

      {/* --- Section 2: Operational Reports --- */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4 ml-1">Operational Reports</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
          {/* 1. Daily Noon Stat Check */}
          {can("stats.noon") && (
            <MetricCard
              icon={<FileText size={24} className="text-teal-600 dark:text-teal-400" />}
              iconBg="bg-teal-50 dark:bg-teal-900/20"
              title="Daily Noon"
              value={metrics.dailyNoon}
              path="/daily-noon-report"
            />
          )}

          {/* 2. Departure Stat Check */}
          {can("stats.departure") && (
            <MetricCard
              icon={<SquareArrowUpLeft size={24} className="text-teal-600 dark:text-teal-400" />}
              iconBg="bg-teal-50 dark:bg-teal-900/20"
              title="Departure"
              value={metrics.departure}
              path="/departure-report"
            />
          )}

          {/* 3. Arrival Stat Check */}
          {can("stats.arrival") && (
            <MetricCard
              icon={<SquareArrowDownRight size={24} className="text-teal-600 dark:text-teal-400" />}
              iconBg="bg-teal-50 dark:bg-teal-900/20"
              title="Arrival"
              value={metrics.arrival}
              path="/arrival-report"
            />
          )}

          {/* 4. NOR Stat Check */}
          {can("stats.nor") && (
            <MetricCard
              icon={<Flag size={24} className="text-teal-600 dark:text-teal-400" />}
              iconBg="bg-teal-50 dark:bg-teal-900/20"
              title="NOR"
              value={metrics.nor}
              path="/nor"
            />
          )}

          {/* 5. Cargo Stowage Stat Check */}
          {can("stats.cargo_stowage") && (
            <MetricCard
              icon={<Boxes size={24} className="text-teal-600 dark:text-teal-400" />}
              iconBg="bg-teal-50 dark:bg-teal-900/20"
              title="Cargo Stowage"
              value={metrics.cargoStowage}
              path="/cargo-stowage-cargo-documents"
            />
          )}

          {/* 6. Cargo Documents Stat Check */}
          {can("stats.cargo_docs") && (
            <MetricCard
              icon={<CalendarCheck size={24} className="text-teal-600 dark:text-teal-400" />}
              iconBg="bg-teal-50 dark:bg-teal-900/20"
              title="Cargo Docs"
              value={metrics.cargoDocuments}
              path="/cargo-stowage-cargo-documents"
            />
          )}
        </div>
      </div>
    </div>
  );
};

/* --- REUSED CARD COMPONENTS --- */
const MetricCard = ({ icon, iconBg, title, value, path }: any) => {
  const animatedValue = useCountUp(Number(value), 800);
  return (
    <Link 
      href={path}
      className="group block min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] dark:hover:border-brand-500/50"
    >
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl transition-transform group-hover:scale-110 group-hover:rotate-3 ${iconBg}`}>
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

const SkeletonCard = () => (
  <div className="min-w-0 w-full rounded-2xl border border-gray-200 p-5 dark:border-gray-800 animate-pulse bg-white dark:bg-white/[0.03]">
    {/* Icon Placeholder */}
    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
    
    <div className="mt-5 space-y-3">
      {/* Title Placeholder */}
      <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
      {/* Value Placeholder */}
      <div className="h-7 w-1/3 bg-gray-300 dark:bg-gray-600 rounded"></div>
    </div>
  </div>
);