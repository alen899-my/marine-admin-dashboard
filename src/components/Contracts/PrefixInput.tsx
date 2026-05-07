import React from 'react';
import Label from '../form/Label';
import Input from '../form/input/InputField';
import Button from '../ui/button/Button';

export interface PrefixInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  prefix: string;
  label?: string;
  showTypeSelector?: boolean;
  valueType?: 'amount' | 'percent';
  onTypeChange?: (type: 'amount' | 'percent') => void;
  error?: boolean;
  hint?: string;
}

export function PrefixInput({
  prefix,
  label,
  showTypeSelector = false,
  valueType = 'amount',
  onTypeChange,
  error,
  hint,
  ...props
}: PrefixInputProps) {
  return (
    <div className="w-full space-y-2">
      {label && (
        <Label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
          {label}
        </Label>
      )}
      <div className={`flex rounded-lg overflow-hidden border transition shadow-theme-xs focus-within:ring-3 focus-within:ring-brand-500/10 focus-within:border-brand-300 dark:focus-within:border-brand-800 ${
        props.disabled 
          ? 'border-gray-300 dark:border-gray-700 cursor-not-allowed' 
          : error 
            ? 'border-red-500 dark:border-red-500/50 bg-red-50/10' 
            : 'border-gray-300 dark:border-gray-700 bg-transparent'
      }`}>
      <div className={`flex items-center border-r ${
        props.disabled 
          ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700' 
          : error 
            ? 'bg-red-50 dark:bg-red-500/10 border-red-500 dark:border-red-500/50' 
            : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
      }`}>
        {showTypeSelector ? (
          <div className="flex p-[3px] mx-1.5 bg-gray-100/80 dark:bg-gray-900/40 rounded-md shadow-[inset_0px_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-inset ring-gray-200/60 dark:ring-gray-700/50">
            <button
              type="button"
              disabled={props.disabled}
              onClick={() => onTypeChange?.('amount')}
              className={`relative flex items-center justify-center px-3.5 py-1 text-sm font-semibold rounded-[4px] transition-all duration-300 ease-out select-none ${
                valueType === 'amount'
                  ? 'bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 shadow-[0_2px_5px_rgba(0,0,0,0.08)] ring-1 ring-gray-200/80 dark:ring-white/10 z-10'
                  : 'text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95'
              }`}
            >
              {prefix}
            </button>
            <button
              type="button"
              disabled={props.disabled}
              onClick={() => onTypeChange?.('percent')}
              className={`relative flex items-center justify-center px-3.5 py-1 text-sm font-semibold rounded-[4px] transition-all duration-300 ease-out select-none ${
                valueType === 'percent'
                  ? 'bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 shadow-[0_2px_5px_rgba(0,0,0,0.08)] ring-1 ring-gray-200/80 dark:ring-white/10 z-10'
                  : 'text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95'
              }`}
            >
              %
            </button>
          </div>
        ) : (
          <span className={`px-4 text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap`}>
            {prefix}
          </span>
        )}
      </div>
      <div className="flex-1 flex items-center">
        <Input
          {...(props as any)}
          disabled={props.disabled}
          className={`flex-1 w-full text-sm outline-none appearance-none placeholder:text-gray-400 dark:placeholder:text-white/30 dark:[color-scheme:dark] !border-0 !ring-0 !shadow-none !rounded-none !bg-transparent dark:!bg-transparent ${
            props.disabled
              ? "text-gray-500 dark:text-gray-400 cursor-not-allowed"
              : "text-gray-800 dark:text-white/90"
          }`}
        />
      </div>
      </div>
      {hint && (
        <p className={`mt-1 text-xs ${error ? 'text-red-500' : 'text-gray-500'}`}>
          {hint}
        </p>
      )}
    </div>
  );
}
