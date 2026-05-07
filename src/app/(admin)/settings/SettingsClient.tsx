"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { ChevronRight } from "lucide-react";
import Switch from "@/components/form/switch/Switch";
import Select from "@/components/form/Select";
import SearchableSelect from "@/components/form/SearchableSelect";
import SettingItem from "@/components/common/SettingItem";
import { Settings, formatCurrency } from "@/lib/payrollVerificationAccess";
import { setCurrencySettings } from "@/lib/currencySettings";

interface SettingsClientProps {
  initialSettings: Settings;
  globalSettings?: Settings;
  isSuperAdmin?: boolean;
  companies?: { value: string; label: string }[];
  userCompanyId?: string;
  defaultCompanyId?: string;
}

type SettingsTab = "payroll" | "career" | "currency";

export default function SettingsClient({
  initialSettings,
  globalSettings,
  isSuperAdmin = false,
  companies = [],
  userCompanyId,
  defaultCompanyId,
}: SettingsClientProps) {
  // Initialize global currency settings on mount
  useEffect(() => {
    setCurrencySettings({
      currencySymbol: initialSettings.currencySymbol,
      currencyCode: initialSettings.currencyCode,
      currencyPosition: initialSettings.currencyPosition,
      currencyFormatType: initialSettings.currencyFormatType,
      currencySpace: initialSettings.currencySpace,
    });
  }, []);
  const [activeTab, setActiveTab] = useState<SettingsTab>("payroll");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    defaultCompanyId || userCompanyId || "",
  );
  const [captainOnly, setCaptainOnly] = useState(
    initialSettings.captainOnlyVerification,
  );
  const [showOnGlobalCareersPage, setShowOnGlobalCareersPage] = useState(
    initialSettings.showOnGlobalCareersPage ?? true,
  );
  const [publicCareersPageEnabled, setPublicCareersPageEnabled] = useState(
    globalSettings?.publicCareersPageEnabled ?? true,
  );
  const [companyCareersPageEnabled, setCompanyCareersPageEnabled] = useState(
    initialSettings.companyCareersPageEnabled ?? true,
  );
  const [currencyPosition, setCurrencyPosition] = useState<"left" | "right">(
    initialSettings.currencyPosition || "left",
  );
  const [currencyFormatType, setCurrencyFormatType] = useState<
    "symbol" | "code"
  >(initialSettings.currencyFormatType || "symbol");
  const [currencySpace, setCurrencySpace] = useState(
    initialSettings.currencySpace ?? true,
  );
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);

  const handleCompanyChange = async (companyId: string) => {
    setSelectedCompanyId(companyId);
    setLoadingSettings(true);
    try {
      const queryParams = `?companyId=${companyId}`;
      const res = await fetch(`/api/settings${queryParams}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load settings");

      setCaptainOnly(data.captainOnlyVerification);
      setShowOnGlobalCareersPage(data.showOnGlobalCareersPage ?? true);
      setCompanyCareersPageEnabled(data.companyCareersPageEnabled ?? true);
      setCurrencyPosition(data.currencyPosition);
      setCurrencyFormatType(data.currencyFormatType || "symbol");
      setCurrencySpace(data.currencySpace ?? true);
      // Update global currency settings
      setCurrencySettings({
        currencySymbol: data.currencySymbol,
        currencyCode: data.currencyCode,
        currencyPosition: data.currencyPosition,
        currencyFormatType: data.currencyFormatType || "symbol",
        currencySpace: data.currencySpace ?? true,
      });
      toast.success("Loaded settings for selected company");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load settings",
      );
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleCareerVisibilityToggle = async (value: boolean) => {
    setShowOnGlobalCareersPage(value);
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          showOnGlobalCareersPage: value,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save");
      setShowOnGlobalCareersPage(data.showOnGlobalCareersPage ?? true);
      toast.success("Career settings updated");
    } catch (error: unknown) {
      setShowOnGlobalCareersPage(!value);
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePublicCareersPageToggle = async (value: boolean) => {
    setPublicCareersPageEnabled(value);
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicCareersPageEnabled: value,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save");
      setPublicCareersPageEnabled(data.publicCareersPageEnabled ?? true);
      toast.success("Public careers page setting updated");
    } catch (error: unknown) {
      setPublicCareersPageEnabled(!value);
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleCompanyCareersPageToggle = async (value: boolean) => {
    setCompanyCareersPageEnabled(value);
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          companyCareersPageEnabled: value,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save");
      setCompanyCareersPageEnabled(data.companyCareersPageEnabled ?? true);
      toast.success("Career settings updated");
    } catch (error: unknown) {
      setCompanyCareersPageEnabled(!value);
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePayrollToggle = async (value: boolean) => {
    setCaptainOnly(value);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        companyId: selectedCompanyId,
        captainOnlyVerification: value,
      };

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save");
      setCaptainOnly(data.captainOnlyVerification);
      toast.success("Settings updated");
    } catch (error: unknown) {
      setCaptainOnly(!value);
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleCurrencyChange = async (
    field: "currencyPosition" | "currencyFormatType" | "currencySpace",
    value: string | boolean,
  ) => {
    const newCurrencyPosition =
      field === "currencyPosition"
        ? (value as "left" | "right")
        : currencyPosition;
    const newCurrencyFormatType =
      field === "currencyFormatType"
        ? (value as "symbol" | "code")
        : currencyFormatType;
    const newCurrencySpace =
      field === "currencySpace" ? (value as boolean) : currencySpace;

    if (field === "currencyPosition") {
      setCurrencyPosition(value as "left" | "right");
    } else if (field === "currencyFormatType") {
      setCurrencyFormatType(value as "symbol" | "code");
    } else if (field === "currencySpace") {
      setCurrencySpace(value as boolean);
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        companyId: selectedCompanyId,
        currencyPosition: newCurrencyPosition,
        currencyFormatType: newCurrencyFormatType,
        currencySpace: newCurrencySpace,
      };

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save");
      setCurrencyPosition(data.currencyPosition);
      setCurrencyFormatType(data.currencyFormatType || "symbol");
      // Update global currency settings
      setCurrencySettings({
        currencyPosition: data.currencyPosition,
        currencyFormatType: data.currencyFormatType || "symbol",
        currencySpace: data.currencySpace ?? true,
      });
      toast.success("Currency settings updated");
    } catch (error: unknown) {
      if (field === "currencyPosition") {
        setCurrencyPosition(currencyPosition);
      } else if (field === "currencyFormatType") {
        setCurrencyFormatType(currencyFormatType);
      } else if (field === "currencySpace") {
        setCurrencySpace(currencySpace);
      }
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const menuItems: {
    id: SettingsTab;
    label: string;
    icon?: React.ReactNode;
  }[] = [
    { id: "payroll", label: "Payroll" },
    { id: "career", label: "Career" },
    { id: "currency", label: "Currency" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
            Settings
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage company-specific configurations and settings.
          </p>
        </div>
      </div>

      {/* Company Selector for Super Admin */}
      {isSuperAdmin && (
        <div className="">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Company for Settings
          </label>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="w-full sm:w-80">
              <SearchableSelect
                options={companies}
                placeholder="Select company..."
                value={selectedCompanyId}
                onChange={handleCompanyChange}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8 py-4">
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-full md:w-70 shrink-0">
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-hide">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
                    ${
                      isActive
                        ? "bg-brand-600 text-white"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/5"
                    }
                  `}
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                  {isActive && (
                    <ChevronRight
                      size={14}
                      className="ml-auto hidden md:block opacity-60"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-1 w-full max-w-3xl">
          {loadingSettings ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          ) : (
            <>
              {activeTab === "payroll" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-2">
                    Payroll Settings
                  </h3>

                  <SettingItem
                    title="Captain-Only Verification"
                    description="When enabled, only users with the Captain role can perform payroll verification. If disabled, other authorized personnel can also verify payroll."
                  >
                    <Switch
                      key={`captain-only-${captainOnly}`}
                      label=""
                      defaultChecked={captainOnly}
                      onChange={handlePayrollToggle}
                      disabled={saving}
                    />
                  </SettingItem>
                </div>
              )}

              {activeTab === "currency" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-2">
                    Currency Settings
                  </h3>

                  <SettingItem
                    title="Currency Space"
                    description="Add space between currency symbol/code and amount"
                  >
                    <Switch
                      key={`currency-space-${currencySpace}`}
                      label=""
                      defaultChecked={currencySpace}
                      onChange={(value) =>
                        handleCurrencyChange("currencySpace", value)
                      }
                      disabled={saving}
                    />
                  </SettingItem>

                  <SettingItem
                    title="Currency Position"
                    description="Choose whether the currency symbol/code appears before or after the amount"
                  >
                    <Select
                      value={currencyPosition}
                      onChange={(value) =>
                        handleCurrencyChange("currencyPosition", value)
                      }
                      disabled={saving}
                      options={[
                        { value: "left", label: "Left ($100)" },
                        { value: "right", label: "Right (100$)" },
                      ]}
                    />
                  </SettingItem>

                  <SettingItem
                    title="Currency Format Type"
                    description="Choose between currency symbol ($) or currency code (USD)"
                  >
                    <Select
                      value={currencyFormatType}
                      onChange={(value) =>
                        handleCurrencyChange("currencyFormatType", value)
                      }
                      disabled={saving}
                      options={[
                        { value: "symbol", label: "Symbol" },
                        { value: "code", label: "Code" },
                      ]}
                    />
                  </SettingItem>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Preview:
                    </p>
                    <div className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <span className="text-lg font-semibold text-gray-800 dark:text-white">
                        {formatCurrency(
                          1234.56,
                          initialSettings.currencySymbol,
                          initialSettings.currencyCode,
                          currencyPosition,
                          currencyFormatType,
                          currencySpace,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "career" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-2">
                    Career Settings
                  </h3>

                  {isSuperAdmin && (
                    <SettingItem
                      title="Enable Main Public Careers Page"
                      description="Controls the root public `/careers` page for the whole system. When disabled, `/careers` returns the standard 404 page, while company-specific careers pages remain available."
                    >
                      <Switch
                        key={`public-careers-page-enabled-${publicCareersPageEnabled}`}
                        label=""
                        defaultChecked={publicCareersPageEnabled}
                        onChange={handlePublicCareersPageToggle}
                        disabled={saving}
                      />
                    </SettingItem>
                  )}

                  <SettingItem
                    title="Enable Company Careers Link"
                    description="Controls this company&apos;s public careers page. When disabled, the company-specific careers page and job detail links return the standard 404 page and cannot be accessed publicly."
                  >
                    <Switch
                      key={`company-careers-page-enabled-${companyCareersPageEnabled}`}
                      label=""
                      defaultChecked={companyCareersPageEnabled}
                      onChange={handleCompanyCareersPageToggle}
                      disabled={saving}
                    />
                  </SettingItem>

                  <SettingItem
                    title="Show Jobs On Parkora Careers Page"
                    description="When enabled, this company&apos;s jobs appear on the Parkora `/careers` page. When disabled, they stay available only through the company-specific careers link."
                  >
                    <Switch
                      key={`global-careers-visibility-${showOnGlobalCareersPage}`}
                      label=""
                      defaultChecked={showOnGlobalCareersPage}
                      onChange={handleCareerVisibilityToggle}
                      disabled={saving}
                    />
                  </SettingItem>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
