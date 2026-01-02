"use client";

import { ReactNode, useState } from "react";

type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: TooltipPosition;
}

export default function Tooltip({
  content,
  children,
  position = "top",
}: TooltipProps) {
  const [open, setOpen] = useState(false);

  const positionClasses: Record<TooltipPosition, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses: Record<TooltipPosition, string> = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-800",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-800",
    left:
      "left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-800",
    right:
      "right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-800",
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}

      {open && (
        <div
          className={`absolute z-[9999999] ${positionClasses[position]}`}
        >
          <div className="relative w-max max-w-none whitespace-nowrap rounded-lg bg-gray-900 px-4 py-2 text-theme-xs text-gray-300 shadow-tooltip dark:bg-zinc-800">
            {content}

            {/* Arrow */}
            <span
              className={`absolute h-0 w-0 border-4 border-transparent ${arrowClasses[position]}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
