// components/form/SimpleDatePicker.tsx
import { Calendar } from 'lucide-react';
import Label from './Label';

type PropsType = {
  id?: string;
  value?: string;           // accepts both "YYYY-MM-DD" and full ISO strings
  onChange?: (isoString: string) => void;  // emits full ISO string (same as DatePicker)
  label?: any;
  placeholder?: string;
  className?: string;
  error?: boolean;
  hint?: string;
};

/** Convert any date string (ISO or YYYY-MM-DD) → "YYYY-MM-DD" for the input */
function toInputValue(val?: string): string {
  if (!val) return "";
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  // Full ISO string — take the date part
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value; // "YYYY-MM-DD" or ""
    if (!raw) {
      onChange?.("");
      return;
    }
    // Emit a full ISO string so the parent state (which stores ISO strings) stays consistent
    const iso = new Date(raw).toISOString();
    onChange?.(iso);
  };

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <input
          id={id}
          type="date"
          value={toInputValue(value)}
          onChange={handleChange}
          placeholder={placeholder}
          className={`h-11 w-full rounded-lg appearance-none px-4 py-2.5 text-sm shadow-theme-xs
            placeholder:text-gray-400 focus:outline-hidden focus:ring-3
            dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30
            bg-transparent border border-gray-300 focus:border-brand-300
            focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800
            text-gray-800 dark:[color-scheme:dark] ${className || ""}`}
        />
        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <Calendar className="size-4" />
        </span>
      </div>
      {hint && (
        <p className={`mt-1.5 text-xs ${error ? "text-error-500" : "text-gray-500"}`}>
          {hint}
        </p>
      )}
    </div>
  );
}