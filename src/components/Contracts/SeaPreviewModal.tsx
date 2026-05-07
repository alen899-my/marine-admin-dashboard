"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import SeaDocumentPreview, {
  buildPrintHtml,
} from "@/components/templates/Seadocumentpreview";
import Button from "@/components/ui/button/Button";
import { Download, Loader2 } from "lucide-react";
import { buildTokenValuesFromData } from "@/lib/seaPlaceholders";
import { Modal } from "@/components/ui/modal";
import { useSidebarNotifications } from "@/context/SidebarNotificationContext";
import Select from "@/components/form/Select";

// Helper to convert relative URL to full URL
const getFullUrl = (path?: string) => {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${typeof window !== "undefined" ? window.location.origin : ""}${path}`;
};

interface Application {
  _id: string;
  firstName: string;
  lastName: string;
  rank?: string;
  cellPhone?: string;
  email?: string;
  nationality?: string;
  company?: string;
  contractRaw?: any;
  [key: string]: any;
}

interface SeaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onMarkAsSent?: () => void;
  currencySettings?: {
    currencyCode?: string;
    currencyPosition?: "left" | "right";
    currencyFormatType?: "symbol" | "code";
    currencySpace?: boolean;
  };
}

function buildTokenValues(
  application: Application | null,
  companyData: any,
  currencySettings?: {
    currencyCode?: string;
    currencyPosition?: "left" | "right";
    currencyFormatType?: "symbol" | "code";
    currencySpace?: boolean;
  },
): Record<string, string> {
  if (!application) return {};

  const raw = application.contractRaw || {};
  const wages = raw.wages || {};

  // Ensure company has the currency code — prefer currencySettings.currencyCode
  // (fetched from getSettings via API), then fall back to company.currency from populate
  const effectiveCompany = {
    ...companyData,
    currency: currencySettings?.currencyCode || companyData?.currency || "",
  };

  const candidateData = {
    ...application,
    cdcNo: raw.cdcNo,
    indosNo: raw.indosNo,
    passportNo: raw.passportNo,
    passportExp: raw.passportExp,
  };

  const vesselData = raw.vesselId || {
    name: raw.vesselName,
    imo: raw.vesselImo,
    flag: raw.vesselFlag,
  };

  const contractData = {
    portOfJoining: raw.portOfJoining,
    commencement: raw.commencement,
    signDate: raw.signDate,
    contractPeriod: raw.contractPeriod,
    signPlace: raw.signPlace,
    referenceNo: raw.referenceNo,
  };

  const wagesData = {
    basic: wages.basic,
    fixedOvertime: wages.fixedOvertime,
    leaveWages: wages.leaveWages,
    otherAllowance: wages.otherAllowance,
    allowances: wages.allowances,
    deductions: wages.deductions,
  };

  return buildTokenValuesFromData({
    candidate: candidateData,
    vessel: vesselData,
    contract: contractData,
    wages: wagesData,
    company: effectiveCompany,
    currencySettings,
  });
}

export default function SeaPreviewModal({
  isOpen,
  onClose,
  application,
  onMarkAsSent,
  currencySettings,
}: SeaPreviewModalProps) {
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [markingSent, setMarkingSent] = useState(false);
  const [templateOptions, setTemplateOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const { refreshCounts } = useSidebarNotifications();

  const capturedHtmlRef = useRef<string | null>(null);
  const onHtmlReady = useCallback((html: string) => {
    capturedHtmlRef.current = html;
  }, []);

  const handleMarkAsSent = async (action: "sent" | "unsent" = "sent") => {
    if (!application?._id || markingSent) return;

    setMarkingSent(true);
    try {
      const res = await fetch("/api/contracts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: application._id,
          action,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      await refreshCounts();
      if (onMarkAsSent) onMarkAsSent();
      onClose();
    } catch (err: any) {
      console.error("Status update failed:", err);
      alert(err.message || "Failed to update status");
    } finally {
      setMarkingSent(false);
    }
  };

  const handleUnsent = () => handleMarkAsSent("unsent");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !application) return;

    const companyId = application.company;
    if (!companyId) {
      setError("No company ID found for this contract.");
      return;
    }

    let cancelled = false;
    setLoadingTemplates(true);
    setLoading(true);
    setTemplateOptions([]);
    setSelectedTemplateId("");
    setError(null);
    setTemplate(null);

    fetch(`/api/sea-templates?companyId=${companyId}&status=active`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.success) {
          throw new Error(json.error || "Failed to load SEA templates.");
        }

        const options = (json.data || []).map((item: { _id: string; name: string; isDefault?: boolean }) => ({
          value: item._id,
          label: item.isDefault ? `${item.name} (Default)` : item.name,
        }));

        setTemplateOptions(options);
        if (options.length > 0) {
          setSelectedTemplateId(options[0].value);
        } else {
          setLoading(false);
          setError("No active SEA template found for this company.");
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoading(false);
          setError(err instanceof Error ? err.message : "Network error loading templates.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTemplates(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, application]);

  useEffect(() => {
    if (!isOpen || !selectedTemplateId) return;

    let cancelled = false;
    capturedHtmlRef.current = null;
    setLoading(true);
    setError(null);
    setTemplate(null);

    fetch(`/api/sea-templates/${selectedTemplateId}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success) {
          setTemplate(json.data);
        } else {
          setError(json.error || "Failed to load SEA template.");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Network error loading template.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedTemplateId]);

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !isMounted) return null;

  const sections = (template?.sections || []).map((s: any) => {
    let cols = s.columns || [];

    // Dynamically inject user-defined allowances into the Wage Table if it exists
    if (s.type === "wage_table") {
      const dynamicAllowances =
        application?.contractRaw?.wages?.allowances || [];
      const hasDynamic = dynamicAllowances.length > 0;

      if (hasDynamic) {
        // Filter out legacy hardcoded allowance columns that are now replaced by dynamic ones
        const legacyKeys = [
          "[WAGES.TWA]",
          "[WAGES.MOA]",
          "[WAGES.COMPETENCY]",
        ];
        cols = cols.filter((c: any) => !legacyKeys.includes(c.key));

        const customCols = dynamicAllowances.map((a: any) => ({
          key: `[WAGES.${a.label.toUpperCase().replace(/[^A-Z0-9]/g, "_")}]`,
          label: a.label,
        }));

        if (customCols.length > 0) {
          // Try to insert them just before the TOTAL column
          const totalIdx = cols.findIndex(
            (c: any) => c.key === "[WAGES.TOTAL]",
          );
          if (totalIdx !== -1) {
            cols = [
              ...cols.slice(0, totalIdx),
              ...customCols,
              ...cols.slice(totalIdx),
            ];
          } else {
            cols = [...cols, ...customCols];
          }
        }
      }
    }

    return {
      id: s._id?.toString() || String(s.order),
      key: s._id?.toString() || String(s.order),
      title: s.title || "",
      label: s.title || "",
      type: s.type || "richtext",
      content: s.content || "",
      enabled: s.enabled !== false,
      order: s.order ?? 0,
      columns: cols,
    };
  });

  // Merge currencySettings: template API provides currencyCode + format prefs;
  // fall back to the prop passed from ContractTable (company-level settings)
  const mergedCurrencySettings = {
    ...currencySettings,
    ...template?.currencySettings,
  };

  const tokenValues = buildTokenValues(
    application,
    template?.company,
    mergedCurrencySettings,
  );

  const buildFallbackHtml = (): string => {
    if (!template) return "";
    const SPECIAL_TYPES = new Set([
      "seafarer_table",
      "vessel_table",
      "wage_table",
      "disability_table",
      "signature_block",
      "manning_agent",
      "owner_manager",
    ]);
    const sortedSections = [...sections]
      .sort((a: any, b: any) => a.order - b.order)
      .filter((s: any) => s.enabled);

    const allBlocks: any[] = sortedSections.flatMap((s: any) => {
      if (SPECIAL_TYPES.has(s.type)) {
        return [
          {
            sectionId: s.id,
            sectionTitle: s.title,
            isFirstBlockOfSection: true,
            type: s.type,
            section: s,
          },
        ];
      }
      return [
        {
          sectionId: s.id,
          sectionTitle: s.title,
          isFirstBlockOfSection: true,
          type: "richtext",
          html: s.content || "",
          section: s,
        },
      ];
    });

    return buildPrintHtml({
      pages: [],
      allBlocks,
      tokenValues,
      companyName: template.company?.name || "",
      logoUrl: getFullUrl(template.logoUrl),
      letterheadBgUrl: getFullUrl(template.letterheadBgUrl),
      headerAddress: template.headerAddress,
      footerText: template.footerText,
      primaryColor: template.primaryColor || "#1e40af",
      mainHeading: template.mainHeading,
      subHeading: template.subHeading,
      footerBgColor: template.footerBgColor,
      footerTextColor: template.footerTextColor || "#000000",
    });
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const html = capturedHtmlRef.current ?? buildFallbackHtml();
      const candidateName = application
        ? `${application.firstName}_${application.lastName}`.replace(
            /\s+/g,
            "_",
          )
        : "SEA";

      const res = await fetch("/api/generate-pdf/sea-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, filename: `SEA_${candidateName}` }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Server PDF generation failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SEA_${candidateName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("PDF download failed:", err);
      alert(`Failed to generate PDF: ${err?.message || "Please try again."}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[1020px] p-5 sm:p-7"
    >
      {/* Header */}
      <div className="mb-5 pr-8">
        <h4 className="text-lg font-bold text-gray-800 dark:text-white">
          Contract Preview
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {application
            ? `${application.firstName} ${application.lastName}${application.rank ? ` · ${application.rank}` : ""}`
            : "—"}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 p-3 mb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
       
          <div className="w-full sm:w-72">
            <Select
              label="SEA Template"
              options={templateOptions}
              placeholder={
                loadingTemplates ? "Loading templates..." : "Choose SEA template"
              }
              value={selectedTemplateId}
              onChange={setSelectedTemplateId}
              disabled={loadingTemplates || templateOptions.length === 0}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={handleDownloadPDF}
            disabled={downloading || loading || !template}
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {downloading ? "Generating…" : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[794px] font-['Times_New_Roman',serif] text-[13.5px] leading-[1.7] text-[#111] max-h-[60vh] overflow-y-auto bg-gray-200 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-8 sm:p-12 shadow-inner custom-scrollbar relative">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              <span className="ml-3 text-gray-500 text-sm font-sans">
                Loading template…
              </span>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 text-center font-sans">
              <div className="text-red-500 font-medium mb-2">
                Could not load SEA template
              </div>
              <div className="text-gray-500 text-sm">{error}</div>
            </div>
          )}

          {!loading && !error && template && (
            <div id="sea-pages-root">
              <SeaDocumentPreview
                sections={sections}
                logoUrl={getFullUrl(template.logoUrl)}
                letterheadBgUrl={getFullUrl(template.letterheadBgUrl)}
                headerAddress={template.headerAddress}
                footerText={template.footerText}
                footerBgColor={template.footerBgColor}
                footerTextColor={template.footerTextColor || "#000000"}
                primaryColor={template.primaryColor || "#1e40af"}
                companyName={template.company?.name}
                tokenValues={tokenValues}
                modal={false}
                showBrackets={false}
                onHtmlReady={onHtmlReady}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end border-t border-gray-100 dark:border-white/10 mt-6 pt-5">
        <div className="flex items-center gap-3">
          {application?.status === "offer_sea_issued" ? (
            <Button
              variant="outline"
              onClick={handleUnsent}
              disabled={markingSent}
            >
              {markingSent ? "Updating..." : "Mark as Unsend "}
            </Button>
          ) : (application?.contractRaw?.contractStatus === "generated" ||
            application?.contractStatus === "generated") ? (
            <Button
              variant="outline"
              onClick={() => handleMarkAsSent("sent")}
              disabled={markingSent}
            >
              {markingSent ? "Marking..." : "Mark as Sent"}
            </Button>
          ) : null}
          <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </Modal>
  );
}
