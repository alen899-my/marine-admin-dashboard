"use client";

import React, { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";
import Avatar from "@/components/ui/avatar/Avatar";
import { formatCurrency } from "@/lib/formatCurrency";

interface CurrencySettings {
  currencySymbol: string;
  currencyCode: string;
  currencyPosition: "left" | "right";
  currencyFormatType: "symbol" | "code";
  currencySpace: boolean;
}

interface PayrollEntry {
  id: string;
  name: string;
  rank: string;
  monthYear: string;
  netPayable: number;
  status: string;
  profilePhoto: string | null;
}

interface PayrollApprovalQueueProps {
  data: PayrollEntry[];
  currencySettings?: CurrencySettings;
}

const defaultCurrencySettings: CurrencySettings = {
  currencySymbol: "$",
  currencyCode: "USD",
  currencyPosition: "left",
  currencyFormatType: "symbol",
  currencySpace: true,
};

export default function PayrollApprovalQueue({ 
  data: initialData, 
  currencySettings = defaultCurrencySettings 
}: PayrollApprovalQueueProps) {
  const [data, setData] = useState(initialData);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  const handleAction = async (id: string, action: "verify" | "approve") => {
    try {
      setProcessingId(id);
      const res = await fetch("/api/payroll", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id], action }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Failed to ${action} payroll`);
      }

      toast.success(`Payroll ${action === "verify" ? "verified" : "approved"} successfully`);
      
      // Update local state to remove the item from the queue
      setData(prev => prev.filter(item => item.id !== id));
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "saved":
        return <Badge color="blue">Saved</Badge>;
      case "captain_verified":
        return <Badge color="warning">Capt. Verified</Badge>;
      case "finance_approved":
        return <Badge color="success">Approved</Badge>;
      default:
        return <Badge color="gray">{status}</Badge>;
    }
  };

  return (
    <div className="min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/50">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 block">
        Payroll Approval Queue
      </span>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">Seafarer</th>
              <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">Rank</th>
              <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">Period</th>
              <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">Net Payable</th>
              <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">Status</th>
              
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {data.map((item) => (
              <tr key={item.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="py-4 px-2">
                  <div className="flex items-center gap-3">
                    <Avatar src={item.profilePhoto} name={item.name} size="small" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</span>
                  </div>
                </td>
                <td className="py-4 px-2 text-sm text-gray-600 dark:text-gray-400">{item.rank}</td>
                <td className="py-4 px-2 text-sm text-gray-600 dark:text-gray-400">{item.monthYear}</td>
                <td className="py-4 px-2 text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(item.netPayable, currencySettings.currencyCode, { currencySettings })}
                </td>
                <td className="py-4 px-2">{getStatusBadge(item.status)}</td>
               
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-gray-500">
                  No payrolls awaiting approval.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
