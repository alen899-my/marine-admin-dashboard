"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: any[];
  title: string;
}

export default function HistoryModal({ isOpen, onClose, history, title }: HistoryModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[600px] p-4 sm:p-6 lg:p-8"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h4 className="text-base sm:text-lg text-gray-800 dark:text-white/90">
          {title}
        </h4>
        <div className="p-1.5 bg-brand-500/10 rounded-lg">
          <MessageSquare className="h-4 w-4 text-brand-500" />
        </div>
      </div>

      <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5 dark:border-white/10 dark:bg-gray-800/50 custom-scrollbar">
        {history && history.length > 0 ? (
          <div className="space-y-4">
            {history.map((log: any, i: number) => {
              // ✅ LEFT SIDE: Office/Admin | RIGHT SIDE: Ship
              const isAdmin = log.role === "admin" || log.role === "super-admin";
              
              return (
                <div key={i} className={`flex w-full ${isAdmin ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[85%] p-3 rounded-xl text-[13px] shadow-sm ${
                    isAdmin 
                      ? "bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/5 rounded-tl-none text-gray-700 dark:text-gray-200" 
                      : "bg-brand-600 text-white rounded-tr-none"
                  }`}>
                    <p className="leading-6">{log.message}</p>
                    <div className={`flex justify-between items-center gap-4 mt-2 opacity-60 text-[10px] font-bold uppercase tracking-wider ${isAdmin ? "text-gray-500" : "text-brand-100"}`}>
                      <span>{isAdmin ? "Office" : "Ship"}</span>
                      <span>{formatDate(log.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400 italic text-sm">
            No history available for this document.
          </div>
        )}
      </div>

      <div className="mt-5 flex justify-end">
        <button 
          onClick={onClose}
          className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}