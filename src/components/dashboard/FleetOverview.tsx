import React from "react";
import type { MetricsData } from "@/types/dashboard";
import DashboardSection from "./DashboardSection";
import DashboardWidgetGrid, { DashboardWidget } from "./DashboardWidgetGrid";
import { MetricCard } from "./MetricCard";
import { Ship, Users2 } from "lucide-react";

interface FleetOverviewProps {
  metrics: MetricsData;
}

export default function FleetOverview({ metrics }: FleetOverviewProps) {
  return (
    <DashboardSection
      sectionId="fleet-overview"
      title="Fleet & HR"
      permissions={["stats.vessels", "stats.activecrew"]}
    >
      <DashboardWidgetGrid
        sectionId="fleet-overview"
        className="grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4"
      >
        <DashboardWidget
          id="fleet-overview-vessels"
          permission="stats.vessels"
        >
          <MetricCard
            icon={<Ship size={22} className="text-teal-600 dark:text-teal-400" />}
            iconBg="bg-teal-50 dark:bg-teal-900/20"
            title="Vessels in Fleet"
            value={metrics.vesselCount}
            path="/vessels"
            trend={metrics.vesselTrend}
            sparkline={metrics.vesselSparkline}
          />
        </DashboardWidget>

        <DashboardWidget
          id="fleet-overview-active-crew"
          permission="stats.activecrew"
        >
          <MetricCard
            icon={<Users2 size={22} className="text-blue-600 dark:text-blue-400" />}
            iconBg="bg-blue-50 dark:bg-blue-900/20"
            title="Active Crew"
            value={metrics.activeCrewCount}
            path="/crews"
            trend={metrics.crewTrend}
            sparkline={metrics.crewSparkline}
          />
        </DashboardWidget>
      </DashboardWidgetGrid>
    </DashboardSection>
  );
}
