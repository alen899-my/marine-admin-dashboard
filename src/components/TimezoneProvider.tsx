"use client";

import { useEffect } from "react";

/**
 * Sets the user's IANA timezone as a long-lived cookie (`tz`).
 * Mount this once in the admin layout so every report page's SSR
 * render already has the correct timezone without a URL round-trip.
 *
 * Cookie: `tz=Asia/Kolkata; path=/; max-age=31536000; SameSite=Lax`
 */
export default function TimezoneProvider() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // e.g. "Asia/Kolkata"
    document.cookie = `tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; SameSite=Lax`;
  }, []);

  // Renders nothing — purely a side-effect component
  return null;
}
