"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/components/ui/button/Button";

interface MonthYearPickerProps {
  month: number; // 1-12
  year: number;
  onChange: (month: number, year: number) => void;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function MonthYearPicker({ month, year, onChange }: MonthYearPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleMonthChangeOffset = (offset: number) => {
    let newMonth = month + offset;
    let newYear = year;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    onChange(newMonth, newYear);
  };

  const handleContainerClick = () => {
    if (inputRef.current) {
      try {
        inputRef.current.showPicker();
      } catch (err) {
        inputRef.current.focus();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value; // Native format is "YYYY-MM"
    if (!raw) return;
    
    const [y, m] = raw.split("-").map(Number);
    if (y && m) {
      onChange(m, y);
    }
  };

  // Convert props to standard HTML YYYY-MM
  const inputValue = `${year}-${String(month).padStart(2, "0")}`;

  return (
    <div className="relative flex items-center gap-1 h-[48px] p-1 bg-white text-gray-700 ring-1 ring-inset ring-gray-300 rounded-lg dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 transition">
      <Button
        variant="ghost"
        className="!p-1 h-full w-8 flex z-10 items-center justify-center shrink-0"
        onClick={() => handleMonthChangeOffset(-1)}
        aria-label="Previous month"
      >
        <ChevronLeft size={16} />
      </Button>

      <div 
        className="relative flex items-center justify-center h-full min-w-[130px] rounded hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer flex-1"
        onClick={handleContainerClick}
      >
        {/* VISUAL DISPLAY (What the user sees) */}
        <span className="text-sm font-semibold pointer-events-none text-gray-800 dark:text-gray-300">
          {MONTHS[month - 1]} {year}
        </span>

        {/* HIDDEN LOGIC (Native Browser Picker) */}
        <input
          ref={inputRef}
          type="month"
          value={inputValue}
          onChange={handleChange}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer [color-scheme:light_dark]"
          style={{ appearance: "none" }}
        />
      </div>

      <Button
        variant="ghost"
        className="!p-1 h-full w-8 flex z-10 items-center justify-center shrink-0"
        onClick={() => handleMonthChangeOffset(1)}
        aria-label="Next month"
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  );
}
