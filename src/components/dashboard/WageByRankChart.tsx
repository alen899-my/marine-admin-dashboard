"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import type { WageByRankRow } from "@/lib/services/salary-insights";
import { formatCurrency } from "@/lib/formatCurrency";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface CurrencySettings {
  currencySymbol: string;
  currencyCode: string;
  currencyPosition: "left" | "right";
  currencyFormatType: "symbol" | "code";
  currencySpace: boolean;
}

interface WageByRankChartProps {
  data: WageByRankRow[];
  currencySettings?: CurrencySettings;
}

const defaultCurrencySettings: CurrencySettings = {
  currencySymbol: "$",
  currencyCode: "USD",
  currencyPosition: "left",
  currencyFormatType: "symbol",
  currencySpace: true,
};

export default function WageByRankChart({ data, currencySettings = defaultCurrencySettings }: WageByRankChartProps) {
  const categories = data.map((d) => d.rank);
  const values = data.map((d) => d.avgBasic);
  const maxVal = Math.max(...values, 1);
  const defaultChartHeight = Math.max(180, data.length * 40);

  const formatValue = (val: number) => formatCurrency(val, currencySettings.currencyCode, { currencySettings });

  const chartOptions: ApexCharts.ApexOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        fontFamily: "Inter, sans-serif",
        toolbar: { show: false },
        animations: { enabled: true },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: "58%",
          distributed: false,
          borderRadius: 4,
          dataLabels: { position: "top" },
        },
      },
      colors: ["#6366f1"],
      dataLabels: {
        enabled: true,
        textAnchor: "start",
        style: { fontSize: "11px", fontWeight: 600, colors: ["#475569"] },
        formatter: (val: number | string) => formatValue(Number(val)),
        offsetX: 5,
        dropShadow: { enabled: false },
      },
      xaxis: {
        categories,
        min: 0,
        max: Math.ceil(maxVal * 1.25),
        tickAmount: 5,
        labels: {
          formatter: (val: number | string) => formatValue(Number(val)),
          style: { colors: "#64748b", fontSize: "11px" },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          show: true,
          style: { colors: "#64748b", fontSize: "11px", fontWeight: 500 },
          offsetX: -5,
          maxWidth: 120,
        },
      },
      legend: { show: false },
      grid: { show: false, padding: { right: 60 } },
      tooltip: {
        theme: "light",
        x: { show: false },
        y: {
          formatter: (val: number | string) => `${formatValue(Number(val))} avg`,
          title: { formatter: () => "" },
        },
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            yaxis: {
              labels: {
                style: { fontSize: "10px" },
                maxWidth: 100,
              },
            },
            xaxis: {
              labels: {
                style: { fontSize: "10px" },
              },
            },
            dataLabels: {
              style: { fontSize: "10px" },
            },
          },
        },
      ],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, currencySettings]
  );

  const chartSeries = [{ name: "Avg Basic Wage", data: values }];

  return (
    <div className="min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 transition-all duration-200 hover:shadow-lg hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/50 flex flex-col">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 sm:mb-4 block">
        Average Basic Wage by Rank
      </span>
      {data.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
          No wage data available.
        </div>
      ) : (
        <div
          className="w-full flex-1 min-h-[180px]"
          style={{ height: `var(--dashboard-widget-body-height, ${defaultChartHeight}px)` }}
        >
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
