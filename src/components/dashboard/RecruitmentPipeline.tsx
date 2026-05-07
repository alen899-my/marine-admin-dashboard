"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface FunnelStage {
  stage: string;
  count: number;
}

interface RecruitmentPipelineProps {
  data: FunnelStage[];
}

export default function RecruitmentPipeline({ data }: RecruitmentPipelineProps) {
  const chartOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: {
      type: "bar",
      fontFamily: "Inter, sans-serif",
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "60%",
        distributed: true,
        borderRadius: 4,
        dataLabels: {
          position: "top",
        },
      },
    },
    colors: [
      "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", 
      "#f43f5e", "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16"
    ],
    dataLabels: {
      enabled: true,
      textAnchor: "start",
      style: {
        fontSize: '12px',
        fontWeight: 600,
        colors: ["#475569"], 
      },
      formatter: (val: number | string) => {
        return String(val);
      },
      offsetX: 5, 
      dropShadow: {
        enabled: false,
      },
    },
    xaxis: {
      categories: data.map(d => d.stage.charAt(0).toUpperCase() + d.stage.slice(1).replace(/_/g, " ")),
      max: Math.max(...data.map(d => d.count)) < 10 ? 10 : undefined,
      tickAmount: 5,
      labels: {
        formatter: (val) => Math.floor(Number(val)).toString(),
        style: {
          colors: '#64748b',
        }
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        show: true,
        style: {
          colors: '#64748b',
          fontSize: '11px',
          fontWeight: 500,
        },
        offsetX: -5,
      },
    },
    grid: {
      show: false,
      padding: {
        right: 35,
      }
    },
    tooltip: {
      theme: "light",
      x: { show: false },
      y: {
        title: {
          formatter: () => "",
        },
      },
    },
  }), [data]);

  const chartSeries = [{
    name: "Candidates",
    data: data.map(d => d.count),
  }];

  return (
    <div className="min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/50 flex flex-col">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 block">
        Recruitment Pipeline
      </span>
      <div
        className="w-full flex-1 min-h-[240px]"
        style={{ height: "var(--dashboard-widget-body-height, 350px)" }}
      >
        <Chart options={chartOptions} series={chartSeries} type="bar" height="100%" />
      </div>
    </div>
  );
}
