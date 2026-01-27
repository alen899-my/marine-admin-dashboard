"use client";

import ExportToExcel from "@/components/common/ExportToExcel";

// Define the mapping function here (Client Side)
const excelMapping = (r: any) => ({
  "Vessel Name":
    typeof r.vesselId === "object" && r.vesselId !== null
      ? r.vesselId.name
      : r.vesselName || "-",
  "Voyage No":
    typeof r.voyageId === "object" && r.voyageId !== null
      ? r.voyageId.voyageNo
      : r.voyageNo || "-",
  "Report Date": r.reportDate ? new Date(r.reportDate).toLocaleString() : "-",
  Status: r.status || "-",
  Latitude: r.position?.lat || "-",
  Longitude: r.position?.long || "-",
  "Dist Last 24h": r.navigation?.distLast24h ?? 0,
  "Engine Dist": r.navigation?.engineDist ?? 0,
  "Slip %": r.navigation?.slip ?? 0,
  "Next Port": r.navigation?.nextPort || "-",
  "VLSFO Consumed": r.consumption?.vlsfo ?? 0,
  "LSMGO Consumed": r.consumption?.lsmgo ?? 0,
  Wind: r.weather?.wind || "-",
  "Sea State": r.weather?.seaState || "-",
  Remarks: r.remarks || "-",
});

export default function DailyNoonExportWrapper({ data }: { data: any[] }) {
  return (
    <ExportToExcel
      data={data}
      fileName="Daily_Noon_Reports"
      exportMap={excelMapping} // Passing function from Client to Client is allowed
    />
  );
}