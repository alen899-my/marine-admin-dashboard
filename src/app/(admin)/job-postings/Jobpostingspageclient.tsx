"use client";

import { Check, Copy } from "lucide-react";
import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import TableCount from "@/components/common/TableCount";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { buildCompanyCareersPath } from "@/lib/careerLinks";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import AddJobButton from "./AddJob";
import JobPostingFilterWrapper from "./JobPostingFilterWrapper";

interface JobPostingsPageClientProps {
  children: ReactNode;
  totalCount: number;
  isSuperAdmin: boolean;
  userCompanyId?: string;
  selectedCompanyId?: string;
  companies: { value: string; label: string }[];
}

export default function JobPostingsPageClient({
  children,
  totalCount,
  isSuperAdmin,
  userCompanyId,
  selectedCompanyId,
  companies,
}: JobPostingsPageClientProps) {
  const { can, isReady } = useAuthorization();
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("job-postings");
  const [copiedLink, setCopiedLink] = useState(false);
  const [companyCareersPageEnabled, setCompanyCareersPageEnabled] = useState(true);
  const [loadingCompanySettings, setLoadingCompanySettings] = useState(false);

  const canView = can("jobs.view");
  const canAdd = can("jobs.create");
  const activeCompanyId = isSuperAdmin ? selectedCompanyId || "" : userCompanyId || "";

  const companyLink = useMemo(() => {
    if (!activeCompanyId) return "";

    if (typeof window === "undefined") return buildCompanyCareersPath(activeCompanyId);

    return `${window.location.origin}${buildCompanyCareersPath(activeCompanyId)}`;
  }, [activeCompanyId]);

  const companyName = useMemo(
    () => companies.find((company) => company.value === activeCompanyId)?.label || "",
    [activeCompanyId, companies],
  );

  useEffect(() => {
    setCopiedLink(false);
  }, [companyLink]);

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      if (!activeCompanyId) {
        setCompanyCareersPageEnabled(true);
        return;
      }

      setLoadingCompanySettings(true);
      try {
        const res = await fetch(`/api/settings?companyId=${activeCompanyId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load settings");
        }

        if (!cancelled) {
          setCompanyCareersPageEnabled(data.companyCareersPageEnabled ?? true);
        }
      } catch {
        if (!cancelled) {
          setCompanyCareersPageEnabled(true);
        }
      } finally {
        if (!cancelled) {
          setLoadingCompanySettings(false);
        }
      }
    };

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [activeCompanyId]);

  const handleCopyCompanyLink = async () => {
    if (!companyLink || !companyCareersPageEnabled) return;

    try {
      await navigator.clipboard.writeText(companyLink);
      setCopiedLink(true);
      toast.success("Career page link copied");
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (!isReady) return null;

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">
          You do not have permission to access Job Postings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Job Postings
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Publish and manage open positions shown on company and global careers pages.
          </p>
          {companyLink ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {companyName ? `${companyName} careers page` : "Company careers page"}
              </span>
              <div className="flex items-center gap-2 min-w-0">
                {loadingCompanySettings ? (
                  <span className="text-sm text-gray-400 dark:text-gray-500">
                    Loading link status...
                  </span>
                ) : companyCareersPageEnabled ? (
                  <a
                    href={companyLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-brand-600 dark:text-brand-400 hover:underline truncate"
                    title={companyLink}
                  >
                    {companyLink}
                  </a>
                ) : (
                  <span className="text-sm text-amber-600 dark:text-amber-400">
                    Public company careers link is disabled in Settings.
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleCopyCompanyLink}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-brand-600 dark:hover:text-brand-400"
                  title="Copy company careers link"
                  disabled={loadingCompanySettings || !companyCareersPageEnabled}
                >
                  {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          ) : isSuperAdmin ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select a company in the filter to view its public careers link.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Filter Toggle */}
          <div className="w-full flex justify-end sm:w-auto">
            <FilterToggleButton
              isVisible={isFilterVisible}
              onToggle={setIsFilterVisible}
            />
          </div>

          {canAdd && (
            <div className="w-full sm:w-auto">
              <AddJobButton
                className="w-full justify-center"
                isSuperAdmin={isSuperAdmin}
                userCompanyId={userCompanyId}
                companies={companies}
              />
            </div>
          )}
        </div>
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          isFilterVisible ? (
            <JobPostingFilterWrapper
              companies={companies}
              isSuperAdmin={isSuperAdmin}
            />
          ) : null
        }
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="jobs" />
        </div>
        {children}
      </ComponentCard>
    </div>
  );
}
