"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { formatCurrency } from "@/lib/formatCurrency";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface CostData {
  monthYear: string;
  amount: number;
}

interface CurrencySettings {
  currencySymbol: string;
  currencyCode: string;
  currencyPosition: "left" | "right";
  currencyFormatType: "symbol" | "code";
  currencySpace: boolean;
}

interface PayrollCostChartProps {
  data: CostData[];
  currencySettings?: CurrencySettings;
}

const defaultCurrencySettings: CurrencySettings = {
  currencySymbol: "$",
  currencyCode: "USD",
  currencyPosition: "left",
  currencyFormatType: "symbol",
  currencySpace: true,
};

export default function PayrollCostChart({ data, currencySettings = defaultCurrencySettings }: PayrollCostChartProps) {
  const formatValue = React.useCallback(
    (val: number) => formatCurrency(val, currencySettings.currencyCode, { currencySettings }),
    [currencySettings],
  );

  const chartOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: {
      type: "line",
      fontFamily: "Inter, sans-serif",
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    stroke: {
      curve: "smooth",
      width: 3,
      colors: ["#6366f1"]
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        gradientToColors: ['#818cf8'],
        shadeIntensity: 1,
        type: 'horizontal',
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100, 100, 100]
      },
    },
    markers: {
      size: 4,
      colors: ["#fff"],
      strokeColors: "#6366f1",
      strokeWidth: 2,
      hover: {
        size: 6,
      }
    },
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
        formatter: (val) => formatValue(Number(val)),
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
    tooltip: {
      theme: "light",
      y: {
        formatter: (val) => formatValue(Number(val))
      }
    },
  }), [data, formatValue]);

  const chartSeries = [
    {
      name: "Monthly Cost",
      data: data.map(d => d.amount),
    },
  ];

  return (
    <div className="min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/50 flex flex-col">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 block">
        Monthly Payroll Cost Trend
      </span>
      <div
        className="w-full flex-1 min-h-[220px]"
        style={{ height: "var(--dashboard-widget-body-height, 300px)" }}
      >
        <Chart options={chartOptions} series={chartSeries} type="line" height="100%" />
      </div>
    </div>
  );
}
