"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import type { RoleDistributionItem } from "@/lib/services/user-access";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface RoleDistributionChartProps {
  data: RoleDistributionItem[];
}

const ROLE_COLORS = [
  "#6366f1", // indigo
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#a855f7", // purple
  "#f43f5e", // rose
  "#64748b", // slate
];

export default function RoleDistributionChart({ data }: RoleDistributionChartProps) {
  const categories = data.map(
    (d) => d.roleName.charAt(0).toUpperCase() + d.roleName.slice(1).replace(/-/g, " ")
  );
  const counts = data.map((d) => d.count);
  const colors = data.map((_, i) => ROLE_COLORS[i % ROLE_COLORS.length]);

  const maxCount = Math.max(...counts, 1);

  const chartOptions: ApexCharts.ApexOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        fontFamily: "Inter, sans-serif",
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: "55%",
          distributed: true,
          borderRadius: 4,
          dataLabels: { position: "top" },
        },
      },
      colors,
      dataLabels: {
        enabled: true,
        textAnchor: "start",
        style: { fontSize: "12px", fontWeight: 600, colors: ["#475569"] },
        formatter: (val: number | string) => String(val),
        offsetX: 5,
        dropShadow: { enabled: false },
      },
      xaxis: {
        categories,
        min: 0,
        max: maxCount < 5 ? 5 : undefined,
        tickAmount: 4,
        labels: {
          formatter: (val: number | string) => Math.floor(Number(val)).toString(),
          style: { colors: "#64748b" },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          show: true,
          style: { colors: "#64748b", fontSize: "11px", fontWeight: 500 },
          offsetX: -5,
        },
      },
      legend: { show: false },
      grid: { show: false, padding: { right: 35 } },
      tooltip: {
        theme: "light",
        x: { show: false },
        y: { title: { formatter: () => "" } },
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
  );

  const chartSeries = [{ name: "Users", data: counts }];

  return (
    <div
      className="min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/50 flex flex-col"
      style={{ height: "var(--dashboard-widget-height, 320px)" }}
    >
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 block">
        Role Distribution
      </span>
      {data.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400 flex-1 flex items-center justify-center">
          No role data available.
        </div>
      ) : (
        <div className="w-full flex-1 min-h-0">
          <Chart
            options={chartOptions}
            series={chartSeries}
            type="bar"
            height="100%"
          />
        </div>
      )}
    </div>
  );
}
