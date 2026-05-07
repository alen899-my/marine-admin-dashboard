"use client";

import React from "react";
import PayrollStatusChart from "./PayrollStatusChart";
import PayrollApprovalQueue from "./PayrollApprovalQueue";
import PayrollCostChart from "./PayrollCostChart";
import type { MetricsData } from "@/types/dashboard";
import DashboardSection from "./DashboardSection";
import DashboardWidgetGrid, { DashboardWidget } from "./DashboardWidgetGrid";
import { MetricCard } from "./MetricCard";
import { CalendarClock, CircleDollarSign } from "lucide-react";

interface CurrencySettings {
  currencySymbol: string;
  currencyCode: string;
  currencyPosition: "left" | "right";
  currencyFormatType: "symbol" | "code";
  currencySpace: boolean;
}

interface PayrollOverviewProps {
  data: {
    statusBarChartData: React.ComponentProps<typeof PayrollStatusChart>["data"];
    approvalQueue: React.ComponentProps<typeof PayrollApprovalQueue>["data"];
    costLineChartData: React.ComponentProps<typeof PayrollCostChart>["data"];
  };
  metrics: MetricsData;
  currencySettings?: CurrencySettings;
}

const defaultCurrencySettings: CurrencySettings = {
  currencySymbol: "$",
  currencyCode: "USD",
  currencyPosition: "left",
  currencyFormatType: "symbol",
  currencySpace: true,
};

export default function PayrollOverview({ data, metrics, currencySettings = defaultCurrencySettings }: PayrollOverviewProps) {
  return (
    <DashboardSection
      sectionId="payroll-overview"
      title="Payroll Overview"
      permissions={[
        "stats.openpayrolls",
        "stats.pendingleaves",
        "stats.payrollstatus",
        "stats.payrollcost",
        "stats.payrollapprovalqueue",
      ]}
    >
      <DashboardWidgetGrid
        sectionId="payroll-overview"
        className="grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4"
      >
        <DashboardWidget
          id="payroll-overview-pending-leaves"
          permission="stats.pendingleaves"
        >
          <MetricCard
            icon={<CalendarClock size={22} className="text-amber-600 dark:text-amber-400" />}
            iconBg="bg-amber-50 dark:bg-amber-900/20"
            title="Pending Leave Approvals"
            value={metrics.pendingLeaveCount}
            path="/payroll"
            trend={metrics.pendingLeaveTrend}
            sparkline={metrics.pendingLeaveSparkline}
          />
        </DashboardWidget>

        <DashboardWidget
          id="payroll-overview-open-payrolls"
          permission="stats.openpayrolls"
        >
          <MetricCard
            icon={<CircleDollarSign size={22} className="text-emerald-600 dark:text-emerald-400" />}
            iconBg="bg-emerald-50 dark:bg-emerald-900/20"
            title="Open Payrolls"
            value={metrics.openPayrollCount}
            path="/payroll"
            trend={metrics.payrollTrend}
            sparkline={metrics.payrollSparkline}
          />
        </DashboardWidget>

        <DashboardWidget
          id="payroll-overview-status-chart"
          permission="stats.payrollstatus"
          className="sm:col-span-2 lg:col-span-2 lg:row-span-2"
        >
          <PayrollStatusChart data={data.statusBarChartData} />
        </DashboardWidget>

        <DashboardWidget
          id="payroll-overview-cost-chart"
          permission="stats.payrollcost"
          className="sm:col-span-2 lg:col-span-2"
        >
          <PayrollCostChart data={data.costLineChartData} currencySettings={currencySettings} />
        </DashboardWidget>

        <DashboardWidget
          id="payroll-overview-approval-queue"
          permission="stats.payrollapprovalqueue"
          className="sm:col-span-2 lg:col-span-4"
        >
          <PayrollApprovalQueue data={data.approvalQueue} currencySettings={currencySettings} />
        </DashboardWidget>
      </DashboardWidgetGrid>
    </DashboardSection>
  );
}
