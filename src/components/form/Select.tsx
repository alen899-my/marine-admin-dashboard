"use client";

import { ChevronDownIcon } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string;
  label?: string; //  Added label prop
  error?: boolean;
  hint?: string;
  disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
  value,
  label, //  Destructure label
  error = false,
  hint,
  disabled = false,
}) => {
  const [internalValue, setInternalValue] = useState<string>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    setInternalValue(val);
    onChange(val);
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === internalValue);

  return (
    <div className="w-full" ref={containerRef}>
      {/*  Render label if provided */}
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400 ml-1">
          {label.includes("*") ? (
            <>
              {label.replace("*", "").trim()} <span className="text-error-500">*</span>
            </>
          ) : (
            label
          )}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs outline-none transition-colors
            ${disabled ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800" : "bg-white dark:bg-gray-900"}
            ${error
              ? "border-error-500 focus:ring-error-500/10 dark:border-gray-700 dark:focus:border-brand-800"
              : isOpen
                ? "border-brand-300 ring-3 ring-brand-500/10 dark:border-brand-800"
                : "border-gray-300 hover:border-gray-400 dark:border-gray-700"
            }
            ${className}
          `}
          style={{ height: '44px' }}
        >
          <span className={`block truncate ${internalValue ? "text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-400"}`}>
            {selectedOption ? selectedOption.label : internalValue || placeholder}
          </span>
          <ChevronDownIcon
            size={18}
            className={`text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            style={{ minWidth: "18px" }}
          />
        </button>

        {/* DROPDOWN MENU EXACTLY LIKE SearchableSelect */}
        {isOpen && !disabled && (
          <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800 custom-scrollbar">
            {options.length > 0 ? (
              options.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`
                    cursor-pointer rounded-md px-3 py-2 text-sm transition-colors
                    ${internalValue === option.value
                      ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50"
                    }
                  `}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="py-2 text-center text-xs text-gray-400">
                No options available
              </div>
            )}
          </div>
        )}
      </div>
      {hint && (
        <p className={`mt-1.5 text-xs ${error ? "text-error-500" : "text-gray-500"}`}>
          {hint}
        </p>
      )}
    </div>
  );
};

export default Select;
