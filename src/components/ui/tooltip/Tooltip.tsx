"use client";

import { ReactNode, useState, useEffect } from "react";

type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: TooltipPosition;
}

export default function Tooltip({
  content,
  children,
  position: preferredPosition = "top",
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  // Default to preferred, will be corrected by useEffect
  const [coords, setCoords] = useState<TooltipPosition>(preferredPosition);

  useEffect(() => {
    const handleResize = () => {
      // If mobile, force position to 'left'
      if (window.innerWidth < 640) {
        setCoords("left");
      } else {
        setCoords(preferredPosition);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [preferredPosition]);

  const positionClasses: Record<TooltipPosition, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses: Record<TooltipPosition, string> = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-zinc-800",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-zinc-800",
    left: "left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-zinc-800",
    right: "right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-zinc-800",
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      // Added for mobile accessibility
      onClick={() => setOpen(!open)}
    >
      {children}

      {open && (
        <div className={`absolute z-[999999] ${positionClasses[coords]}`}>
          <div className="relative w-max max-w-[150px] sm:max-w-[250px] whitespace-normal break-words rounded-lg bg-gray-900 px-3 py-2 text-[11px] leading-tight text-gray-300 shadow-xl dark:bg-zinc-800">
            {content}

            {/* Arrow */}
            <span
              className={`absolute h-0 w-0 border-4 border-transparent ${arrowClasses[coords]}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}