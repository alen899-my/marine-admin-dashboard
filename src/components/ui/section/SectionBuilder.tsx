"use client";

import React from "react";
import Button from "../button/Button";
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  Copy,
  Layout,
  Type,
  AlignLeft,
  List,
  ListOrdered,
  AlignCenter,
  AlignRight,
  Eye
} from "lucide-react";
import Checkbox from "@/components/form/input/Checkbox";
import RichTextEditor from "@/components/form/RichTextEditor";
import { getNextCopyName } from "@/lib/utils";

export interface Section {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
  order: number;
  type?: "richtext" | "signature_block" | "page_break";
  columns?: { key: string; label: string }[];
}

export interface PlaceholderCategory {
  id: string;
  title: string;
  icon?: React.ReactNode;
  items: { key: string; label: string }[];
}

interface SectionBuilderProps {
  value?: Section[];
  onChange?: (sections: Section[]) => void;
  placeholderCategories?: PlaceholderCategory[];
  onInsertPlaceholder?: (key: string, sectionId: string) => void;
  newlyAddedSectionId?: string | null;
  onNewSectionExpanded?: () => void;
}

const SectionBuilder: React.FC<SectionBuilderProps> = ({
  value = [],
  onChange,
  placeholderCategories = [],
  onInsertPlaceholder,
  newlyAddedSectionId,
  onNewSectionExpanded,
}) => {
  const [sections, setSections] = React.useState<Section[]>(value);
  const [expandedSection, setExpandedSection] = React.useState<string | null>(
    value[0]?.id || null
  );
  const [activeSectionForPlaceholder, setActiveSectionForPlaceholder] = React.useState<string | null>(
    value[0]?.id || null
  );
  const [activePlaceholderTab, setActivePlaceholderTab] = React.useState<string>(
    placeholderCategories[0]?.id || ""
  );
  const editorRefs = React.useRef<{ [key: string]: any }>({});

  React.useEffect(() => {
    if (value) {
      setSections(value);
      if (newlyAddedSectionId) {
        setExpandedSection(newlyAddedSectionId);
        setActiveSectionForPlaceholder(newlyAddedSectionId);
        onNewSectionExpanded?.();
      } else if (value.length > 0 && !expandedSection) {
        setExpandedSection(value[0].id);
        setActiveSectionForPlaceholder(value[0].id);
      }
    }
  }, [value, newlyAddedSectionId]);

  React.useEffect(() => {
    if (placeholderCategories.length > 0 && !activePlaceholderTab) {
      setActivePlaceholderTab(placeholderCategories[0].id);
    }
  }, [placeholderCategories]);

  const addSection = () => {
    const newSection: Section = {
      id: `section_${Date.now()}`,
      title: `Section ${sections.length + 1}`,
      content: "",
      enabled: true,
      order: sections.length,
    };
    const updated = [...sections, newSection];
    setSections(updated);
    setExpandedSection(newSection.id);
    setActiveSectionForPlaceholder(newSection.id);
    onChange?.(updated);
  };

  const removeSection = (sectionId: string) => {
    const updated = sections
      .filter((s) => s.id !== sectionId)
      .map((s, i) => ({ ...s, order: i }));
    setSections(updated);
    onChange?.(updated);
    if (expandedSection === sectionId) {
      setExpandedSection(updated[0]?.id || null);
      setActiveSectionForPlaceholder(updated[0]?.id || null);
    }
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    const updated = sections.map((s) =>
      s.id === sectionId ? { ...s, ...updates } : s
    );
    setSections(updated);
    onChange?.(updated);
  };

  const moveSection = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= sections.length) return;
    const updated = [...sections];
    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, removed);
    const reordered = updated.map((s, i) => ({ ...s, order: i }));
    setSections(reordered);
    onChange?.(reordered);
  };

  const duplicateSection = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    const newSection: Section = {
      ...section,
      id: `section_${Date.now()}`,
      title: getNextCopyName(section.title || "Section", sections.map(s => s.title)),
      order: sections.length,
    };
    const updated = [...sections, newSection];
    setSections(updated);
    setExpandedSection(newSection.id);
    setActiveSectionForPlaceholder(newSection.id);
    onChange?.(updated);
  };

  const insertPlaceholder = (key: string) => {
    if (!activeSectionForPlaceholder) return;
    const editor = editorRefs.current[activeSectionForPlaceholder];
    if (editor) {
      editor.chain().focus().insertContent(key).run();
    }
  };

  const activeCategory = placeholderCategories.find(c => c.id === activePlaceholderTab);

  return (
    <div className="space-y-4">
      {/* Placeholder Panel */}
      {placeholderCategories.length > 0 && (
        <div className="mb-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Category tabs — horizontally scrollable */}
          <div className="flex gap-1 p-2 bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {placeholderCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActivePlaceholderTab(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  activePlaceholderTab === cat.id
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {cat.icon}
                <span>{cat.title}</span>
              </button>
            ))}
          </div>

          {/* Placeholder items — larger, easier-to-scan grid */}
          {activeCategory && (
            <div className="p-4 max-h-[360px] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {activeCategory.items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => insertPlaceholder(item.key)}
                    className="flex flex-col items-start gap-1 px-3.5 py-3 rounded-xl text-left border border-gray-100 dark:border-gray-800 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-all group min-h-[74px]"
                  >
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-brand-600 transition-colors leading-snug">
                      {item.label}
                    </span>
                    <span className="text-gray-400 font-mono text-[11px] break-all w-full leading-snug">
                      {item.key}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section List */}
      <div className="space-y-3">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={`rounded-xl border transition-all ${
              section.enabled
                ? "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 opacity-60"
            }`}
          >
            {/* Section Header */}
            <div
              className={`flex items-center gap-2 px-3 py-2.5 border-b cursor-pointer ${
                activeSectionForPlaceholder === section.id
                  ? "bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/30"
                  : "border-gray-100 dark:border-gray-800"
              }`}
              onClick={() => {
                setExpandedSection(expandedSection === section.id ? null : section.id);
                setActiveSectionForPlaceholder(section.id);
              }}
            >


              <Checkbox
                checked={section.enabled}
                onChange={(checked) => {
                  updateSection(section.id, { enabled: checked });
                  if (checked) {
                    setExpandedSection(section.id);
                    setActiveSectionForPlaceholder(section.id);
                  }
                }}
              />

              <input
                type="text"
                value={section.title}
                onChange={(e) => { e.stopPropagation(); updateSection(section.id, { title: e.target.value }); }}
                onClick={(e) => { e.stopPropagation(); setActiveSectionForPlaceholder(section.id); }}
                placeholder={section.title || `Section ${index + 1}`}
                disabled={!section.enabled}
                className="flex-1 min-w-0 text-sm font-semibold bg-transparent border-none outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400 disabled:cursor-not-allowed truncate"
              />

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    moveSection(index, index - 1);
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move Up"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500 rotate-[-90deg]" />
                </button>
                <button
                  type="button"
                  disabled={index === sections.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    moveSection(index, index + 1);
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move Down"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500 rotate-[90deg]" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateSection(section.id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSection(section.id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {expandedSection === section.id ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>

            {/* Section Content */}
            {section.enabled && expandedSection === section.id && (
              <div className="p-4 space-y-3">


                <RichTextEditor
                  value={section.content}
                  onChange={(val) => updateSection(section.id, { content: val })}
                  onCreate={(editor) => {
                    editorRefs.current[section.id] = editor;
                  }}
                  placeholder="Type your section content here..."
                />
                
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tip: Click placeholder buttons above to insert. Use format: <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">{"[CANDIDATE.FULL_NAME]"}</code>
                </p>
                </div>
              )}
          </div>
        ))}
      </div>

    </div>
  );
};

export default SectionBuilder;
