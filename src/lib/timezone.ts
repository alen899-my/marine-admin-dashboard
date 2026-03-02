import { startOfDay, endOfDay } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

/**
 * Returns the UTC Date representing the START of the current day
 * in the user's local timezone (IANA name, e.g. "Asia/Kolkata").
 *
 * Example — IST user (UTC+5:30), current UTC time = Mar 2 04:00:
 *   Zoned time  = Mar 2 09:30 IST
 *   Start of day IST = Mar 2 00:00 IST = Mar 1 18:30 UTC  ← returned
 */
export function localStartOfDay(tz: string): Date {
    const nowInZone = toZonedTime(new Date(), tz);
    const startInZone = startOfDay(nowInZone);
    return fromZonedTime(startInZone, tz);
}

/**
 * Returns the UTC Date representing the END of the current day
 * in the user's local timezone (23:59:59.999 local time).
 */
export function localEndOfDay(tz: string): Date {
    const nowInZone = toZonedTime(new Date(), tz);
    const endInZone = endOfDay(nowInZone);
    return fromZonedTime(endInZone, tz);
}

/**
 * Parses a "DD/MM/YYYY" date string and returns the UTC Date
 * representing the START of that day in the user's local timezone.
 *
 * Returns undefined if parsing fails.
 */
export function parseDateInTz(
    dateStr: string | undefined,
    tz: string
): Date | undefined {
    if (!dateStr) return undefined;

    let year: number, month: number, day: number;

    if (dateStr.includes("/")) {
        const parts = dateStr.split("/");
        if (parts.length !== 3) return undefined;
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1; // 0-indexed
        year = parseInt(parts[2], 10);
    } else {
        // ISO or other formats
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return undefined;
        year = d.getUTCFullYear();
        month = d.getUTCMonth();
        day = d.getUTCDate();
    }

    // Build a zoned date at midnight in the user's timezone
    const zonedMidnight = new Date(year, month, day, 0, 0, 0, 0);
    if (isNaN(zonedMidnight.getTime())) return undefined;

    // Convert from the user's local timezone to UTC
    return fromZonedTime(zonedMidnight, tz);
}

/**
 * Parses a "DD/MM/YYYY" date string and returns the UTC Date
 * representing the END of that day (23:59:59.999) in the user's local timezone.
 *
 * Returns undefined if parsing fails.
 */
export function parseEndDateInTz(
    dateStr: string | undefined,
    tz: string
): Date | undefined {
    if (!dateStr) return undefined;

    let year: number, month: number, day: number;

    if (dateStr.includes("/")) {
        const parts = dateStr.split("/");
        if (parts.length !== 3) return undefined;
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
    } else {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return undefined;
        year = d.getUTCFullYear();
        month = d.getUTCMonth();
        day = d.getUTCDate();
    }

    // End of that local day = 23:59:59.999
    const zonedEndOfDay = new Date(year, month, day, 23, 59, 59, 999);
    if (isNaN(zonedEndOfDay.getTime())) return undefined;

    return fromZonedTime(zonedEndOfDay, tz);
}
