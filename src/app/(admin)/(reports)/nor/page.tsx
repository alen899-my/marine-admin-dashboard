"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AddNORButton from "./AddNORButton";
import NorReportTable from "./NorReportTable";
import { useState } from "react";

export default function NoticeOfReadiness() {
  const [refresh, setRefresh] = useState(0);

  const handleRefresh = () => setRefresh((prev) => prev + 1);

  return (
    <div>
      <PageBreadcrumb pageTitle="NOR" />

      <div className="space-y-6">
        <ComponentCard title="NOR Table" action={<AddNORButton onSuccess={handleRefresh}/>}>
         

          <NorReportTable refresh={refresh}/>
        </ComponentCard>
      </div>
    </div>
  );
}
