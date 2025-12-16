"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useState } from "react";
import AddArrivalReportButton from "./AddArrivalReportButton";
import ArrivalReportTable from "./ArrivalReportTable";

export default function ArrivalReport() {
  const [refresh, setRefresh] = useState(0);

  const handleRefresh = () => setRefresh((prev) => prev + 1);

  return (
    <div>
      <PageBreadcrumb pageTitle="Arrival Report" />

      <div className="space-y-6">
        <ComponentCard
          title="Arrival Report Table"
          action={<AddArrivalReportButton onSuccess={handleRefresh} />}
        >
          <ArrivalReportTable refresh={refresh} />
        </ComponentCard>
      </div>
    </div>
  );
}
