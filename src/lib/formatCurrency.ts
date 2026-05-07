// src/lib/formatCurrency.ts

import { getCurrencySymbol } from "@/constants/geoData";
import { getCurrencySettings } from "./currencySettings";

/**
 * formatCurrency(1500, "USD")  →  "$ 1,500.00" (uses cached settings)
 * formatCurrency(1500, "INR")  →  "₹ 1,500.00"
 * formatCurrency(1500)         →  "1,500.00"  (no currency)
 * 
 * Uses global currency settings (position, formatType, space) if no options provided
 */
export function formatCurrency(
  amount: number | null | undefined,
  currencyCode?: string | null,
  options?: {
    decimals?: number;       // default: 2
    symbolSeparator?: string; // default: " " (or from settings)
    position?: "left" | "right"; // default: from cached settings
    formatType?: "symbol" | "code"; // default: from cached settings
    showSpace?: boolean; // default: from cached settings
    currencySettings?: {
      currencyPosition: "left" | "right";
      currencyFormatType: "symbol" | "code";
      currencySpace: boolean;
    };
  }
): string {
  if (amount == null || isNaN(amount)) return "-";

  const settings = options?.currencySettings ?? getCurrencySettings();
  const decimals = options?.decimals ?? 2;
  const position = options?.position ?? settings.currencyPosition;
  const formatType = options?.formatType ?? settings.currencyFormatType;
  const showSpace = options?.showSpace ?? settings.currencySpace;
  const sep = options?.symbolSeparator ?? (showSpace ? " " : "");

  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  // Handle negative amounts: move minus sign before currency symbol
  const isNegative = amount < 0;
  const absAmount = isNegative ? Math.abs(amount) : amount;
  const absoluteFormatted = absAmount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (!currencyCode) {
    return isNegative ? `-${absoluteFormatted}` : absoluteFormatted;
  }

  const symbol = getCurrencySymbol(currencyCode);
  const displayValue = formatType === "symbol" ? symbol : currencyCode;

  const prefix = isNegative ? "-" : "";
  return position === "left"
    ? `${prefix}${displayValue}${sep}${absoluteFormatted}`
    : `${prefix}${absoluteFormatted}${sep}${displayValue}`;
}

/**
 * formatCurrencyCompact(1_500_000, "USD")  →  "$ 1.5M"
 * formatCurrencyCompact(2500, "EUR")        →  "€ 2.5K"
 */
export function formatCurrencyCompact(
  amount: number | null | undefined,
  currencyCode?: string | null
): string {
  if (amount == null || isNaN(amount)) return "-";

  let compact: string;
  const abs = Math.abs(amount);

  if (abs >= 1_000_000_000) {
    compact = (amount / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  } else if (abs >= 1_000_000) {
    compact = (amount / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  } else if (abs >= 1_000) {
    compact = (amount / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  } else {
    compact = amount.toFixed(2);
  }

  if (!currencyCode) return compact;

  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol} ${compact}`;
}

/**
 * currencyLabel("USD")  →  "USD ($)"
 * currencyLabel("INR")  →  "INR (₹)"
 * currencyLabel("")     →  "-"
 */
export function currencyLabel(currencyCode?: string | null): string {
  if (!currencyCode) return "-";
  const symbol = getCurrencySymbol(currencyCode);
  return `${currencyCode} (${symbol})`;
}