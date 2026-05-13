"use client";
import React from "react";
import { Modal } from "../ui/modal";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  variant?: "warning" | "danger" | "success" | "info";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  loading = false,
  variant = "warning",
}: ConfirmModalProps) {
  
  // Dynamic Styles based on Variant
  const variants = {
    warning: {
      icon: "fill-warning-600 dark:fill-orange-400",
      button: "bg-warning-500 hover:bg-warning-600",
      path: <path d="M32.1445 19.0002C32.1445 26.2604 26.2589 32.146 18.9987 32.146C11.7385 32.146 5.85287 26.2604 5.85287 19.0002C5.85287 11.7399 11.7385 5.85433 18.9987 5.85433C26.2589 5.85433 32.1445 11.7399 32.1445 19.0002ZM18.9987 35.146C27.9158 35.146 35.1445 27.9173 35.1445 19.0002C35.1445 10.0831 27.9158 2.85433 18.9987 2.85433C10.0816 2.85433 2.85287 10.0831 2.85287 19.0002C2.85287 27.9173 10.0816 35.146 18.9987 35.146ZM21.0001 26.0855C21.0001 24.9809 20.1047 24.0855 19.0001 24.0855L18.9985 24.0855C17.894 24.0855 16.9985 24.9809 16.9985 26.0855C16.9985 27.19 17.894 28.0855 18.9985 28.0855L19.0001 28.0855C20.1047 28.0855 21.0001 27.19 21.0001 26.0855ZM18.9986 10.1829C19.827 10.1829 20.4986 10.8545 20.4986 11.6829L20.4986 20.6707C20.4986 21.4992 19.827 22.1707 18.9986 22.1707C18.1701 22.1707 17.4986 21.4992 17.4986 20.6707L17.4986 11.6829C17.4986 10.8545 18.1701 10.1829 18.9986 10.1829Z" />
    },
    danger: {
      icon: "fill-error-600 dark:fill-error-500",
      button: "bg-error-500 hover:bg-error-600",
      path: <path d="M9.62684 11.7496C9.04105 11.1638 9.04105 10.2141 9.62684 9.6283C10.2126 9.04252 11.1624 9.04252 11.7482 9.6283L18.9985 16.8786L26.2485 9.62851C26.8343 9.04273 27.7841 9.04273 28.3699 9.62851C28.9556 10.2143 28.9556 11.164 28.3699 11.7498L21.1198 18.9999L28.3699 26.25C28.9556 26.8358 28.9556 27.7855 28.3699 28.3713C27.7841 28.9571 26.8343 28.9571 26.2485 28.3713L18.9985 21.1212L11.7482 28.3715C11.1624 28.9573 10.2126 28.9573 9.62684 28.3715C9.04105 27.7857 9.04105 26.836 9.62684 26.2502L16.8771 18.9999L9.62684 11.7496Z" />
    }
  };

  const style = variants[variant === "danger" ? "danger" : "warning"];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-6 lg:p-10">
      <div className="text-center">
        <div className="mb-7 flex items-center justify-center">
          <svg className={style.icon} width="44" height="44" viewBox="0 0 38 38" fill="none">
            {style.path}
          </svg>
        </div>

        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">{title}</h4>
        <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>

        <div className="flex items-center justify-center gap-3 mt-8">
          <button onClick={onClose} className="w-full px-5 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className={`w-full px-5 py-3 text-sm font-medium text-white rounded-lg ${style.button}`}>
            {loading ? "updating..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
