"use client";

import React from "react";
import { AlertCircle, Clock, LucideIcon } from "lucide-react";

export type ExpiryBadgeType = "expired" | "expiringSoon";

interface BadgeConfig {
  label: string;
  sub: string;
  icon: LucideIcon;
  bg: string;
  border: string;
  iconColor: string;
  valueColor: string;
  subColor: string;
}

const BADGE_CONFIGS: Record<ExpiryBadgeType, BadgeConfig> = {
  expired: {
    label: "Expired",
    sub: "Past expiry date",
    icon: AlertCircle,
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
    iconColor: "text-red-500",
    valueColor: "text-red-600 dark:text-red-400",
    subColor: "text-red-400 dark:text-red-500",
  },
  expiringSoon: {
    label: "Expiring Soon",
    sub: "Within 60 days",
    icon: Clock,
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
    iconColor: "text-amber-500",
    valueColor: "text-amber-600 dark:text-amber-400",
    subColor: "text-amber-400 dark:text-amber-500",
  },
};

export function ExpiryBadge({ type, value }: { type: ExpiryBadgeType; value: number }) {
  const b = BADGE_CONFIGS[type];
  const Icon = b.icon;

  return (
    <div
      className={`flex h-full items-center gap-4 rounded-2xl border p-5 transition-all duration-200 hover:shadow-md ${b.bg} ${b.border}`}
    >
      <div
        className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/80 dark:bg-black/20 shadow-sm ${b.iconColor}`}
      >
        <Icon className="h-7 w-7" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-3xl font-bold leading-none ${b.valueColor}`}>
          {value}
        </p>
        <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
          {b.label}
        </p>
        <p className={`text-xs mt-0.5 ${b.subColor} line-clamp-1`}>{b.sub}</p>
      </div>
    </div>
  );
}

interface ExpiryCountBadgesProps {
  expired: number;
  expiringSoon: number;
}

export default function ExpiryCountBadges({
  expired,
  expiringSoon,
}: ExpiryCountBadgesProps) {
  return (
    <div className="flex flex-wrap items-stretch gap-4 min-h-full">
      <div className="flex-1 min-w-[240px]">
        <ExpiryBadge type="expired" value={expired} />
      </div>
      <div className="flex-1 min-w-[240px]">
        <ExpiryBadge type="expiringSoon" value={expiringSoon} />
      </div>
    </div>
  );
}
