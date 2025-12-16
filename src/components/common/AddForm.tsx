"use client";

import React from "react";
import Button from "@/components/ui/button/Button";

type AddFormProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  onCancel?: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
};

export default function AddForm({
  title,
  description,
  children,
  onCancel,
  onSubmit,
  submitLabel = "Submit",
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
          <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base mt-1">
            {description}
          </p>
        )}
      </div>

      {/* FORM CONTENT */}
      {children}

      {/* ACTIONS */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}

        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
