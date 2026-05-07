import React from "react";
import RecruitmentPipeline from "./RecruitmentPipeline";
import JobsOverview from "./JobsOverview";
import RecentApplications from "./RecentApplications";
import type { MetricsData } from "@/types/dashboard";
import DashboardSection from "./DashboardSection";
import DashboardWidgetGrid, { DashboardWidget } from "./DashboardWidgetGrid";
import { MetricCard } from "./MetricCard";
import { UserCheck } from "lucide-react";

interface RecruitmentOverviewProps {
  data: {
    funnel: React.ComponentProps<typeof RecruitmentPipeline>["data"];
    jobsOverview: React.ComponentProps<typeof JobsOverview>["data"];
    recentApplications: React.ComponentProps<typeof RecentApplications>["data"];
  };
  metrics: MetricsData;
}

export default function RecruitmentOverview({ data, metrics }: RecruitmentOverviewProps) {
  return (
    <DashboardSection
      sectionId="recruitment-overview"
      title="Recruitment Pipeline"
      permissions={[
        "stats.candidates",
        "stats.recruitmentpipeline",
        "stats.jobsoverview",
        "stats.recentapplications",
      ]}
    >
      <DashboardWidgetGrid
        sectionId="recruitment-overview"
        className="grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-4"
      >
        <DashboardWidget
          id="recruitment-overview-candidates"
          permission="stats.candidates"
        >
          <MetricCard
            icon={<UserCheck size={22} className="text-indigo-600 dark:text-indigo-400" />}
            iconBg="bg-indigo-50 dark:bg-indigo-900/20"
            title="Total Candidates"
            value={metrics.candidateCount}
            path="/onboarding"
            trend={metrics.candidateTrend}
            sparkline={metrics.candidateSparkline}
          />
        </DashboardWidget>

        <DashboardWidget
          id="recruitment-overview-pipeline"
          permission="stats.recruitmentpipeline"
          className="lg:col-span-1 xl:col-span-2"
        >
          <RecruitmentPipeline data={data.funnel} />
        </DashboardWidget>

        <DashboardWidget
          id="recruitment-overview-jobs"
          permission="stats.jobsoverview"
          className="lg:col-span-1 xl:col-span-2"
        >
          <JobsOverview data={data.jobsOverview} />
        </DashboardWidget>

        <DashboardWidget
          id="recruitment-overview-recent-applications"
          permission="stats.recentapplications"
          className="lg:col-span-2 xl:col-span-4"
        >
          <RecentApplications data={data.recentApplications} />
        </DashboardWidget>
      </DashboardWidgetGrid>
    </DashboardSection>
  );
}
