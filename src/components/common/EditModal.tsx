"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { Loader2 } from "lucide-react";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: () => Promise<void> | void;
  loading?: boolean;
  children: React.ReactNode;
  maxWidth?: string;
}

const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  title,
  onSubmit,
  loading = false,
  children,
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    await onSubmit();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={`
        w-full
        max-w-[95vw]
        sm:max-w-[90vw]
        md:max-w-[720px]
        lg:max-w-[900px]
        p-4
        sm:p-6
        lg:p-8
      `}
    >
      <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
        {/* HEADER */}
        <h4 className="mb-6 shrink-0 text-lg font-medium text-gray-800 dark:text-white/90">
          {title}
        </h4>

        {/* BODY */}
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>

        {/* FOOTER */}
        <div className="mt-6 flex w-full shrink-0 items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-white/10">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            size="sm"
            type="submit"
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditModal;
