"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AddDailyNoonReportButton from "./AddDailyNoonReportButton";
import DailyNoonReportTable from "./DailyNoonReportTable";
import { useState } from "react";

export default function DailyNoonReport() {
  const [refresh, setRefresh] = useState(0);

  const handleRefresh = () => setRefresh((prev) => prev + 1);

  return (
    <div>
      <PageBreadcrumb pageTitle="Daily Noon Report" />

      <div className="space-y-6">
        {/* ✅ Pass the button to the 'action' prop */}
        <ComponentCard 
          title="Daily Noon Report Table" 
          action={<AddDailyNoonReportButton onSuccess={handleRefresh} />}
        >
          <DailyNoonReportTable refresh={refresh} />
        </ComponentCard>
      </div>
    </div>
  );
}