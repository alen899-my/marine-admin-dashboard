"use client";

import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import { formatDate } from "@/lib/utils";

interface PortCallDetailsCardProps {
  data: any;
}

export default function PortCallDetailsCard({ data }: PortCallDetailsCardProps) {
  if (!data) return null;

  return (
    <ComponentCard title="Port Call Request" desc="">
      <div className="space-y-6">
        {/* Info Grid - 3 Equal Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          
          {/* Column 1: Vessel & Voyage */}
          <div className="space-y-5">
            <div>
              <Label className="text-muted text-[11px] capitalize tracking-wider">Vessel Name</Label>
              <p className="text-sm text-gray-900 dark:text-white whitespace-normal break-words leading-tight ">
                {data.vesselId?.name || "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-muted text-[11px] capitalize tracking-wider">Port Agent</Label>
              <p className="text-sm text-gray-900 dark:text-white whitespace-normal break-words leading-tight ">
                {data.agentContact || "N/A"}
              </p>
            </div>
          </div>

          {/* Column 2: Port & Logistics */}
          <div className="space-y-5">
            <div>
              <Label className="text-muted text-[11px] capitalize tracking-wider">Port Name</Label>
              <p className="text-sm text-gray-900 dark:text-white whitespace-normal break-words leading-tight ">
                {data.portName}
              </p>
            </div>
             <div>
                <Label className="text-muted text-[11px] capitalize tracking-wider">ETA Arrival</Label>
                <p className="text-sm text-gray-900 dark:text-white whitespace-normal break-words leading-tight ">
                  {formatDate(data.eta)}
                </p>
              </div>
          </div>

          {/* Column 3: Timeline & ID */}
          <div className="space-y-5">
            <div>
              <Label className="text-muted text-[11px] capitalize tracking-wider">Request ID</Label>
              <p className="text-sm text-gray-900 dark:text-white whitespace-normal break-words leading-tight ">
                {data.requestId}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
           
              <div>
                <Label className="text-muted text-[11px] capitalize tracking-wider">Submission Due</Label>
                <p className="text-sm text-gray-900 dark:text-white whitespace-normal break-words leading-tight ">
                  {formatDate(data.dueDate)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note Section - Full Width Row */}
        <div className="">
          <Label className="text-muted text-[11px] uppercase tracking-wider">Notes / Instructions</Label>
          <div className="mt-2 p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl">
            <p className="text-sm text-gray-600 dark:text-muted italic leading-relaxed">
              {data.notes || "No special instructions provided for this port call."}
            </p>
          </div>
        </div>
      </div>
    </ComponentCard>
  );
}