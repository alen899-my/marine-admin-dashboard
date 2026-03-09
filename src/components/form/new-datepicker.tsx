"use client";

import { useRef } from 'react';
import { Calendar } from 'lucide-react';
import Label from './Label';

type PropsType = {
  id?: string;
  value?: string;           // Accepts "YYYY-MM-DD" or full ISO strings
  onChange?: (isoString: string) => void;  // Emits full ISO string
  label?: any;
  placeholder?: string;
  className?: string;
  error?: boolean;
  hint?: string;
};

/** * Forces the display to always be DD/MM/YYYY 
 * regardless of the user's computer regional settings.
 */
function toDisplayFormat(val?: string): string {
  if (!val) return "";
  // If it's just a YYYY-MM-DD string, parse it manually to avoid timezone shifts
  const parts = val.split('T')[0].split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  
  const date = new Date(val);
  if (isNaN(date.getTime())) return "";
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Convert any date string to "YYYY-MM-DD" for the hidden native input */
function toInputValue(val?: string): string {
  if (!val) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  try {
    return new Date(val).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export default function SimpleDatePicker({
  id,
  value,
  onChange,
  label,
  placeholder,
  className,
  error = false,
  hint,
}: PropsType) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value; 
    if (!raw) {
      onChange?.("");
      return;
    }
    // Convert to ISO to keep consistency with your CargoReportTable logic
    const iso = new Date(raw).toISOString();
    onChange?.(iso);
  };

  const handleContainerClick = () => {
    // This forces the native browser calendar to open
    if (inputRef.current) {
      try {
        inputRef.current.showPicker();
      } catch (err) {
        // Fallback for older browsers
        inputRef.current.focus();
      }
    }
  };

  const labelStr = typeof label === 'string' ? label : '';
  const hasAsterisk = labelStr.includes('*');
  const borderClasses = error
    ? 'border-error-500 focus-within:ring-error-500/10 dark:border-gray-700'
    : 'border-gray-300 focus-within:border-brand-300 focus-within:ring-brand-500/20 dark:border-gray-700';

  return (
    <div className="w-full">
      {label && (
        <Label htmlFor={id}>
          {hasAsterisk ? (
            <>
              {labelStr.replace('*', '').trim()} <span className="text-error-500">*</span>
            </>
          ) : (
            label
          )}
        </Label>
      )}
      
      <div 
        className={`relative group cursor-pointer rounded-lg border bg-transparent transition-all ${borderClasses} ${className || ''}`}
        onClick={handleContainerClick}
      >
        {/* VISUAL DISPLAY: This is what the user sees (forced DD/MM/YYYY) */}
        <div className="h-11 w-full px-4 py-2.5 text-sm flex items-center pointer-events-none">
          {value ? (
            <span className="text-gray-800 dark:text-white/90">
              {toDisplayFormat(value)}
            </span>
          ) : (
            <span className="text-gray-400 dark:text-white/30">
              {placeholder || 'DD/MM/YYYY'}
            </span>
          )}
        </div>

        {/* HIDDEN LOGIC: The native input is invisible but spans the whole area */}
        <input
          ref={inputRef}
          id={id}
          type="date"
          value={toInputValue(value)}
          onChange={handleChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full [color-scheme:dark]"
          style={{ appearance: 'none' }}
        />

        {/* CALENDAR ICON */}
        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <Calendar className="size-4" />
        </span>
      </div>

      {hint && (
        <p className={`mt-1.5 text-xs ${error ? 'text-error-500' : 'text-gray-500'}`}>
          {hint}
        </p>
      )}
    </div>
  );
}