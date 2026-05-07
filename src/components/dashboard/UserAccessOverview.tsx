import React from "react";
import UserStatusDonut from "./UserStatusDonut";
import RoleDistributionChart from "./RoleDistributionChart";
import RecentLoginTable from "./RecentLoginTable";
import type { UserAccessData } from "@/lib/services/user-access";
import type { MetricsData } from "@/types/dashboard";
import DashboardSection from "./DashboardSection";
import DashboardWidgetGrid, { DashboardWidget } from "./DashboardWidgetGrid";
import { MetricCard } from "./MetricCard";
import { Building2, Users2 } from "lucide-react";

interface UserAccessOverviewProps {
  data: UserAccessData;
  metrics: MetricsData;
}

export default function UserAccessOverview({ data, metrics }: UserAccessOverviewProps) {
  return (
    <DashboardSection
      sectionId="user-access-overview"
      title="User & Access Overview"
      permissions={[
        "stats.users",
        "stats.companies",
        "stats.userstatus",
        "stats.roledistribution",
        "stats.recentlogins",
      ]}
    >
      <DashboardWidgetGrid
        sectionId="user-access-overview"
        className="grid-cols-1 gap-4 md:gap-6 lg:grid-cols-4"
      >
        <DashboardWidget
          id="user-access-overview-users"
          permission="stats.users"
        >
          <MetricCard
            icon={<Users2 size={22} className="text-slate-600 dark:text-slate-400" />}
            iconBg="bg-slate-50 dark:bg-slate-900/20"
            title="Users"
            value={metrics.userCount}
            path="/manage-users"
            trend={metrics.userTrend}
            sparkline={metrics.userSparkline}
          />
        </DashboardWidget>

        <DashboardWidget
          id="user-access-overview-companies"
          permission="stats.companies"
        >
          <MetricCard
            icon={<Building2 size={22} className="text-slate-600 dark:text-slate-400" />}
            iconBg="bg-slate-50 dark:bg-slate-900/20"
            title="Companies"
            value={metrics.companyCount}
            path="/manage-companies"
            trend={metrics.companyTrend}
            sparkline={metrics.companySparkline}
          />
        </DashboardWidget>

        <DashboardWidget
          id="user-access-overview-user-status"
          permission="stats.userstatus"
          className="lg:col-span-1"
        >
          <UserStatusDonut data={data.statusDistribution} />
        </DashboardWidget>

        <DashboardWidget
          id="user-access-overview-role-distribution"
          permission="stats.roledistribution"
          className="lg:col-span-3"
        >
          <RoleDistributionChart data={data.roleDistribution} />
        </DashboardWidget>

        <DashboardWidget
          id="user-access-overview-recent-logins"
          permission="stats.recentlogins"
          className="lg:col-span-4"
        >
          <RecentLoginTable rows={data.recentLogins} />
        </DashboardWidget>
      </DashboardWidgetGrid>
    </DashboardSection>
  );
}
