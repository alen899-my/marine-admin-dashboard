import React from "react";
import DashboardSection from "./DashboardSection";
import DashboardWidgetGrid, { DashboardWidget } from "./DashboardWidgetGrid";
import {
  CrewStatusDistributionCard,
  CrewStatusTableWidget,
  type CrewStatusData,
} from "./CrewStatusBreakdown";

interface CrewStatusOverviewProps {
  data: CrewStatusData;
}

export default function CrewStatusOverview({ data }: CrewStatusOverviewProps) {
  return (
    <DashboardSection
      sectionId="crew-status-overview"
      title="Crew Status Breakdown"
      permissions={["stats.crewstatusbreakdown"]}
    >
      <DashboardWidgetGrid
        sectionId="crew-status-overview"
        className="grid-cols-1 lg:grid-cols-4"
      >
        <DashboardWidget
          id="crew-status-overview-distribution"
          permission="stats.crewstatusbreakdown"
          className="lg:col-span-1"
        >
          <CrewStatusDistributionCard data={data} />
        </DashboardWidget>

        <DashboardWidget
          id="crew-status-overview-table"
          permission="stats.crewstatusbreakdown"
          className="lg:col-span-3"
        >
          <CrewStatusTableWidget data={data} />
        </DashboardWidget>
      </DashboardWidgetGrid>
    </DashboardSection>
  );
}
