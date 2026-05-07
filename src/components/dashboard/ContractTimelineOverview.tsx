import React from "react";
import ContractTimeline from "./ContractTimeline";
import type { ContractTimelineData } from "@/lib/services/contract-timeline";
import type { MetricsData } from "@/types/dashboard";
import DashboardSection from "./DashboardSection";
import DashboardWidgetGrid, { DashboardWidget } from "./DashboardWidgetGrid";
import { MetricCard } from "./MetricCard";
import { FileCheck } from "lucide-react";

interface ContractTimelineOverviewProps {
  data: ContractTimelineData;
  metrics: MetricsData;
}

export default function ContractTimelineOverview({ data, metrics }: ContractTimelineOverviewProps) {
  return (
    <DashboardSection
      sectionId="contract-timeline-overview"
      title="Contract Lifecycle"
      permissions={["stats.activecontracts", "stats.contracttimeline"]}
    >
      <DashboardWidgetGrid
        sectionId="contract-timeline-overview"
        className="grid-cols-1 gap-4 md:gap-6 lg:grid-cols-4"
      >
        <DashboardWidget
          id="contract-timeline-overview-active-contracts"
          permission="stats.activecontracts"
        >
          <MetricCard
            icon={<FileCheck size={22} className="text-violet-600 dark:text-violet-400" />}
            iconBg="bg-violet-50 dark:bg-violet-900/20"
            title="Active Contracts"
            value={metrics.activeContractCount}
            path="/contracts"
            trend={metrics.contractTrend}
            sparkline={metrics.contractSparkline}
          />
        </DashboardWidget>

        <DashboardWidget
          id="contract-timeline-overview-timeline"
          permission="stats.contracttimeline"
          className="lg:col-span-4"
        >
          <ContractTimeline rows={data.rows} />
        </DashboardWidget>
      </DashboardWidgetGrid>
    </DashboardSection>
  );
}
