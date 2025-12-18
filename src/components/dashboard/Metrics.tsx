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
} from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";

interface IMetrics {
  dailyNoon: number;
  departure: number;
  arrival: number;
  nor: number;
  cargoStowage: number;
  cargoDocuments: number;
}

export const Metrics = () => {
  const [metrics, setMetrics] = useState<IMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await fetch("/api/dashboard/metrics");
        const data = await res.json();
        setMetrics(data);
      } catch (err) {
        console.error("Failed to load metrics", err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!metrics) {
    return <p className="text-red-500">Failed to load metrics.</p>;
  }

  return (
    /**
     * CHANGE: Adjusted breakpoints. 
     * Using 'xl:grid-cols-6' only when there is enough room.
     * Added 'w-full' and 'max-w-full' to ensure container doesn't grow.
     */
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6 w-full max-w-full">
      <MetricCard
        icon={<CalendarCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" />}
        iconBg="bg-teal-50 dark:bg-teal-900/30"
        title="Daily Noon Reports"
        value={metrics.dailyNoon}
        path="/daily-noon-report"
      />
      {/* ... repeat for other cards ... */}
      <MetricCard
        icon={<Ship className="w-6 h-6 text-teal-600 dark:text-teal-400" />}
        iconBg="bg-teal-50 dark:bg-teal-900/30"
        title="Departure Reports"
        value={metrics.departure}
        path="/departure-report"
      />
      <MetricCard
        icon={<Anchor className="w-6 h-6 text-teal-600 dark:text-teal-400" />}
        iconBg="bg-teal-50 dark:bg-teal-900/30"
        title="Arrival Reports"
        value={metrics.arrival}
        path="/arrival-report"
      />
      <MetricCard
        icon={<FileText className="w-6 h-6 text-teal-600 dark:text-teal-400" />}
        iconBg="bg-teal-50 dark:bg-teal-900/30"
        title="NOR Reports"
        value={metrics.nor}
        path="/nor"
      />
      <MetricCard
        icon={<Package className="w-6 h-6 text-teal-600 dark:text-teal-400" />}
        iconBg="bg-teal-50 dark:bg-teal-900/30"
        title="Cargo Stowage Reports"
        value={metrics.cargoStowage}
        path="/cargo-stowage-cargo-documents"
      />
      <MetricCard
        icon={<FileStack className="w-6 h-6 text-teal-600 dark:text-teal-400" />}
        iconBg="bg-teal-50 dark:bg-teal-900/30"
        title="Cargo Documents"
        value={metrics.cargoDocuments}
        path="/cargo-stowage-cargo-documents"
      />
    </div>
  );
};

/* ----------------------- CARD COMPONENT ----------------------- */
const MetricCard = ({ icon, iconBg, title, value, path }: any) => {
  const animatedValue = useCountUp(Number(value), 800);

  return (
    <Link 
      href={path}
      /**
       * CHANGE: 
       * 1. Removed hard 'min-w-[180px]' to prevent it from pushing neighbors.
       * 2. Added 'min-w-0' to let flex/grid shrink the card if necessary.
       */
      className="group block min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] dark:hover:border-brand-500/50"
    >
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl transition-transform group-hover:scale-110 ${iconBg}`}>
        {icon}
      </div>

      <div className="flex flex-col mt-5">
        <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-brand-500 transition-colors line-clamp-1">
          {title}
        </span>
        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
          {animatedValue}
        </h4>
      </div>
    </Link>
  );
};

const SkeletonCard = () => (
  <div className="min-w-0 w-full rounded-2xl border border-gray-200 p-5 dark:border-gray-800 animate-pulse">
    <div className="w-12 h-12 bg-gray-200 rounded-xl dark:bg-gray-700"></div>
    <div className="mt-5 space-y-2">
      <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-8 w-1/2 bg-gray-300 dark:bg-gray-600 rounded"></div>
    </div>
  </div>
);