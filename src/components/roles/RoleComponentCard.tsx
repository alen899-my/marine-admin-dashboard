import React from "react";

interface RoleComponentCardProps {
  title?: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
  desc?: string;
  action?: React.ReactNode;
  legend?: React.ReactNode; 
}

const RoleComponentCard: React.FC<RoleComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
  action,
  legend, 
}) => {
  return (
    <div
      className={`rounded-xl  ${className}`}
    >
      {/* Card Header */}
      {(title || action || legend) && (
        <div className="px-4 py-3  dark:">
          {/* ✅ RESPONSIVE FIX: flex-col on mobile, flex-row on small screens and up */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            
            {/* Title & Description */}
            <div className="flex-1">
              {typeof title === "string" ? (
                <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 tracking-wide">
                  {title}
                </h3>
              ) : (
                <div className="w-full">{title}</div>
              )}
              
              {desc && (
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-tight">
                  {desc}
                </p>
              )}
            </div>

            {/* ✅ Wrapper for Legend & Action (Aligned Right on Desktop, Left on Mobile) */}
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              {legend && <div>{legend}</div>}
              {action && <div>{action}</div>}
            </div>
            
          </div>
        </div>
      )}

      {/* Card Body */}
      <div className="p-3">
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
};

export default RoleComponentCard;