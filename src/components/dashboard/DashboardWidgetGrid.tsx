"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  type SortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontal, GripVertical } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useDashboardLayout } from "./DashboardLayoutContext";
import { ResizeHandle } from "./ResizeHandle";

export interface DashboardWidgetProps {
  id: string;
  permission?: string;
  className?: string;
  children: React.ReactNode;
}

interface DashboardWidgetGridProps {
  sectionId: string;
  children: React.ReactNode;
  className?: string;
  strategy?: SortingStrategy;
}

export function DashboardWidget({ children }: DashboardWidgetProps) {
  return <>{children}</>;
}

DashboardWidget.displayName = "DashboardWidget";

export default function DashboardWidgetGrid({
  sectionId,
  children,
  className,
  strategy = rectSortingStrategy,
}: DashboardWidgetGridProps) {
  const { can, isReady } = useAuthorization();
  const dashboardLayout = useDashboardLayout();

  const isEditMode = dashboardLayout?.isEditMode ?? false;
  const canRearrange = can("dashboard.rearrange");
  const canResize = can("dashboard.resize");
  const isDraggable = isEditMode && canRearrange;
  const isResizable = isEditMode && canResize;

  const widgetDescriptors = React.useMemo(
    () =>
      React.Children.toArray(children).filter((child): child is React.ReactElement<DashboardWidgetProps> =>
        React.isValidElement<DashboardWidgetProps>(child),
      ),
    [children],
  );

  const allWidgetIds = React.useMemo(
    () => widgetDescriptors.map((widget) => widget.props.id),
    [widgetDescriptors],
  );

  React.useEffect(() => {
    dashboardLayout?.syncWidgetOrder(sectionId, allWidgetIds);
  }, [allWidgetIds, dashboardLayout, sectionId]);

  const orderedIds = dashboardLayout?.getWidgetOrder(sectionId, allWidgetIds) ?? allWidgetIds;

  const visibleWidgets = React.useMemo(() => {
    if (!isReady) return [] as React.ReactElement<DashboardWidgetProps>[];

    return widgetDescriptors.filter((widget) =>
      widget.props.permission ? can(widget.props.permission) : true,
    );
  }, [can, isReady, widgetDescriptors]);

  const visibleWidgetMap = React.useMemo(
    () => new Map(visibleWidgets.map((widget) => [widget.props.id, widget.props])),
    [visibleWidgets],
  );

  const visibleOrderedIds = React.useMemo(
    () => orderedIds.filter((id) => visibleWidgetMap.has(id)),
    [orderedIds, visibleWidgetMap],
  );

  const { setNodeRef } = useDroppable({
    id: `widget-container-${sectionId}`,
    data: {
      type: "widget-container",
      sectionId,
    },
  });

  if (!isReady || visibleOrderedIds.length === 0) {
    return null;
  }

  return (
    <SortableContext
      id={`widgets-${sectionId}`}
      items={visibleOrderedIds}
      strategy={strategy}
    >
      <div
        ref={setNodeRef}
        className={twMerge(
          "grid grid-cols-1 items-start gap-6",
          dashboardLayout?.invalidDropSectionId === sectionId &&
            "rounded-[1.75rem] bg-red-50/40 ring-2 ring-red-200 ring-offset-2 ring-offset-white dark:bg-red-500/10 dark:ring-red-500/40 dark:ring-offset-slate-950",
          className,
        )}
        style={{
          gridAutoRows: "1px",
          rowGap: "0px",
        }}
      >
        {visibleOrderedIds.map((widgetId) => {
          const widget = visibleWidgetMap.get(widgetId);
          if (!widget) return null;

          return (
            <SortableWidgetCard
              key={widgetId}
              id={widgetId}
              sectionId={sectionId}
              className={widget.className}
              isDraggable={isDraggable}
              isResizable={isResizable}
            >
              {widget.children}
            </SortableWidgetCard>
          );
        })}
      </div>
    </SortableContext>
  );
}

interface SortableWidgetCardProps {
  id: string;
  sectionId: string;
  className?: string;
  children: React.ReactNode;
  isDraggable?: boolean;
  isResizable?: boolean;
}

const MIN_WIDGET_HEIGHT = 140;
const ROW_GAP = 24; // 1.5rem for gap-6
const MAX_WIDGET_HEIGHT = 840;
const WIDGET_BODY_OFFSET = 108;
type ResizeMode = "height" | "width" | "both";

interface GridMetrics {
  averageTrackWidth: number;
  columnCount: number;
  gap: number;
}

function SortableWidgetCard({
  id,
  sectionId,
  className,
  children,
  isDraggable = false,
  isResizable = false,
}: SortableWidgetCardProps) {
  const dashboardLayout = useDashboardLayout();
  const [currentColumnCount, setCurrentColumnCount] = React.useState(1);
  const persistedRawHeight = dashboardLayout?.getWidgetHeight(id) ?? null;
  // Convert any rowSpans saved in the previous session back to pixel heights
  const persistedHeight = persistedRawHeight !== null 
    ? (persistedRawHeight <= 20 ? (persistedRawHeight * 140) + ((persistedRawHeight - 1) * ROW_GAP) : persistedRawHeight)
    : null;
  const persistedSpan = dashboardLayout?.getWidgetSpan(id, currentColumnCount) ?? null;
  const [resizingHeight, setResizingHeight] = React.useState<number | null>(null);
  const [resizingSpan, setResizingSpan] = React.useState<number | null>(null);
  const [isResizing, setIsResizing] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [intrinsicHeight, setIntrinsicHeight] = React.useState<number>(MIN_WIDGET_HEIGHT);
  const [isMounted, setIsMounted] = React.useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: !isDraggable,
    data: {
      type: "widget",
      sectionId,
      preview: children,
    },
  });

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (!contentRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const newHeight = Math.round(entries[0].contentRect.height);
      // Only update if changed by more than 2px to avoid infinite loops from subtle sub-pixel changes
      setIntrinsicHeight((prev) => (Math.abs(prev - newHeight) > 2 ? newHeight : prev));
    });
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, []);

  const isDropTarget =
    dashboardLayout?.activeWidgetSectionId === sectionId &&
    dashboardLayout.overWidgetId === id &&
    dashboardLayout.activeWidgetId !== id;

  const measureGridMetrics = React.useCallback((): GridMetrics => {
    const parent = wrapperRef.current?.parentElement;
    if (!parent) {
      return {
        averageTrackWidth: wrapperRef.current?.getBoundingClientRect().width ?? 0,
        columnCount: 1,
        gap: 0,
      };
    }

    const parentStyles = window.getComputedStyle(parent);
    const columns = parentStyles.gridTemplateColumns.split(" ").filter(Boolean);
    const columnCount = columns.length || 1;
    const gap = Number.parseFloat(parentStyles.columnGap || "0") || 0;
    const numericWidths = columns
      .map((value) => Number.parseFloat(value))
      .filter((value) => Number.isFinite(value) && value > 0);

    const averageTrackWidth =
      numericWidths.length > 0
        ? numericWidths.reduce((sum, width) => sum + width, 0) / numericWidths.length
        : Math.max(
            1,
            (parent.getBoundingClientRect().width - gap * Math.max(0, columnCount - 1)) / columnCount,
          );

    return {
      averageTrackWidth,
      columnCount,
      gap,
    };
  }, []);

  const setWidgetNodeRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      wrapperRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef],
  );

  React.useEffect(() => {
    const parent = wrapperRef.current?.parentElement;
    if (!parent) return;

    const updateColumnCount = () => {
      setCurrentColumnCount(measureGridMetrics().columnCount);
    };

    updateColumnCount();

    const resizeObserver = new ResizeObserver(updateColumnCount);
    resizeObserver.observe(parent);

    return () => {
      resizeObserver.disconnect();
    };
  }, [measureGridMetrics]);

  const inferCurrentSpan = React.useCallback(
    (metrics: GridMetrics) => {
      if (persistedSpan !== null) {
        return persistedSpan;
      }

      const nodeWidth = wrapperRef.current?.getBoundingClientRect().width ?? metrics.averageTrackWidth;
      const inferred = Math.round((nodeWidth + metrics.gap) / (metrics.averageTrackWidth + metrics.gap));
      return Math.max(1, Math.min(metrics.columnCount, inferred || 1));
    },
    [persistedSpan],
  );

  const activeHeight = resizingHeight ?? persistedHeight;
  const isAutoHeight = activeHeight === null;
  const finalHeight = isAutoHeight ? intrinsicHeight : activeHeight;
  const resolvedRowSpan = Math.round(finalHeight + ROW_GAP); // Spans height + gap in 1px increments

  const resolvedSpan = resizingSpan ?? persistedSpan;
  const clampedResolvedSpan =
    resolvedSpan !== null ? Math.max(1, Math.min(currentColumnCount, resolvedSpan)) : null;
  const widgetBodyHeight =
    finalHeight !== null
      ? Math.max(MIN_WIDGET_HEIGHT - 48, finalHeight - WIDGET_BODY_OFFSET)
      : null;

  const handleResizeStart = React.useCallback(
    (mode: ResizeMode) => (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const metrics = measureGridMetrics();
      const currentHeight = wrapperRef.current?.getBoundingClientRect().height ?? finalHeight;
      const currentWidth =
        wrapperRef.current?.getBoundingClientRect().width ?? metrics.averageTrackWidth;
      const currentSpan = inferCurrentSpan(metrics);
      const startX = event.clientX;
      const startY = event.clientY;
      let latestHeight = currentHeight;
      let latestSpan = currentSpan;

      setIsResizing(true);
      if (mode === "height" || mode === "both") {
        setResizingHeight(currentHeight);
      }
      if (mode === "width" || mode === "both") {
        setResizingSpan(currentSpan);
      }

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (mode === "height" || mode === "both") {
          const nextHeight = Math.max(
            MIN_WIDGET_HEIGHT,
            Math.min(MAX_WIDGET_HEIGHT, currentHeight + (moveEvent.clientY - startY)),
          );
          
          latestHeight = nextHeight;
          setResizingHeight(nextHeight);
        }

        if (mode === "width" || mode === "both") {
          const nextWidth = Math.max(metrics.averageTrackWidth, currentWidth + (moveEvent.clientX - startX));
          const nextSpan = Math.max(
            1,
            Math.min(
              metrics.columnCount,
              Math.round((nextWidth + metrics.gap) / (metrics.averageTrackWidth + metrics.gap)) || 1,
            ),
          );

          latestSpan = nextSpan;
          setResizingSpan(nextSpan);
        }
      };

      const handlePointerUp = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);

        setIsResizing(false);
        if (mode === "height" || mode === "both") {
          dashboardLayout?.setWidgetHeight(id, latestHeight);
          setResizingHeight(null);
        }
        if (mode === "width" || mode === "both") {
          dashboardLayout?.setWidgetSpan(id, metrics.columnCount, latestSpan);
          setResizingSpan(null);
        }
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    },
    [dashboardLayout, id, inferCurrentSpan, measureGridMetrics],
  );

  const handleResetResize = React.useCallback(
    (mode: ResizeMode) => (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (mode === "height" || mode === "both") {
        dashboardLayout?.setWidgetHeight(id, null);
      }
      if (mode === "width" || mode === "both") {
        dashboardLayout?.setWidgetSpan(id, currentColumnCount, null);
      }
    },
    [dashboardLayout, id, currentColumnCount],
  );

  return (
    <div
      ref={setWidgetNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isResizing ? undefined : transition,
        gridColumn:
          clampedResolvedSpan !== null ? `span ${clampedResolvedSpan} / span ${clampedResolvedSpan}` : undefined,
        gridRow: `span ${resolvedRowSpan} / span ${resolvedRowSpan}`,
        height: `${finalHeight}px`,
        marginBottom: `${ROW_GAP}px`,
        ["--dashboard-widget-height" as string]: "100%",
        ["--dashboard-widget-body-height" as string]:
          widgetBodyHeight !== null ? `${widgetBodyHeight}px` : undefined,
      }}
      className={twMerge("relative min-w-0 min-h-0 self-start", className)}
    >
      <div
        className={twMerge(
          "group/widget relative rounded-2xl transition-all duration-200 h-full",
          isDragging &&
            "z-30 scale-[0.985] opacity-45 ring-2 ring-brand-300 ring-offset-2 ring-offset-white dark:ring-brand-400/70 dark:ring-offset-slate-950",
          isResizing &&
            "ring-2 ring-brand-300 ring-offset-2 ring-offset-white dark:ring-brand-400/70 dark:ring-offset-slate-950",
          isDropTarget &&
            "ring-2 ring-brand-300 ring-offset-2 ring-offset-white dark:ring-brand-400/70 dark:ring-offset-slate-950",
        )}
      >
        <button
          type="button"
          aria-label="Reorder widget"
          className={twMerge(
            "absolute right-3 top-3 z-20 flex h-9 w-9 touch-none items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-400 shadow-sm transition hover:border-brand-300 hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:border-white/10 dark:bg-slate-900/95 dark:text-gray-500 dark:hover:border-brand-500/40 dark:hover:text-brand-300",
            !isDraggable && "hidden"
          )}
          {...(isMounted && isDraggable ? attributes : {})}
          {...(isMounted && isDraggable ? listeners : {})}
        >
          <GripVertical size={16} />
        </button>

        <div
          ref={contentRef}
          className={twMerge(
            !isAutoHeight && "h-full overflow-auto overscroll-contain [&>*]:!min-h-full",
          )}
        >
          {children}
        </div>

        {/* MS Word Style Resize Handles */}
        <div className="absolute inset-0 pointer-events-none border border-transparent rounded-2xl transition-colors" />
        

        <ResizeHandle 
          position="middle-right" 
          className={twMerge("opacity-0 group-hover/widget:opacity-100 pointer-events-auto", !isResizable && "hidden")} 
          onPointerDown={handleResizeStart("width")}
          onDoubleClick={handleResetResize("width")}
          active={isResizing}
        />

        <ResizeHandle 
          position="bottom-center" 
          className={twMerge("opacity-0 group-hover/widget:opacity-100 pointer-events-auto", !isResizable && "hidden")} 
          onPointerDown={handleResizeStart("height")}
          onDoubleClick={handleResetResize("height")}
          active={isResizing}
        />
        <ResizeHandle 
          position="bottom-right" 
          className={twMerge("opacity-0 group-hover/widget:opacity-100 pointer-events-auto", !isResizable && "hidden")} 
          onPointerDown={handleResizeStart("both")}
          onDoubleClick={handleResetResize("both")}
          active={isResizing}
        />

        {isDropTarget && (
          <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/20 dark:border-brand-400/70 dark:bg-brand-500/10" />
        )}
      </div>
    </div>
  );
}

export { rectSortingStrategy, verticalListSortingStrategy };
