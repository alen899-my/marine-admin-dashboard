import React from "react";

export function SkeletonKPI() {
  return (
    <div className="flex flex-col justify-between min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-gray-800 shrink-0" />
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800 mt-1" />
        </div>
      </div>
      <div className="h-8 w-16 rounded bg-gray-200 dark:bg-gray-800 mt-4" />
      <div className="flex items-end justify-between mt-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-10 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
        <div className="h-[38px] w-24 rounded bg-gray-100 dark:bg-gray-800/50" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5, title }: { rows?: number; cols?: number; title?: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
      {title && <div className="mb-4 h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />}
      <div className="space-y-3">
        <div className={`grid gap-3 pb-3 border-b border-gray-100 dark:border-gray-800`}
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-3 bg-gray-100 dark:bg-gray-800 rounded" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={`grid gap-3 py-3 border-b border-gray-50 dark:border-gray-800/50 last:border-0`}
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
