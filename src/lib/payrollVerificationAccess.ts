import { getCurrencySettings } from "./currencySettings";

export interface Settings {
  captainOnlyVerification: boolean;
  showOnGlobalCareersPage: boolean;
  publicCareersPageEnabled: boolean;
  companyCareersPageEnabled: boolean;
  currencySymbol: string;
  currencyCode: string;
  currencyPosition: "left" | "right";
  currencyFormatType: "symbol" | "code";
  currencySpace: boolean;
}

// Currency display helper function
// Uses cached currency settings as defaults if parameters not provided
export function formatCurrency(
  amount: number | string,
  symbol?: string,
  code?: string,
  position?: "left" | "right",
  formatType?: "symbol" | "code",
  showSpace?: boolean
): string {
  // Get cached settings for defaults
  const defaults = getCurrencySettings();

  const useSymbol = symbol ?? defaults.currencySymbol;
  const useCode = code ?? defaults.currencyCode;
  const usePosition = position ?? defaults.currencyPosition;
  const useFormatType = formatType ?? defaults.currencyFormatType;
  const useSpace = showSpace ?? defaults.currencySpace;

  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const formatted = isNaN(num) ? "0" : num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const space = useSpace ? " " : "";
  const displayValue = useFormatType === "symbol" ? useSymbol : useCode;

  return usePosition === "left"
    ? `${displayValue}${space}${formatted}`
    : `${formatted}${space}${displayValue}`;
}

function normalizeRole(role?: string | null) {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
}

export function isCaptainRole(role?: string | null) {
  return normalizeRole(role) === "captain";
}

export function isSuperAdminRole(role?: string | null) {
  return normalizeRole(role) === "super-admin";
}

export function canVerifyPayrollForRole(input: {
  role?: string | null;
  hasVerifyPermission: boolean;
  captainOnlyVerification: boolean;
}) {
  if (isSuperAdminRole(input.role)) {
    return true;
  }

  if (!input.hasVerifyPermission) {
    return false;
  }

  if (!input.captainOnlyVerification) {
    return true;
  }

  return isCaptainRole(input.role);
}
