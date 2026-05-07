"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { useAuthorization } from "@/hooks/useAuthorization";
import CrewStatusTable from "./CrewStatusTable";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export interface CrewStatusData {
  distribution: { status: string; count: number }[];
  crewList: {
    _id: string;
    name: string;
    profilePhoto: string | null;
    rank: string;
    vesselName: string;
    crewStatus: string;
    contractEnd?: string;
  }[];
}

interface CrewStatusBreakdownProps {
  data: CrewStatusData;
}

export function CrewStatusDistributionCard({ data }: CrewStatusBreakdownProps) {
  const { isReady } = useAuthorization();

  const chartOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: {
      type: "donut",
      fontFamily: "Inter, sans-serif",
    },
    labels: data.distribution.map((d) => d.status.charAt(0).toUpperCase() + d.status.slice(1).replace("_", " ")),
    colors: [
      "#12b76a", // green (success-500)
      "#f04438", // rose (error-500)
      "#0ba5ec", // sky (blue-light-500)
      "#6366f1", // indigo (indigo-500)
      "#7a5af8", // purple (theme-purple-500)
      "#f79009", // amber (warning-500)
      "#475467", // slate (gray-600)
      "#fb6514", // orange (orange-500)
      "#667085", // gray (gray-500)
    ],
    legend: {
      position: "bottom",
      labels: {
        colors: "var(--foreground)",
      },
    },
    dataLabels: {
      enabled: false,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "75%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Crew",
              color: "var(--foreground)",
              formatter: () => data.crewList.length.toString(),
            },
          },
        },
      },
    },
    stroke: {
      show: false,
    },
    tooltip: {
      theme: "light",
      fillSeriesColor: false,
    },
  }), [data]);

  const chartSeries = data.distribution.map((d) => d.count);

  if (!isReady) return null;

  return (
    <div className="group block min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] dark:hover:border-brand-500/50">
      <div className="mt-5 flex h-full flex-col">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-brand-500 transition-colors line-clamp-1 mb-4 uppercase tracking-wider">
          Crew Status Distribution
        </span>
        <div
          className="w-full flex-1 min-h-[240px]"
          style={{ height: "var(--dashboard-widget-body-height, 320px)" }}
        >
          <Chart
            options={chartOptions}
            series={chartSeries}
            type="donut"
            width="100%"
            height="100%"
          />
        </div>
      </div>
    </div>
  );
}

export function CrewStatusTableWidget({ data }: CrewStatusBreakdownProps) {
  return <CrewStatusTable crewList={data.crewList} />;
}

export default function CrewStatusBreakdown({ data }: CrewStatusBreakdownProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <CrewStatusDistributionCard data={data} />
      </div>
      <div className="lg:col-span-3">
        <CrewStatusTableWidget data={data} />
      </div>
    </div>
  );
}
