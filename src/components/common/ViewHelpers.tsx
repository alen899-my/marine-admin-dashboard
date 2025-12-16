import React from "react";

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
      <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
        {title}
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function Item({
  label,
  value,
  full = false,
}: {
  label: string;
  // Fixed: Replaced 'any' with 'React.ReactNode' for type safety
  value?: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 break-words font-medium text-gray-800 dark:text-gray-100">
        {value ?? "-"}
      </p>
    </div>
  );
}