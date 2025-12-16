"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useState } from "react";
import AddDepartureReportButton from "./AddDepartureReportButton";
import DepartureReportTable from "./DepartureReportTable";

export default function DepartureReport() {
  const [refresh, setRefresh] = useState(0);

  const handleRefresh = () => setRefresh((prev) => prev + 1);

  return (
    <div>
      <PageBreadcrumb pageTitle="Departure Report" />

      <div className="space-y-6">
        <ComponentCard title="Departure Report Table" action={<AddDepartureReportButton onSuccess={handleRefresh} />}>
         
            
      

          <DepartureReportTable refresh={refresh} />
        </ComponentCard>
      </div>
    </div>
  );
}
