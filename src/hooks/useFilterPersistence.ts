"use client";
import { useState, useEffect } from "react";

/**
 * @param key - A unique string for each page (e.g., 'noon-report', 'arrival-report')
 * @param defaultValue - Whether filters should be open by default
 */
export function useFilterPersistence(key: string = "common", defaultValue: boolean = false) {
  // Create the storage key based on the page name
  const storageKey = `${key}ReportFilterVisible`;

  const [isFilterVisible, setIsFilterVisible] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      // If nothing is saved, use the defaultValue
      return saved !== null ? saved === "true" : defaultValue;
    }
    return defaultValue;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, isFilterVisible.toString());
    }
  }, [isFilterVisible, storageKey]);

  return { isFilterVisible, setIsFilterVisible };
}