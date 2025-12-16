"use client";

import React, { useEffect, useState } from "react";
// Removed unused 'Badge' import
import {
  CalendarCheck,
  Ship,
  Anchor,
  FileText,
  Package,
  FileStack,
} from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";

// Define Interface for Metrics Data
interface IMetrics {
  dailyNoon: number;
  departure: number;
  arrival: number;
  nor: number;
  cargoStowage: number;
  cargoDocuments: number;
}

export const Metrics = () => {
  // Use typed state
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
      <div className="flex gap-4 overflow-x-auto pb-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!metrics) {
    return <p className="text-red-500">Failed to load metrics.</p>;
  }

  return (
    <div
      className="
        grid
        grid-cols-1 
        sm:grid-cols-2 
        md:grid-cols-3 
        lg:grid-cols-4 
        xl:grid-cols-6 
        gap-4 
        md:gap-6
      "
    >
      {/* Daily Noon Report */}
      <MetricCard
        icon={
          <CalendarCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" />
        }
        iconBg="bg-teal-50 dark:bg-teal-900/30"
        title="Daily Noon Reports"
        value={metrics.dailyNoon}
      />

      {/* Departure */}
      <MetricCard
        icon={<Ship className="w-6 h-6 text-teal-600 dark:text-teal-400" />}
        iconBg="bg-teal-50 dark:bg-teal-900/30"
        title="Departure Reports"
        value={metrics.departure}
      />

      {/* Arrival */}
      <MetricCard
        icon={<Anchor className="w-6 h-6 text-teal-600 dark:text-teal-400" />}
        iconBg="bg-teal-50 dark:bg-teal-900/30"
        title="Arrival Reports"
        value={metrics.arrival}
      />

      {/* NOR */}
      <MetricCard
        icon={
          <FileText className="w-6 h-6 text-teal-600 dark:text-teal-400" />
        }
        iconBg="bg-teal-50 dark:bg-teal-900/30"
        title="NOR Reports"
        value={metrics.nor}
      />

      {/* Cargo Stowage */}
      <MetricCard
        icon={<Package className="w-6 h-6 text-teal-600 dark:text-teal-400" />}
        iconBg="bg-teal-50 dark:bg-teal-900/30"
        title="Cargo Stowage Reports"
        value={metrics.cargoStowage}
      />

      {/* Cargo Documents */}
      <MetricCard
        icon={
          <FileStack className="w-6 h-6 text-teal-600 dark:text-teal-400" />
        }
        iconBg="bg-teal-50 dark:bg-teal-900/30"
        title="Cargo Documents"
        value={metrics.cargoDocuments}
      />
    </div>
  );
};

/* ----------------------- CARD COMPONENT ----------------------- */
const MetricCard = ({
  icon,
  iconBg,
  title,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  value: number | string;
}) => {
  const animatedValue = useCountUp(Number(value), 800);

  return (
    <div className="min-w-[230px] rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div
        className={`flex items-center justify-center w-12 h-12 rounded-xl ${iconBg}`}
      >
        {icon}
      </div>

      <div className="flex items-end justify-between mt-5">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </span>

          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {animatedValue}
          </h4>
        </div>
      </div>
    </div>
  );
};

/* ----------------------- SKELETON LOADER ----------------------- */
const SkeletonCard = () => (
  <div className="min-w-[230px] rounded-2xl border border-gray-200 p-5 dark:border-gray-800 animate-pulse">
    <div className="w-12 h-12 bg-gray-200 rounded-xl dark:bg-gray-700"></div>
    <div className="mt-5 space-y-2">
      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
    </div>
  </div>
);