"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface SearchableMultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

export default function SearchableMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  disabled = false,
  error = false,
}: SearchableMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOptions = useMemo(
    () => options.filter((option) => value.includes(option.value)),
    [options, value],
  );

  const filteredOptions = useMemo(
    () =>
      options.filter((option) =>
        option.label.toLowerCase().includes(search.toLowerCase()),
      ),
    [options, search],
  );

  const toggleValue = (nextValue: string) => {
    if (value.includes(nextValue)) {
      onChange(value.filter((item) => item !== nextValue));
      return;
    }
    onChange([...value, nextValue]);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={`min-h-11 rounded-lg border px-3 py-2 shadow-theme-xs ${
          disabled
            ? "cursor-not-allowed bg-gray-100 dark:bg-gray-800"
            : "bg-white dark:bg-gray-900"
        } ${
          error
            ? "border-red-500"
            : isOpen
              ? "border-brand-300 ring-3 ring-brand-500/10 dark:border-brand-800"
              : "border-gray-300 dark:border-gray-700"
        }`}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
            >
              {option.label}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleValue(option.value);
                }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            value={search}
            disabled={disabled}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={selectedOptions.length ? "" : placeholder}
            className="min-w-[180px] flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 dark:text-white/90"
          />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800 custom-scrollbar">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const selected = value.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleValue(option.value)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                    selected
                      ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <span>{option.label}</span>
                  {selected && <span className="text-xs font-medium">Selected</span>}
                </button>
              );
            })
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
