"use client";

import React from "react";
import { useAuthorization } from "@/hooks/useAuthorization";
import { ChevronDown, GripVertical } from "lucide-react";
import { useDashboardLayout } from "./DashboardLayoutContext";

interface DashboardSectionProps {
  sectionId: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
  permissions?: string[];
}

export default function DashboardSection({
  sectionId,
  title,
  icon,
  children,
  className = "",
  id,
  permissions,
}: DashboardSectionProps) {
  const { canAny, can, isReady } = useAuthorization();
  const [isOpen, setIsOpen] = React.useState(true);
  const dashboardLayout = useDashboardLayout();

  const sectionOrder = dashboardLayout?.getSectionOrder(sectionId) ?? 0;
  const isDragging = dashboardLayout?.activeSectionId === sectionId;
  const isEditMode = dashboardLayout?.isEditMode ?? false;
  const canRearrange = can("dashboard.rearrange");
  const isDraggable = isEditMode && canRearrange;

  if (permissions?.length) {
    if (!isReady) return null;
    if (!canAny(permissions)) return null;
  }

  return (
    <section
      id={id}
      style={{ order: sectionOrder }}
      onDragEnter={() => {
        if (!dashboardLayout?.activeSectionId) return;
        dashboardLayout.moveSection(dashboardLayout.activeSectionId, sectionId);
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={() => {
        dashboardLayout?.clearActiveSection();
      }}
      className={`space-y-6 pb-12 transition-opacity duration-150 ${isDragging ? "opacity-60" : "opacity-100"} ${className}`}
    >
      <button
        type="button"
        draggable={isDraggable}
        onClick={() => setIsOpen((prev) => !prev)}
        onDragStart={(event) => {
          if (!isDraggable) return;
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", sectionId);
          dashboardLayout?.setActiveSection(sectionId);
        }}
        onDragEnd={() => {
          dashboardLayout?.clearActiveSection();
        }}
        aria-expanded={isOpen}
        className={`flex w-full items-center py-1 text-left ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""}`}
      >
        <div className="flex min-w-0 items-center gap-2">
          {isDraggable && (
            <GripVertical
              size={16}
              className="shrink-0 text-gray-400 dark:text-gray-500"
            />
          )}
          <div className="h-5 w-1 rounded-full bg-brand-500" />
          <h2 className="text-lg font-bold uppercase tracking-tight text-gray-900 dark:text-white">
            {title}
          </h2>
          <ChevronDown
            size={18}
            className={`shrink-0 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
          {icon && <div className="text-gray-400">{icon}</div>}
        </div>
      </button>

      <div
        className={`grid transition-all duration-200 ease-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-6 pt-1">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

interface WidgetWrapperProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function WidgetWrapper({ permission, children, fallback = null }: WidgetWrapperProps) {
  const { can, isReady } = useAuthorization();

  if (!isReady) return null; // Or a specific widget skeleton

  if (!can(permission)) {
    return fallback;
  }

  return <>{children}</>;
}
