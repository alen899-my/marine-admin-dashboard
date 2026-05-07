import React from "react";
import ExpiryTable from "./ExpiryTable";
import { ExpiryBadge } from "./ExpiryCountBadges";
import DashboardSection from "./DashboardSection";
import DashboardWidgetGrid, {
  DashboardWidget,
  rectSortingStrategy,
} from "./DashboardWidgetGrid";

interface ExpiryAlertsProps {
  data: {
    counts: {
      expired: number;
      expiringSoon: number;
      valid: number;
    };
    rows: React.ComponentProps<typeof ExpiryTable>["rows"];
  };
}

export default function ExpiryAlerts({ data }: ExpiryAlertsProps) {
  return (
    <DashboardSection
      sectionId="expiry-alerts"
      title="Compliance & Document Expiry"
      permissions={[
        "stats.expiryexpired", 
        "stats.expirysoon", 
        "stats.expirytable"
      ]}
    >
      <DashboardWidgetGrid
        sectionId="expiry-alerts"
        strategy={rectSortingStrategy}
        className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      >
        <DashboardWidget
          id="expiry-alerts-expired"
          permission="stats.expiryexpired"
          className="lg:col-span-1"
        >
          <ExpiryBadge type="expired" value={data.counts.expired} />
        </DashboardWidget>

        <DashboardWidget
          id="expiry-alerts-soon"
          permission="stats.expirysoon"
          className="lg:col-span-1"
        >
          <ExpiryBadge type="expiringSoon" value={data.counts.expiringSoon} />
        </DashboardWidget>

        <DashboardWidget
          id="expiry-alerts-table"
          permission="stats.expirytable"
          className="md:col-span-2 lg:col-span-4"
        >
          <ExpiryTable rows={data.rows} />
        </DashboardWidget>
      </DashboardWidgetGrid>
    </DashboardSection>
  );
}
