"use client";

import { useAuthorization } from "@/hooks/useAuthorization";
import { UserGuideSection } from "@/types/userGuide";
import Input from "@/components/form/input/InputField";
import { BookOpen, ChevronDown, HelpCircle } from "lucide-react";
import React, { useMemo, useState } from "react";

interface UserGuideContentProps {
  sections?: UserGuideSection[];
}

export default function UserGuideContent({ sections = [] }: UserGuideContentProps) {
  const { user, isReady } = useAuthorization();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);

  // Filter sections by search term
  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return sections;
    const term = searchTerm.toLowerCase();
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(term) ||
        (s.content && s.content.toLowerCase().includes(term))
    );
  }, [sections, searchTerm]);

  // Grouping logic
  const { groups, sectionsByGroup } = useMemo(() => {
    const sectionsByGroup: Record<string, UserGuideSection[]> = {};
    const groupMap: Record<string, { id: string; name: string; sortOrder: number }> = {};

    filteredSections.forEach((section) => {
      const group = section.group || { id: "other", name: "General Docs", sortOrder: 999 };
      const groupId = group.id;

      if (!sectionsByGroup[groupId]) {
        sectionsByGroup[groupId] = [];
        groupMap[groupId] = group;
      }
      sectionsByGroup[groupId].push(section);
    });

    const sortedGroups = Object.values(groupMap).sort((a, b) => a.sortOrder - b.sortOrder);
    return { groups: sortedGroups, sectionsByGroup };
  }, [filteredSections]);

  const getContentForCurrentUser = (section: UserGuideSection): string => {
    const roleContents = section.roleContents || {};
    const defaultContent = section.content || "";
    const userRole = user?.role?.toLowerCase() || "";

    if (Object.keys(roleContents).length === 0) return defaultContent;
    if (roleContents[userRole]) return roleContents[userRole];

    const matchedKey = Object.keys(roleContents).find(
      (key) => key.toLowerCase().trim() === userRole
    );
    return matchedKey ? roleContents[matchedKey] : defaultContent;
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 md:py-10 space-y-8">
      {/* Page Header - Matching Admin Template */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-4 md:px-0">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">
            User Guide
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Comprehensive documentation for the system modules.
          </p>
        </div>

        <div className="w-full sm:w-80">
          <Input
            label="Search"
            placeholder="Search guides..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="mx-4 md:mx-0 py-20 px-6 rounded-3xl border border-dashed border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] text-center">
          <div className="w-14 h-14 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <HelpCircle size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No matches found</h3>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2">
            Try adjusting your search criteria or clear to browse all categories.
          </p>
          <button 
            onClick={() => setSearchTerm("")}
            className="mt-6 px-6 py-2.5 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 transition-all text-sm"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <div key={group.id} className="space-y-4 px-4 md:px-0">
              <div className="px-1">
                <h2 className="text-[11px] uppercase tracking-[0.18em] font-bold text-gray-500 dark:text-gray-400">
                  {group.name}
                </h2>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900 divide-y divide-gray-100 dark:divide-white/5 overflow-hidden">
                {sectionsByGroup[group.id]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((section) => {
                    const content = getContentForCurrentUser(section);
                    const isExpanded = expandedSectionId === section._id;

                    if (!content) return null;

                    return (
                      <div key={section._id}>
                        <button
                          onClick={() => setExpandedSectionId(isExpanded ? null : section._id)}
                          className={`w-full flex items-center justify-between p-6 text-left transition-colors ${
                            isExpanded ? "bg-gray-50/50 dark:bg-white/[0.02]" : "hover:bg-gray-50/30 dark:hover:bg-white/[0.01]"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl transition-colors ${
                              isExpanded ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400"
                            }`}>
                              <BookOpen size={20} />
                            </div>
                            <h3 className={`text-base sm:text-lg font-semibold transition-colors ${
                              isExpanded ? "text-brand-600 dark:text-brand-400" : "text-gray-800 dark:text-white/90"
                            }`}>
                              {section.title}
                            </h3>
                          </div>
                          <ChevronDown 
                            size={20} 
                            className={`text-gray-400 transition-transform duration-300 ${isExpanded ? "rotate-180 text-brand-600" : ""}`} 
                          />
                        </button>

                        {isExpanded && (
                          <div className="px-6 pb-10 pt-4 bg-gray-50/50 dark:bg-white/[0.02] animate-in fade-in duration-500">
                            <div className="pl-6">
                              <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
                                {content.includes("<") ? (
                                  <div
                                    className="rte-content text-base leading-relaxed text-gray-700 dark:text-gray-300"
                                    dangerouslySetInnerHTML={{ __html: content }}
                                  />
                                ) : (
                                  <p className="text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {content}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
