"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Input from "@/components/form/input/InputField";
import FileInput from "@/components/form/input/FileInput";
import SearchableSelect from "@/components/form/SearchableSelect";
import Select from "@/components/form/Select";
import Checkbox from "@/components/form/input/Checkbox";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import type { PlaceholderCard } from "@/lib/seaPlaceholders";
import SeaDocumentPreview from "./Seadocumentpreview";
import { SectionBuilder, type Section, type PlaceholderCategory } from "@/components/ui/section";
import Button from "@/components/ui/button/Button";
import { useAuthorization } from "@/hooks/useAuthorization";
import { Card } from "@/components/ui/card";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { FormField } from "@/components/ui/form";
import RichTextEditor from "@/components/form/RichTextEditor";
import {
  Settings,
  FileText,
  Image,
  Save,
  X,
  Plus,
  Layout,
  User,
  Anchor,
  FileSignature,
  DollarSign,
  Building2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// ICON MAP
// ─────────────────────────────────────────────────────────────────
const LUCIDE_ICON_MAP: Record<string, React.ReactNode> = {
  User:          <User className="w-3.5 h-3.5" />,
  Anchor:        <Anchor className="w-3.5 h-3.5" />,
  FileSignature: <FileSignature className="w-3.5 h-3.5" />,
  DollarSign:    <DollarSign className="w-3.5 h-3.5" />,
  Building2:     <Building2 className="w-3.5 h-3.5" />,
};

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────
interface CompanyOption { value: string; label: string; logo?: string; }
interface TemplateSectionInput {
  key?: string;
  title?: string;
  content?: string;
  enabled?: boolean;
  order?: number;
  type?: string;
  columns?: Section["columns"];
}
interface TemplateCompanyInput {
  _id?: string;
}
interface SeaTemplateInitialData {
  name?: string;
  company?: string | TemplateCompanyInput | null;
  primaryColor?: string;
  headerAddress?: string;
  footerText?: string;
  footerBgColor?: string;
  footerTextColor?: string;
  isDefault?: boolean;
  status?: string;
  mainHeading?: string;
  subHeading?: string;
  logoUrl?: string;
  letterheadBgUrl?: string;
  sections?: TemplateSectionInput[];
}

interface SeaTemplateFormProps {
  mode?: "create" | "edit";
  isSuperAdmin?: boolean;
  companies?: CompanyOption[];
  companyId?: string;
  companyName?: string;
  companyLogo?: string;
  initialData?: SeaTemplateInitialData;
  templateId?: string;
  placeholderCards: PlaceholderCard[];
}

// ─────────────────────────────────────────────────────────────────
// MAIN FORM
// ─────────────────────────────────────────────────────────────────
export default function SeaTemplateForm({
  mode = "create",
  isSuperAdmin = false,
  companies = [],
  companyId = "",
  companyName = "",
  companyLogo = "",
  initialData,
  templateId,
  placeholderCards,
}: SeaTemplateFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const { can, isReady } = useAuthorization();

  // ── Meta
  const [templateName, setTemplateName]           = useState(initialData?.name || "");
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => {
    if (!isEdit || !initialData?.company) return companyId;
    if (typeof initialData.company === "string") return initialData.company;
    return (initialData.company as TemplateCompanyInput)._id || companyId;
  });
  const [primaryColor, setPrimaryColor]           = useState(initialData?.primaryColor || "#1e40af");
  const [headerAddress, setHeaderAddress]         = useState(initialData?.headerAddress || "");
  const [footerText, setFooterText]               = useState(initialData?.footerText || "");
  const [footerBgColor, setFooterBgColor]         = useState(initialData?.footerBgColor || "");
  const [footerTextColor, setFooterTextColor]     = useState(initialData?.footerTextColor || "#000000");
  const [isDefault, setIsDefault]                 = useState(initialData?.isDefault || false);
  const [status, setStatus]                       = useState(initialData?.status || "active");
  const [mainHeading, setMainHeading]             = useState(initialData?.mainHeading || "");
  const [subHeading, setSubHeading]               = useState(initialData?.subHeading || "");

  // ── Files
  const [logoFile, setLogoFile]         = useState<File | null>(null);
  const [logoUrl, setLogoUrl]           = useState(initialData?.logoUrl || "");
  const [bgFile, setBgFile]             = useState<File | null>(null);
  const [bgUrl, setBgUrl]               = useState(initialData?.letterheadBgUrl || "");
  const [logoPreview, setLogoPreview]   = useState(initialData?.logoUrl || "");
  const [bgPreview, setBgPreview]       = useState(initialData?.letterheadBgUrl || "");

  // ── Sections
  const [sections, setSections] = useState<Section[]>(() => {
    if (initialData?.sections?.length) {
      return initialData.sections.map((s, i: number) => ({
        id:      s.key || `section_${i}`,
        title:   s.title || "",
        content: s.content || "",
        enabled: s.enabled ?? true,
        order:   s.order ?? i,
        type:    (s.type as Section["type"]) || "richtext",
        columns: s.columns || [],
      }));
    }
    return [];
  });

  // ── UI state
  const [activeTab, setActiveTab]       = useState("sections");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [newSectionId, setNewSectionId] = useState<string | null>(null);
  const [dynamicPlaceholderCards, setDynamicPlaceholderCards] =
    useState<PlaceholderCard[]>(placeholderCards || []);

  const effectiveCompany = isSuperAdmin
    ? companies.find((c) => c.value === selectedCompanyId)
    : { value: companyId, label: companyName, logo: companyLogo };

  useEffect(() => {
    setDynamicPlaceholderCards(placeholderCards || []);
  }, [placeholderCards]);

  useEffect(() => {
    if (!isSuperAdmin) {
      return;
    }

    if (!selectedCompanyId) {
      setDynamicPlaceholderCards(placeholderCards || []);
      return;
    }

    let active = true;

    const loadPlaceholderCards = async () => {
      try {
        const res = await fetch(
          `/api/sea-templates/placeholders?companyId=${selectedCompanyId}`,
        );
        const result = await res.json();

        if (!res.ok || !result?.success) {
          return;
        }

        if (active) {
          setDynamicPlaceholderCards(result.data || []);
        }
      } catch {
      }
    };

    void loadPlaceholderCards();

    return () => {
      active = false;
    };
  }, [isSuperAdmin, selectedCompanyId, placeholderCards]);

  const placeholderCategories: PlaceholderCategory[] = (
    dynamicPlaceholderCards || []
  ).map((card) => ({
    id:    card.id,
    title: card.title,
    icon:  LUCIDE_ICON_MAP[card.icon] ?? <FileText className="w-3.5 h-3.5" />,
    items: card.items.map((item) => ({ key: item.key, label: item.label })),
  }));

  // ── Image validation helper
  const validateImage = (
    file: File,
    options: {
      exactWidth: number;
      exactHeight: number;
      tolerance: number;
      maxSizeBytes: number;
      label: string;
    }
  ): Promise<{ valid: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (file.size > options.maxSizeBytes) {
        const maxKB = Math.round(options.maxSizeBytes / 1024);
        resolve({ valid: false, error: `${options.label} image should be less than ${maxKB}KB` });
        return;
      }
      const img = new window.Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const wDiff = Math.abs(img.width - options.exactWidth);
        const hDiff = Math.abs(img.height - options.exactHeight);
        if (wDiff > options.tolerance || hDiff > options.tolerance) {
          const actual = `${img.width}×${img.height}px`;
          const needed = `${options.exactWidth}×${options.exactHeight}px`;
          resolve({
            valid: false,
            error: `${options.label} image should be ${needed}. Yours is ${actual}. Please resize and try again.`,
          });
          return;
        }
        resolve({ valid: true });
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve({ valid: false, error: "Invalid image file. Please upload a valid image." });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // ── File handlers
  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f) {
      const validation = await validateImage(f, {
        exactWidth: 785, exactHeight: 220, tolerance: 30,
        maxSizeBytes: 500 * 1024, label: "Logo",
      });
      if (!validation.valid) { toast.error(validation.error); return; }
      setLogoFile(f);
      setLogoPreview(URL.createObjectURL(f));
    }
  };
  const handleBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f) {
      const validation = await validateImage(f, {
        exactWidth: 2100, exactHeight: 300, tolerance: 50,
        maxSizeBytes: 2 * 1024 * 1024, label: "Background",
      });
      if (!validation.valid) { toast.error(validation.error); return; }
      setBgFile(f);
      setBgPreview(URL.createObjectURL(f));
    }
  };

  // ── Add blank section
  const addBlankSection = () => {
    const newId = `section_${Date.now()}`;
    setSections((prev) => [
      ...prev,
      { id: newId, title: `Section ${prev.length + 1}`, content: "", enabled: true, order: prev.length, type: "richtext", columns: [] },
    ]);
    setNewSectionId(newId);
    setActiveTab("sections");
  };

  // ── Validate
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!templateName.trim()) errs.name = "Template name is required";
    if (isSuperAdmin && !selectedCompanyId) errs.company = "Please select a company";
    // Either logo or background header image is required
    if (!logoUrl && !logoFile && !bgUrl && !bgFile) {
      errs.logo = "Logo or background image is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { toast.error("Please fix the errors."); return; }
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name",           templateName.trim());
      fd.append("companyId",      isSuperAdmin ? selectedCompanyId : companyId);
      fd.append("headerAddress",  headerAddress);
      fd.append("footerText",     footerText);
      fd.append("footerBgColor",  footerBgColor);
      fd.append("footerTextColor",footerTextColor);
      fd.append("primaryColor",   primaryColor);
      fd.append("isDefault",      String(isDefault));
      fd.append("status",         status);
      fd.append("mainHeading",    mainHeading);
      fd.append("subHeading",     subHeading);
      fd.append("sections", JSON.stringify(
        sections.map((s, i) => ({
          key: s.id, title: s.title, content: s.content,
          enabled: s.enabled, order: i, type: s.type || "richtext", columns: s.columns || [],
        }))
      ));
      if (logoFile instanceof File) fd.append("logoFile", logoFile);
      else if (logoUrl)             fd.append("logoUrl", logoUrl);
      if (bgFile instanceof File)   fd.append("letterheadBgFile", bgFile);
      else if (bgUrl)               fd.append("letterheadBgUrl", bgUrl);

      const url    = isEdit ? `/api/sea-templates/${templateId}` : "/api/sea-templates";
      const method = isEdit ? "PATCH" : "POST";
      const res    = await fetch(url, { method, body: fd });
      const result = await res.json();
      if (!result.success) { toast.error(result.error || "Save failed."); return; }
      toast.success(isEdit ? "Template updated!" : "Template created!");
      router.push("/sea-templates");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const tokenValues: Record<string, string> = {};

  const tabs: TabItem[] = [
    { id: "sections",   label: "Sections",   icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "settings",   label: "Settings",   icon: <Settings className="w-3.5 h-3.5" /> },
    { id: "letterhead", label: "Letterhead", icon: <Image className="w-3.5 h-3.5" /> },
  ];

  const previewSections = sections.map((s, i) => ({
    id: s.id, title: s.title, content: s.content,
    enabled: s.enabled, order: i, type: s.type, columns: s.columns,
  }));

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  if (!isReady) return null;

  if (mode === "create" && !can("templates.create")) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">
          You do not have permission to create SEA Templates.
        </p>
      </div>
    );
  }

  if (mode === "edit" && !can("templates.edit")) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">
          You do not have permission to edit SEA Templates.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb
        pageTitle={isEdit ? "Edit SEA Template" : "New SEA Template"}
        items={[{ label: "SEA Templates", href: "/sea-templates" }]}
      />

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">

        {/* ══ TOP BAR ══════════════════════════════════════════════ */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4  ">
          <div className="overflow-x-auto no-scrollbar">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={isSubmitting} startIcon={<Save className="w-4 h-4" />}>
              {isSubmitting ? "Saving…" : isEdit ? "Update" : "Save"}
            </Button>
          </div>
        </div>

        {/* ══ BODY ══ */}
        <div className="flex flex-col lg:flex-row gap-4 items-start min-w-0">

          {/* ── LEFT: Form ───────────────────────────────────────── */}
          <div className="w-full lg:w-1/2 lg:min-w-0 space-y-4">

            {/* ─── SECTIONS TAB ─── */}
            {activeTab === "sections" && (
              <Card>
                <Card.Header
                  title="Document Sections"
                  subtitle={`${sections.length} section${sections.length !== 1 ? "s" : ""} — add blocks to build your SEA contract`}
                  icon={<FileText className="w-4 h-4" />}
                  action={
                    <Button type="button" size="sm" startIcon={<Plus className="w-4 h-4" />} onClick={addBlankSection}>
                      <span className="hidden xs:inline">Add </span>Section
                    </Button>
                  }
                />
                <Card.Body>
                  {sections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 text-center px-4">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <Layout className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No sections yet</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mb-5">
                        Click <strong>Add Section</strong> to create a custom section. Give it a title, write your content, and insert tables with custom rows and columns.
                      </p>
                      <Button type="button" variant="outline" size="sm" startIcon={<Plus className="w-4 h-4" />} onClick={addBlankSection}>
                        Add Section
                      </Button>
                    </div>
                  ) : (
                    <SectionBuilder
                      value={sections}
                      onChange={setSections}
                      placeholderCategories={placeholderCategories}
                      newlyAddedSectionId={newSectionId}
                      onNewSectionExpanded={() => setNewSectionId(null)}
                    />
                  )}
                </Card.Body>
              </Card>
            )}

            {/* ─── SETTINGS TAB ─── */}
            {activeTab === "settings" && (
              <Card>
                <Card.Header title="Template Settings" subtitle="Name, headings and brand colour" icon={<Settings className="w-4 h-4" />} />
                <Card.Body className="space-y-6">

                  {/* Template identity */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Template Identity</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Template Name *" error={errors.name}>
                        <Input placeholder="e.g. Standard SEA – MLC 2006" value={templateName} onChange={(e) => setTemplateName(e.target.value)} error={!!errors.name} />
                      </FormField>
                      {isSuperAdmin && (
                        <FormField label="Company *" error={errors.company}>
                          <SearchableSelect options={companies} value={selectedCompanyId} onChange={setSelectedCompanyId} placeholder="Select company…" />
                        </FormField>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Status</p>
                    <div className="max-w-xs">
                      <Select
                        value={status}
                        onChange={setStatus}
                        options={[
                          { value: "active", label: "Active" },
                          { value: "inactive", label: "Inactive" },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Document headings */}
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Document Title</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Main Heading">
                        <Input placeholder="SEAFARER'S EMPLOYMENT AGREEMENT" value={mainHeading} onChange={(e) => setMainHeading(e.target.value)} />
                      </FormField>
                      <FormField label="Sub Heading">
                        <Input placeholder="(Manning Agreement)" value={subHeading} onChange={(e) => setSubHeading(e.target.value)} />
                      </FormField>
                    </div>
                  </div>

                  {/* Brand color */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Brand / Accent Colour</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-11 w-16 rounded-lg cursor-pointer border border-gray-300 dark:border-gray-700 p-0.5"
                      />
                      <div className="w-32">
                        <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono" />
                      </div>
                      <p className="text-xs text-gray-400">Used for headings &amp; accents in the PDF</p>
                    </div>
                  </div>

                  {/* Default checkbox */}
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                    <Checkbox id="isDefault" label="Set as default template for new contracts" checked={isDefault} onChange={setIsDefault} />
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* ─── LETTERHEAD TAB ─── */}
            {activeTab === "letterhead" && (
              <Card>
                <Card.Header title="Letterhead" subtitle="Logo, background image, address block and footer" icon={<Image className="w-4 h-4" />} />
                <Card.Body className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Logo */}
                    <FormField label="Agency / Company Logo *" hint="Size: 785×220px recommended. File should be less than 500KB" error={errors.logo}>
                      {logoPreview && (
                        <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          <img src={logoPreview} alt="Logo" className="h-10 object-contain" />
                          <Button type="button" variant="ghost" size="sm" className="ml-auto"
                            onClick={() => { setLogoFile(null); setLogoUrl(""); setLogoPreview(""); }}>
                            <X className="w-3.5 h-3.5 text-error-500" />
                          </Button>
                        </div>
                      )}
                      <FileInput accept="image/*" onChange={handleLogo} />
                    </FormField>

                    {/* Background */}
                    <FormField label="Header Background Image" hint="Size: 2100×300px recommended. File should be less than 2MB">
                      {bgPreview && (
                        <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          <img src={bgPreview} alt="BG" className="h-10 object-contain" />
                          <Button type="button" variant="ghost" size="sm" className="ml-auto"
                            onClick={() => { setBgFile(null); setBgUrl(""); setBgPreview(""); }}>
                            <X className="w-3.5 h-3.5 text-error-500" />
                          </Button>
                        </div>
                      )}
                      <FileInput accept="image/*" onChange={handleBg} />
                    </FormField>
                  </div>

                  {/* Address */}
                  <FormField label="Header Address Block" hint="Displayed on the right side of the header">
                    <RichTextEditor
                      value={headerAddress}
                      onChange={setHeaderAddress}
                      placeholder="Enter company address (e.g., Company Name, Building, Street, City, PIN)"
                    />
                  </FormField>

                  {/* Footer text — now RichTextEditor */}
                  <FormField label="Footer Text" hint="Shown at the bottom of every page. Supports rich text formatting.">
                    <RichTextEditor
                      value={footerText}
                      onChange={setFooterText}
                      placeholder="e.g. T: +91 484-4087333   E: info@company.com   W: www.company.com"
                    />
                  </FormField>

                  {/* Footer colours */}
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Footer Colours</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                      {/* Footer background colour */}
                      <FormField label="Footer Background Colour" hint="Optional solid fill behind the footer">
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={footerBgColor || "#ffffff"}
                            onChange={(e) => setFooterBgColor(e.target.value)}
                            className="h-10 w-14 rounded-lg cursor-pointer border border-gray-300 dark:border-gray-700 p-0.5 flex-shrink-0"
                          />
                          <div className="flex-1">
                            <Input
                              value={footerBgColor}
                              onChange={(e) => setFooterBgColor(e.target.value)}
                              placeholder="e.g. #1e3a5f or leave blank"
                              className="font-mono"
                            />
                          </div>
                          {footerBgColor && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setFooterBgColor("")}
                            >
                              <X className="w-3.5 h-3.5 text-gray-400" />
                            </Button>
                          )}
                        </div>
                      </FormField>

                      {/* Footer text colour */}
                      <FormField label="Footer Text Colour" hint="Colour applied to all footer text">
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={footerTextColor}
                            onChange={(e) => setFooterTextColor(e.target.value)}
                            className="h-10 w-14 rounded-lg cursor-pointer border border-gray-300 dark:border-gray-700 p-0.5 flex-shrink-0"
                          />
                          <div className="flex-1">
                            <Input
                              value={footerTextColor}
                              onChange={(e) => setFooterTextColor(e.target.value)}
                              className="font-mono"
                            />
                          </div>
                        </div>
                      </FormField>

                    </div>
                  </div>

                </Card.Body>
              </Card>
            )}
          </div>

          {/* ── RIGHT: Live Preview ───────────────────────────────── */}
          <div className="w-full lg:w-1/2 lg:min-w-0 lg:sticky lg:top-4 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto lg:overflow-x-auto lg:overscroll-contain">
            <SeaDocumentPreview
              sections={previewSections}
              logoUrl={logoPreview || logoUrl}
              letterheadBgUrl={bgPreview || bgUrl}
              headerAddress={headerAddress}
              footerText={footerText}
              footerBgColor={footerBgColor}
              footerTextColor={footerTextColor}
              primaryColor={primaryColor}
              companyName={effectiveCompany?.label || companyName}
            
              tokenValues={tokenValues}
              isMini={false}
              showBrackets={true}
              isTemplateMode={true}
            />
          </div>

        </div>
      </form>
    </div>
  );
}
