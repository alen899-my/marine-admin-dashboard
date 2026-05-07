"use client";

import React from "react";
import Button from "@/components/ui/button/Button";

type AddFormProps = {
  title: string;
  description?: string;
  descriptionError?: boolean;
  children: React.ReactNode;
  onCancel?: () => void;
  onSubmit?: () => unknown | Promise<unknown>;
  submitLabel?: string;
  actions?: React.ReactNode;
};

export default function AddForm({
  title,
  description,
  descriptionError,
  children,
  onCancel,
  onSubmit,
  submitLabel = "Submit",
  actions,
}: AddFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* HEADER */}
      <div>
        <h4 className="text-xl font-medium text-gray-800 dark:text-white/90">
          {title}
        </h4>
        {description && (
          <p
            className={`text-sm sm:text-base mt-1 ${
              descriptionError
                ? "text-error-600 border-l-2 border-error-600 pl-2"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {description}
          </p>
        )}
      </div>

      {/* FORM CONTENT */}
      {children}

      {/* ACTIONS */}
      {actions ? (
        <div className="flex flex-wrap justify-end gap-3">{actions}</div>
      ) : (
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}

          <Button type="submit">{submitLabel}</Button>
        </div>
      )}
    </form>
  );
}
