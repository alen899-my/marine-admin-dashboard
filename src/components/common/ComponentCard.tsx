import React from "react";

interface ComponentCardProps {
  title?: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string; // New Prop
  desc?: string;
  action?: React.ReactNode;
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  headerClassName = "px-4 py-3", // Reduced by 1 step from previous px-5 py-4
  desc = "",
  action,
}) => {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {/* Card Header */}
      {(title || action) && (
        // Apply the headerClassName here instead of hardcoded px-6 py-5
        <div className={headerClassName}>
          {/* Use flex-col for mobile, row for desktop to accommodate large Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            
            {/* Title & Description Wrapper */}
            <div className="flex-1">
              {typeof title === "string" ? (
                <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
                  {title}
                </h3>
              ) : (
                // Render component directly (e.g., Filters)
                <div className="w-full">{title}</div>
              )}
              
              {desc && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {desc}
                </p>
              )}
            </div>

            {/* Action Area */}
            {action && <div className="shrink-0">{action}</div>}
            
          </div>
        </div>
      )}

      {/* Card Body */}
      <div className="p-2  border-gray-100 dark:border-gray-800 sm:p-4">
        {/* Padding reduced: p-3 -> p-2 and sm:p-5 -> sm:p-4 */}
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
};

export default ComponentCard;