"use client";

import { ChevronDown, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  className = "",
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // The text displayed in the input box
  const [inputValue, setInputValue] = useState("");
  
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Sync Input Display with Selected Value
  // When the parent passes a new value (e.g. "AN16"), we find the label ("AN16") to show in the text box.
  useEffect(() => {
    const selectedOption = options.find((opt) => opt.value === value);
    if (selectedOption) {
      setInputValue(selectedOption.label);
    } else if (!value) {
      setInputValue("");
    }
  }, [value, options]);

  // 2. Handle Outside Click
  // If user clicks away, reset the text to match the currently selected value (undo typing)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // On blur, revert text to the actual selected value
        const selectedOption = options.find((opt) => opt.value === value);
        setInputValue(selectedOption ? selectedOption.label : "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, options]);

  // 3. Filter Options based on what the user typed
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    // The useEffect above will update the input text automatically
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    
    // Optional: If you want to clear the selection when they start typing new text
    if (value) onChange(""); 
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* INPUT FIELD (Acts as the trigger) */}
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onClick={() => !disabled && setIsOpen(true)}
          className={`
            h-11 w-full rounded-lg border px-4 py-2.5 pr-10 text-sm shadow-theme-xs outline-none transition-colors
            placeholder:text-gray-400 
            ${disabled ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800" : "bg-white text-gray-800 dark:bg-gray-900 dark:text-white/90"}
            ${
              isOpen
                ? "border-brand-300 ring-3 ring-brand-500/10 dark:border-brand-800"
                : "border-gray-300 dark:border-gray-700"
            }
          `}
        />

        {/* Icons Area */}
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {/* Clear "X" Button (only if there is text) */}
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                setInputValue("");
              }}
              className="rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
            >
              <X size={14} />
            </button>
          )}
          
          {/* Chevron */}
          <ChevronDown
            size={18}
            className={`pointer-events-none text-gray-500 transition-transform duration-200 dark:text-gray-400 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* DROPDOWN MENU */}
      {isOpen && !disabled && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800 custom-scrollbar">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`
                  cursor-pointer rounded-md px-3 py-2 text-sm transition-colors
                  ${
                    value === option.value
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
              No matching results
            </div>
          )}
        </div>
      )}
    </div>
  );
}