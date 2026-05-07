"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, FileText } from "lucide-react";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import SeaTemplateTable from "@/components/templates/Seatemplatetable";
import TableCount from "@/components/common/TableCount";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import SeaTemplateFilters, { SeaTemplateFilterData } from "@/components/templates/SeaTemplateFilters";

interface SeaTemplatesPageClientProps {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isSuperAdmin: boolean;
  companies?: { value: string; label: string }[];
}

export default function SeaTemplatesPageClient({
  data,
  pagination,
  isSuperAdmin,
  companies = [],
}: SeaTemplatesPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can, isReady } = useAuthorization();
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("sea-templates");

  const handleApplyFilters = (filters: SeaTemplateFilterData) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (filters.search) {
      params.set("search", filters.search);
    } else {
      params.delete("search");
    }
    
    if (filters.status && filters.status !== "all") {
      params.set("status", filters.status);
    } else {
      params.delete("status");
    }
    
    if (filters.companyId) {
      params.set("companyId", filters.companyId);
    } else {
      params.delete("companyId");
    }
    
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  if (!isReady) return null;

  if (!can("templates.view")) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">
          You do not have permission to access SEA Templates.
        </p>
      </div>
    );
  }

  const canAdd = can("templates.create");

  return (
    <div className="space-y-6">
      {/* Header section with modern theme */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white/90">
              SEA Templates
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Configure and manage Seafarer Employment Agreement document templates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Toggle */}
          <FilterToggleButton
            isVisible={isFilterVisible}
            onToggle={setIsFilterVisible}
          />
          
          {canAdd && (
            <Button
              onClick={() => router.push("/sea-templates/new")}
              variant="primary"
              size="sm"
              className="shadow-theme-xs"
              startIcon={<Plus size={18} />}
            >
              New Template
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          isFilterVisible ? (
            <SeaTemplateFilters
              search={searchParams.get("search") || ""}
              status={searchParams.get("status") || "all"}
              companyId={searchParams.get("companyId") || ""}
              companies={companies}
              isSuperAdmin={isSuperAdmin}
              onApply={handleApplyFilters}
            />
          ) : null
        }
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={pagination?.total || data.length} label="Templates" />
        </div>
        
        <SeaTemplateTable 
          data={data} 
          pagination={pagination}
          isSuperAdmin={isSuperAdmin} 
        />
      </ComponentCard>
    </div>
  );
}