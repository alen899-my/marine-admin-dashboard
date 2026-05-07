"use client";

import React, { ReactNode } from "react";
import { AlertCircle, Info } from "lucide-react";

interface FormFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  hint,
  error,
  required = false,
  children,
  className = "",
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <Info className="w-3 h-3" />
          {hint}
        </p>
      )}
    </div>
  );
};

export default FormField;
