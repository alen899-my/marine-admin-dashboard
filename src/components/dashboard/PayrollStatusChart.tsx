"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface StatusData {
  monthYear: string;
  saved: number;
  captain_verified: number;
  finance_approved: number;
}

interface PayrollStatusChartProps {
  data: StatusData[];
}

export default function PayrollStatusChart({ data }: PayrollStatusChartProps) {
  const chartOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: {
      type: "bar",
      stacked: false,
      fontFamily: "Inter, sans-serif",
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 4,
        dataLabels: {
          position: "top",
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"]
    },
    colors: ["#6366f1", "#f59e0b", "#10b981"],
    xaxis: {
      categories: data.map(d => d.monthYear),
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '11px'
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '11px'
        }
      },
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
      xaxis: {
        lines: { show: false }
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '12px',
      markers: {
        size: 4
      }
    },
    tooltip: {
      theme: "light",
    },
  }), [data]);

  const chartSeries = [
    {
      name: "Saved",
      data: data.map(d => d.saved),
    },
    {
      name: "Captain Verified",
      data: data.map(d => d.captain_verified),
    },
    {
      name: "Finance Approved",
      data: data.map(d => d.finance_approved),
    },
  ];

  return (
    <div className="min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/50 flex flex-col">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 block">
        Payroll Status Breakdown
      </span>
      <div
        className="w-full flex-1 min-h-[220px]"
        style={{ height: "var(--dashboard-widget-body-height, 300px)" }}
      >
        <Chart options={chartOptions} series={chartSeries} type="bar" height="100%" />
      </div>
    </div>
  );
}
