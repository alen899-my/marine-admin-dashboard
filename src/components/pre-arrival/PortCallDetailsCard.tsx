"use client";
import React, { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import { formatDate } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

interface PortCallDetailsCardProps {
  data: any;
}

export default function PortCallDetailsCard({ data }: PortCallDetailsCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!data) return null;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <div>
          <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Port Call Request
          </span>
          {!isOpen && (
            <span className="ml-3 text-xs text-gray-400 dark:text-muted">
              {data.vesselId?.name || "N/A"} · {data.portName} 
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
        )}
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-100 dark:border-white/5">
          <div className="space-y-6 mt-4">
            {/* Info Grid - 3 Equal Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {/* Column 1: Vessel & Voyage */}
              <div className="space-y-5">
                <div>
                  <Label className="text-muted text-[11px] capitalize tracking-wider">Vessel Name</Label>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-normal break-words leading-tight">
                    {data.vesselId?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted text-[11px] capitalize tracking-wider">Port Agent</Label>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-normal break-words leading-tight">
                    {data.agentContact || "N/A"}
                  </p>
                </div>
              </div>

              {/* Column 2: Port & Logistics */}
              <div className="space-y-5">
                <div>
                  <Label className="text-muted text-[11px] capitalize tracking-wider">Port Name</Label>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-normal break-words leading-tight">
                    {data.portName}
                  </p>
                </div>
                <div>
                  <Label className="text-muted text-[11px] capitalize tracking-wider">ETA Arrival</Label>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-normal break-words leading-tight">
                    {formatDate(data.eta)}
                  </p>
                </div>
              </div>

              {/* Column 3: Timeline & ID */}
              <div className="space-y-5">
                <div>
                  <Label className="text-muted text-[11px] capitalize tracking-wider">Request ID</Label>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-normal break-words leading-tight">
                    {data.requestId}
                  </p>
                </div>
                <div>
                  <Label className="text-muted text-[11px] capitalize tracking-wider">Submission Due</Label>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-normal break-words leading-tight">
                    {formatDate(data.dueDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Note Section */}
            <div>
              <Label className="text-muted text-[11px] uppercase tracking-wider">Notes / Instructions</Label>
              
                <p className="text-sm text-gray-500 dark:text-muted italic leading-relaxed">
                  {data.notes || "No special instructions provided for this port call."}
                </p>
            
            </div>
          </div>
        </div>
      )}
    </div>
  );
}