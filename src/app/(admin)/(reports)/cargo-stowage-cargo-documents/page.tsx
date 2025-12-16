"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CargoReportTable from "./CargoReportTable";
// Removed unused 'Metadata' import
import AddCragoButton from "./AddCragoButton";
import { useState } from "react";

export default function CragoStowageCargoDocuments() {
  const [refresh, setRefresh] = useState(0);

  const handleRefresh = () => setRefresh((prev) => prev + 1);
  return (
    <div>
      <PageBreadcrumb pageTitle="Cargo Stowage & Cargo Documents" />

      <div className="space-y-6">
        <ComponentCard
          title="Cargo Stowage & Cargo Documents Table"
          action={<AddCragoButton onSuccess={handleRefresh} />}
        >
          <CargoReportTable refresh={refresh} />
        </ComponentCard>
      </div>
    </div>
  );
}