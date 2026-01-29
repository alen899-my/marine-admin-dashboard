"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/form/input/TextArea";
import { AlertCircle } from "lucide-react";

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title?: string;
  loading?: boolean;
}

const RejectionModal: React.FC<RejectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Reason for Rejection",
  loading = false,
}) => {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason);
    setReason(""); // Reset for next use
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-[90vw] sm:max-w-[450px] p-6 lg:p-8"
    >
      <div className="flex items-center gap-3 text-red-600 mb-4">
      
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Please provide a clear reason for rejecting this document.
        </p>

        <TextArea
          placeholder="e.g., Missing authorized signature, blurry scan, or expired date..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="w-full"
        />

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || !reason.trim()}
            className="w-full sm:w-auto"
          >
            {loading ? "Processing..." : "Confirm Rejection"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RejectionModal;