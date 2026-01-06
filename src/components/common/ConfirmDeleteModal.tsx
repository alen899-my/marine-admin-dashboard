"use client";

import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { Loader2, Trash2 } from "lucide-react";
import React from "react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title?: string;
  description?: React.ReactNode;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  title = "Delete Confirmation",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={`
        w-full
        max-w-[90vw]
        sm:max-w-[400px]
        md:max-w-[420px]
        p-4
        sm:p-6
        lg:p-8
      `}
    >
      {/* HEADER */}
      <div className="flex items-center gap-3 text-red-600">
        <Trash2 size={20} />
        <h2 className="text-base sm:text-lg font-semibold">{title}</h2>
      </div>

      {/* DESCRIPTION */}
      <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-300">
        {description}
      </p>

      {/* FOOTER */}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>

        <Button
          variant="destructive" // This handles red-600, red-700 on hover, and red-400 when disabled
          onClick={onConfirm}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Deleting...</span>
            </>
          ) : (
            "Delete"
          )}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteModal;
