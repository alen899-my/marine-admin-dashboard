"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

interface DashboardLayoutContextValue {
  activeSectionId: string | null;
  activeWidgetId: string | null;
  activeWidgetSectionId: string | null;
  clearActiveSection: () => void;
  getSectionOrder: (sectionId: string) => number;
  getWidgetHeight: (widgetId: string) => number | null;
  getWidgetOrder: (sectionId: string, defaultOrder: string[]) => string[];
  getWidgetSpan: (widgetId: string, columnCount: number) => number | null;
  invalidDropSectionId: string | null;
  isEditMode: boolean;
  moveSection: (activeSectionId: string, targetSectionId: string) => void;
  overWidgetId: string | null;
  setActiveSection: (sectionId: string) => void;
  setEditMode: (editMode: boolean) => void;
  setWidgetHeight: (widgetId: string, height: number | null) => void;
  setWidgetSpan: (widgetId: string, columnCount: number, span: number | null) => void;
  syncWidgetOrder: (sectionId: string, widgetIds: string[]) => void;
}

const DashboardLayoutContext = createContext<DashboardLayoutContextValue | null>(null);

export interface InitialDashboardLayout {
  sectionOrder?: string[];
  widgetOrders?: Record<string, string[]>;
  widgetHeights?: Record<string, number>;
  widgetSpans?: Record<string, Record<string, number>>;
}

function normalizeOrder(defaultOrder: string[], savedOrder: string[]) {
  const validSaved = savedOrder.filter((id) => defaultOrder.includes(id));
  const missing = defaultOrder.filter((id) => !validSaved.includes(id));
  return [...validSaved, ...missing];
}

function isSameOrder(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function arrayMove(items: string[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

/** Fire-and-forget debounced save to /api/dashboard/layout */
function useDebouncedLayoutSave(
  sectionOrder: string[],
  widgetOrders: Record<string, string[]>,
  widgetHeights: Record<string, number>,
  widgetSpans: Record<string, Record<string, number>>,
  isMounted: boolean,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isMounted) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      fetch("/api/dashboard/layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionOrder, widgetOrders, widgetHeights, widgetSpans }),
      }).catch(() => {
        // Silently ignore network errors — layout will re-save on next change
      });
    }, 800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionOrder, widgetOrders, widgetHeights, widgetSpans, isMounted]);
}

export function DashboardLayoutProvider({
  children,
  defaultOrder,
  initialLayout,
}: {
  children: React.ReactNode;
  defaultOrder: string[];
  initialLayout?: InitialDashboardLayout | null;
}) {
  const [orderedSections, setOrderedSections] = useState(() =>
    initialLayout?.sectionOrder?.length
      ? normalizeOrder(defaultOrder, initialLayout.sectionOrder)
      : defaultOrder,
  );

  const [widgetOrders, setWidgetOrders] = useState<Record<string, string[]>>(
    () => initialLayout?.widgetOrders ?? {},
  );

  const [widgetHeights, setWidgetHeights] = useState<Record<string, number>>(
    () => initialLayout?.widgetHeights ?? {},
  );

  const [widgetSpans, setWidgetSpans] = useState<Record<string, Record<string, number>>>(
    () => initialLayout?.widgetSpans ?? {},
  );

  const [isEditMode, setIsEditMode] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const [activeWidgetSectionId, setActiveWidgetSectionId] = useState<string | null>(null);
  const [activeWidgetPreview, setActiveWidgetPreview] = useState<React.ReactNode>(null);
  const [overWidgetId, setOverWidgetId] = useState<string | null>(null);
  const [invalidDropSectionId, setInvalidDropSectionId] = useState<string | null>(null);

  // Track whether the component has mounted so we don't save on first render
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Debounced persist to DB whenever layout state changes after mount
  useDebouncedLayoutSave(
    orderedSections,
    widgetOrders,
    widgetHeights,
    widgetSpans,
    isMounted,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const moveSection = useCallback((activeId: string, targetId: string) => {
    if (activeId === targetId) return;

    setOrderedSections((current) => {
      const fromIndex = current.indexOf(activeId);
      const toIndex = current.indexOf(targetId);

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return current;
      }

      return arrayMove(current, fromIndex, toIndex);
    });
  }, []);

  const syncWidgetOrder = useCallback((sectionId: string, widgetIds: string[]) => {
    setWidgetOrders((current) => {
      const normalized = normalizeOrder(widgetIds, current[sectionId] ?? []);
      if (isSameOrder(normalized, current[sectionId] ?? [])) {
        return current;
      }

      return {
        ...current,
        [sectionId]: normalized,
      };
    });
  }, []);

  const moveWidget = useCallback((sectionId: string, activeId: string, overId: string) => {
    if (activeId === overId) return;

    setWidgetOrders((current) => {
      const currentOrder = current[sectionId] ?? [];
      const fromIndex = currentOrder.indexOf(activeId);
      const toIndex = currentOrder.indexOf(overId);

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return current;
      }

      return {
        ...current,
        [sectionId]: arrayMove(currentOrder, fromIndex, toIndex),
      };
    });
  }, []);

  const clearActiveSection = useCallback(() => {
    setActiveSectionId(null);
  }, []);

  const setWidgetHeight = useCallback((widgetId: string, height: number | null) => {
    setWidgetHeights((current) => {
      if (height === null) {
        if (!(widgetId in current)) {
          return current;
        }

        const next = { ...current };
        delete next[widgetId];
        return next;
      }

      if (current[widgetId] === height) {
        return current;
      }

      return {
        ...current,
        [widgetId]: height,
      };
    });
  }, []);

  const setWidgetSpan = useCallback((widgetId: string, columnCount: number, span: number | null) => {
    const columnKey = String(columnCount);

    setWidgetSpans((current) => {
      const currentWidgetSpans = current[widgetId] ?? {};

      if (span === null) {
        if (!(columnKey in currentWidgetSpans)) {
          return current;
        }

        const nextWidgetSpans = { ...currentWidgetSpans };
        delete nextWidgetSpans[columnKey];

        if (Object.keys(nextWidgetSpans).length === 0) {
          const next = { ...current };
          delete next[widgetId];
          return next;
        }

        return {
          ...current,
          [widgetId]: nextWidgetSpans,
        };
      }

      if (currentWidgetSpans[columnKey] === span) {
        return current;
      }

      return {
        ...current,
        [widgetId]: {
          ...currentWidgetSpans,
          [columnKey]: span,
        },
      };
    });
  }, []);

  const clearActiveWidget = useCallback(() => {
    setActiveWidgetId(null);
    setActiveWidgetSectionId(null);
    setActiveWidgetPreview(null);
    setOverWidgetId(null);
    setInvalidDropSectionId(null);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeId = String(event.active.id);
    const sectionId = event.active.data.current?.sectionId;

    if (typeof sectionId !== "string") return;

    setActiveWidgetId(activeId);
    setActiveWidgetSectionId(sectionId);
    setActiveWidgetPreview(event.active.data.current?.preview ?? null);
    setOverWidgetId(null);
    setInvalidDropSectionId(null);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const sourceSectionId = event.active.data.current?.sectionId;
    const targetSectionId = event.over?.data.current?.sectionId;

    if (typeof sourceSectionId !== "string") {
      setOverWidgetId(null);
      setInvalidDropSectionId(null);
      return;
    }

    if (!event.over) {
      setOverWidgetId(null);
      setInvalidDropSectionId(null);
      return;
    }

    if (typeof targetSectionId !== "string" || sourceSectionId !== targetSectionId) {
      setOverWidgetId(null);
      setInvalidDropSectionId(typeof targetSectionId === "string" ? targetSectionId : null);
      return;
    }

    if (event.over.data.current?.type === "widget") {
      setOverWidgetId(String(event.over.id));
    } else {
      setOverWidgetId(null);
    }

    setInvalidDropSectionId(null);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const sourceSectionId = event.active.data.current?.sectionId;
    const targetSectionId = event.over?.data.current?.sectionId;

    if (
      event.over &&
      event.over.data.current?.type === "widget" &&
      typeof sourceSectionId === "string" &&
      sourceSectionId === targetSectionId
    ) {
      moveWidget(sourceSectionId, String(event.active.id), String(event.over.id));
    }

    clearActiveWidget();
  }, [clearActiveWidget, moveWidget]);

  const getSectionOrder = useCallback(
    (sectionId: string) => {
      const index = orderedSections.indexOf(sectionId);
      return index === -1 ? orderedSections.length : index;
    },
    [orderedSections],
  );

  const getWidgetOrder = useCallback(
    (sectionId: string, currentWidgetIds: string[]) =>
      normalizeOrder(currentWidgetIds, widgetOrders[sectionId] ?? []),
    [widgetOrders],
  );

  const getWidgetHeight = useCallback(
    (widgetId: string) => widgetHeights[widgetId] ?? null,
    [widgetHeights],
  );

  const getWidgetSpan = useCallback(
    (widgetId: string, columnCount: number) =>
      widgetSpans[widgetId]?.[String(columnCount)] ?? null,
    [widgetSpans],
  );

  const value = useMemo(
    () => ({
      activeSectionId,
      activeWidgetId,
      activeWidgetSectionId,
      clearActiveSection,
      getSectionOrder,
      getWidgetHeight,
      getWidgetOrder,
      getWidgetSpan,
      invalidDropSectionId,
      isEditMode,
      moveSection,
      overWidgetId,
      setActiveSection: setActiveSectionId,
      setEditMode: setIsEditMode,
      setWidgetHeight,
      setWidgetSpan,
      syncWidgetOrder,
    }),
    [
      activeSectionId,
      activeWidgetId,
      activeWidgetSectionId,
      clearActiveSection,
      getSectionOrder,
      getWidgetHeight,
      getWidgetOrder,
      getWidgetSpan,
      invalidDropSectionId,
      isEditMode,
      moveSection,
      overWidgetId,
      setWidgetHeight,
      setWidgetSpan,
      syncWidgetOrder,
    ],
  );

  const dndId = React.useId();

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={clearActiveWidget}
    >
      <DashboardLayoutContext.Provider value={value}>
        {children}
      </DashboardLayoutContext.Provider>
      <DragOverlay>
        {activeWidgetPreview ? (
          <div className="max-w-[min(42rem,calc(100vw-2rem))] rounded-[1.75rem] opacity-95 shadow-2xl ring-2 ring-brand-300 ring-offset-2 ring-offset-white dark:ring-brand-400/70 dark:ring-offset-slate-950">
            {activeWidgetPreview}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export function useDashboardLayout() {
  return useContext(DashboardLayoutContext);
}
