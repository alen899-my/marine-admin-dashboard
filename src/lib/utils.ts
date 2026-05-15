/**
 * Formats a Date string or object into a human-readable format.
 * Example: "2026-01-25T14:30:00Z" -> "25 Jan 2026, 14:30"
 */
export const formatDate = (date: string | Date | undefined) => {
  if (!date) return "N/A";

  const d = new Date(date);

  // Check if date is valid
  if (isNaN(d.getTime())) return "Invalid Date";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // Change to true if you prefer 12-hour format
    timeZone: "Asia/Kolkata", // Always display in IST
  }).format(d).toUpperCase();
};

/**
 * Short date format for compact cards
 * Example: "25 Jan 2026"
 */
export const formatShortDate = (date: string | Date | undefined) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
};

export const formatUploadedFileName = (
  fileName?: string | null,
  fileUrl?: string | null,
) => {
  if (fileName?.trim()) {
    const cleaned = fileName.trim();
    const match = cleaned.match(/^\d{10,}[-_](.+)$/);
    return match ? match[1] : cleaned;
  }

  if (!fileUrl) return "File";

  try {
    const pathname = new URL(fileUrl, "http://localhost").pathname;
    const fileFromUrl = decodeURIComponent(pathname.split("/").pop() ?? "");
    const parts = fileFromUrl.split("_");
    const originalName = parts.length > 2 ? parts.slice(2).join("_") : fileFromUrl;
    const match = (originalName || fileFromUrl).match(/^\d{10,}[-_](.+)$/);
    return match ? match[1] : originalName || fileFromUrl || "File";
  } catch {
    const fileFromUrl = fileUrl.split("/").pop()?.split("?")[0] ?? "";
    const parts = fileFromUrl.split("_");
    const name = parts.length > 2 ? parts.slice(2).join("_") : fileFromUrl;
    const match = name.match(/^\d{10,}[-_](.+)$/);
    return match ? match[1] : name || "File";
  }
};

export const PUBLIC_EDITABLE_APPLICATION_STATUSES = [
  "draft",
  "submitted",
] as const;

export const canEditPublicApplicationStatus = (status?: string | null) =>
  PUBLIC_EDITABLE_APPLICATION_STATUSES.includes(
    (status ?? "") as (typeof PUBLIC_EDITABLE_APPLICATION_STATUSES)[number],
  );

export const canEditPublicApplication = ({
  jobIsAccepting,
  deadline,
  now = new Date(),
}: {
  jobIsAccepting?: boolean;
  deadline?: string | Date | null;
  now?: Date;
}) => {
  if (jobIsAccepting === false) return false;
  if (!deadline) return true;

  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) return true;

  return now < deadlineDate;
};

/**
 * Generates a name for a duplicate item, appending copy(1), copy(2), etc.
 * @param name The current name of the item
 * @param existingNames A list of names to check against for duplicates
 */
export const getNextCopyName = (name: string, existingNames: string[]) => {
  // 1. Identify base name by removing existing copy suffixes
  // Matches " (copy)", " (Copy)", " copy(1)", " copy(22)", etc. at the end of the string
  const copySuffixPattern = /\s+(\(copy\)|copy\(\d+\))$/i;
  const baseName = name.replace(copySuffixPattern, "").trim();

  // 2. Find the highest number used so far for this base name
  // Pattern: baseName + " copy(\d+)"
  const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const numberPattern = new RegExp(`^${escapedBaseName}\\s+copy\\((\\d+)\\)$`, "i");

  let maxNumber = 0;
  let foundExactBase = false;

  for (const n of existingNames) {
    if (n.trim().toLowerCase() === baseName.toLowerCase()) {
      foundExactBase = true;
    }
    const match = n.match(numberPattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) maxNumber = num;
    }
  }

  // If no numbered copies exist, but the base name exists, we start with copy(1)
  // If even the base name doesn't exist (unlikely as we are duplicating), we still use copy(1)
  return `${baseName} copy(${maxNumber + 1})`;
};
