"use client";
import { useState, useEffect } from "react";

/**
 * @param key - A unique string for each page (e.g., 'noon-report', 'arrival-report')
 * @param defaultValue - Whether filters should be open by default
 */
export function useFilterPersistence(key: string = "common", defaultValue: boolean = false) {
  const storageKey = `${key}ReportFilterVisible`;

  const [isFilterVisible, setIsFilterVisible] = useState(defaultValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        setIsFilterVisible(saved === "true");
      }
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window !== "undefined" && isHydrated) {
      localStorage.setItem(storageKey, isFilterVisible.toString());
    }
  }, [isFilterVisible, storageKey, isHydrated]);

  return { isFilterVisible, setIsFilterVisible };
}