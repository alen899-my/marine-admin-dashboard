"use client";

import React from "react";
import { twMerge } from "tailwind-merge";

type HandlePosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

interface ResizeHandleProps {
  position: HandlePosition;
  active?: boolean;
  onPointerDown?: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onDoubleClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

const POSITION_CLASSES: Record<HandlePosition, string> = {
  "top-left": "top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
  "top-center": "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize",
  "top-right": "top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
  "middle-left": "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
  "middle-right": "top-1/2 right-0 translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
  "bottom-left": "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
  "bottom-center": "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize",
  "bottom-right": "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
};

/**
 * ResizeHandle component that mimics the MS Word shape adjustment handles.
 * Small squares positioned on the border of a card.
 */
export function ResizeHandle({
  position,
  active = false,
  onPointerDown,
  onDoubleClick,
  className,
}: ResizeHandleProps) {
  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      className={twMerge(
        "absolute z-30 h-3 w-3 bg-white border-2 border-gray-400 shadow-md transition-all duration-150",
        "hover:scale-125 hover:border-brand-500 hover:z-40 hover:bg-brand-50",
        "focus:outline-none focus:ring-2 focus:ring-brand-500",
        active && "border-brand-500 bg-brand-50 scale-125 ring-2 ring-brand-300/50",
        POSITION_CLASSES[position],
        className
      )}
      aria-label={`Resize from ${position}`}
    />
  );
}
