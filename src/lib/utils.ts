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
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // Change to true if you prefer 12-hour format
  }).format(d);
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