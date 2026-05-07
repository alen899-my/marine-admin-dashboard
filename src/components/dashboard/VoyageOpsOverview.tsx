import React from "react";
import ActiveVoyagesTable from "./ActiveVoyagesTable";
import NoonReportsTable from "./NoonReportsTable";
import PreArrivalTable from "./PreArrivalTable";
import type { VoyageOpsData } from "@/lib/services/voyage-ops";
import type { MetricsData } from "@/types/dashboard";
import DashboardSection from "./DashboardSection";
import DashboardWidgetGrid, { DashboardWidget } from "./DashboardWidgetGrid";
import { MetricCard } from "./MetricCard";
import { 
  FileStack, 
  FileText, 
  Flag, 
  Map, 
  Boxes,
  SquareArrowDownRight, 
  SquareArrowUpLeft 
} from "lucide-react";

interface VoyageOpsOverviewProps {
  data: VoyageOpsData;
  metrics: MetricsData;
}

export default function VoyageOpsOverview({ data, metrics }: VoyageOpsOverviewProps) {
  return (
    <DashboardSection
      sectionId="voyage-ops-overview"
      title="Voyage & Vessel Operations"
      permissions={[
        "stats.voyages",
        "stats.noon",
        "stats.departure",
        "stats.arrival",
        "stats.nor",
        "stats.cargo_stowage",
        "stats.cargo_docs",
        "stats.activevoyagestable",
        "stats.noonreportstable",
        "stats.prearrivaltable",
      ]}
    >
      <DashboardWidgetGrid
        sectionId="voyage-ops-overview"
        className="grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4"
      >
        <DashboardWidget
          id="voyage-ops-overview-voyages"
          permission="stats.voyages"
        >
          <MetricCard
            icon={<Map size={22} className="text-teal-600 dark:text-teal-400" />}
            iconBg="bg-teal-50 dark:bg-teal-900/20"
            title="Voyages"
            value={metrics.voyageCount}
            path="/voyage"
            trend={metrics.voyageTrend}
            sparkline={metrics.voyageSparkline}
          />
        </DashboardWidget>

        <DashboardWidget
          id="voyage-ops-overview-noon"
          permission="stats.noon"
        >
          <MetricCard
            icon={<FileText size={22} className="text-teal-600 dark:text-teal-400" />}
            iconBg="bg-teal-50 dark:bg-teal-900/20"
            title="Daily Noon Reports"
            value={metrics.dailyNoon}
            path="/daily-noon-report"
            trend={metrics.noonTrend}
            sparkline={metrics.noonSparkline}
          />
        </DashboardWidget>

        <DashboardWidget
          id="voyage-ops-overview-departure"
          permission="stats.departure"
        >
          <MetricCard
            icon={<SquareArrowUpLeft size={22} className="text-teal-600 dark:text-teal-400" />}
            iconBg="bg-teal-50 dark:bg-teal-900/20"
            title="Departure Reports"
            value={metrics.departure}
            path="/departure-report"
            trend={metrics.departureTrend}
            sparkline={metrics.departureSparkline}
          />
        </DashboardWidget>

        <DashboardWidget
          id="voyage-ops-overview-arrival"
          permission="stats.arrival"
        >
          <MetricCard
            icon={<SquareArrowDownRight size={22} className="text-teal-600 dark:text-teal-400" />}
            iconBg="bg-teal-50 dark:bg-teal-900/20"
            title="Arrival Reports"
            value={metrics.arrival}
            path="/arrival-report"
            trend={metrics.arrivalTrend}
            sparkline={metrics.arrivalSparkline}
          />
        </DashboardWidget>

        <DashboardWidget
          id="voyage-ops-overview-nor"
          permission="stats.nor"
        >
          <MetricCard
            icon={<Flag size={22} className="text-teal-600 dark:text-teal-400" />}
            iconBg="bg-teal-50 dark:bg-teal-900/20"
            title="NOR Reports"
            value={metrics.nor}
            path="/nor"
            trend={metrics.norTrend}
            sparkline={metrics.norSparkline}
          />
        </DashboardWidget>

        <DashboardWidget
          id="voyage-ops-overview-cargo-stowage"
          permission="stats.cargo_stowage"
        >
          <MetricCard
            icon={<Boxes size={22} className="text-teal-600 dark:text-teal-400" />}
            iconBg="bg-teal-50 dark:bg-teal-900/20"
            title="Cargo Stowage Reports"
            value={metrics.cargoStowage}
            path="/cargo-stowage-cargo-documents"
            trend={metrics.stowageTrend}
            sparkline={metrics.stowageSparkline}
          />
        </DashboardWidget>

        <DashboardWidget
          id="voyage-ops-overview-cargo-docs"
          permission="stats.cargo_docs"
        >
          <MetricCard
            icon={<FileStack size={22} className="text-teal-600 dark:text-teal-400" />}
            iconBg="bg-teal-50 dark:bg-teal-900/20"
            title="Cargo Documents"
            value={metrics.cargoDocuments}
            path="/cargo-stowage-cargo-documents"
            trend={metrics.cargoDocTrend}
            sparkline={metrics.cargoDocSparkline}
          />
        </DashboardWidget>

        <DashboardWidget
          id="voyage-ops-overview-active-voyages"
          permission="stats.activevoyagestable"
          className="md:col-span-2 xl:col-span-4"
        >
          <ActiveVoyagesTable rows={data.activeVoyages} />
        </DashboardWidget>

        <DashboardWidget
          id="voyage-ops-overview-noon-reports-table"
          permission="stats.noonreportstable"
          className="md:col-span-1 xl:col-span-2"
        >
          <NoonReportsTable rows={data.noonReports} />
        </DashboardWidget>

        <DashboardWidget
          id="voyage-ops-overview-pre-arrivals"
          permission="stats.prearrivaltable"
          className="md:col-span-1 xl:col-span-2"
        >
          <PreArrivalTable rows={data.preArrivals} />
        </DashboardWidget>
      </DashboardWidgetGrid>
    </DashboardSection>
  );
}
