import React from "react";
import WageByRankChart from "./WageByRankChart";
import SalaryHeadsTable from "./SalaryHeadsTable";
import type { SalaryInsightsData } from "@/lib/services/salary-insights";
import DashboardSection from "./DashboardSection";
import DashboardWidgetGrid, { DashboardWidget } from "./DashboardWidgetGrid";

interface CurrencySettings {
  currencySymbol: string;
  currencyCode: string;
  currencyPosition: "left" | "right";
  currencyFormatType: "symbol" | "code";
  currencySpace: boolean;
}

interface SalaryInsightsOverviewProps {
  data: SalaryInsightsData;
  currencySettings?: CurrencySettings;
}

const defaultCurrencySettings: CurrencySettings = {
  currencySymbol: "$",
  currencyCode: "USD",
  currencyPosition: "left",
  currencyFormatType: "symbol",
  currencySpace: true,
};

export default function SalaryInsightsOverview({ data, currencySettings = defaultCurrencySettings }: SalaryInsightsOverviewProps) {
  return (
    <DashboardSection
      sectionId="salary-insights-overview"
      title="Salary & Wage Insights"
      permissions={["stats.wagebyrank", "stats.salaryheads"]}
    >
      <DashboardWidgetGrid
        sectionId="salary-insights-overview"
        className="grid-cols-1 lg:grid-cols-2"
      >
        <DashboardWidget
          id="salary-insights-overview-wage-by-rank"
          permission="stats.wagebyrank"
        >
          <WageByRankChart data={data.wageByRank} currencySettings={currencySettings} />
        </DashboardWidget>

        <DashboardWidget
          id="salary-insights-overview-salary-heads"
          permission="stats.salaryheads"
        >
          <SalaryHeadsTable rows={data.salaryHeads} currencySettings={currencySettings} />
        </DashboardWidget>
      </DashboardWidgetGrid>
    </DashboardSection>
  );
}
