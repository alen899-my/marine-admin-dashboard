"use client";

import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Avatar from "@/components/ui/avatar/Avatar";

interface CrewMember {
  _id: string;
  name: string;
  profilePhoto: string | null;
  rank: string;
  vesselName: string;
  crewStatus: string;
  contractEnd?: string | null;
}

interface CrewStatusTableProps {
  crewList: CrewMember[];
}

type CrewStatusBadgeColor =
  | "green"
  | "sky"
  | "indigo"
  | "purple"
  | "rose"
  | "amber"
  | "slate"
  | "orange"
  | "gray"
  | "default";

const statusColorMap: Record<string, CrewStatusBadgeColor> = {
  onboard: "green",
  vacation: "sky",
  available: "indigo",
  traveling: "purple",
  medical_leave: "rose",
  training: "amber",
  inactive: "slate",
  resigned: "orange",
  blacklisted: "gray",
};

export default function CrewStatusTable({ crewList }: CrewStatusTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: "contractEnd";
    direction: "asc" | "desc" | null;
  }>({ key: "contractEnd", direction: null });

  const sortedCrew = useMemo(() => {
    const sortableItems = [...crewList];
    if (sortConfig.direction !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key] ? new Date(a[sortConfig.key]!).getTime() : 0;
        const bVal = b[sortConfig.key] ? new Date(b[sortConfig.key]!).getTime() : 0;

        if (aVal < bVal) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [crewList, sortConfig]);

  const groupedCrew = useMemo(() => {
    const groups: Record<string, CrewMember[]> = {};
    sortedCrew.forEach((crew) => {
      if (!groups[crew.crewStatus]) {
        groups[crew.crewStatus] = [];
      }
      groups[crew.crewStatus].push(crew);
    });
    return groups;
  }, [sortedCrew]);

  const requestSort = () => {
    let direction: "asc" | "desc" | null = "asc";
    if (sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.direction === "desc") {
      direction = null;
    }
    setSortConfig({ key: "contractEnd", direction });
  };

  const getSortIcon = () => {
    if (sortConfig.direction === "asc") return <ChevronUp size={14} />;
    if (sortConfig.direction === "desc") return <ChevronDown size={14} />;
    return <ArrowUpDown size={14} />;
  };

  return (
    <div className="min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/50 flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
          Crew List by Status
        </span>
        <Link href="/crews" className="text-sm text-brand-500 hover:text-brand-600 font-medium">
          View More
        </Link>
      </div>
      <div className="overflow-auto flex-1 pr-1 -mr-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">Name</th>
              <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">Rank</th>
              <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">Vessel</th>
              <th 
                className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 text-right cursor-pointer hover:text-brand-500 transition-colors select-none"
                onClick={requestSort}
              >
                <div className="flex items-center justify-end gap-1">
                  Contract End
                  {getSortIcon()}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {Object.entries(groupedCrew).map(([status, members]) => (
              <React.Fragment key={status}>
                <tr className="bg-gray-50/50 dark:bg-white/[0.02]">
                  <td colSpan={4} className="py-2 px-3">
                    <Badge color={statusColorMap[status] || "default"} variant="light" size="sm">
                      {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")} ({members.length})
                    </Badge>
                  </td>
                </tr>
                {members.slice(0, 5).map((crew) => (
                  <tr key={crew._id} className="group hover:bg-gray-50/30 dark:hover:bg-white/[0.01] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={crew.profilePhoto} name={crew.name} size="small" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{crew.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400">{crew.rank}</td>
                    <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400">{crew.vesselName}</td>
                    <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {crew.contractEnd ? format(new Date(crew.contractEnd), "dd MMM yyyy") : "N/A"}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            {crewList.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-sm text-gray-500">
                  No crew members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
