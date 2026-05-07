"use client";

import ComponentCard from "@/components/common/ComponentCard";
import ExportToExcel from "@/components/common/ExportToExcel";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import TableCount from "@/components/common/TableCount";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { ReactNode } from "react";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import JobFilterWrapper from "./JobFilterWrapper";
import Button from "@/components/ui/button/Button";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "";

const excelMapping = (r: any) => ({
  // ── Identity
  "First Name":          r.firstName || "-",
  "Last Name":           r.lastName || "-",
  "Rank":                r.rank || "-",
  "Applied For":         r.positionApplied || "-",

  // ── Company
  "Company":             r.companyName || "-",

  // ── Personal
  "Nationality":         r.nationality || "-",
  "Date of Birth":       r.dateOfBirth ? new Date(r.dateOfBirth).toLocaleDateString("en-IN") : "-",
  "Place of Birth":      r.placeOfBirth || "-",
  "Marital Status":      r.maritalStatus || "-",

  // ── Contact
  "Email":               r.email || "-",
  "Cell Phone":          r.cellPhone || "-",
 
  "Present Address":     r.presentAddress || "-",

  // ── Availability
  "Date of Availability": r.dateOfAvailability
    ? new Date(r.dateOfAvailability).toLocaleDateString("en-IN")
    : "-",
  "Availability Note":   r.availabilityNote || "-",

  // ── Physical
  "Weight (kg)":         r.weightKg ?? "-",
  "Height (cm)":         r.heightCm ?? "-",
  "Coverall Size":       r.coverallSize || "-",
  "Shoe Size":           r.shoeSize || "-",


 

  "Resume":  r._id
    ? `${BASE_URL}/jobs/resume/${r._id}`
    : "No Attachment",
});
interface JobPageClientProps {
  children: ReactNode;
  data: any[];
  totalCount: number;
  companies: { id: string; name: string }[];
  jobs: { value: string; label: string }[];
  isSuperAdmin: boolean;
  canAdd: boolean;
  currentCompanyId: string;
  portalCompanyId: string;
}

export default function JobPageClient({
  children,
  data,
  totalCount,
  companies,
  jobs,
  isSuperAdmin,
  canAdd,
  currentCompanyId,
  portalCompanyId,
}: JobPageClientProps) {
  const router = useRouter();
  const { can, isReady } = useAuthorization();
  const canView = can("candidates.view");
  const canCreate = can("candidates.create") || canAdd;
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("jobs");

  if (!isReady) return null;

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">
          You do not have permission to access Candidate Management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Candidate Applications
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review, filter, export, and progress candidate applications through recruitment stages.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="w-full flex justify-end sm:w-auto">
            <FilterToggleButton
              isVisible={isFilterVisible}
              onToggle={setIsFilterVisible}
            />
          </div>

          <div className="w-full sm:w-auto">
            <ExportToExcel
              data={data}
              fileName="Candidate_Applications_Report"
              exportMap={excelMapping}
              className="w-full justify-center"
            />
          </div>

          {canCreate && (
            <div className="w-full sm:w-auto">
              <Button
                onClick={() => router.push("/jobs/apply")}
                variant="primary"
                size="sm"
                className="w-full sm:w-auto justify-center"
                startIcon={<Plus size={18} />}
              >
                New Candidate
              </Button>
            </div>
          )}
        </div>
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          isFilterVisible ? (
            <JobFilterWrapper
              companies={companies}
              jobs={jobs}
              isSuperAdmin={isSuperAdmin}
            />
          ) : null
        }
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="Applications" />
        </div>
        {children}
      </ComponentCard>
    </div>
  );
}
