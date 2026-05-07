"use client";

import { useCountUp } from "@/hooks/useCountUp";
import { TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import React from "react";
import { ResizeHandle } from "./ResizeHandle";
import { useDashboardLayout } from "./DashboardLayoutContext";
import { twMerge } from "tailwind-merge";

// ─── Sparkline SVG ──────────────────────────────────────────────────────────
const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 40;
  const padding = 2;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - padding * 2) - padding;
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`M ${points.join(" L ")}`}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`M ${points.join(" L ")} L ${width},${height} L 0,${height} Z`}
        fill={`url(#grad-${color})`}
      />
    </svg>
  );
};

// ─── Metric Card Component ───────────────────────────────────────────────────
interface MetricCardProps {
  id?: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  value: number;
  trend: number;
  sparkline: number[];
  path: string;
  className?: string;
}

export function MetricCard({
  id,
  icon,
  iconBg,
  title,
  value,
  trend,
  sparkline,
  path,
  className,
}: MetricCardProps) {
  const displayValue = useCountUp(value);
  const isPositive = trend >= 0;
  const trendColor = isPositive ? "#10b981" : "#ef4444"; // emerald vs red
  
  const dashboardLayout = useDashboardLayout();
  const [currentColumnCount, setCurrentColumnCount] = React.useState(1);
  const persistedHeight = id ? dashboardLayout?.getWidgetHeight(id) : null;
  const persistedSpan = id ? dashboardLayout?.getWidgetSpan(id, currentColumnCount) : null;
  const [resizingHeight, setResizingHeight] = React.useState<number | null>(null);
  const [resizingSpan, setResizingSpan] = React.useState<number | null>(null);
  const [isResizing, setIsResizing] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);

  // Measure grid columns
  React.useEffect(() => {
    const parent = wrapperRef.current?.parentElement;
    if (!parent) return;

    const updateColumnCount = () => {
      const parentStyles = window.getComputedStyle(parent);
      const columns = parentStyles.gridTemplateColumns.split(" ").filter(Boolean);
      setCurrentColumnCount(columns.length || 1);
    };

    updateColumnCount();
    const resizeObserver = new ResizeObserver(updateColumnCount);
    resizeObserver.observe(parent);
    return () => resizeObserver.disconnect();
  }, []);

  const handleResizeStart = (mode: "height" | "width" | "both") => (event: React.PointerEvent) => {
    if (!id) return;
    event.preventDefault();
    event.stopPropagation();

    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = rect.width;
    const startHeight = rect.height;
    
    // Grid metrics for span calculation
    const parent = wrapperRef.current?.parentElement;
    const parentStyles = parent ? window.getComputedStyle(parent) : null;
    const gap = parentStyles ? parseFloat(parentStyles.columnGap || "0") : 0;
    const columnCount = currentColumnCount;
    const trackWidth = ((parent?.getBoundingClientRect().width ?? 0) - (gap * (columnCount - 1))) / columnCount;

    setIsResizing(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (mode === "height" || mode === "both") {
        const nextHeight = Math.max(120, startHeight + (moveEvent.clientY - startY));
        setResizingHeight(nextHeight);
      }
      if (mode === "width" || mode === "both") {
        const nextWidth = Math.max(trackWidth, startWidth + (moveEvent.clientX - startX));
        const nextSpan = Math.max(1, Math.min(columnCount, Math.round((nextWidth + gap) / (trackWidth + gap))));
        setResizingSpan(nextSpan);
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      
      setIsResizing(false);

      // We need to capture the values from the state at the time of release
      // However, since handlePointerMove was updating state, we should use the state values if they exist
      setResizingHeight((prevHeight) => {
        if (prevHeight !== null && (mode === "height" || mode === "both")) {
          dashboardLayout?.setWidgetHeight(id, prevHeight);
        }
        return null;
      });

      setResizingSpan((prevSpan) => {
        if (prevSpan !== null && (mode === "width" || mode === "both")) {
          dashboardLayout?.setWidgetSpan(id, currentColumnCount, prevSpan);
        }
        return null;
      });
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const resolvedHeight = resizingHeight ?? persistedHeight;
  const resolvedSpan = resizingSpan ?? persistedSpan;
  const clampedResolvedSpan = (resolvedSpan !== null && resolvedSpan !== undefined) ? Math.max(1, Math.min(currentColumnCount, resolvedSpan)) : null;

  return (
    <div 
      ref={wrapperRef}
      className={twMerge("relative group/metric h-full", className)}
      style={{
        gridColumn: clampedResolvedSpan ? `span ${clampedResolvedSpan} / span ${clampedResolvedSpan}` : undefined,
        height: resolvedHeight ? `${resolvedHeight}px` : undefined,
      }}
    >
      <Link
        href={path}
        className={twMerge(
          "block overflow-auto h-full min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] dark:hover:border-brand-500/50",
          isResizing && "ring-2 ring-brand-300 ring-offset-2 ring-offset-white dark:ring-brand-400/70 dark:ring-offset-slate-950"
        )}
      >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${iconBg}`}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-brand-500 transition-colors line-clamp-1">
              {title}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {displayValue}
        </h3>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{Math.abs(trend)}%</span>
          </div>
          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            vs last week
          </span>
        </div>

        <div className="h-10 w-24">
          <Sparkline data={sparkline} color={trendColor} />
        </div>
      </div>
      </Link>

      {/* MS Word Style Resize Handles */}
      {id && (
        <>
          <div className="absolute inset-0 pointer-events-none border border-transparent rounded-2xl transition-colors" />
          

          <ResizeHandle 
            position="middle-right" 
            className="opacity-0 group-hover/metric:opacity-100" 
            onPointerDown={handleResizeStart("width")}
            active={isResizing}
          />

          <ResizeHandle 
            position="bottom-center" 
            className="opacity-0 group-hover/metric:opacity-100" 
            onPointerDown={handleResizeStart("height")}
            active={isResizing}
          />
          <ResizeHandle 
            position="bottom-right" 
            className="opacity-0 group-hover/metric:opacity-100" 
            onPointerDown={handleResizeStart("both")}
            active={isResizing}
          />
        </>
      )}
    </div>
  );
}
